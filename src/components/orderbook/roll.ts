// Rolling digits (§7.5): each digit is a clipped column holding a strip of 11 glyphs
// (blank, 0–9). The digit sets translateY(-(d + 1) × 1.4em). Width is fixed per value.
const STRIP =
  '<span class="ob-strip"><span> </span><span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span></span>';

export const y = (ch: string): string =>
  ch >= "0" && ch <= "9" ? `translateY(-${((+ch + 1) * 1.4).toFixed(1)}em)` : "translateY(0em)";

/** Left-pads with blank glyphs to `width`, so columns keep their identity as values change. */
export const pad = (value: string, width = 0): string => value.padStart(width, " ");

export function rollHtml(value: string, width = 0): string {
  const cols = [...pad(value, width)]
    .map((ch) =>
      ch === " " || (ch >= "0" && ch <= "9")
        ? `<span class="ob-col">${STRIP.replace('class="ob-strip"', `class="ob-strip" style="transform:${y(ch)}"`)}</span>`
        : `<span>${ch}</span>`,
    )
    .join("");
  return `<span class="ob-sr">${value}</span><span class="ob-roll" aria-hidden="true">${cols}</span>`;
}
