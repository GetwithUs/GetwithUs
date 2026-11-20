import { ArrowRight } from "lucide-react";
import Link from "next/link";
import BlogCards3D from "@/components/home/BlogCards3D";
import BlogScene3D from "@/components/three/BlogScene3D";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import Icon from "@/components/ui/Icon";
import type { BlogPostView } from "@/features/blog/types";

/** Latest three posts plus the one decorative 3D scene on the home page. */
export default function BlogSection({ posts }: { posts: BlogPostView[] }) {
  if (posts.length === 0) return null;

  return (
    <section aria-labelledby="blog-section-title" className="border-t border-line py-20 md:py-[120px]">
      <Container>
        <div className="mb-12 flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <h2
              id="blog-section-title"
              className="font-display text-[clamp(1.75rem,3.5vw,2.5rem)] font-extrabold leading-[1.08] tracking-tight text-ink"
            >
              Latest Blogs
            </h2>
            <p className="mt-3 max-w-[38em] text-[1.0625rem] leading-relaxed text-body">
              Practical writing on software, automation, and growing a business online.
            </p>
            <Button href="/blog" variant="secondary" className="mt-6 hidden sm:inline-flex">
              View all blogs
              <Icon icon={ArrowRight} size={16} />
            </Button>
          </div>
          <BlogScene3D size="small" />
        </div>

        <BlogCards3D posts={posts} />

        <div className="mt-8 sm:hidden">
          <Link href="/blog" className="text-sm font-semibold text-accent hover:text-ink">
            View all blogs
          </Link>
        </div>
      </Container>
    </section>
  );
}
