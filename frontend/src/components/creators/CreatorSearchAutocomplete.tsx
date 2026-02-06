"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import {
  suggestCreators,
  type CreatorSuggestion,
} from "@/lib/actions/search-creators";

interface CreatorSearchAutocompleteProps {
  /** Current search value (controlled) */
  value: string;
  /** Called when the text input changes */
  onChange: (value: string) => void;
  /** Called when the user submits the search (Enter or button click) */
  onSubmit?: (query: string) => void;
  /** Called when a suggestion is clicked (receives full suggestion with slug) */
  onSelect?: (suggestion: CreatorSuggestion) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Additional className for the outer wrapper */
  className?: string;
  /** Input height class */
  inputClassName?: string;
  /** Whether to show the search icon */
  showIcon?: boolean;
  /** Whether clicking a suggestion navigates to the creator page */
  navigateOnSelect?: boolean;
  /** Auto-focus the input */
  autoFocus?: boolean;
  /** Reports whether the suggestions dropdown is visible */
  onSuggestionsVisibleChange?: (visible: boolean) => void;
}

export function CreatorSearchAutocomplete({
  value,
  onChange,
  onSubmit,
  onSelect,
  placeholder = "Search creators...",
  className = "",
  inputClassName = "h-12",
  showIcon = true,
  navigateOnSelect = true,
  autoFocus = false,
  onSuggestionsVisibleChange,
}: CreatorSearchAutocompleteProps) {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<CreatorSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Fetch suggestions with debounce
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 1) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const results = await suggestCreators(query);
      setSuggestions(results);
      setIsOpen(results.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced input handler
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 1) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, fetchSuggestions]);

  // Notify parent when suggestions visibility changes
  useEffect(() => {
    onSuggestionsVisibleChange?.(isOpen && suggestions.length > 0);
  }, [isOpen, suggestions.length, onSuggestionsVisibleChange]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (suggestion: CreatorSuggestion) => {
    setIsOpen(false);
    setActiveIndex(-1);
    if (onSelect) {
      onSelect(suggestion);
    } else if (navigateOnSelect) {
      router.push(`/creator/${suggestion.slug}`);
    } else {
      onChange(suggestion.name);
      onSubmit?.(suggestion.name);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        onSubmit?.(value);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < suggestions.length && suggestions[activeIndex]) {
          handleSelect(suggestions[activeIndex]);
        } else {
          setIsOpen(false);
          onSubmit?.(value);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  const handleClear = () => {
    onChange("");
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        {showIcon && (
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`w-full ${showIcon ? "pl-12" : "pl-4"} pr-10 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#DE2010]/50 transition-colors ${inputClassName}`}
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="creator-suggestions"
          aria-activedescendant={
            activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined
          }
        />
        {/* Loading / Clear button */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
          ) : value ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          id="creator-suggestions"
          role="listbox"
          className="absolute z-50 top-full mt-2 w-full bg-[#111113] border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden"
        >
          {suggestions.map((s, idx) => (
            <button
              key={s.slug}
              id={`suggestion-${idx}`}
              role="option"
              aria-selected={idx === activeIndex}
              onClick={() => handleSelect(s)}
              onMouseEnter={() => setActiveIndex(idx)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                idx === activeIndex
                  ? "bg-white/[0.08]"
                  : "hover:bg-white/[0.05]"
              }`}
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-slate-800">
                {s.profilePicUrl ? (
                  <Image
                    src={s.profilePicUrl}
                    alt={s.name}
                    width={36}
                    height={36}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#DE2010] to-[#b01a0d]">
                    <span className="text-sm font-bold text-white">
                      {s.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">
                  {s.name}
                </p>
                <p className="text-xs text-slate-500 truncate">{s.niche}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
