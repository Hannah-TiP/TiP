/**
 * Serialize the rich-text `body` of a Guide step into plain text for the HowTo
 * JSON-LD `text` (the page renders the rich version). Strips HTML tags and the
 * most common inline Markdown markers, then collapses whitespace. The parity
 * test compares the SOURCE payload, not markup, so this only needs to produce a
 * stable, human-readable plain string.
 */
export function toPlainText(input?: string | null): string {
  if (!input) return '';
  return input
    .replace(/<[^>]+>/g, ' ') // HTML tags
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // markdown images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // markdown links → link text
    .replace(/[*_`~#>]/g, '') // inline emphasis / heading / quote markers
    .replace(/\s+/g, ' ')
    .trim();
}
