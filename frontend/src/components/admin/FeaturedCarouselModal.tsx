"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Search, X, Loader2, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { suggestCreators, getCreatorSummariesBySlugs, type CreatorSuggestion } from "@/lib/actions/search-creators";
import {
  getFeaturedCarouselSettings,
  saveFeaturedCarouselSettings,
} from "@/lib/actions/featured-carousel";

const MAX_CREATORS = 10;

interface FeaturedCarouselModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeaturedCarouselModal({
  open,
  onOpenChange,
}: FeaturedCarouselModalProps) {
  const [enabled, setEnabled] = useState(false);
  const [selected, setSelected] = useState<CreatorSuggestion[]>([]);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<CreatorSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load current settings when modal opens
  useEffect(() => {
    if (!open) return;

    setResult(null);
    setQuery("");
    setSuggestions([]);

    (async () => {
      setLoading(true);
      try {
        const settings = await getFeaturedCarouselSettings();
        setEnabled(settings.enabled);

        if (settings.creatorSlugs.length > 0) {
          const summaries = await getCreatorSummariesBySlugs(
            settings.creatorSlugs
          );
          setSelected(summaries);
        } else {
          setSelected([]);
        }
      } catch {
        setResult({ type: "error", message: "Failed to load settings." });
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  // Debounced search
  const handleSearch = useCallback((value: string) => {
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await suggestCreators(value);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  const addCreator = (creator: CreatorSuggestion) => {
    if (selected.length >= MAX_CREATORS) return;
    if (selected.some((s) => s.slug === creator.slug)) return;

    setSelected((prev) => [...prev, creator]);
    setQuery("");
    setSuggestions([]);
  };

  const removeCreator = (slug: string) => {
    setSelected((prev) => prev.filter((s) => s.slug !== slug));
  };

  const handleSave = async () => {
    setSaving(true);
    setResult(null);

    try {
      const slugs = selected.map((s) => s.slug);
      const res = await saveFeaturedCarouselSettings(slugs, enabled);
      setResult({
        type: res.success ? "success" : "error",
        message: res.message,
      });
    } catch {
      setResult({ type: "error", message: "Failed to save settings." });
    } finally {
      setSaving(false);
    }
  };

  // Filter out already-selected creators from suggestions
  const filteredSuggestions = suggestions.filter(
    (s) => !selected.some((sel) => sel.slug === s.slug)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#09090b] border-white/[0.08] text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Star className="w-5 h-5 text-[#FFD200]" />
            Featured Carousel
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Handpick up to {MAX_CREATORS} creators for the homepage carousel.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#FFD200]" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Toggle */}
            <div className="flex items-center justify-between px-1">
              <div>
                <p className="text-sm font-medium text-white">
                  Handpicked mode
                </p>
                <p className="text-xs text-slate-500">
                  {enabled
                    ? "Showing handpicked creators"
                    : "Using default trending/random"}
                </p>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={setEnabled}
                className="data-[state=checked]:bg-[#FFD200]"
              />
            </div>

            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search creators..."
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                disabled={selected.length >= MAX_CREATORS}
                className="w-full pl-9 pr-4 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FFD200]/50 disabled:opacity-40"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />
              )}
            </div>

            {/* Search suggestions dropdown */}
            {filteredSuggestions.length > 0 && (
              <div className="border border-white/[0.08] rounded-xl overflow-hidden divide-y divide-white/[0.05]">
                {filteredSuggestions.map((creator) => (
                  <button
                    key={creator.slug}
                    onClick={() => addCreator(creator)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.05] transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-white/[0.05]">
                      {creator.profilePicUrl ? (
                        <Image
                          src={creator.profilePicUrl}
                          alt={creator.name}
                          width={32}
                          height={32}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br from-[#DE2010] to-[#b01a0d]">
                          {creator.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">
                        {creator.name}
                      </p>
                      <p className="text-xs text-slate-500">{creator.niche}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Selected creators */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <p className="text-xs font-medium text-slate-400">
                  Selected creators
                </p>
                <p className="text-xs text-slate-500">
                  {selected.length}/{MAX_CREATORS}
                </p>
              </div>

              {selected.length === 0 ? (
                <p className="text-xs text-slate-600 text-center py-6">
                  No creators selected yet. Use the search above to add
                  creators.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {selected.map((creator, index) => (
                    <div
                      key={creator.slug}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05]"
                    >
                      <span className="text-xs font-medium text-slate-500 w-4 text-center flex-shrink-0">
                        {index + 1}
                      </span>
                      <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 bg-white/[0.05]">
                        {creator.profilePicUrl ? (
                          <Image
                            src={creator.profilePicUrl}
                            alt={creator.name}
                            width={28}
                            height={28}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-br from-[#DE2010] to-[#b01a0d]">
                            {creator.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">
                          {creator.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {creator.niche}
                        </p>
                      </div>
                      <button
                        onClick={() => removeCreator(creator.slug)}
                        className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-white/[0.08] text-slate-500 hover:text-white transition-colors flex-shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Result message */}
            {result && (
              <div
                className={`p-3 rounded-xl text-sm ${
                  result.type === "success"
                    ? "bg-[#319E31]/10 border border-[#319E31]/20 text-[#319E31]"
                    : "bg-[#DE2010]/10 border border-[#DE2010]/20 text-[#DE2010]"
                }`}
              >
                {result.message}
              </div>
            )}

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FFD200]/10 border border-[#FFD200]/20 text-[#FFD200] hover:bg-[#FFD200]/20 transition-colors disabled:opacity-50 font-medium text-sm"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Star className="w-4 h-4" />
              )}
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
