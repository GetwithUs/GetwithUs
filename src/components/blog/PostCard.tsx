import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/dates";
import type { BlogPostView } from "@/features/blog/types";

/** Plain server-rendered post card. Hover changes colour only; no transforms or reveals. */
export default function PostCard({ post }: { post: BlogPostView }) {
  const date = post.publishedAt ?? post.createdAt;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-card">
      <Link
        href={`/blog/${post.slug}`}
        className="block text-ink hover:text-accent focus-visible:text-accent focus-visible:outline-none"
        aria-label={post.title}
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-soft">
          {post.coverImageUrl ? (
            <Image
              src={post.coverImageUrl}
              alt=""
              fill
              sizes="(max-width: 767px) 100vw, (max-width: 1100px) 50vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,var(--accent-soft),transparent_60%)]"
            />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-3 p-5">
          <p className="type-small text-muted">{formatDate(date)}</p>
          <h3 className="type-h4 font-semibold leading-snug text-current">{post.title}</h3>
          {post.excerpt ? (
            <p className="line-clamp-3 text-[0.98rem] leading-relaxed text-body">{post.excerpt}</p>
          ) : null}
          {post.tags.length ? (
            <p className="mt-auto type-small text-muted">{post.tags.slice(0, 3).join(" · ")}</p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
