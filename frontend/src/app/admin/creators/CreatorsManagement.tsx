"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  Search,
  Users,
  BadgeCheck,
  Globe,
  ExternalLink,
  Loader2,
  ShieldCheck,
  ShieldOff,
  Pencil,
  Trash2,
  X,
  Save,
  AlertTriangle,
  Upload,
  ChevronLeft,
  ChevronRight,
  Power,
  Star,
  ArrowUpDown,
  CheckCircle,
  Square,
  CheckSquare,
} from "lucide-react";
import { toggleCreatorVerified, toggleCreatorActive, toggleCreatorFeatured } from "@/lib/actions/sync-engine";
import type { Creator } from "@/lib/creators";

interface CreatorsManagementProps {
  creators: Creator[];
}

const ITEMS_PER_PAGE = 50;

export function CreatorsManagement({ creators }: CreatorsManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [nicheFilter, setNicheFilter] = useState("all");
  const [verifiedFilter, setVerifiedFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("reach-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);
  const [togglingActiveSlug, setTogglingActiveSlug] = useState<string | null>(null);
  const [togglingFeaturedSlug, setTogglingFeaturedSlug] = useState<string | null>(null);
  const [localCreators, setLocalCreators] = useState(creators);
  const [actionResult, setActionResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [approvingSlug, setApprovingSlug] = useState<string | null>(null);

  // Batch selection state
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [batchAction, setBatchAction] = useState<string | null>(null);
  const [batchConfirmAction, setBatchConfirmAction] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 });

  // Delete state
  const [deleteConfirmSlug, setDeleteConfirmSlug] = useState<string | null>(null);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  // Edit state
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    niche: string;
    bio: string;
    website: string;
    status: string;
    location: string;
    contactEmail: string;
    profilePicUrl: string;
    bannerUrl: string;
  }>({ name: "", niche: "", bio: "", website: "", status: "ACTIVE", location: "", contactEmail: "", profilePicUrl: "", bannerUrl: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<"profile" | "banner" | null>(null);

  // Get unique niches for filter
  const allNiches = Array.from(
    new Set(localCreators.map((c) => c.niche).filter(Boolean))
  ).sort();

  // Filter creators
  const filteredCreators = localCreators.filter((creator) => {
    const matchesSearch =
      searchTerm === "" ||
      creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creator.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creator.niche.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creator.tags?.some((t) =>
        t.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesNiche =
      nicheFilter === "all" || creator.niche === nicheFilter;

    const matchesVerified =
      verifiedFilter === "all" ||
      (verifiedFilter === "verified" && creator.verified) ||
      (verifiedFilter === "unverified" && !creator.verified);

    const matchesStatus =
      statusFilter === "all" || creator.status === statusFilter;

    return matchesSearch && matchesNiche && matchesVerified && matchesStatus;
  });

  // Sort creators
  const sortedCreators = useMemo(() => {
    const sorted = [...filteredCreators];
    switch (sortBy) {
      case "reach-desc":
        sorted.sort((a, b) => (b.metrics.totalReach || 0) - (a.metrics.totalReach || 0));
        break;
      case "reach-asc":
        sorted.sort((a, b) => (a.metrics.totalReach || 0) - (b.metrics.totalReach || 0));
        break;
      case "name-asc":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "newest":
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "oldest":
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case "niche-asc":
        sorted.sort((a, b) => a.niche.localeCompare(b.niche) || a.name.localeCompare(b.name));
        break;
    }
    return sorted;
  }, [filteredCreators, sortBy]);

  // Pagination
  const totalPages = Math.ceil(sortedCreators.length / ITEMS_PER_PAGE);
  const paginatedCreators = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedCreators.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedCreators, currentPage]);

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };
  const handleNicheChange = (value: string) => {
    setNicheFilter(value);
    setCurrentPage(1);
  };
  const handleVerifiedChange = (value: string) => {
    setVerifiedFilter(value);
    setCurrentPage(1);
  };
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };
  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handleToggleVerified = async (slug: string, currentVerified: boolean) => {
    setTogglingSlug(slug);
    setActionResult(null);

    try {
      const result = await toggleCreatorVerified(slug, !currentVerified);
      if (result.success) {
        setLocalCreators((prev) =>
          prev.map((c) =>
            c.slug === slug ? { ...c, verified: !currentVerified } : c
          )
        );
        setActionResult({ type: "success", message: result.message });
      } else {
        setActionResult({ type: "error", message: result.message });
      }
    } catch {
      setActionResult({
        type: "error",
        message: "Failed to update verification status.",
      });
    } finally {
      setTogglingSlug(null);
    }
  };

  const handleToggleActive = async (slug: string, currentStatus: string) => {
    setTogglingActiveSlug(slug);
    setActionResult(null);

    const makeActive = currentStatus !== "ACTIVE";

    try {
      const result = await toggleCreatorActive(slug, makeActive);
      if (result.success) {
        setLocalCreators((prev) =>
          prev.map((c) =>
            c.slug === slug
              ? { ...c, status: makeActive ? "ACTIVE" : "INACTIVE" }
              : c
          )
        );
        setActionResult({ type: "success", message: result.message });
      } else {
        setActionResult({ type: "error", message: result.message });
      }
    } catch {
      setActionResult({
        type: "error",
        message: "Failed to update active status.",
      });
    } finally {
      setTogglingActiveSlug(null);
    }
  };

  const handleToggleFeatured = async (slug: string, currentStatus: string) => {
    setTogglingFeaturedSlug(slug);
    setActionResult(null);

    const makeFeatured = currentStatus !== "FEATURED";

    try {
      const result = await toggleCreatorFeatured(slug, makeFeatured);
      if (result.success) {
        setLocalCreators((prev) =>
          prev.map((c) =>
            c.slug === slug
              ? { ...c, status: makeFeatured ? "FEATURED" : "ACTIVE" }
              : c
          )
        );
        setActionResult({ type: "success", message: result.message });
      } else {
        setActionResult({ type: "error", message: result.message });
      }
    } catch {
      setActionResult({
        type: "error",
        message: "Failed to update featured status.",
      });
    } finally {
      setTogglingFeaturedSlug(null);
    }
  };

  const handleApprove = async (slug: string) => {
    setApprovingSlug(slug);
    setActionResult(null);

    try {
      const result = await toggleCreatorActive(slug, true);
      if (result.success) {
        setLocalCreators((prev) =>
          prev.map((c) =>
            c.slug === slug ? { ...c, status: "ACTIVE" } : c
          )
        );
        setActionResult({ type: "success", message: `Creator "${slug}" approved and set to active.` });
      } else {
        setActionResult({ type: "error", message: result.message });
      }
    } catch {
      setActionResult({ type: "error", message: "Failed to approve creator." });
    } finally {
      setApprovingSlug(null);
    }
  };

  const handleDelete = async (slug: string) => {
    setDeletingSlug(slug);
    setActionResult(null);

    try {
      const res = await fetch(`/api/creators/${slug}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        setLocalCreators((prev) => prev.filter((c) => c.slug !== slug));
        setActionResult({ type: "success", message: `Creator "${slug}" deleted successfully.` });
      } else {
        setActionResult({ type: "error", message: data.error || "Failed to delete creator." });
      }
    } catch {
      setActionResult({ type: "error", message: "Failed to delete creator." });
    } finally {
      setDeletingSlug(null);
      setDeleteConfirmSlug(null);
    }
  };

  const openEdit = (creator: Creator) => {
    setEditingSlug(creator.slug);
    setEditForm({
      name: creator.name,
      niche: creator.niche,
      bio: creator.bio || "",
      website: "",
      status: creator.status,
      location: creator.location || "",
      contactEmail: creator.contactEmail || "",
      profilePicUrl: creator.profilePicUrl || "",
      bannerUrl: creator.bannerUrl || creator.coverImageUrl || "",
    });
    setActionResult(null);
  };

  const handleSaveEdit = async () => {
    if (!editingSlug) return;
    setSavingEdit(true);
    setActionResult(null);

    try {
      const res = await fetch(`/api/creators/${editingSlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          niche: editForm.niche,
          bio: editForm.bio,
          website: editForm.website || undefined,
          status: editForm.status,
          location: editForm.location || undefined,
          contactEmail: editForm.contactEmail || undefined,
          profilePicUrl: editForm.profilePicUrl || undefined,
          primaryProfileImage: editForm.profilePicUrl || undefined,
          bannerUrl: editForm.bannerUrl || undefined,
          coverImageUrl: editForm.bannerUrl || undefined,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setLocalCreators((prev) =>
          prev.map((c) =>
            c.slug === editingSlug
              ? {
                  ...c,
                  name: editForm.name,
                  niche: editForm.niche,
                  bio: editForm.bio,
                  status: editForm.status as Creator["status"],
                  location: editForm.location || c.location,
                  profilePicUrl: editForm.profilePicUrl || c.profilePicUrl,
                  bannerUrl: editForm.bannerUrl || c.bannerUrl,
                }
              : c
          )
        );
        setActionResult({ type: "success", message: `Creator "${editForm.name}" updated successfully.` });
        setEditingSlug(null);
      } else {
        setActionResult({ type: "error", message: data.error || "Failed to update creator." });
      }
    } catch {
      setActionResult({ type: "error", message: "Failed to update creator." });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleImageUpload = async (file: File, type: "profile" | "banner") => {
    if (!editingSlug) return;
    setUploadingImage(type);
    setActionResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const res = await fetch(`/api/creators/${editingSlug}/upload-image`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        const s3Url = data.data.url;
        if (type === "profile") {
          setEditForm((prev) => ({ ...prev, profilePicUrl: s3Url }));
          setLocalCreators((prev) =>
            prev.map((c) =>
              c.slug === editingSlug ? { ...c, profilePicUrl: s3Url } : c
            )
          );
        } else {
          setEditForm((prev) => ({ ...prev, bannerUrl: s3Url }));
          setLocalCreators((prev) =>
            prev.map((c) =>
              c.slug === editingSlug ? { ...c, bannerUrl: s3Url, coverImageUrl: s3Url } : c
            )
          );
        }
        setActionResult({ type: "success", message: `${type === "profile" ? "Profile" : "Banner"} image uploaded to S3.` });
      } else {
        setActionResult({ type: "error", message: data.error || "Failed to upload image." });
      }
    } catch {
      setActionResult({ type: "error", message: "Failed to upload image." });
    } finally {
      setUploadingImage(null);
    }
  };

  const formatReach = (num: number): string => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Batch selection helpers
  const toggleSelectSlug = (slug: string) => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const allOnPageSelected =
    paginatedCreators.length > 0 &&
    paginatedCreators.every((c) => selectedSlugs.has(c.slug));

  const toggleSelectAllOnPage = () => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        paginatedCreators.forEach((c) => next.delete(c.slug));
      } else {
        paginatedCreators.forEach((c) => next.add(c.slug));
      }
      return next;
    });
  };

  const handleBatchAction = async (action: string) => {
    const slugs = Array.from(selectedSlugs);
    if (slugs.length === 0) return;

    setBatchAction(action);
    setBatchProgress({ done: 0, total: slugs.length });
    setActionResult(null);

    let successCount = 0;
    let failCount = 0;

    // Process in parallel with Promise.allSettled, tracking progress
    const promises = slugs.map(async (slug) => {
      try {
        let result: { success: boolean; message: string };
        switch (action) {
          case "approve":
          case "activate":
            result = await toggleCreatorActive(slug, true);
            if (result.success) {
              setLocalCreators((prev) =>
                prev.map((c) => (c.slug === slug ? { ...c, status: "ACTIVE" } : c))
              );
            }
            break;
          case "deactivate":
            result = await toggleCreatorActive(slug, false);
            if (result.success) {
              setLocalCreators((prev) =>
                prev.map((c) => (c.slug === slug ? { ...c, status: "INACTIVE" } : c))
              );
            }
            break;
          case "feature":
            result = await toggleCreatorFeatured(slug, true);
            if (result.success) {
              setLocalCreators((prev) =>
                prev.map((c) => (c.slug === slug ? { ...c, status: "FEATURED" } : c))
              );
            }
            break;
          case "verify":
            result = await toggleCreatorVerified(slug, true);
            if (result.success) {
              setLocalCreators((prev) =>
                prev.map((c) => (c.slug === slug ? { ...c, verified: true } : c))
              );
            }
            break;
          case "unverify":
            result = await toggleCreatorVerified(slug, false);
            if (result.success) {
              setLocalCreators((prev) =>
                prev.map((c) => (c.slug === slug ? { ...c, verified: false } : c))
              );
            }
            break;
          case "delete": {
            const res = await fetch(`/api/creators/${slug}`, { method: "DELETE" });
            const data = await res.json();
            result = { success: data.success, message: data.error || "" };
            if (data.success) {
              setLocalCreators((prev) => prev.filter((c) => c.slug !== slug));
            }
            break;
          }
          default:
            result = { success: false, message: "Unknown action" };
        }
        if (result.success) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
      setBatchProgress((prev) => ({ ...prev, done: prev.done + 1 }));
    });

    await Promise.allSettled(promises);

    setSelectedSlugs(new Set());
    setBatchAction(null);
    setBatchConfirmAction(null);

    const actionLabel = action.charAt(0).toUpperCase() + action.slice(1);
    if (failCount === 0) {
      setActionResult({
        type: "success",
        message: `${actionLabel}: ${successCount} creator${successCount !== 1 ? "s" : ""} updated successfully.`,
      });
    } else {
      setActionResult({
        type: "error",
        message: `${actionLabel}: ${successCount} succeeded, ${failCount} failed.`,
      });
    }
  };

  return (
    <div className={`space-y-6 ${selectedSlugs.size > 0 ? "pb-20" : ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#DE2010]/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#DE2010]" />
            </div>
            <h1 className="text-2xl font-bold text-white">Manage Creators</h1>
          </div>
          <p className="text-slate-400">
            Search, filter, and manage all registered creators
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-full bg-white/[0.05] text-sm text-slate-400">
          {localCreators.length} total
        </span>
      </div>

      {/* Action Result */}
      {actionResult && (
        <div
          className={`p-4 rounded-xl border text-sm ${
            actionResult.type === "success"
              ? "bg-[#319E31]/10 border-[#319E31]/20 text-[#319E31]"
              : "bg-[#DE2010]/10 border-[#DE2010]/20 text-[#DE2010]"
          }`}
        >
          {actionResult.message}
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, slug, or niche..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white placeholder-slate-500 focus:outline-none focus:border-[#DE2010]/40 focus:ring-1 focus:ring-[#DE2010]/20 text-sm"
            />
          </div>

          {/* Niche Filter */}
          <select
            value={nicheFilter}
            onChange={(e) => handleNicheChange(e.target.value)}
            className="px-4 py-2.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-[#DE2010]/40 appearance-none cursor-pointer"
          >
            <option value="all" className="bg-[#0f0f12]">
              All Niches
            </option>
            {allNiches.map((niche) => (
              <option key={niche} value={niche} className="bg-[#0f0f12]">
                {niche.charAt(0).toUpperCase() + niche.slice(1)}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-4 py-2.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-[#DE2010]/40 appearance-none cursor-pointer"
          >
            <option value="all" className="bg-[#0f0f12]">
              All Statuses
            </option>
            <option value="ACTIVE" className="bg-[#0f0f12]">
              Active
            </option>
            <option value="INACTIVE" className="bg-[#0f0f12]">
              Inactive
            </option>
            <option value="FEATURED" className="bg-[#0f0f12]">
              Featured
            </option>
            <option value="PENDING_REVIEW" className="bg-[#0f0f12]">
              Pending Review
            </option>
          </select>

          {/* Verified Filter */}
          <select
            value={verifiedFilter}
            onChange={(e) => handleVerifiedChange(e.target.value)}
            className="px-4 py-2.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-[#DE2010]/40 appearance-none cursor-pointer"
          >
            <option value="all" className="bg-[#0f0f12]">
              All Verification
            </option>
            <option value="verified" className="bg-[#0f0f12]">
              Verified
            </option>
            <option value="unverified" className="bg-[#0f0f12]">
              Unverified
            </option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-4 py-2.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-[#DE2010]/40 appearance-none cursor-pointer"
          >
            <option value="reach-desc" className="bg-[#0f0f12]">
              Reach: High to Low
            </option>
            <option value="reach-asc" className="bg-[#0f0f12]">
              Reach: Low to High
            </option>
            <option value="name-asc" className="bg-[#0f0f12]">
              Name: A-Z
            </option>
            <option value="name-desc" className="bg-[#0f0f12]">
              Name: Z-A
            </option>
            <option value="newest" className="bg-[#0f0f12]">
              Newest First
            </option>
            <option value="oldest" className="bg-[#0f0f12]">
              Oldest First
            </option>
            <option value="niche-asc" className="bg-[#0f0f12]">
              Niche: A-Z
            </option>
          </select>
        </div>

        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={toggleSelectAllOnPage}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            {allOnPageSelected ? (
              <CheckSquare className="w-3.5 h-3.5 text-[#DE2010]" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
            Select all on page
          </button>
          <p className="text-xs text-slate-500">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, sortedCreators.length)} of {sortedCreators.length} creators
            {sortedCreators.length !== localCreators.length && ` (${localCreators.length} total)`}
          </p>
        </div>
      </div>

      {/* Creators Table */}
      {filteredCreators.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/[0.05] flex items-center justify-center">
            <Users className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            No creators found
          </h3>
          <p className="text-slate-400 text-sm">
            {searchTerm || nicheFilter !== "all" || verifiedFilter !== "all"
              ? "Try adjusting your search or filters."
              : "No creators have been approved yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedCreators.map((creator) => {
            const isToggling = togglingSlug === creator.slug;
            const isSelected = selectedSlugs.has(creator.slug);

            return (
              <div
                key={creator.slug}
                className={`bg-white/[0.02] border rounded-xl p-5 hover:border-white/[0.1] transition-colors ${
                  isSelected ? "border-[#DE2010]/40 bg-[#DE2010]/[0.03]" : "border-white/[0.05]"
                }`}
              >
                <div className="flex items-center justify-between">
                  {/* Creator Info */}
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Selection Checkbox */}
                    <button
                      onClick={() => toggleSelectSlug(creator.slug)}
                      className="flex-shrink-0 text-slate-500 hover:text-white transition-colors"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-[#DE2010]" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                    {/* Avatar */}
                    {creator.profilePicUrl ? (
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
                        <Image
                          src={creator.profilePicUrl}
                          alt={creator.name}
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#DE2010] to-[#b01a0d] flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-white">
                          {creator.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* Name & Meta */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-semibold truncate">
                          {creator.name}
                        </h3>
                        {creator.verified && (
                          <BadgeCheck className="w-4 h-4 text-[#319E31] flex-shrink-0" />
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                            creator.status === "FEATURED"
                              ? "bg-[#FFD200]/10 text-[#FFD200]"
                              : creator.status === "INACTIVE"
                              ? "bg-slate-500/10 text-slate-500"
                              : creator.status === "PENDING_REVIEW"
                              ? "bg-orange-500/10 text-orange-400"
                              : "bg-[#319E31]/10 text-[#319E31]"
                          }`}
                        >
                          {creator.status === "PENDING_REVIEW" ? "Pending Review" : creator.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-slate-500">
                          @{creator.slug}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-white/[0.05] text-xs text-slate-400">
                          {creator.niche}
                        </span>
                        <span className="flex items-center gap-1 text-slate-500 text-xs">
                          <Globe className="w-3 h-3" />
                          {formatReach(creator.metrics.totalReach)} reach
                        </span>
                        <span className="text-slate-600 text-xs hidden md:inline">
                          Joined {formatDate(creator.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    {/* Approve Button for Pending Review */}
                    {creator.status === "PENDING_REVIEW" && (
                      <button
                        onClick={() => handleApprove(creator.slug)}
                        disabled={approvingSlug === creator.slug}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 bg-[#319E31]/10 text-[#319E31] border border-[#319E31]/20 hover:bg-[#319E31]/20"
                      >
                        {approvingSlug === creator.slug ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5" />
                        )}
                        Approve
                      </button>
                    )}

                    {/* Active/Inactive Toggle */}
                    {creator.status !== "FEATURED" && creator.status !== "PENDING_REVIEW" && (
                      <button
                        onClick={() => handleToggleActive(creator.slug, creator.status)}
                        disabled={togglingActiveSlug === creator.slug}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                          creator.status === "ACTIVE"
                            ? "bg-[#319E31]/10 text-[#319E31] border border-[#319E31]/20 hover:bg-[#319E31]/20"
                            : "bg-slate-500/10 text-slate-400 border border-slate-500/20 hover:bg-slate-500/20"
                        }`}
                      >
                        {togglingActiveSlug === creator.slug ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Power className="w-3.5 h-3.5" />
                        )}
                        {creator.status === "ACTIVE" ? "Active" : "Inactive"}
                      </button>
                    )}

                    {/* Featured Toggle */}
                    {creator.status !== "INACTIVE" && creator.status !== "PENDING_REVIEW" && (
                      <button
                        onClick={() => handleToggleFeatured(creator.slug, creator.status)}
                        disabled={togglingFeaturedSlug === creator.slug}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                          creator.status === "FEATURED"
                            ? "bg-[#FFD200]/10 text-[#FFD200] border border-[#FFD200]/20 hover:bg-[#FFD200]/20"
                            : "bg-white/[0.05] text-slate-400 border border-white/[0.08] hover:bg-white/[0.08] hover:text-[#FFD200]"
                        }`}
                      >
                        {togglingFeaturedSlug === creator.slug ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Star className={`w-3.5 h-3.5 ${creator.status === "FEATURED" ? "fill-[#FFD200]" : ""}`} />
                        )}
                        {creator.status === "FEATURED" ? "Featured" : "Feature"}
                      </button>
                    )}

                    {/* View Profile Link */}
                    <a
                      href={`/creator/${creator.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.05] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors text-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View
                    </a>

                    {/* Manual Verification Override Toggle */}
                    <button
                      onClick={() =>
                        handleToggleVerified(creator.slug, creator.verified)
                      }
                      disabled={isToggling}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                        creator.verified
                          ? "bg-[#319E31]/10 text-[#319E31] border border-[#319E31]/20 hover:bg-[#319E31]/20"
                          : "bg-white/[0.05] text-slate-400 border border-white/[0.08] hover:bg-white/[0.08] hover:text-white"
                      }`}
                    >
                      {isToggling ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : creator.verified ? (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      ) : (
                        <ShieldOff className="w-3.5 h-3.5" />
                      )}
                      {creator.verified ? "Verified" : "Unverified"}
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => openEdit(creator)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FFD200]/10 text-[#FFD200] border border-[#FFD200]/20 hover:bg-[#FFD200]/20 transition-colors text-xs font-medium"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => setDeleteConfirmSlug(creator.slug)}
                      disabled={deletingSlug === creator.slug}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#DE2010]/10 text-[#DE2010] border border-[#DE2010]/20 hover:bg-[#DE2010]/20 transition-colors text-xs font-medium disabled:opacity-50"
                    >
                      {deletingSlug === creator.slug ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3">
          <button
            onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            disabled={currentPage === 1}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.05] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors text-sm disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                // Show first, last, current, and neighbors
                if (page === 1 || page === totalPages) return true;
                if (Math.abs(page - currentPage) <= 2) return true;
                return false;
              })
              .reduce<(number | "ellipsis")[]>((acc, page, idx, arr) => {
                if (idx > 0 && page - (arr[idx - 1] as number) > 1) {
                  acc.push("ellipsis");
                }
                acc.push(page);
                return acc;
              }, [])
              .map((item, idx) =>
                item === "ellipsis" ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-slate-600 text-sm">...</span>
                ) : (
                  <button
                    key={item}
                    onClick={() => { setCurrentPage(item); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === item
                        ? "bg-[#DE2010] text-white"
                        : "bg-white/[0.05] text-slate-400 hover:text-white hover:bg-white/[0.08]"
                    }`}
                  >
                    {item}
                  </button>
                )
              )}
          </div>

          <button
            onClick={() => { setCurrentPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.05] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors text-sm disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmSlug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#141418] border border-white/[0.1] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#DE2010]/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#DE2010]" />
              </div>
              <h3 className="text-lg font-semibold text-white">Delete Creator</h3>
            </div>
            <p className="text-sm text-slate-400 mb-2">
              Are you sure you want to delete <span className="text-white font-medium">@{deleteConfirmSlug}</span>?
            </p>
            <p className="text-xs text-slate-500 mb-6">
              This action cannot be undone. All creator data including their profile, platform links, and metrics will be permanently removed.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmSlug(null)}
                className="px-4 py-2 rounded-lg bg-white/[0.05] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmSlug)}
                disabled={!!deletingSlug}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#DE2010] text-white hover:bg-[#ff2a17] transition-colors text-sm font-medium disabled:opacity-50"
              >
                {deletingSlug ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Creator
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Action Bar */}
      {selectedSlugs.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#141418]/95 backdrop-blur-md border-t border-white/[0.1] px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-white">
                {selectedSlugs.size} selected
              </span>
              <button
                onClick={() => setSelectedSlugs(new Set())}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>

            {batchAction ? (
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-[#DE2010]" />
                <span>
                  Processing {batchProgress.done} of {batchProgress.total}...
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handleBatchAction("approve")}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#319E31]/10 text-[#319E31] border border-[#319E31]/20 hover:bg-[#319E31]/20 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleBatchAction("activate")}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#319E31]/10 text-[#319E31] border border-[#319E31]/20 hover:bg-[#319E31]/20 transition-colors"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBatchAction("deactivate")}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20 hover:bg-slate-500/20 transition-colors"
                >
                  Deactivate
                </button>
                <button
                  onClick={() => handleBatchAction("feature")}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#FFD200]/10 text-[#FFD200] border border-[#FFD200]/20 hover:bg-[#FFD200]/20 transition-colors"
                >
                  Feature
                </button>
                <button
                  onClick={() => handleBatchAction("verify")}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#319E31]/10 text-[#319E31] border border-[#319E31]/20 hover:bg-[#319E31]/20 transition-colors"
                >
                  Verify
                </button>
                <button
                  onClick={() => handleBatchAction("unverify")}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.05] text-slate-400 border border-white/[0.08] hover:bg-white/[0.08] transition-colors"
                >
                  Unverify
                </button>
                <button
                  onClick={() => setBatchConfirmAction("delete")}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#DE2010]/10 text-[#DE2010] border border-[#DE2010]/20 hover:bg-[#DE2010]/20 transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Batch Delete Confirmation Modal */}
      {batchConfirmAction === "delete" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#141418] border border-white/[0.1] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#DE2010]/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#DE2010]" />
              </div>
              <h3 className="text-lg font-semibold text-white">Delete {selectedSlugs.size} Creator{selectedSlugs.size !== 1 ? "s" : ""}</h3>
            </div>
            <p className="text-sm text-slate-400 mb-2">
              Are you sure you want to delete <span className="text-white font-medium">{selectedSlugs.size} creator{selectedSlugs.size !== 1 ? "s" : ""}</span>?
            </p>
            <p className="text-xs text-slate-500 mb-6">
              This action cannot be undone. All selected creator data including profiles, platform links, and metrics will be permanently removed.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setBatchConfirmAction(null)}
                className="px-4 py-2 rounded-lg bg-white/[0.05] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBatchAction("delete")}
                disabled={!!batchAction}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#DE2010] text-white hover:bg-[#ff2a17] transition-colors text-sm font-medium disabled:opacity-50"
              >
                {batchAction === "delete" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete {selectedSlugs.size} Creator{selectedSlugs.size !== 1 ? "s" : ""}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Creator Modal */}
      {editingSlug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#141418] border border-white/[0.1] rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFD200]/10 flex items-center justify-center">
                  <Pencil className="w-5 h-5 text-[#FFD200]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Edit Creator</h3>
                  <p className="text-xs text-slate-500">@{editingSlug}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingSlug(null)}
                className="p-2 text-slate-500 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full h-10 px-3 bg-white/[0.05] border border-white/[0.08] rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#FFD200]/40 focus:ring-1 focus:ring-[#FFD200]/20"
                />
              </div>

              {/* Niche */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Niche</label>
                <input
                  type="text"
                  value={editForm.niche}
                  onChange={(e) => setEditForm({ ...editForm, niche: e.target.value })}
                  className="w-full h-10 px-3 bg-white/[0.05] border border-white/[0.08] rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#FFD200]/40 focus:ring-1 focus:ring-[#FFD200]/20"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full h-10 px-3 bg-white/[0.05] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-[#FFD200]/40 appearance-none cursor-pointer"
                >
                  <option value="ACTIVE" className="bg-[#141418]">Active</option>
                  <option value="FEATURED" className="bg-[#141418]">Featured</option>
                  <option value="PENDING_REVIEW" className="bg-[#141418]">Pending Review</option>
                  <option value="INACTIVE" className="bg-[#141418]">Inactive</option>
                </select>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#FFD200]/40 focus:ring-1 focus:ring-[#FFD200]/20 resize-none"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Location</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  placeholder="e.g. Harare, Zimbabwe"
                  className="w-full h-10 px-3 bg-white/[0.05] border border-white/[0.08] rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#FFD200]/40 focus:ring-1 focus:ring-[#FFD200]/20"
                />
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Website</label>
                <input
                  type="url"
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full h-10 px-3 bg-white/[0.05] border border-white/[0.08] rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#FFD200]/40 focus:ring-1 focus:ring-[#FFD200]/20"
                />
              </div>

              {/* Contact Email */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Contact Email</label>
                <input
                  type="email"
                  value={editForm.contactEmail}
                  onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                  placeholder="creator@example.com"
                  className="w-full h-10 px-3 bg-white/[0.05] border border-white/[0.08] rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#FFD200]/40 focus:ring-1 focus:ring-[#FFD200]/20"
                />
              </div>

              {/* Divider */}
              <div className="border-t border-white/[0.05] pt-4">
                <p className="text-xs text-slate-500 mb-4">Images are stored in S3. Upload a file or paste an S3/image URL.</p>
              </div>

              {/* Profile Picture */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Profile Picture</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={editForm.profilePicUrl}
                    onChange={(e) => setEditForm({ ...editForm, profilePicUrl: e.target.value })}
                    placeholder="https://263tube-creator-images.s3..."
                    className="flex-1 h-10 px-3 bg-white/[0.05] border border-white/[0.08] rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#FFD200]/40 focus:ring-1 focus:ring-[#FFD200]/20"
                  />
                  <label className={`flex items-center gap-1.5 px-3 h-10 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                    uploadingImage === "profile"
                      ? "bg-white/[0.05] border-white/[0.08] text-slate-500"
                      : "bg-[#319E31]/10 border-[#319E31]/20 text-[#319E31] hover:bg-[#319E31]/20"
                  }`}>
                    {uploadingImage === "profile" ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    {uploadingImage === "profile" ? "Uploading..." : "Upload"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={uploadingImage !== null}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, "profile");
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                {editForm.profilePicUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-800">
                      <Image src={editForm.profilePicUrl} alt="Profile preview" width={40} height={40} className="object-cover w-full h-full" />
                    </div>
                    <span className="text-xs text-slate-500 truncate flex-1">{editForm.profilePicUrl}</span>
                  </div>
                )}
              </div>

              {/* Banner Image */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Banner Image</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={editForm.bannerUrl}
                    onChange={(e) => setEditForm({ ...editForm, bannerUrl: e.target.value })}
                    placeholder="https://263tube-creator-images.s3..."
                    className="flex-1 h-10 px-3 bg-white/[0.05] border border-white/[0.08] rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#FFD200]/40 focus:ring-1 focus:ring-[#FFD200]/20"
                  />
                  <label className={`flex items-center gap-1.5 px-3 h-10 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                    uploadingImage === "banner"
                      ? "bg-white/[0.05] border-white/[0.08] text-slate-500"
                      : "bg-[#319E31]/10 border-[#319E31]/20 text-[#319E31] hover:bg-[#319E31]/20"
                  }`}>
                    {uploadingImage === "banner" ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    {uploadingImage === "banner" ? "Uploading..." : "Upload"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={uploadingImage !== null}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, "banner");
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                {editForm.bannerUrl && (
                  <div className="mt-2">
                    <div className="h-16 rounded-lg overflow-hidden bg-slate-800">
                      <Image src={editForm.bannerUrl} alt="Banner preview" width={400} height={64} className="object-cover w-full h-full" />
                    </div>
                    <span className="text-xs text-slate-500 truncate block mt-1">{editForm.bannerUrl}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Save / Cancel */}
            <div className="flex items-center gap-3 justify-end mt-6 pt-4 border-t border-white/[0.05]">
              <button
                onClick={() => setEditingSlug(null)}
                className="px-4 py-2 rounded-lg bg-white/[0.05] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit || !editForm.name.trim() || !editForm.niche.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#319E31] text-white hover:bg-[#3db83d] transition-colors text-sm font-medium disabled:opacity-50"
              >
                {savingEdit ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
