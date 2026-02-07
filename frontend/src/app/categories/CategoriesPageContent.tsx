"use client";

import Link from "next/link";
import { ArrowRight, Users, TrendingUp } from "lucide-react";
import { getCategoryColors, type CategoryWithStats } from "@/lib/categories-shared";

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toString();
}

interface CategoriesPageContentProps {
  categories: CategoryWithStats[];
}

export function CategoriesPageContent({ categories }: CategoriesPageContentProps) {
  const totalCreators = categories.reduce((sum, cat) => sum + cat.creatorCount, 0);

  return (
    <>
      {/* Header */}
      <header className="relative py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">✨</span>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Browse by Category</h1>
          </div>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto mb-6">
            Explore {categories.length} content categories featuring Zimbabwe&apos;s best creators
          </p>

          {/* Quick Stats */}
          <div className="flex items-center justify-center gap-6 sm:gap-10">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white">{totalCreators}+</div>
              <div className="text-xs sm:text-sm text-slate-500">Total Creators</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white">{categories.length}</div>
              <div className="text-xs sm:text-sm text-slate-500">Categories</div>
            </div>
          </div>
        </div>
      </header>

      {/* Categories Grid */}
      <main className="relative px-4 sm:px-6 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {categories.map((category) => {
              const colors = getCategoryColors(category.value);

              return (
                <Link
                  key={category.value}
                  href={`/creators?niche=${category.value}`}
                  className={`group relative p-5 sm:p-6 rounded-2xl bg-white/[0.02] border ${colors.borderColor} hover:bg-white/[0.04] transition-all duration-300 overflow-hidden`}
                >
                  {/* Background Gradient on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${colors.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                  <div className="relative">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl sm:text-4xl">{category.icon || "📁"}</span>
                        <div>
                          <h2 className="text-lg sm:text-xl font-bold text-white group-hover:text-[#FFD200] transition-colors">
                            {category.label}
                          </h2>
                          <div className="flex items-center gap-1 text-slate-500">
                            <Users className="w-3 h-3" />
                            <span className="text-xs">{category.creatorCount} creators</span>
                          </div>
                        </div>
                      </div>
                      <div className={`p-2 rounded-lg ${colors.bgColor} opacity-0 group-hover:opacity-100 transition-opacity`}>
                        <ArrowRight className="w-4 h-4 text-white" />
                      </div>
                    </div>

                    {/* Description */}
                    {category.description && (
                      <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                        {category.description}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
