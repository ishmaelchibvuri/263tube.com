"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreatorSearchAutocomplete } from "@/components/creators/CreatorSearchAutocomplete";

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

  const handleSearch = (query?: string) => {
    const q = (query ?? searchQuery).trim();
    if (q) {
      router.push(`/creators?search=${encodeURIComponent(q)}`);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSearch();
      }}
      className="relative max-w-md sm:max-w-2xl mx-auto mb-4 sm:mb-6"
    >
      <div
        className={`absolute -inset-0.5 bg-gradient-to-r from-[#319E31] via-[#FFD200] to-[#DE2010] rounded-xl blur-md transition-opacity duration-300 ${
          searchFocused ? "opacity-40" : "opacity-0"
        }`}
      />
      <div
        className="relative flex items-center bg-white/[0.05] backdrop-blur-sm rounded-xl border border-white/[0.1] overflow-visible"
        onFocus={() => setSearchFocused(true)}
        onBlur={(e) => {
          // Only blur if focus leaves the entire container
          if (!e.currentTarget.contains(e.relatedTarget)) {
            setSearchFocused(false);
          }
        }}
      >
        <CreatorSearchAutocomplete
          value={searchQuery}
          onChange={setSearchQuery}
          onSubmit={handleSearch}
          placeholder={`"${SEARCH_SUGGESTIONS[currentSuggestion]}"`}
          showIcon={true}
          navigateOnSelect={true}
          inputClassName="h-12 sm:h-14 text-sm sm:text-base bg-transparent border-0 rounded-none focus:border-0"
          className="flex-1"
        />
        <button
          type="submit"
          className="m-1.5 px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-[#DE2010] to-[#b01a0d] rounded-lg text-white text-sm font-semibold hover:from-[#ff2a17] hover:to-[#DE2010] transition-all flex-shrink-0"
        >
          Search
        </button>
      </div>
    </form>
  );
}
