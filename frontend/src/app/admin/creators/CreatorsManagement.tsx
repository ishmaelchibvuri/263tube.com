"use client";

import { useState } from "react";
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
} from "lucide-react";
import { toggleCreatorVerified } from "@/lib/actions/sync-engine";
import type { Creator } from "@/lib/creators";

interface CreatorsManagementProps {
  creators: Creator[];
}

export function CreatorsManagement({ creators }: CreatorsManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [nicheFilter, setNicheFilter] = useState("all");
  const [verifiedFilter, setVerifiedFilter] = useState("all");
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);
  const [localCreators, setLocalCreators] = useState(creators);
  const [actionResult, setActionResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

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

    return matchesSearch && matchesNiche && matchesVerified;
  });

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

  return (
    <div className="space-y-6">
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
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white placeholder-slate-500 focus:outline-none focus:border-[#DE2010]/40 focus:ring-1 focus:ring-[#DE2010]/20 text-sm"
            />
          </div>

          {/* Niche Filter */}
          <select
            value={nicheFilter}
            onChange={(e) => setNicheFilter(e.target.value)}
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

          {/* Verified Filter */}
          <select
            value={verifiedFilter}
            onChange={(e) => setVerifiedFilter(e.target.value)}
            className="px-4 py-2.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-[#DE2010]/40 appearance-none cursor-pointer"
          >
            <option value="all" className="bg-[#0f0f12]">
              All Status
            </option>
            <option value="verified" className="bg-[#0f0f12]">
              Verified
            </option>
            <option value="unverified" className="bg-[#0f0f12]">
              Unverified
            </option>
          </select>
        </div>

        <p className="text-xs text-slate-500 mt-3">
          Showing {filteredCreators.length} of {localCreators.length} creators
        </p>
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
          {filteredCreators.map((creator) => {
            const isToggling = togglingSlug === creator.slug;

            return (
              <div
                key={creator.slug}
                className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-5 hover:border-white/[0.1] transition-colors"
              >
                <div className="flex items-center justify-between">
                  {/* Creator Info */}
                  <div className="flex items-center gap-4 min-w-0 flex-1">
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
                              : "bg-[#319E31]/10 text-[#319E31]"
                          }`}
                        >
                          {creator.status}
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
                  <option value="PENDING" className="bg-[#141418]">Pending</option>
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
