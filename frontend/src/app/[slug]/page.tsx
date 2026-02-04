"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Link as LinkIcon,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";
import posthog from "posthog-js";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface BlogPost {
  postId: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: string;
  tags?: string[];
  featuredImage?: string;
  metaDescription?: string;
  publishedAt: string;
  updatedAt: string;
}

export default function BlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchBlogPost();
      fetchRelatedPosts();
    }
  }, [slug]);

  const fetchBlogPost = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blog/${slug}`);

      if (!response.ok) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (data.success || data.post) {
        const postData = data.post || data.data?.post;
        setPost(postData);

        // Track page view
        posthog.capture("blog_post_viewed", {
          post_slug: slug,
          post_title: postData.title,
          url_type: "root_level",
        });

        // Update page metadata
        if (typeof document !== "undefined") {
          document.title = `${postData.title} | Regulatory Exams`;
          const metaDescription = document.querySelector('meta[name="description"]');
          if (metaDescription) {
            metaDescription.setAttribute("content", postData.metaDescription || postData.excerpt);
          }
        }
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error("Failed to fetch blog post:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedPosts = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blog?limit=3`);
      const data = await response.json();

      if (data.success || data.posts) {
        const posts = data.posts || data.data?.posts || [];
        // Filter out current post and limit to 3
        const filtered = posts.filter((p: BlogPost) => p.slug !== slug).slice(0, 3);
        setRelatedPosts(filtered);
      }
    } catch (error) {
      console.error("Failed to fetch related posts:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const estimateReadTime = (content: string) => {
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / 200);
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = post?.title || "";

  const handleShare = (platform: string) => {
    posthog.capture("blog_post_shared", {
      platform,
      post_slug: slug,
      post_title: post?.title,
      url_type: "root_level",
    });

    let url = "";
    switch (platform) {
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case "copy":
        navigator.clipboard.writeText(shareUrl);
        alert("Link copied to clipboard!");
        return;
    }

    if (url) {
      window.open(url, "_blank", "width=600,height=400");
    }
  };

  // If not found, return null and let Next.js handle 404
  if (notFound) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push("/")}
                className="text-gray-600 hover:text-primary"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Home
              </Button>
              <span className="text-gray-300">|</span>
              <Button
                variant="ghost"
                onClick={() => router.push("/blog")}
                className="text-gray-600 hover:text-primary"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                All Articles
              </Button>
            </div>
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>

              {/* Share Menu */}
              {showShareMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                  <button
                    onClick={() => handleShare("facebook")}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                  >
                    <Facebook className="h-4 w-4 text-primary" />
                    Facebook
                  </button>
                  <button
                    onClick={() => handleShare("twitter")}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                  >
                    <Twitter className="h-4 w-4 text-sky-500" />
                    Twitter
                  </button>
                  <button
                    onClick={() => handleShare("linkedin")}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                  >
                    <Linkedin className="h-4 w-4 text-blue-700" />
                    LinkedIn
                  </button>
                  <button
                    onClick={() => handleShare("copy")}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                  >
                    <LinkIcon className="h-4 w-4 text-gray-600" />
                    Copy Link
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Article Header */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-sm">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          {post.title}
        </h1>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-8 pb-8 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <span className="font-medium">{post.author}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span>{formatDate(post.publishedAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span>{estimateReadTime(post.content)} min read</span>
          </div>
        </div>

        {/* Featured Image */}
        {post.featuredImage && (
          <div className="mb-12 rounded-2xl overflow-hidden shadow-2xl">
            <Image
              src={post.featuredImage}
              alt={post.title}
              width={1200}
              height={630}
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Article Content */}
        <div className="prose prose-lg prose-blue max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </div>

        {/* CTA Box */}
        <div className="mt-16 bg-gradient-to-r from-primary to-secondary rounded-2xl p-8 md:p-12 text-white">
          <h3 className="text-3xl font-bold mb-4">Ready to Put This Knowledge Into Practice?</h3>
          <p className="text-xl text-white/90 mb-6">
            Start practicing with our free quiz and join thousands of professionals preparing for their RE5 exam.
          </p>
          <Button
            size="lg"
            onClick={() => {
              posthog.capture("blog_post_cta_clicked", {
                post_slug: slug,
                location: "article_bottom",
                url_type: "root_level",
              });
              router.push("/#quiz");
            }}
            className="h-14 px-8 text-lg bg-white text-primary hover:bg-gray-100 shadow-xl"
          >
            Take Free Practice Quiz
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </article>

      {/* Related Articles */}
      {relatedPosts.length > 0 && (
        <section className="bg-white py-16 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Related Articles
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {relatedPosts.map((relatedPost) => (
                <Card
                  key={relatedPost.postId}
                  className="border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer"
                  onClick={() => {
                    posthog.capture("related_post_clicked", {
                      from_slug: slug,
                      to_slug: relatedPost.slug,
                      url_type: "root_level",
                    });
                    router.push(`/${relatedPost.slug}`);
                  }}
                >
                  <div className="h-48 bg-gradient-to-br from-primary to-secondary relative">
                    {relatedPost.featuredImage && (
                      <Image
                        src={relatedPost.featuredImage}
                        alt={relatedPost.title}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2 hover:text-primary transition-colors">
                      {relatedPost.title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                      {relatedPost.excerpt}
                    </p>
                    <Button variant="ghost" size="sm" className="p-0 h-auto font-medium text-primary">
                      Read More <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
