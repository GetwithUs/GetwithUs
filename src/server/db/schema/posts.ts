import { index, pgEnum, pgTable, text } from "drizzle-orm/pg-core";
import { createdAt, id, timestamptz } from "@/server/db/schema/columns";

export const POST_STATUSES = ["draft", "published"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export const postStatus = pgEnum("post_status", POST_STATUSES);

export const posts = pgTable(
  "posts",
  {
    id: id(),
    /** URL-safe slug, unique. */
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    /** Short summary shown in listing cards (max ~160 chars). */
    excerpt: text("excerpt").notNull().default(""),
    /** Full post body as an HTML string produced by Tiptap. */
    content: text("content").notNull().default(""),
    /** Vercel Blob URL for the cover image. */
    coverImage: text("cover_image"),
    status: postStatus("status").notNull().default("draft"),
    /** Author display name. */
    author: text("author").notNull().default("GetwithUs"),
    /** ISO date string shown to readers, e.g. "2026-11-19". */
    publishedAt: timestamptz("published_at"),
    createdAt: createdAt(),
    updatedAt: timestamptz("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("posts_slug_idx").on(table.slug),
    index("posts_status_idx").on(table.status),
    index("posts_published_at_idx").on(table.publishedAt.desc()),
  ],
);

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
