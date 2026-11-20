import { sql } from "drizzle-orm";
import { index, pgEnum, pgTable, text } from "drizzle-orm/pg-core";
import { createdAt, id, timestamptz } from "@/server/db/schema/columns";

export const BLOG_POST_STATUSES = ["draft", "published"] as const;
export type BlogPostStatus = (typeof BLOG_POST_STATUSES)[number];

export const blogPostStatus = pgEnum("blog_post_status", BLOG_POST_STATUSES);

/** Every blog field lives in Postgres. Images are Vercel Blob URLs only. */
export const blogPosts = pgTable(
  "blog_posts",
  {
    id: id(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    excerpt: text("excerpt").notNull().default(""),
    contentMarkdown: text("content_markdown").notNull().default(""),
    coverImageUrl: text("cover_image_url"),
    author: text("author").notNull().default("GetwithUs"),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    status: blogPostStatus("status").notNull().default("draft"),
    publishedAt: timestamptz("published_at"),
    createdAt: createdAt(),
    updatedAt: timestamptz("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
  },
  (table) => [
    index("blog_posts_slug_idx").on(table.slug),
    index("blog_posts_status_idx").on(table.status),
    index("blog_posts_published_at_idx").on(table.publishedAt.desc()),
  ],
);

export type BlogPost = typeof blogPosts.$inferSelect;
export type NewBlogPost = typeof blogPosts.$inferInsert;
