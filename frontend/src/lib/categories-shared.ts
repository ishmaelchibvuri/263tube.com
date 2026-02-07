/**
 * 263Tube - Shared Category Types & Utilities
 *
 * Types and pure functions that can be imported by both
 * server components and client components.
 */

// ============================================================================
// Types
// ============================================================================

export interface CategoryItem {
  label: string;
  value: string;
  slug: string;
  description?: string;
  icon?: string;
  source: "seed" | "youtube_sync" | "admin";
}

export interface CategoryWithStats extends CategoryItem {
  creatorCount: number;
}

// ============================================================================
// Icon mapping for known categories
// ============================================================================

export const CATEGORY_ICONS: Record<string, string> = {
  comedy: "😂",
  music: "🎵",
  entertainment: "🎬",
  technology: "💻",
  cooking: "🍳",
  farming: "🌾",
  lifestyle: "✨",
  education: "📚",
  sports: "⚽",
  news: "📰",
  commentary: "💬",
  gaming: "🎮",
  beauty: "💄",
  fashion: "👗",
  travel: "✈️",
  fitness: "💪",
  business: "💼",
  motivation: "🔥",
  diy_crafts: "🔨",
  automotive: "🚗",
  religion_spirituality: "🙏",
  parenting: "👶",
  pets_animals: "🐾",
  real_estate: "🏠",
  finance: "💰",
};

// ============================================================================
// Color mapping for category cards
// ============================================================================

export const CATEGORY_COLORS: Record<string, { color: string; bgColor: string; borderColor: string }> = {
  comedy: { color: "from-[#DE2010] to-[#b01a0d]", bgColor: "bg-[#DE2010]/10", borderColor: "border-[#DE2010]/20" },
  music: { color: "from-purple-500 to-pink-500", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/20" },
  entertainment: { color: "from-pink-500 to-rose-500", bgColor: "bg-pink-500/10", borderColor: "border-pink-500/20" },
  technology: { color: "from-cyan-500 to-blue-500", bgColor: "bg-cyan-500/10", borderColor: "border-cyan-500/20" },
  cooking: { color: "from-[#319E31] to-emerald-600", bgColor: "bg-[#319E31]/10", borderColor: "border-[#319E31]/20" },
  farming: { color: "from-[#FFD200] to-amber-500", bgColor: "bg-[#FFD200]/10", borderColor: "border-[#FFD200]/20" },
  lifestyle: { color: "from-rose-400 to-pink-500", bgColor: "bg-rose-500/10", borderColor: "border-rose-500/20" },
  education: { color: "from-blue-400 to-indigo-500", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20" },
  sports: { color: "from-green-400 to-emerald-500", bgColor: "bg-green-500/10", borderColor: "border-green-500/20" },
  news: { color: "from-slate-400 to-slate-600", bgColor: "bg-slate-500/10", borderColor: "border-slate-500/20" },
  commentary: { color: "from-slate-400 to-slate-600", bgColor: "bg-slate-500/10", borderColor: "border-slate-500/20" },
  gaming: { color: "from-violet-400 to-purple-500", bgColor: "bg-violet-500/10", borderColor: "border-violet-500/20" },
  beauty: { color: "from-fuchsia-400 to-purple-500", bgColor: "bg-fuchsia-500/10", borderColor: "border-fuchsia-500/20" },
  fashion: { color: "from-pink-400 to-fuchsia-500", bgColor: "bg-pink-500/10", borderColor: "border-pink-500/20" },
  travel: { color: "from-sky-400 to-blue-500", bgColor: "bg-sky-500/10", borderColor: "border-sky-500/20" },
  fitness: { color: "from-orange-400 to-red-500", bgColor: "bg-orange-500/10", borderColor: "border-orange-500/20" },
  business: { color: "from-emerald-400 to-teal-500", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/20" },
  motivation: { color: "from-amber-400 to-orange-500", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/20" },
  diy_crafts: { color: "from-yellow-400 to-amber-500", bgColor: "bg-yellow-500/10", borderColor: "border-yellow-500/20" },
  automotive: { color: "from-red-400 to-orange-500", bgColor: "bg-red-500/10", borderColor: "border-red-500/20" },
  religion_spirituality: { color: "from-indigo-400 to-purple-500", bgColor: "bg-indigo-500/10", borderColor: "border-indigo-500/20" },
  parenting: { color: "from-pink-300 to-rose-400", bgColor: "bg-pink-400/10", borderColor: "border-pink-400/20" },
  pets_animals: { color: "from-amber-300 to-yellow-500", bgColor: "bg-amber-400/10", borderColor: "border-amber-400/20" },
  real_estate: { color: "from-teal-400 to-cyan-500", bgColor: "bg-teal-500/10", borderColor: "border-teal-500/20" },
  finance: { color: "from-green-400 to-emerald-500", bgColor: "bg-green-400/10", borderColor: "border-green-400/20" },
};

const DEFAULT_COLORS = { color: "from-slate-400 to-slate-600", bgColor: "bg-slate-500/10", borderColor: "border-slate-500/20" };

export function getCategoryColors(value: string) {
  return CATEGORY_COLORS[value] || DEFAULT_COLORS;
}
