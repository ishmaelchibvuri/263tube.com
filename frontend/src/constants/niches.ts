/**
 * 263Tube - Niche Taxonomy
 *
 * Centralized list of approved content niches/categories.
 * All niche filtering and categorization should reference this taxonomy.
 */

export interface NicheItem {
  /** Display label for the niche */
  label: string;
  /** Value stored in the database (lowercase, no spaces) */
  value: string;
  /** URL-friendly slug for routing */
  slug: string;
  /** Optional description for the niche */
  description?: string;
}

/**
 * Pre-defined niche taxonomy
 *
 * IMPORTANT: When adding new niches:
 * 1. Ensure the value is lowercase with no spaces (use underscores if needed)
 * 2. The slug should be URL-safe (lowercase, hyphens for spaces)
 * 3. Update the DynamoDB GSI2 partition keys if needed
 */
export const NICHES: NicheItem[] = [
  { label: "Comedy", value: "comedy", slug: "comedy", description: "Skits, stand-up, and comedic content" },
  { label: "Music", value: "music", slug: "music", description: "Original music, covers, and performances" },
  { label: "Entertainment", value: "entertainment", slug: "entertainment", description: "General entertainment content" },
  { label: "Technology", value: "technology", slug: "technology", description: "Tech reviews, tutorials, and news" },
  { label: "Cooking", value: "cooking", slug: "cooking", description: "Recipes, cooking shows, and food content" },
  { label: "Farming", value: "farming", slug: "farming", description: "Agriculture, gardening, and livestock" },
  { label: "Lifestyle", value: "lifestyle", slug: "lifestyle", description: "Daily life, vlogs, and personal content" },
  { label: "Education", value: "education", slug: "education", description: "Educational and informative content" },
  { label: "Sports", value: "sports", slug: "sports", description: "Sports coverage, fitness, and athletics" },
  { label: "News", value: "news", slug: "news", description: "News reporting and current affairs" },
  { label: "Commentary", value: "commentary", slug: "commentary", description: "Opinion pieces and analysis" },
  { label: "Gaming", value: "gaming", slug: "gaming", description: "Video game content and streaming" },
  { label: "Beauty", value: "beauty", slug: "beauty", description: "Makeup, skincare, and beauty tips" },
  { label: "Fashion", value: "fashion", slug: "fashion", description: "Fashion, style, and clothing content" },
  { label: "Travel", value: "travel", slug: "travel", description: "Travel vlogs and destination content" },
  { label: "Fitness", value: "fitness", slug: "fitness", description: "Workouts, health, and wellness" },
  { label: "Business", value: "business", slug: "business", description: "Entrepreneurship and business content" },
  { label: "Motivation", value: "motivation", slug: "motivation", description: "Inspirational and motivational content" },
  { label: "DIY & Crafts", value: "diy_crafts", slug: "diy-crafts", description: "Do-it-yourself and craft projects" },
  { label: "Automotive", value: "automotive", slug: "automotive", description: "Cars, motorcycles, and vehicles" },
  { label: "Religion & Spirituality", value: "religion_spirituality", slug: "religion-spirituality", description: "Faith-based and spiritual content" },
  { label: "Parenting", value: "parenting", slug: "parenting", description: "Parenting tips and family content" },
  { label: "Pets & Animals", value: "pets_animals", slug: "pets-animals", description: "Pet care and animal content" },
  { label: "Real Estate", value: "real_estate", slug: "real-estate", description: "Property and real estate content" },
  { label: "Finance", value: "finance", slug: "finance", description: "Personal finance and investing" },
];

/**
 * Special "Other" option for admin review
 * When selected, users can submit a custom niche for admin consideration
 */
export const OTHER_NICHE: NicheItem = {
  label: "Other",
  value: "other",
  slug: "other",
  description: "Not listed? Suggest a new category for review",
};

/**
 * All niches including the "Other" option
 */
export const ALL_NICHES: NicheItem[] = [...NICHES, OTHER_NICHE];

/**
 * Helper to get niche by value
 */
export function getNicheByValue(value: string): NicheItem | undefined {
  return ALL_NICHES.find((niche) => niche.value === value);
}

/**
 * Helper to get niche by slug
 */
export function getNicheBySlug(slug: string): NicheItem | undefined {
  return ALL_NICHES.find((niche) => niche.slug === slug);
}

/**
 * Helper to get niche label by value
 */
export function getNicheLabel(value: string): string {
  const niche = getNicheByValue(value);
  return niche?.label || value;
}

/**
 * Helper to validate if a value is a valid niche
 */
export function isValidNiche(value: string): boolean {
  return ALL_NICHES.some((niche) => niche.value === value);
}

/**
 * Get all niche values (for form validation)
 */
export function getAllNicheValues(): string[] {
  return ALL_NICHES.map((niche) => niche.value);
}

/**
 * Get all niche slugs (for routing)
 */
export function getAllNicheSlugs(): string[] {
  return ALL_NICHES.map((niche) => niche.slug);
}

/**
 * Convert a slug to a value (for API queries)
 */
export function slugToValue(slug: string): string | undefined {
  const niche = getNicheBySlug(slug);
  return niche?.value;
}

/**
 * Convert a value to a slug (for URL generation)
 */
export function valueToSlug(value: string): string | undefined {
  const niche = getNicheByValue(value);
  return niche?.slug;
}
