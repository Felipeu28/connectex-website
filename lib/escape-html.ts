// Tiny HTML-escape helper.
//
// Used wherever user-supplied data is interpolated into an HTML email
// body or template — most notably the {{name}} / {{first_name}} / etc.
// placeholders in campaign sends. Without this, a contact whose name is
// `<script>alert(1)</script>` will execute in every recipient's webmail
// preview (Gmail strips <script> but other clients may not, and the
// payload also breaks layout regardless).

const HTML_ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
}

export function escapeHtml(value: string | null | undefined): string {
  if (value == null) return ''
  return String(value).replace(/[&<>"'`=\/]/g, (c) => HTML_ENTITY_MAP[c] ?? c)
}
