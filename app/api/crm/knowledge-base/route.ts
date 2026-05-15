import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'
import { getSupabaseAdmin } from '@/lib/ticket-triage'

export const runtime = 'nodejs'
export const maxDuration = 60

const VALID_CATEGORIES = ['verizon', 'microsoft365', 'ucaas', 'general'] as const
const MAX_PDF_BYTES = 20 * 1024 * 1024 // 20MB
const MAX_CONTENT_CHARS = 200_000

export async function GET() {
  const { errorResponse } = await requireAdmin()
  if (errorResponse) return errorResponse

  try {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('kb_documents')
      .select('id, title, category, file_name, file_url, created_at, updated_at')
      .order('category')
      .order('title')

    if (error) {
      const message = error.message ?? 'Failed to fetch documents'
      if (message.toLowerCase().includes('does not exist') || error.code === '42P01') {
        console.error('KB table missing — migration 009 not applied:', message)
        return NextResponse.json({
          error: 'Knowledge base not initialized — please run supabase migration 009.',
          missing_table: true,
        }, { status: 500 })
      }
      // Handle missing column gracefully (file_url added in 009)
      if (message.toLowerCase().includes('column') && message.toLowerCase().includes('file_url')) {
        const fallback = await admin
          .from('kb_documents')
          .select('id, title, category, file_name, created_at, updated_at')
          .order('category')
          .order('title')
        if (!fallback.error) return NextResponse.json(fallback.data ?? [])
      }
      console.error('KB list error:', error)
      return NextResponse.json({ error: message }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('KB GET exception:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 })
  }
}

async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PDFParse } = require('pdf-parse')
  const parser = new PDFParse({ data: new Uint8Array(buffer) })
  try {
    const result = await parser.getText()
    return (result?.text ?? '').slice(0, MAX_CONTENT_CHARS)
  } finally {
    await parser.destroy().catch(() => {})
  }
}

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAdmin()
  if (errorResponse) return errorResponse

  try {
    const contentType = req.headers.get('content-type') ?? ''
    const admin = getSupabaseAdmin()

    let title: string | undefined
    let category: string | undefined
    let content: string | undefined
    let fileName: string | null = null
    let fileUrl: string | null = null

    if (contentType.startsWith('multipart/form-data')) {
      const form = await req.formData()
      title = (form.get('title') as string | null)?.trim() || undefined
      category = (form.get('category') as string | null) ?? undefined
      const file = form.get('file') as File | null
      const rawContent = (form.get('content') as string | null)?.trim() || undefined

      if (file) {
        if (file.size > MAX_PDF_BYTES) {
          return NextResponse.json({ error: 'File exceeds 20MB limit' }, { status: 413 })
        }
        fileName = file.name
        const buffer = await file.arrayBuffer()

        const storagePath = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
        const { error: uploadErr } = await admin.storage
          .from('kb-documents')
          .upload(storagePath, buffer, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type || 'application/octet-stream',
          })
        if (uploadErr) {
          console.error('KB storage upload error (continuing with text only):', uploadErr)
        } else {
          const { data: urlData } = admin.storage.from('kb-documents').getPublicUrl(storagePath)
          fileUrl = urlData?.publicUrl ?? null
        }

        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          try {
            content = await extractPdfText(buffer)
            if (!content?.trim()) {
              content = '(PDF uploaded — text extraction returned empty. Use the file URL to view contents.)'
            }
          } catch (err) {
            console.error('PDF parse error:', err)
            content = '(PDF uploaded — text extraction failed. AI cannot reference text content of this file.)'
          }
        } else if (file.type.startsWith('text/') || /\.(txt|md|markdown)$/i.test(file.name)) {
          const text = new TextDecoder().decode(buffer)
          content = text.slice(0, MAX_CONTENT_CHARS)
        } else {
          content = rawContent || `(${file.type || 'binary'} file uploaded — content extraction not supported.)`
        }
      } else if (rawContent) {
        content = rawContent
      }
    } else {
      const body = await req.json()
      title = body.title?.trim()
      category = body.category
      content = body.content?.trim()
      fileName = body.file_name ?? null
    }

    if (!title || !category || !content) {
      return NextResponse.json({ error: 'title, category, and content are required' }, { status: 400 })
    }

    if (!VALID_CATEGORIES.includes(category as (typeof VALID_CATEGORIES)[number])) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    const insertRow: Record<string, unknown> = {
      title,
      category,
      content,
      file_name: fileName,
    }
    if (fileUrl) insertRow.file_url = fileUrl

    const { data, error } = await admin
      .from('kb_documents')
      .insert(insertRow)
      .select('id, title, category, file_name, file_url, created_at, updated_at')
      .single()

    if (error) {
      console.error('KB insert error:', error)
      if (error.code === '42P01' || error.message?.toLowerCase().includes('does not exist')) {
        return NextResponse.json({
          error: 'Knowledge base not initialized — please run supabase migration 009.',
        }, { status: 500 })
      }
      // Retry without file_url if that column doesn't exist
      if (fileUrl && error.message?.toLowerCase().includes('file_url')) {
        const retry = await admin
          .from('kb_documents')
          .insert({ title, category, content, file_name: fileName })
          .select('id, title, category, file_name, created_at, updated_at')
          .single()
        if (!retry.error) return NextResponse.json(retry.data, { status: 201 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('KB POST exception:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 })
  }
}
