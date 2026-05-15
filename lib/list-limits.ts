// Shared cap for list queries that load every row without filters.
//
// We pick a number large enough to handle a realistic CRM dataset
// (hundreds of open deals, ~half-a-thousand contacts in a multi-select
// dropdown) but small enough that the browser tab doesn't OOM if the
// table grows unexpectedly. When `warnIfAtLimit` fires, it's the signal
// to add server-side pagination for that surface.

export const LIST_HARD_LIMIT = 500

export function warnIfAtLimit(name: string, rows: unknown[] | null): void {
  if (rows && rows.length >= LIST_HARD_LIMIT) {
    console.warn(
      `[${name}] returned ${LIST_HARD_LIMIT} rows (the hard cap). Add pagination.`
    )
  }
}
