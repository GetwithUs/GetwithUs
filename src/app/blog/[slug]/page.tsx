import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "@/components/blog/Markdown";
import Container from "@/components/ui/Container";
import { getPostBySlug, listPublishedSlugs } from "@/features/blog/service";
import { formatDate } from "@/lib/dates";
import { pageMetadata } from "@/lib/seo";

export const instant = false;

export async function generateStaticParams() {
  const slugs = await listPublishedSlugs();
  // Cache Components needs at least one param; the placeholder 404s at runtime.
  return slugs.length ? slugs.map((slug) => ({ slug })) : [{ slug: "__placeholder__" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt || `Read ${post.title} on GetwithUs.`;
  const base = pageMetadata({
    title,
    description,
    path: `/blog/${slug}`,
    ownImage: true,
  });

  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      authors: [post.author],
    },
  };
}

/** Static article page. The blog's 3D scene is deliberately not rendered here. */
export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const date = post.publishedAt ?? post.createdAt;

  return (
    <main id="content" tabIndex={-1} className="outline-none py-16 md:py-24">
      <Container>
        <Link href="/blog" className="text-sm font-semibold text-accent hover:text-ink">
          All blogs
        </Link>

        <header className="mt-8 max-w-[820px]">
          <p className="type-small text-muted">
            {formatDate(date)} · {post.author}
          </p>
          <h1 className="mt-4 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-[1.08] tracking-tight text-ink">
            {post.title}
          </h1>
          {post.excerpt ? (
            <p className="mt-5 text-[1.125rem] leading-relaxed text-body">{post.excerpt}</p>
          ) : null}
          {post.tags.length ? (
            <p className="mt-4 type-small text-muted">{post.tags.join(" · ")}</p>
          ) : null}
        </header>

        {post.coverImageUrl ? (
          <div className="relative mt-10 aspect-[16/9] w-full overflow-hidden rounded-card border border-line bg-soft">
            <Image
              src={post.coverImageUrl}
              alt=""
              fill
              priority
              sizes="(max-width: 767px) 100vw, 1200px"
              className="object-cover"
            />
          </div>
        ) : null}

        <div className="mt-12 border-t border-line pt-10">
          <Markdown content={post.contentMarkdown} />
        </div>
      </Container>
    </main>
  );
}
