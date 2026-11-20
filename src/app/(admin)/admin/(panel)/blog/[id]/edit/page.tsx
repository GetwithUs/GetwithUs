import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PostEditor from "@/components/admin/blog/PostEditor";
import { getPostById } from "@/features/blog/service";
import { requireAdmin } from "@/features/admin/auth";

export const metadata: Metadata = { title: "Edit post" };

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("/admin/blog");
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) notFound();
  return (
    <div className="grid gap-8">
      <h1 className="type-h2">Edit post</h1>
      <PostEditor post={post} />
    </div>
  );
}
