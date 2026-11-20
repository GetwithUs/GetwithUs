import { z } from "zod";
import { isBlogBlobUrl } from "@/features/blog/blob";

/** Shared by the create and update route handlers. Every field is optional on update. */
export const blogWriteSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only")
    .optional(),
  excerpt: z.string().trim().max(300).optional(),
  contentMarkdown: z.string().max(100_000).optional(),
  coverImageUrl: z
    .string()
    .refine(isBlogBlobUrl, "Cover image must be a Vercel Blob URL")
    .nullable()
    .optional(),
  author: z.string().trim().min(1).max(100).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(12).optional(),
  status: z.enum(["draft", "published"]).optional(),
  seoTitle: z.string().trim().max(200).nullable().optional(),
  seoDescription: z.string().trim().max(300).nullable().optional(),
});

export const blogCreateSchema = blogWriteSchema.required({ title: true });
