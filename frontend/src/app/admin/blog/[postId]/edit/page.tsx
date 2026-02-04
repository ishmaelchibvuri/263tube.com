"use client";

import { useParams } from "next/navigation";
import { BlogPostEditor } from "@/components/admin/BlogPostEditor";

export default function EditBlogPostPage() {
  const params = useParams();
  const postId = params?.postId as string;

  return <BlogPostEditor postId={postId} />;
}
