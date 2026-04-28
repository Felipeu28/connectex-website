import type { PipelineStage } from '@/lib/crm-types'

export interface AirtableDevice {
  device_type: string
  manufacturer: string | null
  model: string
  serial_number: string | null
}

export interface AirtableImportRow {
  name: string
  company: string
  email: string
  phone: string
  notes: string
  stage: PipelineStage
  devices: AirtableDevice[]
  rawStatus: string
  valid: boolean
  skipReason?: string
}

export interface AirtableParseResult {
  rows: AirtableImportRow[]
  uniqueStatuses: string[]
}

export type AirtableStatusMapping = Record<string, PipelineStage>

function detectDelimiter(text: string): ',' | '\t' {
  const firstLine = text.split(/\r\n|\n|\r/, 1)[0] ?? ''
  const commaCount = (firstLine.match(/,/g) ?? []).length
  const tabCount = (firstLine.match(/\t/g) ?? []).length
  return tabCount > commaCount ? '\t' : ','
}

function parseDelimitedRows(text: string, delimiter: ',' | '\t'): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i]
    const next = normalized[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        field += ch
      }
      continue
    }

    if (ch === '"') {
      inQuotes = true
      continue
    }

    if (ch === delimiter) {
      row.push(field)
      field = ''
      continue
    }

    if (ch === '\n') {
      row.push(field)
      if (row.some((cell) => cell.trim() !== '')) rows.push(row)
      row = []
      field = ''
      continue
    }

    field += ch
  }

  if (field || row.length) {
    row.push(field)
    if (row.some((cell) => cell.trim() !== '')) rows.push(row)
  }

  return rows
}

function cleanCell(value: string | undefined): string {
  return value?.replace(/\u00a0/g, ' ').trim() ?? ''
}

function parseDeviceCell(
  raw: string,
  deviceType: string,
  manufacturer: string | null
): AirtableDevice[] {
  if (!raw.trim()) return []

  return raw
    .split(/\n+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const match = entry.match(/^(.*?)\s*\(([^)]+)\)\s*$/)
      if (match) {
        return {
          device_type: deviceType,
          manufacturer,
          model: match[1].trim() || deviceType,
          serial_number: match[2].trim(),
        }
      }

      return {
        device_type: deviceType,
        manufacturer,
        model: entry || deviceType,
        serial_number: null,
      }
    })
}

export function buildDefaultStatusMapping(statuses: string[]): AirtableStatusMapping {
  const mapping: AirtableStatusMapping = {}

  statuses.forEach((status) => {
    const lower = status.toLowerCase()
    if (lower.includes('initial') || lower.includes('lead') || lower.includes('new') || lower.includes('whiteboard') || lower.includes('unreachable')) {
      mapping[status] = 'lead'
    } else if (lower.includes('qualif') || lower.includes('waiting for customer')) {
      mapping[status] = 'qualified'
    } else if (lower.includes('proposal') || lower.includes('quote')) {
      mapping[status] = 'proposal'
    } else if (lower.includes('negotiat') || lower.includes('port') || lower.includes('install') || lower.includes('continued support') || lower.includes('reported')) {
      mapping[status] = 'negotiation'
    } else if (lower.includes('active') || lower.includes('won') || lower.includes('complete') || lower.includes('moved') || lower.includes('post install')) {
      mapping[status] = 'closed_won'
    } else if (lower.includes('lost') || lower.includes('dead') || lower.includes('cancel') || lower.includes('no sale')) {
      mapping[status] = 'closed_lost'
    } else {
      mapping[status] = 'lead'
    }
  })

  return mapping
}

export function parseAirtableContactsCsv(text: string): AirtableParseResult {
  const rows = parseDelimitedRows(text, detectDelimiter(text))
  if (rows.length < 2) return { rows: [], uniqueStatuses: [] }

  const headers = rows[0].map((header) => cleanCell(header))
  const col = (name: string) => headers.findIndex((header) => header.toLowerCase() === name.toLowerCase())
  const get = (row: string[], name: string) => cleanCell(row[col(name)])

  const uniqueStatuses = new Set<string>()
  const parsedRows: AirtableImportRow[] = []

  for (const row of rows.slice(1)) {
    const bizName = get(row, 'Name')
    const pocName = get(row, 'POC Name')
    const pocEmail = get(row, 'POC Email')
    const pocPhone = get(row, 'POC Phone #')
    const rawStatus = get(row, 'Status')
    const notes = get(row, 'Notes')
    const whiteboarding = get(row, 'Whiteboarding')
    const ecpd = get(row, 'ECPD #')
    const leadId = get(row, 'Lead ID')
    const carrier = get(row, 'Carrier')
    const accountNum = get(row, 'Account #')
    const portStatus = get(row, 'Port Status')
    const portDate = get(row, 'Port Date Confirmed')
    const mainPortNum = get(row, 'Main Porting Number')
    const additionalNums = get(row, 'Additional #s to Port')
    const street = get(row, 'Biz Street Address')
    const city = get(row, 'Biz City')
    const state = get(row, 'Biz State')
    const zip = get(row, 'Biz Zip Code')

    if (bizName.startsWith('***') || bizName.startsWith('FORMS')) continue
    if (!bizName && !pocName && !pocEmail) continue

    if (rawStatus) uniqueStatuses.add(rawStatus)

    const noteParts: string[] = []
    if (notes) noteParts.push(notes)
    if (whiteboarding) noteParts.push(`Whiteboarding:\n${whiteboarding}`)
    if (street || city || state || zip) noteParts.push(`Address: ${[street, city, state, zip].filter(Boolean).join(', ')}`)
    if (ecpd) noteParts.push(`ECPD #: ${ecpd}`)
    if (leadId) noteParts.push(`Lead ID: ${leadId}`)
    if (carrier) noteParts.push(`Carrier: ${carrier}`)
    if (accountNum) noteParts.push(`Account #: ${accountNum}`)
    if (portStatus) noteParts.push(`Port Status: ${portStatus}`)
    if (portDate) noteParts.push(`Port Date: ${portDate}`)
    if (mainPortNum) noteParts.push(`Main Porting #: ${mainPortNum}`)
    if (additionalNums) noteParts.push(`Additional #s: ${additionalNums}`)

    const devices = [
      ...parseDeviceCell(get(row, 'T67LTE IMEIs'), 'Desk Phone', 'Yealink'),
      ...parseDeviceCell(get(row, 'MAC IDs'), 'Device', null),
      ...parseDeviceCell(get(row, 'MCs'), 'Mobile Client', null),
      ...parseDeviceCell(get(row, 'Native Dialers'), 'Phone', null),
      ...parseDeviceCell(get(row, 'Second Numbers'), 'Phone', null),
      ...parseDeviceCell(get(row, 'Routers'), 'Router', 'Verizon'),
      ...parseDeviceCell(get(row, 'Tablets'), 'Tablet', null),
    ]

    const contactName = pocName || bizName
    const valid = Boolean(contactName)

    parsedRows.push({
      name: contactName,
      company: bizName,
      email: pocEmail,
      phone: pocPhone,
      notes: noteParts.join('\n\n'),
      stage: 'lead',
      rawStatus,
      devices,
      valid,
      skipReason: !contactName ? 'No name' : undefined,
    })
  }

  return {
    rows: parsedRows,
    uniqueStatuses: Array.from(uniqueStatuses).sort((a, b) => a.localeCompare(b)),
  }
}
