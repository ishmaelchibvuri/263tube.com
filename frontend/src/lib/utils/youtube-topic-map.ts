/**
 * 263Tube - YouTube Topic to Niche Mapping
 *
 * Maps YouTube topicDetails.topicCategories Wikipedia URLs
 * to 263Tube niche values from the taxonomy.
 */

/**
 * Mapping from YouTube topic Wikipedia URLs to 263Tube niche values.
 * YouTube returns topics as Wikipedia URLs like:
 *   https://en.wikipedia.org/wiki/Entertainment
 *
 * Reference: https://developers.google.com/youtube/v3/docs/channels#topicDetails
 */
const YOUTUBE_TOPIC_TO_NICHE: Record<string, string> = {
  // Direct matches
  "https://en.wikipedia.org/wiki/Comedy": "comedy",
  "https://en.wikipedia.org/wiki/Music": "music",
  "https://en.wikipedia.org/wiki/Entertainment": "entertainment",
  "https://en.wikipedia.org/wiki/Technology": "technology",
  "https://en.wikipedia.org/wiki/Cooking": "cooking",
  "https://en.wikipedia.org/wiki/Food": "cooking",
  "https://en.wikipedia.org/wiki/Agriculture": "farming",
  "https://en.wikipedia.org/wiki/Farming": "farming",
  "https://en.wikipedia.org/wiki/Lifestyle_(sociology)": "lifestyle",
  "https://en.wikipedia.org/wiki/Education": "education",
  "https://en.wikipedia.org/wiki/Sport": "sports",
  "https://en.wikipedia.org/wiki/Sports": "sports",
  "https://en.wikipedia.org/wiki/News": "news",
  "https://en.wikipedia.org/wiki/Video_game": "gaming",
  "https://en.wikipedia.org/wiki/Gaming": "gaming",
  "https://en.wikipedia.org/wiki/Beauty": "beauty",
  "https://en.wikipedia.org/wiki/Fashion": "fashion",
  "https://en.wikipedia.org/wiki/Travel": "travel",
  "https://en.wikipedia.org/wiki/Tourism": "travel",
  "https://en.wikipedia.org/wiki/Physical_fitness": "fitness",
  "https://en.wikipedia.org/wiki/Health": "fitness",
  "https://en.wikipedia.org/wiki/Business": "business",
  "https://en.wikipedia.org/wiki/Entrepreneurship": "business",
  "https://en.wikipedia.org/wiki/Automotive_industry": "automotive",
  "https://en.wikipedia.org/wiki/Automobile": "automotive",
  "https://en.wikipedia.org/wiki/Vehicle": "automotive",
  "https://en.wikipedia.org/wiki/Religion": "religion_spirituality",
  "https://en.wikipedia.org/wiki/Spirituality": "religion_spirituality",
  "https://en.wikipedia.org/wiki/Pet": "pets_animals",
  "https://en.wikipedia.org/wiki/Animal": "pets_animals",
  "https://en.wikipedia.org/wiki/Finance": "finance",
  "https://en.wikipedia.org/wiki/Personal_finance": "finance",
  "https://en.wikipedia.org/wiki/Real_estate": "real_estate",
  "https://en.wikipedia.org/wiki/Do_it_yourself": "diy_crafts",

  // YouTube's known topic categories
  "https://en.wikipedia.org/wiki/Society": "commentary",
  "https://en.wikipedia.org/wiki/Politics": "commentary",
  "https://en.wikipedia.org/wiki/Film": "entertainment",
  "https://en.wikipedia.org/wiki/Television": "entertainment",
  "https://en.wikipedia.org/wiki/Performing_arts": "entertainment",
  "https://en.wikipedia.org/wiki/Hobby": "lifestyle",
  "https://en.wikipedia.org/wiki/Knowledge": "education",
  "https://en.wikipedia.org/wiki/Action_game": "gaming",
  "https://en.wikipedia.org/wiki/Role-playing_video_game": "gaming",
  "https://en.wikipedia.org/wiki/Puzzle_video_game": "gaming",
  "https://en.wikipedia.org/wiki/Action-adventure_game": "gaming",
  "https://en.wikipedia.org/wiki/Simulation_video_game": "gaming",
  "https://en.wikipedia.org/wiki/Strategy_video_game": "gaming",
  "https://en.wikipedia.org/wiki/Sports_game": "gaming",
  "https://en.wikipedia.org/wiki/Casual_game": "gaming",
  "https://en.wikipedia.org/wiki/Music_video_game": "gaming",
  "https://en.wikipedia.org/wiki/Racing_video_game": "gaming",
  "https://en.wikipedia.org/wiki/Massively_multiplayer_online_game": "gaming",
  "https://en.wikipedia.org/wiki/American_football": "sports",
  "https://en.wikipedia.org/wiki/Association_football": "sports",
  "https://en.wikipedia.org/wiki/Basketball": "sports",
  "https://en.wikipedia.org/wiki/Boxing": "sports",
  "https://en.wikipedia.org/wiki/Cricket": "sports",
  "https://en.wikipedia.org/wiki/Golf": "sports",
  "https://en.wikipedia.org/wiki/Ice_hockey": "sports",
  "https://en.wikipedia.org/wiki/Mixed_martial_arts": "sports",
  "https://en.wikipedia.org/wiki/Motorsport": "sports",
  "https://en.wikipedia.org/wiki/Tennis": "sports",
  "https://en.wikipedia.org/wiki/Volleyball": "sports",
  "https://en.wikipedia.org/wiki/Wrestling": "sports",
  "https://en.wikipedia.org/wiki/Christian_music": "music",
  "https://en.wikipedia.org/wiki/Classical_music": "music",
  "https://en.wikipedia.org/wiki/Country_music": "music",
  "https://en.wikipedia.org/wiki/Electronic_music": "music",
  "https://en.wikipedia.org/wiki/Hip_hop_music": "music",
  "https://en.wikipedia.org/wiki/Jazz": "music",
  "https://en.wikipedia.org/wiki/Music_of_Asia": "music",
  "https://en.wikipedia.org/wiki/Music_of_Latin_America": "music",
  "https://en.wikipedia.org/wiki/Pop_music": "music",
  "https://en.wikipedia.org/wiki/Rhythm_and_blues": "music",
  "https://en.wikipedia.org/wiki/Rock_music": "music",
  "https://en.wikipedia.org/wiki/Soul_music": "music",
  "https://en.wikipedia.org/wiki/Independent_music": "music",
};

/**
 * Priority order for niche resolution when multiple topics match different niches.
 * Lower index = higher priority.
 */
const NICHE_PRIORITY = [
  "comedy",
  "music",
  "gaming",
  "cooking",
  "farming",
  "technology",
  "beauty",
  "fashion",
  "sports",
  "fitness",
  "education",
  "news",
  "commentary",
  "business",
  "finance",
  "automotive",
  "travel",
  "diy_crafts",
  "religion_spirituality",
  "parenting",
  "pets_animals",
  "real_estate",
  "motivation",
  "lifestyle",
  "entertainment",
];

/**
 * Maps an array of YouTube topicCategories Wikipedia URLs to the best
 * matching 263Tube niche value.
 *
 * @param topicUrls - Array of Wikipedia URLs from YouTube topicDetails.topicCategories
 * @returns The best matching niche value, or null if no match found
 */
export function mapYouTubeTopicsToNiche(topicUrls: string[]): string | null {
  if (!topicUrls || topicUrls.length === 0) return null;

  const matchedNiches = new Set<string>();

  for (const url of topicUrls) {
    const niche = YOUTUBE_TOPIC_TO_NICHE[url];
    if (niche) {
      matchedNiches.add(niche);
    }
  }

  if (matchedNiches.size === 0) return null;
  if (matchedNiches.size === 1) return [...matchedNiches][0] ?? null;

  // Multiple matches: pick the highest-priority niche
  for (const niche of NICHE_PRIORITY) {
    if (matchedNiches.has(niche)) return niche;
  }

  // Fallback: return the first match
  return [...matchedNiches][0] ?? null;
}

/**
 * Convert a niche value to a display label.
 * e.g., "diy_crafts" -> "DIY Crafts"
 */
export function nicheValueToLabel(value: string): string {
  const SPECIAL_LABELS: Record<string, string> = {
    diy_crafts: "DIY & Crafts",
    religion_spirituality: "Religion & Spirituality",
    pets_animals: "Pets & Animals",
    real_estate: "Real Estate",
  };

  if (SPECIAL_LABELS[value]) return SPECIAL_LABELS[value];

  // Generic: replace underscores with spaces, capitalize each word
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Convert a niche value to a URL-friendly slug.
 * e.g., "diy_crafts" -> "diy-crafts"
 */
export function nicheValueToSlug(value: string): string {
  return value.replace(/_/g, "-").toLowerCase();
}
