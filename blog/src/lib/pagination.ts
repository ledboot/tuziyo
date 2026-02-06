import type { CollectionEntry } from "astro:content";

export const PAGE_SIZE = 5;

export function paginatePosts(posts: CollectionEntry<"blog">[], page: number) {
  const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  return {
    page: safePage,
    totalPages,
    pagePosts: posts.slice(start, end),
  };
}
