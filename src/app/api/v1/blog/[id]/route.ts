import { revalidatePath, revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/features/admin/auth";
import { deleteBlogImage } from "@/features/blog/blob";
import { blogWriteSchema } from "@/features/blog/schema";
import {
  BLOG_TAG,
  deletePost,
  getPostById,
  uniqueSlug,
  updatePost,
} from "@/features/blog/service";

type Ctx = { params: Promise<{ id: string }> };

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

async function revalidateBlog(...slugs: (string | null | undefined)[]) {
  revalidateTag(BLOG_TAG, "max");
  revalidatePath("/");
  revalidatePath("/blog");
  for (const slug of slugs) {
    if (slug) revalidatePath(`/blog/${slug}`);
  }
}

/** Admin only. Partial update; publishes stamp published_at once. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const { id } = await params;
  const existing = await getPostById(id);
  if (!existing) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const parsed = blogWriteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const oldImage = existing.coverImageUrl;
  let newImage = oldImage;
  if ("coverImageUrl" in data) newImage = data.coverImageUrl ?? null;

  let publishedAt = existing.publishedAt;
  const nextStatus = data.status ?? existing.status;
  if (nextStatus === "published" && !publishedAt) publishedAt = new Date();
  if (nextStatus === "draft") publishedAt = null;

  try {
    const slug =
      data.slug && data.slug !== existing.slug
        ? await uniqueSlug(data.slug, id)
        : existing.slug;
    const post = await updatePost(id, {
      ...data,
      slug,
      tags: data.tags ?? existing.tags,
      publishedAt,
      coverImageUrl: newImage,
    });
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    if (oldImage && oldImage !== newImage) await deleteBlogImage(oldImage);
    await revalidateBlog(existing.slug, post.slug);
    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update post" },
      { status: 500 },
    );
  }
}

/** Admin only. Removes the row, then its Blob. */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const { id } = await params;
  try {
    const post = await deletePost(id);
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    await deleteBlogImage(post.coverImageUrl);
    await revalidateBlog(post.slug);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not delete post" },
      { status: 500 },
    );
  }
}
