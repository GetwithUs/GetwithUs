"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { BlogPostView } from "@/features/blog/types";

/**
 * Three blog post cards that tilt on mouse hover using CSS transforms and
 * a subtle floating animation. No Three.js canvas needed here - the "3D"
 * effect is achieved with CSS perspective transforms, which keeps the bundle
 * small, works on all devices and avoids WebGL overhead for simple cards.
 * On reduced motion the cards are shown flat.
 */

function BlogCard({ post, index }: { post: BlogPostView; index: number }) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  // Evaluate reduced-motion once at mount, not during render.
  const [reduceMotion] = useState(
    () =>
      typeof window !== "undefined"
        ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
        : false,
  );

  function handleMouseMove(e: React.MouseEvent<HTMLAnchorElement>) {
    if (reduceMotion) return;
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    const y = -(e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    setTilt({ x: x * 10, y: y * 10 });
  }

  function handleMouseLeave() {
    setTilt({ x: 0, y: 0 });
    setHovered(false);
  }

  // Staggered float animation delay
  const floatDelay = index * 0.8;

  return (
    <Link
      ref={cardRef}
      href={`/blog/${post.slug}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="group block rounded-[20px] border border-line bg-card overflow-hidden"
      style={{
        transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) ${hovered ? "translateZ(10px)" : "translateZ(0px)"}`,
        transition: hovered
          ? "transform 0.08s ease-out, box-shadow 0.2s ease"
          : "transform 0.5s cubic-bezier(0.23,1,0.32,1), box-shadow 0.3s ease",
        boxShadow: hovered
          ? "0 20px 60px rgb(10 107 116 / 0.18), 0 4px 16px rgb(15 27 45 / 0.12)"
          : "0 2px 12px rgb(15 27 45 / 0.06)",
        animation: reduceMotion
          ? undefined
          : `blogFloat 4s ease-in-out ${floatDelay}s infinite`,
        willChange: "transform",
      }}
    >
      {/* Cover image or gradient */}
      <div className="relative aspect-[16/9] overflow-hidden bg-bg-soft">
        {post.coverImageUrl ? (
          <Image
            src={post.coverImageUrl}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
          />
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-accent-soft via-bg-soft to-bg-soft"
            aria-hidden="true"
          >
            {/* Decorative teal glow dot */}
            <div className="absolute top-6 left-6 h-16 w-16 rounded-full bg-accent opacity-20 blur-xl" />
          </div>
        )}
        {/* Teal highlight on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: "radial-gradient(circle at 50% 0%, rgb(10 107 116 / 0.08), transparent 70%)" }}
        />
      </div>

      {/* Text content */}
      <div className="p-5">
        <p className="text-xs font-medium text-muted">
          {post.publishedAt
            ? new Date(post.publishedAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : ""}
          {post.publishedAt ? " · " : ""}
          {post.author}
        </p>
        <h3 className="mt-2 font-display text-base font-bold leading-snug text-ink transition-colors duration-150 group-hover:text-accent line-clamp-2">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="mt-2 text-sm leading-relaxed text-body line-clamp-2">{post.excerpt}</p>
        )}
        <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-accent">
          Read more
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </div>
    </Link>
  );
}

export default function BlogCards3D({ posts }: { posts: BlogPostView[] }) {
  return (
    <>
      <style>{`
        @keyframes blogFloat {
          0%, 100% { transform: perspective(900px) translateY(0px); }
          50% { transform: perspective(900px) translateY(-8px); }
        }
      `}</style>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="list">
        {posts.map((post, i) => (
          <li key={post.id}>
            <BlogCard post={post} index={i} />
          </li>
        ))}
      </ul>
    </>
  );
}
