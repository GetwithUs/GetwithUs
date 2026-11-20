import Image from "next/image";
import ReactMarkdown, { type Components } from "react-markdown";
import Prose from "@/components/ui/Prose";
import { isBlogBlobUrl } from "@/features/blog/blob";

/**
 * Sanitized Markdown: react-markdown does not render raw HTML, and its default
 * URL transform blocks javascript:/data: links. Images are limited to the same
 * Vercel Blob host as admin uploads.
 */
const components: Components = {
  a({ href, children, ...props }) {
    const external = href ? /^https?:\/\//i.test(href) : false;
    return (
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...props}
      >
        {children}
      </a>
    );
  },
  img({ src, alt }) {
    if (typeof src !== "string" || !isBlogBlobUrl(src)) return null;
    return (
      <Image
        src={src}
        alt={alt ?? ""}
        width={1200}
        height={675}
        sizes="(max-width: 767px) 100vw, 68ch"
        className="my-6 h-auto w-full rounded-card border border-line"
      />
    );
  },
  pre({ children }) {
    return <pre className="my-6 overflow-x-auto rounded-card border border-line bg-soft p-4">{children}</pre>;
  },
  code({ children, className }) {
    return <code className={className ?? "rounded bg-soft px-1.5 py-0.5 text-[0.92em]"}>{children}</code>;
  },
};

export default function Markdown({ content }: { content: string }) {
  return (
    <Prose className="max-w-[68ch]">
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </Prose>
  );
}
