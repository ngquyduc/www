// "What users see vs what I see": a toy chat client as a pure discrete-event simulator
// (DESIGN.md §6.3–6.5), ported from design/canvas/project/DmDemo.dc.html. No DOM, no timers:
// the caller advances `now`. Every concept is textbook messaging behaviour; nothing here
// describes any company's implementation. All content is invented.

export type Ms = number;
export type Kind = "text" | "sticker" | "image" | "album" | "voice" | "video" | "link" | "system" | "date";
export type SendKind = Exclude<Kind, "system" | "date">;
export type MsgState =
  | "local"
  | "uploading"
  | "queued"
  | "sending"
  | "retrying"
  | "sent"
  | "delivered"
  | "seen"
  | "failed"
  | "recv";
export interface Reaction {
  e: "😂";
  n: number;
  me: boolean;
}
export interface Msg {
  id: number;
  cid: string;
  mine: boolean;
  kind: Kind;
  state: MsgState;
  seq: number | null;
  stages: string[];
  stage: number;
  attempt: number;
  retryIn: Ms;
  upload: number | null;
  replyTo: number | null;
  reactions: Reaction[];
  pinned: boolean;
  pinPending: boolean;
  text?: string;
  sticker?: "duck" | "paw";
  alt?: string;
  dur?: number | string;
  caption?: string;
  url?: string;
  title?: string;
  desc?: string;
}
export type OpType = "send" | "pin" | "unpin" | "react";
export interface Op {
  id: number;
  type: OpType;
  msgId: number;
  state: "queued" | "inflight" | "retrying" | "done" | "failed";
  attempt: number;
  retryIn: Ms;
  applied: boolean;
  serverVal: number | null;
  waitLogged: boolean;
}
export type Lane = "UI" | "DB" | "NET" | "SYNC";
export type LogKind = "" | "ok" | "warn" | "err";
export interface LogEntry {
  t: Ms;
  lane: Lane;
  text: string;
  kind: LogKind;
}
export type Outcome = "ok" | "reqlost" | "acklost";
type Pre = "compress" | "encode" | "resolve" | "unfurl" | "upload";

export const SLOW = 3;
export const ACK_TIMEOUT = 800;
export const MAX_ATTEMPTS = 5;
export const LONG_PRESS = 450;

export const PIPES: Record<SendKind, { stages: string[]; pre: Pre[] }> = {
  text: { stages: ["LOCAL INSERT", "SEND", "ACK", "DELIVERED", "SEEN"], pre: [] },
  sticker: { stages: ["LOCAL INSERT", "SEND STICKER ID", "ACK", "DELIVERED", "SEEN"], pre: [] },
  image: {
    stages: ["LOCAL PREVIEW", "COMPRESS", "UPLOAD", "SEND MEDIA REF", "ACK", "DELIVERED", "SEEN"],
    pre: ["compress", "upload"],
  },
  album: {
    stages: ["LOCAL PREVIEWS", "COMPRESS ×3", "UPLOAD ×3", "SEND MEDIA REFS", "ACK", "DELIVERED", "SEEN"],
    pre: ["compress", "upload"],
  },
  voice: {
    stages: ["RECORD", "ENCODE", "UPLOAD", "SEND MEDIA REF", "ACK", "DELIVERED", "SEEN"],
    pre: ["encode", "upload"],
  },
  video: { stages: ["PICK VIDEO", "RESOLVE REFERENCE", "SEND REF ONLY", "ACK", "DELIVERED", "SEEN"], pre: ["resolve"] },
  link: { stages: ["DETECT URL", "UNFURL PREVIEW", "SEND URL + CARD", "ACK", "DELIVERED", "SEEN"], pre: ["unfurl"] },
};

export const CANNED = [
  "can she review my PR next",
  "please tell me you reverted it",
  "is she taking interns",
  "who gave the cat sudo",
];
export const REPLIES = [
  "she says thanks for the review",
  "she is asking for equity",
  "new rule: no cats in prod",
  "lgtm (she sat on the trackpad)",
];

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Short label used in banners, reply quotes and the pipeline title. */
export function label(m: Msg | undefined): string {
  if (!m) return "";
  return (
    {
      text: m.text ?? "",
      sticker: "Sticker",
      image: "Photo",
      album: "3 photos",
      voice: "Voice message",
      video: "Video",
      link: m.title || "Link",
    } as Record<string, string>
  )[m.kind] as string;
}

const blank = (id: number, cid: string): Msg => ({
  id,
  cid,
  mine: false,
  kind: "text",
  state: "recv",
  seq: null,
  stages: [],
  stage: 0,
  attempt: 1,
  retryIn: 0,
  upload: null,
  replyTo: null,
  reactions: [],
  pinned: false,
  pinPending: false,
});

export class Sim {
  now: Ms = 0;
  q: { at: Ms; fn: () => void }[] = [];
  msgs: Msg[] = [];
  pinOrder: number[] = [];
  outbox: Op[] = [];
  inflight: Op | null = null;
  seq = 2000;
  pinV = 7;
  conn: "online" | "connecting" | "offline" = "online";
  epoch = 0;
  flaky = false;
  focusId: number | null = null;
  menuFor: number | null = null;
  replyTo: number | null = null;
  tray = false;
  logs: LogEntry[] = [];
  actT0: Ms = 0;
  status = "";
  peerTyping = false;
  /** Scripted network outcomes, consumed before random ones (tests and state boards). */
  script: Outcome[] = [];
  noReplies = true;
  starId: number;
  /** Bumped on every change, so a view can skip work when nothing moved. */
  v = 0;
  readonly rnd: () => number;
  #mid = 0;
  #oid = 0;
  #stickerFlip = 0;

  constructor(seed = 9) {
    this.rnd = mulberry32(seed);
    const add = (o: Partial<Msg>): Msg => {
      const m: Msg = { ...blank(++this.#mid, this.#cid()), ...o };
      if (m.kind !== "date" && m.kind !== "system") m.seq = ++this.seq;
      if (m.mine) {
        m.stages = PIPES[m.kind as SendKind].stages;
        m.stage = m.stages.length - 1;
      }
      this.msgs.push(m);
      return m;
    };
    add({ kind: "date", text: "Saturday 9:41 PM" });
    add({ text: "update: biscuit walked across my keyboard" });
    const pushed = add({ text: "and pushed to main" });
    add({ kind: "image", alt: "Illustration: an orange cat asleep across a laptop keyboard" });
    add({ mine: true, state: "seen", text: "did the tests at least pass", replyTo: pushed.id });
    const star = add({
      text: "all green. she's now our most reliable engineer",
      reactions: [{ e: "😂", n: 2, me: false }],
      pinned: true,
    });
    add({ kind: "system", text: "Remy pinned a message" });
    add({ kind: "voice", dur: 7 });
    add({ mine: true, state: "seen", kind: "sticker", sticker: "duck" });
    add({
      kind: "link",
      url: "catsofgit.example/biscuit",
      title: "Commit history: 14 commits, all titled “mrrp”",
      desc: "An independent audit of one very confident cat.",
    });
    add({ kind: "video", caption: "How to cat-proof a keyboard (part 1 of 47)", dur: "0:15" });
    const last = add({ mine: true, state: "seen", text: "i'm adding her to the on-call rotation" });
    this.pinOrder = [star.id];
    this.focusId = last.id;
    this.starId = star.id;
    this.log("DB", `opened chat: 12 rows from local DB, pins v${this.pinV}`);
    this.log("SYNC", `connected; caught up to seq #${this.seq}`, "ok");
  }

  // ---- scheduler -------------------------------------------------------------------------
  #ri(lo: number, hi: number): number {
    return lo + Math.floor(this.rnd() * (hi - lo + 1));
  }
  #cid(): string {
    const h = () =>
      Math.floor(this.rnd() * 65536)
        .toString(16)
        .padStart(4, "0");
    return h() + h();
  }
  msg(id: number | null | undefined): Msg | undefined {
    return id == null ? undefined : this.msgs.find((m) => m.id === id);
  }
  #schedule(dt: Ms, fn: () => void): void {
    const at = this.now + dt;
    let i = this.q.length;
    while (i > 0 && (this.q[i - 1] as { at: Ms }).at > at) i--;
    this.q.splice(i, 0, { at, fn });
  }
  #step(): void {
    const e = this.q.shift();
    if (!e) return;
    this.now = Math.max(this.now, e.at);
    e.fn();
    this.v++;
  }
  /** Advance simulated time by dt, running every event that falls due. */
  advance(dt: Ms): void {
    const until = this.now + dt;
    while (this.q.length && (this.q[0] as { at: Ms }).at <= until) this.#step();
    this.now = until;
  }
  drainAll(): void {
    let k = 0;
    while (this.q.length && k++ < 800) this.#step();
  }
  drainUntil(c: () => boolean): void {
    let k = 0;
    while (this.q.length && !c() && k++ < 800) this.#step();
  }
  startAction(): void {
    this.actT0 = this.now;
  }
  log(lane: Lane, text: string, kind: LogKind = ""): void {
    this.logs.push({ t: Math.max(0, Math.round(this.now - this.actT0)), lane, text, kind });
    if (this.logs.length > 80) this.logs.shift();
    this.v++;
  }
  #whenOnline(fn: () => void): void {
    const go = () => {
      if (this.conn === "online") fn();
      else this.#schedule(300, go);
    };
    go();
  }
  #short(m: Msg): string {
    return m.cid.slice(0, 4);
  }
  #opName(op: Op): string {
    const m = this.msg(op.msgId);
    return `${op.type === "send" ? `send ${m?.kind}` : op.type} ${m ? this.#short(m) : ""}`;
  }
  pendingOps(): number {
    return this.outbox.filter((o) => o.state !== "done" && o.state !== "failed").length;
  }
  #sysLine(text: string): void {
    this.msgs.push({ ...blank(++this.#mid, this.#cid()), kind: "system", text, attempt: 0 });
  }

  // ---- actions ---------------------------------------------------------------------------
  send(kind: SendKind, data: Partial<Msg> = {}): Msg {
    this.startAction();
    const P = PIPES[kind];
    const m: Msg = {
      ...blank(++this.#mid, this.#cid()),
      mine: true,
      kind,
      state: "local",
      attempt: 0,
      stage: 1,
      stages: P.stages,
      replyTo: this.replyTo,
      ...data,
    };
    if (kind === "image") m.alt ||= "Illustration: the same cat, now wearing a tiny hard hat";
    if (kind === "album") m.alt = "3 photos: a coffee mug, a desk plant and a cat-shaped dent in a cushion";
    if (kind === "voice") m.dur ||= this.#ri(3, 9);
    if (kind === "video") {
      m.caption = "Cat attends standup, says nothing, leaves";
      m.dur = "0:12";
    }
    if (kind === "link") {
      m.url = "oncall.example/rotation";
      m.title = "On-call rotation: Biscuit (primary)";
      m.desc = "Escalation policy: knock things off the desk.";
    }
    if (kind === "sticker") m.sticker ||= this.#stickerFlip++ % 2 ? "duck" : "paw";
    this.replyTo = null;
    this.tray = false;
    this.msgs.push(m);
    if (this.msgs.length > 60) this.msgs.shift();
    this.focusId = m.id;
    const rq = m.replyTo ? ` reply_to=#${this.msg(m.replyTo)?.seq}` : "";
    const first: Record<SendKind, [Lane, string]> = {
      text: ["DB", `insert text, client id ${this.#short(m)}, status=pending${rq}`],
      sticker: ["DB", `insert sticker "${m.sticker}" from the local pack (no upload needed)`],
      image: ["DB", "insert photo row with a local file path; preview drawn from disk"],
      album: ["DB", "insert 1 row with 3 local file paths; previews drawn from disk"],
      voice: ["UI", `recorded a ${m.dur} s voice note (simulated)`],
      video: ["UI", "picked a video to share; it is already hosted elsewhere"],
      link: ["UI", "detected a URL in the draft"],
    };
    this.log(...first[kind]);
    this.log("UI", "bubble shown at once (optimistic)");
    const steps = P.pre.slice();
    const next = (): void => {
      const s = steps.shift();
      if (!s) {
        this.enqueue("send", m.id);
        return;
      }
      this.#pre(s, m, () => {
        m.stage++;
        next();
      });
    };
    next();
    return m;
  }

  #pre(s: Pre, m: Msg, done: () => void): void {
    if (s === "compress")
      this.#schedule(this.#ri(120, 220), () => {
        this.log(
          "UI",
          m.kind === "album"
            ? "compressed 3 photos, 11.8 MB → 1.1 MB (simulated)"
            : "compressed photo, 4.1 MB → 0.4 MB (simulated)",
        );
        done();
      });
    else if (s === "encode")
      this.#schedule(this.#ri(80, 160), () => {
        this.log("UI", `encoded voice note to compressed audio, ${Number(m.dur) * 3} KB (simulated)`);
        done();
      });
    else if (s === "resolve")
      this.#schedule(this.#ri(20, 60), () => {
        this.log("NET", "resolved the video to a reference (id + thumbnail URL)");
        this.log("NET", "no video bytes leave the device");
        done();
      });
    else if (s === "unfurl")
      this.#schedule(this.#ri(120, 260), () => {
        this.log("NET", "fetched page title and image for the preview card");
        done();
      });
    else this.#upload(m, done);
  }

  /** Resumable chunked upload: 10% per tick, pauses while offline and re-checks every 300 ms. */
  #upload(m: Msg, done: () => void): void {
    const total =
      m.kind === "album" ? this.#ri(1000, 1600) : m.kind === "voice" ? this.#ri(300, 500) : this.#ri(600, 1000);
    let waitLogged = false;
    let started = false;
    const tick = (): void => {
      if (this.conn !== "online") {
        if (!waitLogged) {
          this.log("NET", `upload paused at ${m.upload || 0}%: waiting for network`, "warn");
          waitLogged = true;
        }
        m.state = "queued";
        this.#schedule(300, tick);
        return;
      }
      if (!started) {
        started = true;
        m.upload ||= 0;
        this.log("NET", "upload started in chunks, resumable");
      }
      waitLogged = false;
      m.state = "uploading";
      m.upload = Math.min(100, (m.upload || 0) + 10);
      if (m.upload >= 100) {
        this.log("NET", "upload done: storage returned a media reference", "ok");
        m.state = "local";
        done();
        return;
      }
      this.#schedule(Math.round(total / 10), tick);
    };
    this.#schedule(this.#ri(5, 20), tick);
  }

  pin(m: Msg): void {
    this.startAction();
    this.menuFor = null;
    const type = m.pinned ? "unpin" : "pin";
    m.pinned = !m.pinned;
    m.pinPending = true;
    this.pinOrder = this.pinOrder.filter((x) => x !== m.id);
    if (m.pinned) this.pinOrder.push(m.id);
    this.#sysLine(type === "pin" ? "You pinned a message" : "You unpinned a message");
    this.log("UI", `${type === "pin" ? "Pin" : "Unpin"} tapped on a ${m.kind} message`);
    this.log("DB", `${type === "pin" ? "upsert" : "delete"} pin ${this.#short(m)} (optimistic): banner updated`);
    this.enqueue(type, m.id);
  }

  react(m: Msg): void {
    this.startAction();
    this.menuFor = null;
    const r = m.reactions.find((x) => x.e === "😂");
    const adding = !r?.me;
    if (adding) {
      if (r) {
        r.n++;
        r.me = true;
      } else m.reactions.push({ e: "😂", n: 1, me: true });
    } else if (r) {
      r.n--;
      r.me = false;
      if (r.n <= 0) m.reactions = m.reactions.filter((x) => x !== r);
    }
    this.log("DB", `${adding ? "add" : "remove"} reaction 😂 on ${this.#short(m)} (optimistic)`);
    this.enqueue("react", m.id);
  }

  /** "Tap to retry" on a failed send: same client id, so the server can dedupe. */
  retry(m: Msg): void {
    m.state = "local";
    this.startAction();
    this.log("UI", "Tap to retry: same client id re-queued");
    this.focusId = m.id;
    this.enqueue("send", m.id);
  }

  reply(m: Msg): void {
    this.menuFor = null;
    this.replyTo = m.id;
    this.startAction();
    this.log("UI", `Reply tapped: the next message will quote #${m.seq}`);
  }

  openMenu(m: Msg, how: string): void {
    this.startAction();
    this.log("UI", how);
    this.menuFor = m.id;
  }

  // ---- outbox ----------------------------------------------------------------------------
  enqueue(type: OpType, msgId: number): Op {
    const op: Op = {
      id: ++this.#oid,
      type,
      msgId,
      state: "queued",
      attempt: 0,
      retryIn: 0,
      applied: false,
      serverVal: null,
      waitLogged: false,
    };
    this.outbox.push(op);
    if (this.outbox.length > 60) this.outbox.shift();
    this.log("DB", `outbox += ${this.#opName(op)} (depth ${this.pendingOps()})`);
    this.#schedule(this.#ri(1, 3), () => this.pump());
    return op;
  }

  /** Window of 1: the oldest queued op goes out only when nothing is in flight. */
  pump(): void {
    if (this.inflight) return;
    const queued = this.outbox.filter((o) => o.state === "queued");
    if (!queued.length) return;
    if (this.conn !== "online") {
      for (const op of queued) {
        const m = this.msg(op.msgId);
        if (op.type === "send" && m) m.state = "queued";
        if (!op.waitLogged) {
          this.log("NET", `offline: ${this.#opName(op)} waits in outbox`, "warn");
          op.waitLogged = true;
        }
      }
      return;
    }
    this.#transmit(queued[0] as Op);
  }

  #netStage(m: Msg): number {
    return m.stages.length - 4;
  }

  #transmit(op: Op): void {
    const m = this.msg(op.msgId);
    if (this.conn !== "online") {
      op.state = "queued";
      this.inflight = null;
      return;
    }
    op.attempt++;
    op.state = "inflight";
    this.inflight = op;
    if (op.type === "send" && m) {
      m.state = "sending";
      m.attempt = op.attempt;
      m.stage = this.#netStage(m);
    }
    this.log("NET", `${this.#opName(op)} → server, attempt ${op.attempt}`);
    const ep = this.epoch;
    const att = op.attempt;
    const rtt = this.flaky ? this.#ri(160, 420) : this.#ri(50, 140);
    let outcome: Outcome = "ok";
    if (this.script.length) outcome = this.script.shift() as Outcome;
    else if (this.flaky && this.rnd() < 0.4) outcome = this.rnd() < 0.5 ? "reqlost" : "acklost";
    const current = () => ep === this.epoch && op.attempt === att && this.inflight === op;
    if (outcome === "ok")
      this.#schedule(rtt, () => {
        if (current()) this.#ack(op, rtt);
      });
    else {
      if (outcome === "acklost")
        this.#schedule(Math.round(rtt / 2), () => {
          if (!op.applied) {
            op.applied = true;
            op.serverVal = op.type === "send" ? ++this.seq : ++this.pinV;
          }
          this.log("NET", `(server) applied ${this.#opName(op)}, but the ack was lost`, "warn");
        });
      this.#schedule(ACK_TIMEOUT, () => {
        if (current()) this.#timeout(op);
      });
    }
  }

  #timeout(op: Op): void {
    this.inflight = null;
    const m = this.msg(op.msgId) as Msg;
    if (op.attempt >= MAX_ATTEMPTS) {
      op.state = "failed";
      if (op.type === "send") {
        m.state = "failed";
        this.log("NET", `no ack after ${op.attempt} attempts: marked failed`, "err");
        this.status = "Not sent. The bubble offers Tap to retry.";
      } else if (op.type === "react") {
        this.#rollbackReact(m);
        this.log("DB", "reaction failed: optimistic change rolled back", "err");
        this.status = "Reaction failed and was rolled back.";
      } else {
        m.pinned = op.type === "unpin";
        m.pinPending = false;
        this.pinOrder = this.pinOrder.filter((x) => x !== m.id);
        if (m.pinned) this.pinOrder.push(m.id);
        this.log("DB", `${op.type} failed: optimistic change rolled back`, "err");
        this.status = "Pin failed and was rolled back.";
      }
      this.pump();
      return;
    }
    const back = 200 * 2 ** (op.attempt - 1) + this.#ri(0, 100);
    op.state = "retrying";
    op.retryIn = back;
    this.inflight = op;
    if (op.type === "send") {
      m.state = "retrying";
      m.retryIn = back;
      m.attempt = op.attempt;
    }
    this.log("NET", `no ack in ${ACK_TIMEOUT} ms: retry in ${back} ms (backoff + jitter)`, "warn");
    this.status = `Retrying (attempt ${op.attempt + 1}).`;
    const ep = this.epoch;
    this.#schedule(back, () => {
      if (ep === this.epoch && this.inflight === op) {
        this.inflight = null;
        this.#transmit(op);
      }
    });
  }

  /**
   * The reference logs a rollback for a failed reaction but never reverts it; §6.3 says
   * "after 5 failures the optimistic change rolls back", so this toggles your 😂 back.
   */
  #rollbackReact(m: Msg): void {
    const r = m.reactions.find((x) => x.e === "😂");
    if (r?.me) {
      r.n--;
      r.me = false;
      if (r.n <= 0) m.reactions = m.reactions.filter((x) => x !== r);
    } else if (r) {
      r.n++;
      r.me = true;
    } else m.reactions.push({ e: "😂", n: 1, me: true });
  }

  #ack(op: Op, rtt: Ms): void {
    this.inflight = null;
    op.state = "done";
    const m = this.msg(op.msgId) as Msg;
    const dup = op.applied;
    if (op.type === "send") {
      m.seq = op.serverVal ?? ++this.seq;
      m.state = "sent";
      m.stage = m.stages.length - 2;
      this.log("NET", `ack seq #${m.seq}, ${rtt} ms${dup ? ": duplicate dropped by client id" : ""}`, "ok");
      this.log("DB", `update ${this.#short(m)} status=sent seq=${m.seq}`);
      this.status = "Sent.";
      this.#schedule(this.#ri(40, 120), () =>
        this.#whenOnline(() => {
          m.state = "delivered";
          m.stage = m.stages.length - 1;
          this.log("SYNC", 'delivery receipt: "Delivered"', "ok");
          this.status = "Delivered.";
          this.#schedule(this.#ri(500, 1000), () =>
            this.#whenOnline(() => {
              m.state = "seen";
              m.stage = m.stages.length - 1;
              this.log("SYNC", 'read receipt: "Seen"', "ok");
              this.status = "Seen.";
              if (!this.noReplies && this.rnd() < 0.5) this.#peerReply();
            }),
          );
        }),
      );
    } else if (op.type === "react") {
      this.log("NET", `reaction ack, ${rtt} ms`, "ok");
      this.log("SYNC", "reaction event sent to Remy", "ok");
      this.status = "Reaction synced.";
    } else {
      const v = op.serverVal ?? ++this.pinV;
      this.pinV = Math.max(this.pinV, v);
      m.pinPending = false;
      this.log("NET", `${op.type} ack, pins v${v}, ${rtt} ms${dup ? ": duplicate ignored" : ""}`, "ok");
      this.log("SYNC", `${op.type} event fanned out: Remy's banner updates too`, "ok");
      this.status = op.type === "pin" ? "Pinned for both of you." : "Unpinned for both of you.";
    }
    this.pump();
  }

  #peerReply(): void {
    this.#schedule(this.#ri(300, 600), () =>
      this.#whenOnline(() => {
        this.peerTyping = true;
        this.log("SYNC", "typing indicator from Remy");
        this.#schedule(this.#ri(700, 1200), () =>
          this.#whenOnline(() => {
            this.peerTyping = false;
            const r = this.rnd();
            const m: Msg = { ...blank(++this.#mid, this.#cid()), seq: ++this.seq };
            if (r < 0.65) m.text = REPLIES[this.#ri(0, REPLIES.length - 1)];
            else if (r < 0.85) Object.assign(m, { kind: "sticker", sticker: "paw" });
            else Object.assign(m, { kind: "voice", dur: this.#ri(2, 6) });
            this.msgs.push(m);
            this.log("SYNC", `pushed #${m.seq} (${m.kind}) from Remy: inserted locally, read receipt sent`, "ok");
          }),
        );
      }),
    );
  }

  // ---- connection ------------------------------------------------------------------------
  goOffline(): void {
    this.startAction();
    this.conn = "offline";
    this.epoch++;
    if (this.inflight) {
      const op = this.inflight;
      op.state = "queued";
      op.waitLogged = false;
      this.log("NET", `connection dropped: ${this.#opName(op)} back in outbox`, "warn");
      this.inflight = null;
    }
    this.status = "Offline. Changes wait on the device.";
    this.pump();
  }

  goOnline(): void {
    this.startAction();
    this.conn = "connecting";
    this.status = "Reconnecting…";
    const ep = ++this.epoch;
    this.#schedule(this.#ri(120, 300), () => {
      if (ep !== this.epoch) return;
      this.conn = "online";
      const n = this.outbox.filter((o) => o.state === "queued").length;
      this.log(
        "SYNC",
        `reconnected; resuming uploads and flushing ${n} outbox item${n === 1 ? "" : "s"} in order`,
        "ok",
      );
      this.status = "Reconnected.";
      for (const o of this.outbox) o.waitLogged = false;
      this.pump();
    });
  }

  toggleFlaky(): void {
    this.flaky = !this.flaky;
    this.status = this.flaky
      ? "Flaky network on: about 4 in 10 requests lose the request or the ack."
      : "Flaky network off.";
    this.v++;
  }
}
