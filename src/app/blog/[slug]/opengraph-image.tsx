import { getPostBySlug, listPublishedSlugs } from "@/features/blog/service";
import { ogImageSize, renderOgImage } from "@/lib/og-image";

export const size = ogImageSize;
export const contentType = "image/png";
export const alt = "GetwithUs blog";

export async function generateStaticParams() {
  const slugs = await listPublishedSlugs();
  return slugs.length ? slugs.map((slug) => ({ slug })) : [{ slug: "__placeholder__" }];
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  return renderOgImage({
    title: post?.seoTitle || post?.title || "GetwithUs blog",
    kicker: "Blog",
  });
}
