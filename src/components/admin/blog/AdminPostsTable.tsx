"use client";

import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDate } from "@/lib/dates";
import type { BlogPostView } from "@/features/blog/types";

export default function AdminPostsTable({
  posts,
  total,
  page,
  pageCount,
}: {
  posts: BlogPostView[];
  total: number;
  page: number;
  pageCount: number;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleDelete(id: string) {
    if (!confirm("Delete this post permanently?")) return;
    setDeleting(id);
    setError("");
    try {
      const response = await fetch(`/api/v1/blog/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      router.refresh();
    } catch {
      setError("Could not delete that post.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="grid gap-4">
      <p className="type-small text-muted">{total} post{total !== 1 ? "s" : ""}</p>
      {error ? <p role="alert" className="type-small text-err">{error}</p> : null}
      <div className="overflow-x-auto rounded-card border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-bg-soft text-left">
              <th className="px-4 py-3 font-semibold text-ink">Title</th>
              <th className="px-4 py-3 font-semibold text-ink">Status</th>
              <th className="px-4 py-3 font-semibold text-ink">Author</th>
              <th className="px-4 py-3 font-semibold text-ink">Date</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-b border-line last:border-0 hover:bg-bg-soft">
                <td className="max-w-xs px-4 py-3">
                  <span className="block truncate font-medium text-ink">{post.title}</span>
                  <span className="block truncate type-small text-muted">/{post.slug}</span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      post.status === "published"
                        ? "bg-ok/10 text-ok"
                        : "bg-muted/10 text-muted"
                    }`}
                  >
                    {post.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-body">{post.author}</td>
                <td className="px-4 py-3 text-body">
                  {formatDate(post.publishedAt ?? post.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    {post.status === "published" && (
                      <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="rounded p-1.5 text-muted hover:text-ink"
                        aria-label="View post"
                      >
                        <ExternalLink size={15} />
                      </Link>
                    )}
                    <Link
                      href={`/admin/blog/${post.id}/edit`}
                      className="rounded p-1.5 text-muted hover:text-ink"
                      aria-label="Edit post"
                    >
                      <Pencil size={15} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(post.id)}
                      disabled={deleting === post.id}
                      className="rounded p-1.5 text-muted hover:text-err disabled:opacity-50"
                      aria-label="Delete post"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between gap-2">
          <span className="type-small text-muted">Page {page} of {pageCount}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`?page=${page - 1}`} className="rounded border border-line px-3 py-1.5 text-sm hover:bg-bg-soft">
                Previous
              </Link>
            )}
            {page < pageCount && (
              <Link href={`?page=${page + 1}`} className="rounded border border-line px-3 py-1.5 text-sm hover:bg-bg-soft">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
