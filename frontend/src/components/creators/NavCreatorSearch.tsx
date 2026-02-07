"use client";

import { useState } from "react";
import { CreatorSearchAutocomplete } from "./CreatorSearchAutocomplete";

export function NavCreatorSearch() {
  const [query, setQuery] = useState("");

  return (
    <CreatorSearchAutocomplete
      value={query}
      onChange={setQuery}
      placeholder="Search creators..."
      className="w-full max-w-xs sm:max-w-sm md:max-w-md"
      inputClassName="h-9 text-sm"
      showIcon={true}
      navigateOnSelect={true}
    />
  );
}
