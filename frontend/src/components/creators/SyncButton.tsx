"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { syncSingleCreator } from "@/lib/actions/sync-engine";

interface SyncButtonProps {
  slug: string;
}

export function SyncButton({ slug }: SyncButtonProps) {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSync() {
    setSyncing(true);
    setMessage(null);

    try {
      const result = await syncSingleCreator(slug);
      setMessage(result.message);
    } catch {
      setMessage("Sync failed. Please try again.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleSync}
        disabled={syncing}
        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
        {syncing ? "Syncing..." : "Sync Now"}
      </button>
      {message && (
        <span className="text-xs text-slate-400">{message}</span>
      )}
    </div>
  );
}
