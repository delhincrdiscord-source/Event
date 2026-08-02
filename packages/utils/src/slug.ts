// =====================================================
// Slug Utilities
// =====================================================

/**
 * Generate a URL-friendly slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Generate event slug with week suffix
 * Example: "Among Us Game Night" + week 3 → "among-us-game-night-w3"
 */
export function generateEventSlug(title: string, weekNumber: number): string {
  const baseSlug = generateSlug(title);
  return `${baseSlug}-w${weekNumber}`;
}

/**
 * Ensure slug uniqueness by appending a counter if needed
 */
export function ensureUniqueSlug(
  baseSlug: string,
  existingSlugs: string[]
): string {
  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Validate slug format
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
