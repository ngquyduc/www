// Renders public/og/default.png (1200×630) from an SVG in the site's ledger style.
import sharp from "sharp";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#F6F6F3"/>
<rect x="80" y="80" width="56" height="56" rx="10" fill="#121417"/>
<text x="108" y="117" text-anchor="middle" font-family="IBM Plex Mono, Menlo, monospace" font-size="24" font-weight="600" fill="#F6F6F3">QD</text>
<text x="156" y="118" font-family="IBM Plex Sans, Helvetica, Arial, sans-serif" font-size="30" font-weight="600" fill="#121417">Duc Nguyen</text>
<line x1="80" y1="200" x2="1120" y2="200" stroke="#121417" stroke-width="2"/>
<text x="80" y="250" font-family="IBM Plex Mono, Menlo, monospace" font-size="22" letter-spacing="2" fill="#50555E">SINGAPORE · SOFTWARE ENGINEER</text>
<text x="80" y="360" font-family="IBM Plex Sans, Helvetica, Arial, sans-serif" font-size="76" font-weight="700" letter-spacing="-2" fill="#121417">Systems-minded engineer</text>
<text x="80" y="450" font-family="IBM Plex Sans, Helvetica, Arial, sans-serif" font-size="76" font-weight="700" letter-spacing="-2" fill="#121417">who <tspan fill="#A04A00">ships</tspan>.</text>
<text x="80" y="550" font-family="IBM Plex Mono, Menlo, monospace" font-size="24" fill="#63686F">quyduc.vercel.app</text>
</svg>`;

await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile("public/og/default.png");
console.log("wrote public/og/default.png");
