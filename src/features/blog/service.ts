import { and, count, desc, eq, ilike, not, or } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/server/db/client";
import { slugify } from "@/features/blog/slug";
import {
  blogPosts,
  type BlogPost,
  type NewBlogPost,
} from "@/server/db/schema/blog-posts";

export const BLOG_TAG = "blog-posts";
const BLOG_PAGE_SIZE = 9;
export { slugify };

async function cachedPublished(limit: number): Promise<BlogPost[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(BLOG_TAG);
  try {
    return await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.status, "published"))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(limit);
  } catch {
    // A missing/unavailable table must not break the public build; the section hides instead.
    return [];
  }
}

async function cachedPage(page: number): Promise<{
  posts: BlogPost[];
  total: number;
  pageCount: number;
}> {
  "use cache";
  cacheLife("hours");
  cacheTag(BLOG_TAG);
  const offset = (page - 1) * BLOG_PAGE_SIZE;
  try {
    const [posts, totals] = await Promise.all([
      db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.status, "published"))
        .orderBy(desc(blogPosts.publishedAt))
        .limit(BLOG_PAGE_SIZE)
        .offset(offset),
      db.select({ value: count() }).from(blogPosts).where(eq(blogPosts.status, "published")),
    ]);
    const total = Number(totals[0]?.value ?? 0);
    return { posts, total, pageCount: Math.max(1, Math.ceil(total / BLOG_PAGE_SIZE)) };
  } catch {
    return { posts: [], total: 0, pageCount: 1 };
  }
}

async function cachedBySlug(slug: string): Promise<BlogPost | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(BLOG_TAG);
  try {
    const rows = await db
      .select()
      .from(blogPosts)
      .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, "published")))
      .limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

async function cachedSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(BLOG_TAG);
  try {
    const rows = await db
      .select({ slug: blogPosts.slug })
      .from(blogPosts)
      .where(eq(blogPosts.status, "published"))
      .orderBy(desc(blogPosts.publishedAt));
    return rows.map((row) => row.slug);
  } catch {
    return [];
  }
}

/** Public reads. Each is cached until a publish/edit/delete invalidates BLOG_TAG. */
export function listPublishedPosts(limit = 100): Promise<BlogPost[]> {
  return cachedPublished(limit);
}

export function latestPosts(): Promise<BlogPost[]> {
  return cachedPublished(3);
}

export function listPublishedPage(page: number): Promise<{
  posts: BlogPost[];
  total: number;
  pageCount: number;
}> {
  return cachedPage(Math.max(1, page));
}

export function getPostBySlug(slug: string): Promise<BlogPost | null> {
  return cachedBySlug(slug);
}

export function listPublishedSlugs(): Promise<string[]> {
  return cachedSlugs();
}

// Admin reads and writes are deliberately uncached.

type AdminListOptions = { q?: string; status?: "draft" | "published"; page?: number };

export async function listPostsAdmin(opts: AdminListOptions = {}): Promise<{
  posts: BlogPost[];
  total: number;
  page: number;
  pageCount: number;
}> {
  const pageSize = 20;
  const page = Math.max(1, opts.page ?? 1);
  const where = and(
    opts.status ? eq(blogPosts.status, opts.status) : undefined,
    opts.q
      ? or(ilike(blogPosts.title, `%${opts.q}%`), ilike(blogPosts.excerpt, `%${opts.q}%`))
      : undefined,
  );
  const [posts, totals] = await Promise.all([
    db
      .select()
      .from(blogPosts)
      .where(where)
      .orderBy(desc(blogPosts.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ value: count() }).from(blogPosts).where(where),
  ]);
  const total = Number(totals[0]?.value ?? 0);
  return { posts, total, page, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getPostById(id: string): Promise<BlogPost | null> {
  const rows = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
  return rows[0] ?? null;
}

async function isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const rows = await db
    .select({ id: blogPosts.id })
    .from(blogPosts)
    .where(
      excludeId
        ? and(eq(blogPosts.slug, slug), not(eq(blogPosts.id, excludeId)))
        : eq(blogPosts.slug, slug),
    )
    .limit(1);
  return rows.length > 0;
}

/** Keeps an auto-generated slug unique without throwing away the requested base. */
export async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || "post";
  let candidate = root;
  let suffix = 2;
  while (await isSlugTaken(candidate, excludeId)) {
    candidate = `${root}-${suffix++}`;
  }
  return candidate;
}

export async function createPost(data: NewBlogPost): Promise<BlogPost> {
  const rows = await db.insert(blogPosts).values(data).returning();
  return rows[0]!;
}

export async function updatePost(id: string, data: Partial<NewBlogPost>): Promise<BlogPost | null> {
  const rows = await db
    .update(blogPosts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(blogPosts.id, id))
    .returning();
  return rows[0] ?? null;
}

/** Deletes the row first; the API removes the Blob once the row is gone. */
export async function deletePost(id: string): Promise<BlogPost | null> {
  const rows = await db.delete(blogPosts).where(eq(blogPosts.id, id)).returning();
  return rows[0] ?? null;
}
