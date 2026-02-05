"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, HelpCircle, ChevronDown, Search, Sparkles, Users, Shield, Mail } from "lucide-react";

const FAQ_CATEGORIES = [
  {
    id: "general",
    title: "General",
    icon: HelpCircle,
    questions: [
      {
        q: "What is 263Tube?",
        a: "263Tube is Zimbabwe's largest online directory for discovering content creators. We help users find and connect with Zimbabwean YouTubers, TikTokers, Instagram influencers, and other social media creators across various niches like comedy, music, tech, cooking, and more.",
      },
      {
        q: "Is 263Tube free to use?",
        a: "Yes! 263Tube is completely free for everyone. Visitors can browse and discover creators at no cost, and creators can submit their profiles for free listing in our directory.",
      },
      {
        q: "How do I find creators in a specific category?",
        a: "You can browse creators by category using our Categories page, or use the filters on the Discover page to filter by niche, platform, or popularity. You can also use the search bar to find specific creators by name.",
      },
    ],
  },
  {
    id: "creators",
    title: "For Creators",
    icon: Users,
    questions: [
      {
        q: "How do I get listed on 263Tube?",
        a: "You can submit your profile through our Submit page. Fill out the form with your details, social media links, and content niche. Our team reviews submissions within 48 hours and will notify you once your profile is live.",
      },
      {
        q: "Can I submit someone else's profile?",
        a: "Yes! If you know a Zimbabwean creator who should be featured, you can submit their profile on their behalf. Just select 'Suggest a Creator' on the submit page and provide accurate information about them.",
      },
      {
        q: "How do I claim my existing profile?",
        a: "If your profile is already on 263Tube and you want to manage it, visit the Claim page, search for your profile, and submit a verification request. We'll verify your identity through your social media accounts and grant you access to manage your profile.",
      },
      {
        q: "What information is displayed on my profile?",
        a: "Your profile displays your name, profile picture, cover image, content niche, social media links, and a brief bio. All this information is publicly visible to help people discover your content.",
      },
      {
        q: "How do I update my profile information?",
        a: "If you've claimed your profile, you can update it through your dashboard. If you haven't claimed it yet, please submit a claim request first, or contact us with the changes you'd like to make.",
      },
      {
        q: "Can I remove my profile from 263Tube?",
        a: "Yes, you can request removal of your profile at any time. Contact us at support@263tube.com with your removal request and we'll process it promptly.",
      },
    ],
  },
  {
    id: "verification",
    title: "Verification",
    icon: Shield,
    questions: [
      {
        q: "What does the verified badge mean?",
        a: "The verified badge (green checkmark) indicates that a creator has claimed and verified their profile on 263Tube. It confirms that the profile is authentic and managed by the actual creator.",
      },
      {
        q: "How do I get verified?",
        a: "To get verified, you need to claim your profile and complete our verification process. This typically involves confirming your identity through one of your official social media accounts.",
      },
      {
        q: "Does verification cost anything?",
        a: "No, verification is completely free. We don't charge creators for the verified badge.",
      },
    ],
  },
  {
    id: "technical",
    title: "Technical",
    icon: HelpCircle,
    questions: [
      {
        q: "Why are some social links not working?",
        a: "Social media links are provided by creators and may occasionally become outdated if creators change their usernames or delete accounts. If you notice a broken link, please let us know so we can update it.",
      },
      {
        q: "How often is the directory updated?",
        a: "We review and add new creator submissions daily. Trending data and statistics are updated weekly to reflect the latest engagement metrics.",
      },
      {
        q: "Can I embed 263Tube content on my website?",
        a: "Currently, we don't offer embed functionality. However, you're welcome to link to creator profiles on 263Tube from your website.",
      },
    ],
  },
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("general");

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredCategories = FAQ_CATEGORIES.map((category) => ({
    ...category,
    questions: category.questions.filter(
      (q) =>
        q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((category) => category.questions.length > 0);

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-[#DE2010]/10 rounded-full blur-[100px] sm:blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-[#319E31]/5 rounded-full blur-[80px] sm:blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <Image src="/images/logo.png" alt="263Tube" width={32} height={32} className="w-full h-full object-contain" />
            </div>
            <span className="text-base font-bold text-white">263<span className="text-[#DE2010]">Tube</span></span>
          </Link>
        </div>
      </header>

      <main className="relative max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#DE2010]/10 mb-4">
            <HelpCircle className="w-6 h-6 text-[#DE2010]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Frequently Asked Questions</h1>
          <p className="text-sm sm:text-base text-slate-400">
            Find answers to common questions about 263Tube
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#DE2010]/50 transition-colors"
          />
        </div>

        {/* Category Tabs */}
        {!searchQuery && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-2">
            {FAQ_CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    activeCategory === category.id
                      ? "bg-[#DE2010] text-white"
                      : "bg-white/[0.05] text-slate-400 hover:text-white hover:bg-white/[0.1]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {category.title}
                </button>
              );
            })}
          </div>
        )}

        {/* FAQ Items */}
        <div className="space-y-3">
          {(searchQuery ? filteredCategories : FAQ_CATEGORIES.filter((c) => c.id === activeCategory)).map(
            (category) =>
              category.questions.map((item, index) => {
                const itemId = `${category.id}-${index}`;
                const isOpen = openItems.includes(itemId);

                return (
                  <div
                    key={itemId}
                    className="bg-white/[0.02] border border-white/[0.05] rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => toggleItem(itemId)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
                    >
                      <span className="text-sm sm:text-base font-medium text-white pr-4">{item.q}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4">
                        <p className="text-sm text-slate-400 leading-relaxed">{item.a}</p>
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>

        {searchQuery && filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 mb-2">No questions found matching "{searchQuery}"</p>
            <p className="text-sm text-slate-500">Try different keywords or browse by category</p>
          </div>
        )}

        {/* Contact Section */}
        <div className="mt-12 bg-gradient-to-br from-[#DE2010]/10 to-[#319E31]/10 border border-white/[0.05] rounded-xl p-6 text-center">
          <Sparkles className="w-8 h-8 text-[#FFD200] mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-white mb-2">Still have questions?</h2>
          <p className="text-sm text-slate-400 mb-4">
            Can't find what you're looking for? We're here to help.
          </p>
          <a
            href="mailto:support@263tube.com"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#DE2010] hover:bg-[#ff2a17] text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Mail className="w-4 h-4" />
            Contact Support
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-white/[0.05] bg-black/40 mt-12">
        <div className="h-1 bg-gradient-to-r from-[#319E31] via-[#FFD200] to-[#DE2010]" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 text-center">
          <p className="text-slate-500 text-sm">
            &copy; 2025 263Tube. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
