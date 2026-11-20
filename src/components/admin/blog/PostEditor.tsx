"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { slugify } from "@/features/blog/slug";
import type { BlogPostView } from "@/features/blog/types";

type EditorProps = { post?: BlogPostView };

/** Plain form: Markdown textarea, no WYSIWYG, no live preview, no animation. */
export default function PostEditor({ post }: EditorProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [author, setAuthor] = useState(post?.author ?? "GetwithUs");
  const [contentMarkdown, setContentMarkdown] = useState(post?.contentMarkdown ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(post?.coverImageUrl ?? null);
  const [tags, setTags] = useState(post?.tags.join(", ") ?? "");
  const [status, setStatus] = useState<"draft" | "published">(post?.status ?? "draft");
  const [seoTitle, setSeoTitle] = useState(post?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(post?.seoDescription ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function updateTitle(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function uploadCover(file: File) {
    setError("");
    if (file.size > 4 * 1024 * 1024) {
      setError("Image must be 4 MB or smaller.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPEG, PNG and WebP images are allowed.");
      return;
    }

    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const response = await fetch("/api/v1/blog/upload", { method: "POST", body: form });
      const payload = (await response.json().catch(() => null)) as
        | { url?: string; error?: string | unknown }
        | null;
      if (!response.ok || !payload?.url) {
        setError(typeof payload?.error === "string" ? payload.error : "Cover upload failed.");
        return;
      }
      setCoverImageUrl(payload.url);
    } catch {
      setError("Cover upload failed. Check BLOB_READ_WRITE_TOKEN.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function save() {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError("");

    const body = {
      title: title.trim(),
      slug: slug || undefined,
      excerpt: excerpt.trim(),
      author: author.trim() || "GetwithUs",
      contentMarkdown,
      coverImageUrl,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      status,
      seoTitle: seoTitle.trim() || null,
      seoDescription: seoDescription.trim() || null,
    };

    try {
      const response = await fetch(post ? `/api/v1/blog/${post.id}` : "/api/v1/blog", {
        method: post ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string | unknown }
          | null;
        setError(typeof payload?.error === "string" ? payload.error : "Could not save post.");
        return;
      }
      router.push("/admin/blog");
      router.refresh();
    } catch {
      setError("Could not save post. Check the server connection.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid max-w-[900px] gap-6">
      {error ? (
        <p role="alert" className="rounded-card border border-err/30 bg-err/10 px-4 py-3 text-sm text-err">
          {error}
        </p>
      ) : null}

      <div className="grid gap-5 rounded-card border border-line bg-card p-6">
        <Field label="Title" required>
          {(control) => (
            <Input {...control} value={title} onChange={(event) => updateTitle(event.target.value)} placeholder="Post title" />
          )}
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Slug" hint="Generated from the title until you edit it.">
            {(control) => (
              <Input
                {...control}
                value={slug}
                onChange={(event) => {
                  setSlugTouched(true);
                  setSlug(slugify(event.target.value));
                }}
                placeholder="url-friendly-slug"
              />
            )}
          </Field>
          <Field label="Author">
            {(control) => <Input {...control} value={author} onChange={(event) => setAuthor(event.target.value)} />}
          </Field>
        </div>

        <Field label="Excerpt" optional hint="Shown on cards and used as the description when SEO text is empty.">
          {(control) => (
            <Textarea
              {...control}
              rows={3}
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              placeholder="One or two sentences"
            />
          )}
        </Field>

        <Field label="Tags" optional hint="Comma separated.">
          {(control) => (
            <Input
              {...control}
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="web, automation, AI"
            />
          )}
        </Field>

        <Field label="Status">
          {(control) => (
            <Select
              {...control}
              value={status}
              onChange={(event) => setStatus(event.target.value as "draft" | "published")}
              options={[
                { value: "draft", label: "Draft" },
                { value: "published", label: "Published" },
              ]}
            />
          )}
        </Field>
      </div>

      <div className="grid gap-5 rounded-card border border-line bg-card p-6">
        <div>
          <p className="type-body font-medium text-ink">Cover image</p>
          <p className="mt-1 type-small text-body">JPEG, PNG or WebP, up to 4 MB. Stored in Vercel Blob.</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadCover(file);
              }}
            />
            <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()} loading={uploading}>
              {coverImageUrl ? "Replace image" : "Upload image"}
            </Button>
            {coverImageUrl ? (
              <>
                <Image
                  src={coverImageUrl}
                  alt="Current cover"
                  width={120}
                  height={68}
                  className="rounded border border-line object-cover"
                />
                <Button type="button" variant="ghost" onClick={() => setCoverImageUrl(null)}>
                  Remove
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-5 rounded-card border border-line bg-card p-6">
        <Field label="Content (Markdown)" hint="Plain Markdown. Raw HTML is not rendered on the public page.">
          {(control) => (
            <Textarea
              {...control}
              rows={22}
              value={contentMarkdown}
              onChange={(event) => setContentMarkdown(event.target.value)}
              placeholder={"## Heading\n\nWrite with **bold**, lists, links, and fenced code blocks."}
              className="font-mono text-[0.92rem]"
            />
          )}
        </Field>
      </div>

      <div className="grid gap-5 rounded-card border border-line bg-card p-6">
        <Field label="SEO title" optional>
          {(control) => (
            <Input {...control} value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} />
          )}
        </Field>
        <Field label="SEO description" optional>
          {(control) => (
            <Textarea
              {...control}
              rows={2}
              value={seoDescription}
              onChange={(event) => setSeoDescription(event.target.value)}
            />
          )}
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => void save()} loading={saving}>
          {post ? "Save post" : "Create post"}
        </Button>
        <Button href="/admin/blog" variant="ghost">
          Cancel
        </Button>
      </div>
    </div>
  );
}
