// The one place for identity and contact details (DESIGN.md §2.7, §11).
// The email comes from the old index.html `mailto:` link. Never add a phone number here.

export const site = {
  name: "Duc Nguyen",
  fullName: "Nguyen Quy Duc",
  role: "iOS Software Engineer, TikTok",
  location: "Singapore",
  url: "https://quyduc.vercel.app",
  email: "quyduc711@gmail.com",
  description:
    "Duc Nguyen is a systems-minded iOS software engineer in Singapore, working on the instant-messaging SDK at TikTok.",
  resumePath: "/resume.pdf",
  resumeUpdated: "2026-09",
  socials: {
    github: { label: "GitHub", href: "https://github.com/ngquyduc", handle: "github.com/ngquyduc" },
    linkedin: {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/quyduc/",
      handle: "linkedin.com/in/quyduc",
    },
    instagram: {
      label: "Instagram",
      href: "https://www.instagram.com/quyduc711/",
      handle: "instagram.com/quyduc711",
    },
  },
  nav: [
    { label: "Work", href: "/work" },
    { label: "Writing", href: "/writing" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
} as const;

export type Site = typeof site;
