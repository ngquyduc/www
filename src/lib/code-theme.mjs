// Shiki theme built from the instrument tokens (DESIGN.md §4.1, §5.12):
// keyword amber, string term-ok, comment term-muted, everything else term-ink.
const ink = "#E6E8EB";
const muted = "#98A1AE";
const amber = "#F5B041";
const ok = "#3DDC84";
const blue = "#8AB4FF";

/** @type {import('shiki').ThemeRegistrationRaw} */
export const codeTheme = {
  name: "instrument",
  type: "dark",
  colors: { "editor.background": "#0B0D10", "editor.foreground": ink },
  settings: [
    { settings: { foreground: ink, background: "#0B0D10" } },
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: muted } },
    {
      scope: [
        "keyword",
        "storage",
        "storage.type",
        "storage.modifier",
        "keyword.control",
        "keyword.operator.new",
        "entity.name.type",
        "support.type",
      ],
      settings: { foreground: amber },
    },
    { scope: ["string", "string.quoted", "constant.character"], settings: { foreground: ok } },
    { scope: ["constant.numeric", "constant.language"], settings: { foreground: blue } },
  ],
};

/**
 * Copies `title="..."` from a fenced code block's meta onto the <pre> as data-title,
 * so the CodeBlock component can show the filename in its header bar.
 * @type {import('shiki').ShikiTransformer}
 */
export const titleTransformer = {
  name: "title-from-meta",
  pre(node) {
    const raw = this.options.meta?.__raw ?? "";
    const m = raw.match(/title="([^"]+)"/);
    if (m) node.properties["data-title"] = m[1];
  },
};
