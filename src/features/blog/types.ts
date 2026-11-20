/** Client-safe shape of a blog row. Components use this instead of importing the DB schema. */
export type BlogPostView = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  contentMarkdown: string;
  coverImageUrl: string | null;
  author: string;
  tags: string[];
  status: "draft" | "published";
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  seoTitle: string | null;
  seoDescription: string | null;
};
