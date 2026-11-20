import { PenLine } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import AdminPostsTable from "@/components/admin/blog/AdminPostsTable";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { listPostsAdmin } from "@/features/blog/service";
import { requireAdmin } from "@/features/admin/auth";

export const instant = false;
export const metadata: Metadata = { title: "Blog" };

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin("/admin/blog");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const status = sp.status === "draft" || sp.status === "published" ? sp.status : undefined;
  const requested = typeof sp.page === "string" ? Number(sp.page) : 1;
  const page = Number.isFinite(requested) ? Math.max(1, Math.floor(requested)) : 1;

  const { posts, total, pageCount } = await listPostsAdmin({ q, status, page });

  return (
    <div className="grid gap-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="type-h2">Blog</h1>
        <Button href="/admin/blog/new" size="sm">New post</Button>
      </div>

      {posts.length ? (
        <AdminPostsTable posts={posts} total={total} page={page} pageCount={pageCount} />
      ) : (
        <EmptyState icon={PenLine} title="No posts yet">
          <Link href="/admin/blog/new" className="text-accent underline underline-offset-2">
            Write your first post
          </Link>
        </EmptyState>
      )}
    </div>
  );
}
