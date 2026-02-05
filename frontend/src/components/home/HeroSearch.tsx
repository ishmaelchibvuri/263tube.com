"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

const SEARCH_SUGGESTIONS = [
  "Madam Boss",
  "Comedy creators",
  "Tech reviews",
  "Cooking shows",
  "Music artists",
];

export function HeroSearch() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSuggestion((prev) => (prev + 1) % SEARCH_SUGGESTIONS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/creators?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative max-w-md sm:max-w-2xl mx-auto mb-4 sm:mb-6">
      <div
        className={`absolute -inset-0.5 bg-gradient-to-r from-[#319E31] via-[#FFD200] to-[#DE2010] rounded-xl blur-md transition-opacity duration-300 ${
          searchFocused ? "opacity-40" : "opacity-0"
        }`}
      />
      <div className="relative flex items-center bg-white/[0.05] backdrop-blur-sm rounded-xl border border-white/[0.1] overflow-hidden">
        <Search className="w-4 h-4 text-slate-500 ml-3 sm:ml-4 flex-shrink-0" />
        <input
          type="text"
          placeholder={`"${SEARCH_SUGGESTIONS[currentSuggestion]}"`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="flex-1 h-12 sm:h-14 px-2 sm:px-3 bg-transparent text-white placeholder:text-slate-500 focus:outline-none text-sm sm:text-base"
        />
        <button
          type="submit"
          className="m-1.5 px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-[#DE2010] to-[#b01a0d] rounded-lg text-white text-sm font-semibold hover:from-[#ff2a17] hover:to-[#DE2010] transition-all"
        >
          Search
        </button>
      </div>
    </form>
  );
}
