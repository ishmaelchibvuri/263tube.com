import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ClientProviders } from "@/components/providers/ClientProviders";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://263tube.com"),
  title: {
    default: "263Tube - Discover Zimbabwean Content Creators",
    template: "%s | 263Tube",
  },
  description:
    "The ultimate directory for Zimbabwean content creators. Discover YouTubers, influencers, and digital creators shaping Zimbabwean culture. Find talent, connect, and celebrate Zim creativity.",
  keywords: [
    "Zimbabwean YouTubers",
    "Zim content creators",
    "Zimbabwe influencers",
    "African creators",
    "Zim talent directory",
    "Zimbabwean digital creators",
    "263 creators",
    "Harare YouTubers",
    "Zimbabwe entertainment",
    "African influencer marketing",
    "Zim comedy",
    "Zimbabwe social media",
  ],
  authors: [{ name: "263Tube" }],
  creator: "263Tube",
  publisher: "263Tube",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "263Tube",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_ZW",
    url: "https://263tube.com",
    siteName: "263Tube",
    title: "263Tube - Discover Zimbabwean Content Creators",
    description:
      "The ultimate directory for Zimbabwean content creators. Discover YouTubers, influencers, and digital creators shaping our culture.",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "263Tube - Discover Zim Talent",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "263Tube - Discover Zimbabwean Content Creators",
    description:
      "The ultimate directory for Zimbabwean content creators. Discover YouTubers, influencers, and digital creators shaping our culture.",
    images: ["/images/og-image.png"],
    creator: "@263tube",
  },
  alternates: {
    canonical: "https://263tube.com",
  },
  category: "entertainment",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className} suppressHydrationWarning={true}>
        {/* Google tag (gtag.js) - Update with 263Tube tracking ID */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX');
          `}
        </Script>

        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
