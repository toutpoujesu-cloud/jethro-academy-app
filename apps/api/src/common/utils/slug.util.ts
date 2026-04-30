/**
 * Generates a URL-friendly slug from a title string.
 * e.g. "The Cross-Shaped Leader!" → "the-cross-shaped-leader"
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')                          // Decompose accented chars
    .replace(/[̀-ͯ]/g, '')           // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '')             // Remove non-alphanumeric
    .trim()
    .replace(/[\s_]+/g, '-')                  // Spaces/underscores → hyphens
    .replace(/-{2,}/g, '-')                   // Collapse multiple hyphens
    .replace(/^-+|-+$/g, '');                 // Trim leading/trailing hyphens
}

/**
 * Generates a unique verification code for certificates.
 * Format: JA-XXXX-XXXX-XXXX (alphanumeric, uppercase)
 */
export function generateVerificationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude 0,1,I,O (confusing)
  const segment = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `JA-${segment(4)}-${segment(4)}-${segment(4)}`;
}
