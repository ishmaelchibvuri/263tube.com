import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { AuthButton } from "@/components/home/AuthButton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#09090b]">
      <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden">
                <Image
                  src="/images/logo.png"
                  alt="263Tube"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-base font-bold text-white">
                263<span className="text-[#DE2010]">Tube</span>
              </span>
            </Link>
            <AuthButton />
          </div>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8 sm:py-12">{children}</main>
    </div>
  );
}
