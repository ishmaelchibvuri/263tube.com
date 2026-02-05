"use client";

import {
  Youtube,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Globe,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// TikTok icon (not in lucide-react)
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

type PlatformType =
  | "youtube"
  | "instagram"
  | "twitter"
  | "facebook"
  | "tiktok"
  | "linkedin"
  | "website";

interface SocialLink {
  label: string;
  url: string;
  handle?: string;
}

interface SocialLinkGroupProps {
  platform: PlatformType;
  links: SocialLink[];
  className?: string;
}

const platformConfig: Record<
  PlatformType,
  { icon: LucideIcon | typeof TikTokIcon; label: string; color: string }
> = {
  youtube: {
    icon: Youtube,
    label: "YouTube",
    color: "text-red-500 bg-red-500/10",
  },
  instagram: {
    icon: Instagram,
    label: "Instagram",
    color: "text-pink-500 bg-pink-500/10",
  },
  twitter: {
    icon: Twitter,
    label: "X",
    color: "text-sky-500 bg-sky-500/10",
  },
  facebook: {
    icon: Facebook,
    label: "Facebook",
    color: "text-blue-600 bg-blue-600/10",
  },
  tiktok: {
    icon: TikTokIcon,
    label: "TikTok",
    color: "text-foreground bg-foreground/10",
  },
  linkedin: {
    icon: Linkedin,
    label: "LinkedIn",
    color: "text-blue-500 bg-blue-500/10",
  },
  website: {
    icon: Globe,
    label: "Website",
    color: "text-primary bg-primary/10",
  },
};

export function SocialLinkGroup({
  platform,
  links,
  className,
}: SocialLinkGroupProps) {
  const config = platformConfig[platform];
  const Icon = config.icon;

  return (
    <div className={cn("social-link-group", className)}>
      {/* Platform Icon */}
      <div className={cn("social-link-icon flex-shrink-0", config.color)}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Links */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-foreground mb-2">
          {config.label}
        </h4>
        <div className="space-y-2">
          {links.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
            >
              <span className="truncate">{link.label}</span>
              {link.handle && (
                <span className="text-xs text-muted-foreground/60">
                  @{link.handle}
                </span>
              )}
              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SocialLinkGroup;
