"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BookOpen, Search, Calendar, Clock, Tag } from "lucide-react";
import Image from "next/image";
import posthog from "posthog-js";

interface BlogPost {
  postId: string;
  title: string;
  slug: string;
  excerpt: string;
  author: string;
  tags?: string[];
  featuredImage?: string;
  publishedAt: string;
  updatedAt: string;
}

export default function BlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    posthog.capture("blog_page_viewed");
    fetchBlogPosts();
  }, []);

  const fetchBlogPosts = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blog`);
      const data = await response.json();

      if (data.success || data.posts) {
        setPosts(data.posts || data.data?.posts || []);
      }
    } catch (error) {
      console.error("Failed to fetch blog posts:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get all unique tags from posts
  const allTags = Array.from(
    new Set(posts.flatMap((post) => post.tags || []))
  ).sort();

  // Filter posts based on search and tag
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      searchQuery === "" ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag =
      selectedTag === null || (post.tags && post.tags.includes(selectedTag));

    return matchesSearch && matchesTag;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const estimateReadTime = (excerpt: string) => {
    // Rough estimate: 200 words per minute
    const wordCount = excerpt.split(" ").length * 10; // Multiply by 10 to estimate full article
    return Math.ceil(wordCount / 200);
  };

  const getCategoryBadgeColor = (tags?: string[]) => {
    if (!tags || tags.length === 0 || !tags[0]) return "bg-gray-100 text-gray-800";

    const tag = tags[0].toLowerCase();
    if (tag.includes("guide") || tag.includes("study")) return "bg-blue-100 text-blue-800";
    if (tag.includes("tips") || tag.includes("strategy")) return "bg-purple-100 text-purple-800";
    if (tag.includes("exam") || tag.includes("test")) return "bg-green-100 text-green-800";
    return "bg-gray-100 text-gray-800";
  };

  const getGradientColor = (index: number) => {
    const gradients = [
      "from-primary to-secondary",
      "from-purple-500 to-pink-600",
      "from-green-500 to-teal-600",
      "from-orange-500 to-red-600",
      "from-indigo-500 to-blue-600",
      "from-pink-500 to-rose-600",
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg mb-6">
              <BookOpen className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              RE5 Exam Study Blog
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
              Expert guides, tips, and strategies to help you pass your RE5 exam with an 85% success rate
            </p>
          </div>
        </div>
      </section>

      {/* Navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="text-gray-600 hover:text-primary"
            >
              ← Back to Home
            </Button>
            <div className="text-sm text-gray-500">
              {filteredPosts.length} {filteredPosts.length === 1 ? "article" : "articles"}
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <section className="py-12 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            {/* Search Bar */}
            <div className="relative mb-8">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-xl"
              />
            </div>

            {/* Tag Filters */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  variant={selectedTag === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTag(null)}
                  className="rounded-full"
                >
                  All Articles
                </Button>
                {allTags.map((tag) => (
                  <Button
                    key={tag}
                    variant={selectedTag === tag ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    className="rounded-full"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading articles...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {searchQuery || selectedTag ? "No articles found" : "No articles yet"}
              </h3>
              <p className="text-gray-600">
                {searchQuery || selectedTag
                  ? "Try adjusting your search or filter"
                  : "Check back soon for expert RE5 exam guides and tips"}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post, index) => (
                <Card
                  key={post.postId}
                  className="border-0 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 bg-white overflow-hidden group cursor-pointer"
                  onClick={() => {
                    posthog.capture("blog_post_clicked", {
                      post_slug: post.slug,
                      post_title: post.title,
                      from: "blog_listing",
                    });
                    router.push(`/${post.slug}`);
                  }}
                >
                  {/* Featured Image or Gradient */}
                  <div className={`h-48 bg-gradient-to-br ${getGradientColor(index)} relative overflow-hidden`}>
                    {post.featuredImage ? (
                      <Image
                        src={post.featuredImage}
                        alt={post.title}
                        fill
                        className="object-cover"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-all" />

                    {/* Category Badge */}
                    {post.tags && post.tags.length > 0 && post.tags[0] && (
                      <div className="absolute bottom-4 left-4">
                        <Badge className={`${getCategoryBadgeColor(post.tags)} font-bold px-3 py-1`}>
                          {post.tags[0].toUpperCase()}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl group-hover:text-primary transition-colors line-clamp-2 mb-3">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-3 text-base">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    {/* Metadata */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(post.publishedAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{estimateReadTime(post.excerpt)} min read</span>
                      </div>
                    </div>

                    {/* Author */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">By {post.author}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="group-hover:text-primary group-hover:translate-x-1 transition-all"
                      >
                        Read More <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Practicing?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of professionals preparing for their RE5 exam with our proven platform
          </p>
          <Button
            size="lg"
            onClick={() => {
              posthog.capture("blog_cta_clicked", { location: "blog_bottom" });
              router.push("/");
              setTimeout(() => {
                const quizSection = document.querySelector("#quiz");
                if (quizSection) {
                  quizSection.scrollIntoView({ behavior: "smooth" });
                }
              }, 100);
            }}
            className="h-14 px-8 text-lg bg-white text-primary hover:bg-gray-100 shadow-xl"
          >
            Take Free Practice Quiz
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}
