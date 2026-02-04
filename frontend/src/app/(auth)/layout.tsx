import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 0.5,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#000000",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
