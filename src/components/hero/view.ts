// HTML-string views for the hero demo. Used by HeroDemo.astro (SSR boot frame) and
// hero.client.ts (live updates), so both render the same markup. Classes live in HeroDemo.astro.
import { label, type Msg, PIPES, type Sim } from "./sim";

export interface UI {
  draft: string;
  userActs: number;
  hint: string;
  playId: number | null;
  playPos: number;
  instant: boolean;
  reduced: boolean;
}

export const esc = (s: unknown): string => String(s ?? "").replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

const PIN =
  '<svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M15 3l6 6-3 1-4 4 1 5-2 1-4-4-5 5-1-1 5-5-4-4 1-2 5 1 4-4z"/></svg>';

/** Illustration art, injected by setArt() so it stays out of the client bundle (see art.ts). */
let art: Record<string, string> = {};
export const setArt = (a: Record<string, string>): void => {
  art = a;
};
const photo = (alt: string, hat: boolean) => (art[hat ? "photo-hat" : "photo"] ?? "").replace("@ALT", esc(alt));

const PLAY =
  '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4l13 8-13 8z"/></svg>';
const PAUSE =
  '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>';
const WAVE = [6, 12, 18, 10, 22, 14, 8, 16, 24, 12, 6, 14, 20, 10, 16, 22, 8, 12, 18, 6];

const STICKER: Record<string, string> = {
  duck: "a rubber duck in a hard hat holding a SHIP IT sign",
  paw: "a cat paw stamp that says LGTM",
};
const fmt = (sec: number) => `0:${String(Math.floor(sec)).padStart(2, "0")}`;
const IN_FLIGHT = ["local", "queued", "sending", "retrying", "uploading", "failed"];
const STATUS: Record<string, string> = {
  local: "Sending…",
  queued: "Waiting for network",
  sending: "Sending…",
  retrying: "Sending…",
  sent: "Sent",
  delivered: "Delivered",
  seen: "Seen",
  failed: "Not sent ·",
};
const isMsg = (m: Msg) => m.kind !== "date" && m.kind !== "system";

function bubble(s: Sim, ui: UI, m: Msg): string {
  const rep = s.msg(m.replyTo);
  const plain = m.kind === "sticker" || m.kind === "image" || m.kind === "album";
  const card = m.kind === "video" || m.kind === "link";
  // The name includes every visible word in reading order (WCAG 2.5.3, label in name).
  const body =
    m.kind === "text"
      ? m.text
      : m.kind === "sticker"
        ? `Sticker: ${STICKER[m.sticker ?? "paw"]}`
        : m.kind === "video"
          ? `Video, ${m.dur} ${m.caption} Shared video · video.example`
          : m.kind === "link"
            ? `Link, ${m.title} ${m.desc} ${m.url}`
            : label(m) + (m.alt ? `, ${m.alt}` : "");
  const ariaText =
    (m.mine ? "You: " : "Remy: ") +
    body +
    (rep ? `, replying to ${label(rep)}` : "") +
    (m.pinned ? ", pinned" : "") +
    ". Press and hold, or press Enter, for actions.";
  const open = s.menuFor === m.id;
  const attrs = `data-id="${m.id}" data-f="b${m.id}" aria-label="${esc(ariaText)}" aria-haspopup="menu" aria-expanded="${open}"`;
  const uploading = m.state === "uploading" || (m.state === "queued" && m.upload != null && m.upload < 100);
  const overlay = uploading
    ? `<span class="dm-ov">${m.state === "uploading" ? `${m.upload}%` : "Waiting for network"}</span>`
    : "";

  if (m.kind === "voice") {
    const playing = ui.playId === m.id;
    const dur = Number(m.dur);
    const prog = playing ? ui.playPos / dur : 0;
    const bars = WAVE.map(
      (h, j) => `<span style="height:${h}px"${j / WAVE.length < prog ? ' class="on"' : ""}></span>`,
    ).join("");
    const time = playing ? `${fmt(ui.playPos)} / ${fmt(dur)}` : fmt(dur);
    const timeLabel = playing ? `${fmt(ui.playPos)} of ${fmt(dur)}` : `Duration ${fmt(dur)}`;
    return `<div class="dm-voice${open ? " dm-ring" : ""}"><button type="button" class="dm-pbtn dm-play" data-play="${m.id}" data-f="p${m.id}" aria-label="${playing ? "Pause" : "Play"} voice message, ${dur} seconds">${playing ? PAUSE : PLAY}</button><button type="button" class="dm-b dm-vb" ${attrs}><span class="dm-wave" aria-hidden="true">${bars}</span><span role="timer" aria-label="${timeLabel}">${time}</span></button></div>`;
  }

  let inner = "";
  if (rep) inner += `<span class="dm-q"><b>${rep.mine ? "You" : "Remy"}</b>${esc(label(rep))}</span>`;
  if (m.kind === "text") inner += esc(m.text);
  else if (m.kind === "sticker") inner += art[m.sticker ?? "paw"] ?? "";
  else if (m.kind === "image") inner += `<span class="dm-photo">${photo(m.alt ?? "", m.mine)}${overlay}</span>`;
  else if (m.kind === "album")
    inner += `<span class="dm-album" role="img" aria-label="${esc(m.alt)}">${art.album}${overlay}</span>`;
  else if (m.kind === "video")
    inner += `<span class="dm-card"><span class="dm-thumb">${art.video}<span class="dm-dur">${esc(m.dur)}</span></span> <span class="dm-cap"><b>${esc(m.caption)}</b> <small>Shared video · video.example</small></span></span>`;
  else if (m.kind === "link")
    inner += `<span class="dm-card">${art.strip}<span class="dm-cap"><b>${esc(m.title)}</b> <span>${esc(m.desc)}</span> <small>${esc(m.url)}</small></span></span>`;
  const cls = `dm-b ${plain ? "dm-plain" : card ? "dm-cardb" : m.mine ? "dm-me" : "dm-them"}${open ? " dm-ring" : ""}`;
  return `<button type="button" class="${cls}" data-kind="${m.kind}" ${attrs}>${inner}</button>`;
}

function item(s: Sim, ui: UI, m: Msg, prev: Msg | undefined, next: Msg | undefined, lastMine: Msg | undefined): string {
  if (m.kind === "date") return `<div class="dm-row dm-c"><span class="dm-date">${esc(m.text)}</span></div>`;
  if (m.kind === "system") return `<div class="dm-row dm-c"><span class="dm-sys">${PIN}${esc(m.text)}</span></div>`;
  const lastOfRun = !m.mine && (!next || next.mine || !isMsg(next));
  const gap = prev && prev.mine !== m.mine ? " dm-gap" : "";
  let h = `<div class="dm-row ${m.mine ? "dm-mine" : "dm-theirs"}${gap}">`;
  if (m.pinned) h += `<span class="dm-pinl">${PIN}Pinned</span>`;
  h += `<div class="dm-line">${m.mine ? "" : `<span class="dm-av${lastOfRun ? "" : " dm-hid"}" aria-hidden="true">${lastOfRun ? "R" : ""}</span>`}${bubble(s, ui, m)}</div>`;
  if (m.reactions.length) {
    const lab = m.reactions.map((r) => `laughing ${r.n}${r.me ? ", including you" : ""}`).join(", ");
    h += `<span class="dm-rx" role="img" aria-label="Reactions: ${lab}">${m.reactions.map((r) => `${r.e} ${r.n}`).join(" ")}</span>`;
  }
  if (s.menuFor === m.id) {
    const mineRx = m.reactions.some((r) => r.me);
    h += `<div class="dm-menu" role="menu" aria-label="Message actions" data-menu="${m.id}"><button type="button" role="menuitem" class="dm-pbtn dm-mi" data-act="pin" data-f="mpin" style="font-weight:600">${m.pinned ? "Unpin" : "Pin"}</button><button type="button" role="menuitem" class="dm-pbtn dm-mi" data-act="reply" data-f="mreply">Reply</button><button type="button" role="menuitem" class="dm-pbtn dm-mi" data-act="react" data-f="mreact" aria-label="${mineRx ? "Remove laughing reaction" : "React with laughing"}" style="font-size:16px">😂</button><button type="button" role="menuitem" class="dm-pbtn dm-mi dm-sub" data-act="close" data-f="mclose">Cancel</button></div>`;
  }
  if (m.mine && (m === lastMine || IN_FLIGHT.includes(m.state))) {
    const st = m.state === "uploading" ? `Uploading ${m.upload}%` : STATUS[m.state];
    h += `<span class="dm-st${m.state === "failed" ? " dm-err" : ""}">${st}${m.state === "failed" ? `<button type="button" class="dm-pbtn dm-retry" data-retry="${m.id}" data-f="r${m.id}">Tap to retry</button>` : ""}</span>`;
  }
  return `${h}</div>`;
}

/** Thread items, newest first (the container is column-reverse). Keyed by message id. */
export function thread(s: Sim, ui: UI): { k: string; html: string }[] {
  const shown = s.msgs.slice(-24);
  const lastMine = [...s.msgs].reverse().find((m) => m.mine);
  const out = shown.map((m, i) => ({ k: String(m.id), html: item(s, ui, m, shown[i - 1], shown[i + 1], lastMine) }));
  if (s.peerTyping)
    out.push({
      k: "typing",
      html: '<div class="dm-row dm-theirs"><div class="dm-line"><span class="dm-av" aria-hidden="true">R</span><span class="dm-typing" role="img" aria-label="Remy is typing">•••</span></div></div>',
    });
  return out.reverse();
}

export function presence(s: Sim): string {
  return s.peerTyping ? "typing…" : s.conn === "online" ? "Active now" : "Waiting for network";
}

export function banner(s: Sim): string {
  const p = s.msg(s.pinOrder[s.pinOrder.length - 1]);
  if (!p) return "";
  const text = (p.mine ? "You: " : "Remy: ") + (p.kind === "text" ? p.text : `[${label(p)}]`);
  return `<div class="dm-banner" role="group" aria-label="Pinned message: ${esc(text)}">${PIN.replace(/11/g, "14")}<span class="dm-bt">${esc(text)}</span><span class="dm-bn">${p.pinPending ? "syncing…" : ""}</span><span class="flex-1"></span><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg></div>`;
}

export function replyBar(s: Sim): string {
  const r = s.msg(s.replyTo);
  if (!r) return "";
  return `<div class="dm-reply"><span class="dm-rt">Replying to <b>${r.mine ? "yourself" : "Remy"}</b> · ${esc(label(r))}</span><button type="button" class="dm-pbtn dm-x" data-act="cancel-reply" data-f="xreply" aria-label="Cancel reply">✕</button></div>`;
}

const CHIPS: [string, string][] = [
  ["image", "Send a photo"],
  ["voice", "Voice"],
  ["video", "Video"],
  ["hold", "Hold to pin"],
];
const TRAY: [string, string][] = [
  ["sticker", "Sticker"],
  ["image", "Photo"],
  ["album", "3 photos"],
  ["voice", "Voice"],
  ["video", "Video"],
  ["link", "Link"],
];

export function chips(s: Sim, ui: UI): string {
  if (ui.userActs >= 2 || s.tray || s.replyTo || ui.draft || s.menuFor) return "";
  return `<div class="dm-chips" role="group" aria-label="Try the demo">${CHIPS.map(([k, l]) => `<button type="button" class="dm-pbtn dm-chip" data-chip="${k}" data-f="c${k}">${l}</button>`).join("")}</div>`;
}

export function tray(s: Sim): string {
  if (!s.tray) return "";
  return `<div class="dm-tray" role="group" aria-label="Send something else">${TRAY.map(([k, l]) => `<button type="button" class="dm-pbtn dm-tp" data-send="${k}" data-f="t${k}">${l}</button>`).join("")}</div>`;
}

export function hint(ui: UI): string {
  return ui.hint ? `<div class="dm-hint" role="status">${esc(ui.hint)}</div>` : "";
}

// ---- engineer panel --------------------------------------------------------------------------
const LANE: Record<string, string> = { UI: "ui", DB: "db", NET: "net", SYNC: "sync" };

export function pipeline(s: Sim, ui: UI): string {
  const lastMine = [...s.msgs].reverse().find((m) => m.mine) as Msg;
  const f = s.msg(s.focusId) ?? lastMine;
  const composing = ui.draft.length > 0;
  const stages = composing ? ["COMPOSING", ...PIPES.text.stages] : f.stages;
  const cur = composing ? 0 : f.stage;
  const allDone = !composing && f.state === "seen";
  const failed = !composing && f.state === "failed";
  const chipsHtml = stages
    .map((l, i) => {
      const done = i < cur || allDone;
      const active = i === cur && !allDone;
      const cls = active ? (failed ? "fail" : "cur") : done ? "done" : "";
      return `<li><span class="${cls}"${active ? ' aria-current="step"' : ""}>${l}</span>${i < stages.length - 1 ? '<i aria-hidden="true">→</i>' : ""}</li>`;
    })
    .join("");
  let exc = "";
  let excCls = "";
  if (!composing) {
    if (f.state === "uploading") exc = `UPLOADING ${f.upload}% (simulated)`;
    if (f.state === "queued")
      exc =
        f.upload != null && f.upload < 100
          ? `UPLOAD PAUSED at ${f.upload}% · waiting for network`
          : "QUEUED · waiting for network";
    if (f.state === "retrying") exc = `RETRY ${f.attempt + 1} in ${f.retryIn} ms (simulated)`;
    if (f.state === "failed") {
      exc = `FAILED after ${f.attempt} attempts · user can retry`;
      excCls = " fail";
    }
  }
  const pinned = s.msgs.filter((m) => m.pinned).length;
  const pins = `v${s.pinV} · ${pinned} pinned`;
  const outbox = `${s.pendingOps()} pending`;
  const rep = s.msg(s.replyTo);
  const payload: Record<string, string> = {
    text: `text, ${(f.text ?? "").length} chars`,
    sticker: `sticker id "${f.sticker}"`,
    image: "media ref + size + blurhash-style placeholder",
    album: "3 media refs",
    voice: `media ref + ${f.dur} s + waveform`,
    video: "video ref + thumbnail URL only",
    link: "URL + preview card",
  };
  const rec: [string, string][] = composing
    ? [
        ["TYPE", "text (draft)"],
        ["PERSISTED", "no (memory only)"],
        ["REPLY TO", rep ? `#${rep.seq}` : "none"],
        ["TYPING INDICATOR", "≤ 1 per 3 s"],
        ["OUTBOX", outbox],
        ["PINS", pins],
      ]
    : [
        ["TYPE", f.kind],
        ["CLIENT ID", `${f.cid.slice(0, 4)}·${f.cid.slice(4)}`],
        ["SERVER SEQ", f.seq ? `#${f.seq}` : "not assigned yet"],
        ["STATUS", f.state + (f.state === "uploading" ? ` ${f.upload}%` : "")],
        ["PAYLOAD", payload[f.kind] ?? ""],
        ["ATTEMPTS", String(f.attempt)],
        ["OUTBOX", outbox],
        ["PINS", pins],
      ];
  const l = label(f);
  const title = composing ? "draft (text)" : `${f.kind} · "${l.length > 20 ? `${l.slice(0, 19)}…` : l}"`;
  return `<p class="eg-k">PIPELINE · ${esc(title)}</p><ol class="eg-chips" aria-label="Send pipeline for this message type">${chipsHtml}</ol>${exc ? `<p class="eg-exc"><i aria-hidden="true">↳</i><span class="${excCls}">${exc}</span></p>` : ""}<dl class="eg-rec">${rec.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>`;
}

export function logs(s: Sim): string {
  return s.logs
    .slice(-10)
    .map(
      (l) =>
        `<li><span class="eg-t">+${l.t} ms</span><span class="eg-${LANE[l.lane]}">${l.lane}</span><span${l.kind === "warn" || l.kind === "err" ? ` class="eg-${l.kind}"` : ""}>${esc(l.text)}</span></li>`,
    )
    .join("");
}

export function status(s: Sim, ui: UI): string {
  return (
    s.status ||
    (ui.reduced
      ? "Reduced motion: every action completes instantly and nothing plays by itself."
      : "Send any message type, or press and hold one to pin it. Both panes react.")
  );
}

export const conn = (s: Sim) =>
  s.conn === "online" ? "CONNECTED" : s.conn === "connecting" ? "CONNECTING" : "OFFLINE";
