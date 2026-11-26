import { defineCollection } from "astro:content";
import { file, glob } from "astro/loaders";
import { z } from "astro/zod";

// §11. Strings wrapped in [brackets] are placeholders for facts Duc still owes (§12);
// they render striped and fail a PUBLIC_STRICT=1 build.

const metric = z.object({
  value: z.string(),
  label: z.string(),
  // Only résumé numbers are real today (§2.4). "benchmark" needs a reproducible run.
  source: z.enum(["resume", "benchmark", "public"]),
});

const link = z.object({ label: z.string(), href: z.url().optional() });

const work = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/work" }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        tier: z.enum(["experience", "depth", "coursework", "fun"]),
        order: z.number().int(),
        // Kept in the repo but left out of every page, list and route.
        hidden: z.boolean().default(false),
        org: z.string().optional(),
        role: z.string().optional(),
        start: z.string(),
        end: z.string().optional(), // undefined = present
        summary: z.string(),
        stack: z.array(z.string()),
        metrics: z.array(metric).optional(),
        links: z.array(link).optional(),
        context: z.enum(["employment", "internship", "personal", "coursework", "programme"]).optional(),
        // For context "programme": the training programme the project was built in, and how.
        programme: z.object({ name: z.string(), note: z.string() }).optional(),
        coursework: z.object({ module: z.string(), coAuthors: z.array(z.string()).min(1) }).optional(),
        demo: z.literal("orderbook").optional(),
        featured: z.number().int().optional(),
        featuredMeta: z.string().optional(),
        featuredSummary: z.string().optional(),
        featuredMetric: z.string().optional(),
        // Rev 5 cards (§13.3): the experience-card figure (mono 40) and its label, and the plate kind.
        cardMetric: z.string().optional(),
        cardMetricLabel: z.string().optional(),
        plateCaption: z.string().optional(),
        plate: z.enum(["tiktok", "kovalee", "dconstruct", "vebits", "gym", "shop", "chat"]).optional(),
        status: z.enum(["published", "in-progress", "upcoming"]),
        hasPage: z.boolean(),
        // Case-study and depth-page header.
        headline: z.string().optional(),
        lede: z.string().optional(),
        location: z.string().optional(),
        team: z.string().optional(),
        cover: image().optional(),
        coverAlt: z.string().optional(),
      })
      .superRefine((d, ctx) => {
        if (d.tier === "coursework" && !d.coursework)
          ctx.addIssue({
            code: "custom",
            path: ["coursework"],
            message: "Coursework must credit its module and co-authors (§2.3).",
          });
        if (d.context === "programme" && !d.programme)
          ctx.addIssue({
            code: "custom",
            path: ["programme"],
            message: "Name the programme the project was built in.",
          });
        if (d.cover && !d.coverAlt)
          ctx.addIssue({ code: "custom", path: ["coverAlt"], message: "A cover image needs alt text." });
        if (d.links?.some((l) => /matching-engine-go/.test(l.href ?? "")))
          ctx.addIssue({
            code: "custom",
            path: ["links"],
            message: "The Go matching engine is private: no link (§2.8).",
          });
      }),
});

const writing = defineCollection({
  loader: glob({ pattern: "**/[^_]*.mdx", base: "./src/content/writing" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    tags: z.array(z.string()),
    draft: z.boolean(),
    updated: z.coerce.date().optional(),
  }),
});

// The side project in progress (§13.3 NextCard). One entry, id "next".
const building = defineCollection({
  loader: file("src/content/building.yaml"),
  schema: z.object({
    name: z.string().default(""),
    tagline: z.string().default(""),
    sentence: z.string().default(""),
    started: z.string().default(""),
    repo: z.union([z.url(), z.literal("")]).default(""),
    milestones: z.array(z.object({ text: z.string(), done: z.boolean() })).default([]),
  }),
});

// About-page details (§13.4 Now, Uses → Desk, the personal line). One entry, id "about".
const about = defineCollection({
  loader: file("src/content/about.yaml"),
  schema: z.object({
    nowUpdated: z.string().default(""),
    learning: z.string().default(""),
    reading: z.string().default(""),
    laptop: z.string().default(""),
    editor: z.string().default(""),
    keyboard: z.string().default(""),
    personal: z.string().default(""),
    kovaleeInParis: z.boolean().default(false),
  }),
});

export const collections = { work, writing, building, about };
