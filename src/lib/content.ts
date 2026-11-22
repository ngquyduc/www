import { type CollectionEntry, getCollection } from "astro:content";

export type Work = CollectionEntry<"work">;
export type Post = CollectionEntry<"writing">;

export async function getWork(tier?: Work["data"]["tier"]): Promise<Work[]> {
  const all = await getCollection("work", (e) => !tier || e.data.tier === tier);
  return all.sort((a, b) => a.data.order - b.data.order);
}

export async function getFeatured(): Promise<Work[]> {
  const all = await getCollection("work", (e) => e.data.featured !== undefined);
  return all.sort((a, b) => (a.data.featured ?? 0) - (b.data.featured ?? 0));
}

export const workHref = (e: Work): string => `/work/${e.id}`;

const year = (s: string) => s.match(/\b(\d{4})$/)?.[1];

/** "Jan 2024" + "Jun 2024" → "Jan – Jun 2024"; no end → "… – now". */
export function when(start: string, end?: string): string {
  if (!end) return `${start} – now`;
  const y = year(start);
  if (y && y === year(end)) return `${start.replace(` ${y}`, "")} – ${end}`;
  return `${start} – ${end}`;
}

/** Drafts show in `astro dev` only (§9 Writing: "Drafts never appear in production builds"). */
export async function getPosts(): Promise<Post[]> {
  const all = await getCollection("writing", (e) => import.meta.env.DEV || !e.data.draft);
  return all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** Reading time = ceil(words ÷ 230) (§9). */
export function readingMinutes(body: string | undefined): number {
  const words = (body ?? "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>|\{\/\*[\s\S]*?\*\/\}/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 230));
}

export const isoDate = (d: Date): string => d.toISOString().slice(0, 10);
