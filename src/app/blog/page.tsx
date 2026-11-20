import type { Metadata } from "next";
import Pagination from "@/components/blog/Pagination";
import PostCard from "@/components/blog/PostCard";
import BlogScene3D from "@/components/three/BlogScene3D";
import Container from "@/components/ui/Container";
import EmptyState from "@/components/ui/EmptyState";
import { pageMetadata } from "@/lib/seo";
import { listPublishedPage } from "@/features/blog/service";

export const metadata: Metadata = pageMetadata({
  title: "Blog",
  description: "Insights on software development, mobile apps, AI automation, and digital marketing from the GetwithUs team.",
  path: "/blog",
});

export const instant = false;

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const requested = Number(sp.page ?? "1");
  const first = Number.isFinite(requested) ? Math.max(1, Math.floor(requested)) : 1;
  const firstPage = await listPublishedPage(first);
  const page = Math.min(first, firstPage.pageCount);
  const data = page === first ? firstPage : await listPublishedPage(page);

  return (
    <main id="content" tabIndex={-1} className="outline-none py-16 md:py-24">
      <Container>
        <div className="mb-14 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="max-w-2xl">
            <p className="type-small font-semibold uppercase tracking-[0.14em] text-accent">Journal</p>
            <h1 className="mt-4 font-display text-[clamp(2.25rem,5vw,3.5rem)] font-extrabold leading-[1.05] tracking-tight text-ink">
              Notes from GetwithUs
            </h1>
            <p className="mt-5 text-[1.0625rem] leading-relaxed text-body">
              Short, practical writing on the work we do: websites, apps, automation, and the business around them.
            </p>
          </div>
          <div className="flex justify-center lg:justify-end">
            <BlogScene3D size="large" />
          </div>
        </div>

        {data.posts.length ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
            <Pagination page={page} pageCount={data.pageCount} />
          </>
        ) : (
          <EmptyState title="No posts yet">
            Published articles will appear here. Check back soon.
          </EmptyState>
        )}
      </Container>
    </main>
  );
}
