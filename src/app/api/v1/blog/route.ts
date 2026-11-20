import { revalidatePath, revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/features/admin/auth";
import { BLOG_TAG, createPost, slugify, uniqueSlug } from "@/features/blog/service";
import { blogCreateSchema } from "@/features/blog/schema";

/** Admin only. Public reads go through the cached service, never this route. */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = blogCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const slug = data.slug
    ? await uniqueSlug(data.slug)
    : await uniqueSlug(slugify(data.title) || `post-${Date.now()}`);
  const now = new Date();

  try {
    const post = await createPost({
      ...data,
      slug,
      tags: data.tags ?? [],
      status: data.status ?? "draft",
      publishedAt: data.status === "published" ? now : null,
    });
    revalidateTag(BLOG_TAG, "max");
    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);
    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create post" },
      { status: 500 },
    );
  }
}
