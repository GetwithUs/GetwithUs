import Link from "next/link";
import { cn } from "@/lib/cn";

/** Server-rendered page links. Only text colour changes on hover. */
export default function Pagination({
  page,
  pageCount,
  basePath = "/blog",
}: {
  page: number;
  pageCount: number;
  basePath?: string;
}) {
  if (pageCount <= 1) return null;

  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);
  const link = (target: number) => (target === 1 ? basePath : `${basePath}?page=${target}`);

  return (
    <nav aria-label="Blog pages" className="mt-12 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={link(page - 1)} className="rounded-full px-3 py-2 type-button text-body hover:text-accent">
          Previous
        </Link>
      ) : null}
      {pages.map((target) => (
        <Link
          key={target}
          href={link(target)}
          aria-current={target === page ? "page" : undefined}
          className={cn(
            "inline-flex h-9 min-w-9 items-center justify-center rounded-full px-3 type-button",
            target === page ? "bg-accent text-accent-ink" : "text-body hover:text-accent",
          )}
        >
          {target}
        </Link>
      ))}
      {page < pageCount ? (
        <Link href={link(page + 1)} className="rounded-full px-3 py-2 type-button text-body hover:text-accent">
          Next
        </Link>
      ) : null}
    </nav>
  );
}
