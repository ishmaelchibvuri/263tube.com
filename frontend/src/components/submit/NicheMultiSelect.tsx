"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Check, ChevronDown, X, Search } from "lucide-react";
import { NICHES, OTHER_NICHE, type NicheItem } from "@/constants/niches";

interface NicheMultiSelectProps {
  selectedNiches: string[];
  onChange: (niches: string[]) => void;
  onOtherSelected?: (customNiche: string) => void;
  customNiche?: string;
  maxSelections?: number;
  placeholder?: string;
  required?: boolean;
}

export function NicheMultiSelect({
  selectedNiches,
  onChange,
  onOtherSelected,
  customNiche = "",
  maxSelections = 3,
  placeholder = "Select niches...",
  required = false,
}: NicheMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOtherInput, setShowOtherInput] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter niches based on search query
  const filteredNiches = NICHES.filter((niche) =>
    niche.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    niche.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if "Other" is selected
  const isOtherSelected = selectedNiches.includes(OTHER_NICHE.value);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Show/hide other input based on selection
  useEffect(() => {
    setShowOtherInput(isOtherSelected);
  }, [isOtherSelected]);

  const toggleNiche = useCallback((nicheValue: string) => {
    if (selectedNiches.includes(nicheValue)) {
      // Remove niche
      onChange(selectedNiches.filter((v) => v !== nicheValue));
      if (nicheValue === OTHER_NICHE.value && onOtherSelected) {
        onOtherSelected("");
      }
    } else {
      // Add niche (if under max)
      if (selectedNiches.length < maxSelections) {
        onChange([...selectedNiches, nicheValue]);
      }
    }
  }, [selectedNiches, onChange, maxSelections, onOtherSelected]);

  const removeNiche = useCallback((nicheValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedNiches.filter((v) => v !== nicheValue));
    if (nicheValue === OTHER_NICHE.value && onOtherSelected) {
      onOtherSelected("");
    }
  }, [selectedNiches, onChange, onOtherSelected]);

  const getNicheLabel = (value: string): string => {
    if (value === OTHER_NICHE.value) return OTHER_NICHE.label;
    const niche = NICHES.find((n) => n.value === value);
    return niche?.label || value;
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Selected niches display / trigger */}
      <div
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
          }
        }}
        className={`min-h-12 px-3 py-2 bg-white/[0.05] border rounded-xl cursor-pointer transition-colors flex flex-wrap items-center gap-2 ${
          isOpen
            ? "border-[#DE2010]/50 ring-1 ring-[#DE2010]/20"
            : "border-white/[0.1] hover:border-white/[0.2]"
        }`}
      >
        {selectedNiches.length === 0 ? (
          <span className="text-slate-500 text-sm">{placeholder}</span>
        ) : (
          selectedNiches.map((nicheValue) => (
            <span
              key={nicheValue}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#DE2010]/20 text-[#ff6b5b] text-xs font-medium rounded-lg"
            >
              {getNicheLabel(nicheValue)}
              <button
                type="button"
                onClick={(e) => removeNiche(nicheValue, e)}
                className="hover:bg-white/10 rounded p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
        <ChevronDown
          className={`w-4 h-4 text-slate-400 ml-auto transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {/* Hidden input for form validation */}
      {required && (
        <input
          type="text"
          required
          value={selectedNiches.join(",")}
          onChange={() => {}}
          className="absolute opacity-0 pointer-events-none h-0 w-0"
          tabIndex={-1}
        />
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 py-2 bg-[#18181b] border border-white/[0.1] rounded-xl shadow-xl max-h-64 overflow-hidden">
          {/* Search input */}
          <div className="px-3 pb-2 border-b border-white/[0.05]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search niches..."
                className="w-full h-9 pl-9 pr-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#DE2010]/50"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Select up to {maxSelections} niches ({selectedNiches.length}/{maxSelections})
            </p>
          </div>

          {/* Options list */}
          <div className="overflow-y-auto max-h-44 py-1">
            {filteredNiches.length === 0 ? (
              <p className="px-3 py-2 text-sm text-slate-500">No niches found</p>
            ) : (
              filteredNiches.map((niche) => {
                const isSelected = selectedNiches.includes(niche.value);
                const isDisabled = !isSelected && selectedNiches.length >= maxSelections;

                return (
                  <button
                    key={niche.value}
                    type="button"
                    onClick={() => !isDisabled && toggleNiche(niche.value)}
                    disabled={isDisabled}
                    className={`w-full px-3 py-2 text-left flex items-center gap-3 transition-colors ${
                      isDisabled
                        ? "opacity-40 cursor-not-allowed"
                        : isSelected
                        ? "bg-[#DE2010]/10"
                        : "hover:bg-white/[0.05]"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-[#DE2010] border-[#DE2010]"
                          : "border-white/[0.2]"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">{niche.label}</p>
                      {niche.description && (
                        <p className="text-xs text-slate-500 truncate">{niche.description}</p>
                      )}
                    </div>
                  </button>
                );
              })
            )}

            {/* "Other" option - always visible at the bottom */}
            {searchQuery === "" || OTHER_NICHE.label.toLowerCase().includes(searchQuery.toLowerCase()) ? (
              <div className="border-t border-white/[0.05] mt-1 pt-1">
                <button
                  type="button"
                  onClick={() => toggleNiche(OTHER_NICHE.value)}
                  disabled={!isOtherSelected && selectedNiches.length >= maxSelections}
                  className={`w-full px-3 py-2 text-left flex items-center gap-3 transition-colors ${
                    !isOtherSelected && selectedNiches.length >= maxSelections
                      ? "opacity-40 cursor-not-allowed"
                      : isOtherSelected
                      ? "bg-[#FFD200]/10"
                      : "hover:bg-white/[0.05]"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      isOtherSelected
                        ? "bg-[#FFD200] border-[#FFD200]"
                        : "border-white/[0.2]"
                    }`}
                  >
                    {isOtherSelected && <Check className="w-3 h-3 text-black" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#FFD200]">{OTHER_NICHE.label}</p>
                    <p className="text-xs text-slate-500">{OTHER_NICHE.description}</p>
                  </div>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* "Other" custom niche input */}
      {showOtherInput && (
        <div className="mt-3 p-3 bg-[#FFD200]/5 border border-[#FFD200]/20 rounded-xl">
          <label className="block text-xs text-[#FFD200] font-medium mb-2">
            Suggest a New Niche (for Admin Review)
          </label>
          <input
            type="text"
            value={customNiche}
            onChange={(e) => onOtherSelected?.(e.target.value)}
            placeholder="e.g., Documentary, Animation, Podcasting..."
            className="w-full h-10 px-3 bg-white/[0.05] border border-[#FFD200]/30 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FFD200]/50"
          />
          <p className="text-xs text-slate-500 mt-2">
            Our team will review your suggestion and may add it to the official categories.
          </p>
        </div>
      )}
    </div>
  );
}
