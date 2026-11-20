import type { Metadata } from "next";
import PostEditor from "@/components/admin/blog/PostEditor";
import { requireAdmin } from "@/features/admin/auth";

export const metadata: Metadata = { title: "New post" };

export default async function NewPostPage() {
  await requireAdmin("/admin/blog/new");
  return (
    <div className="grid gap-8">
      <h1 className="type-h2">New post</h1>
      <PostEditor />
    </div>
  );
}
