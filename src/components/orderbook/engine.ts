// Simulated order book (DESIGN.md §7), ported from design/canvas/project/OrderBook.dc.html.
// Pure: no DOM. Prices are integer cents with a 0.01 tick.

export type Cents = number;
export type Side = "buy" | "sell";
export interface Level {
  p: Cents;
  q: number;
}
export interface Trade {
  id: number;
  t: string;
  side: Side;
  q: number;
  avg: number;
  who: "sim" | "you";
}
export interface Fill {
  p: Cents;
  q: number;
}

export const TICK_MS = 700;
export const USER_QTY = 10;
export const MID0 = 10000;
const DEPTH = 8;
const TAPE = 12;

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const fmt = (c: Cents): string => (c / 100).toFixed(2);

export class Book {
  asks: Level[] = [];
  bids: Level[] = [];
  tape: Trade[] = [];
  flash = new Set<Cents>();
  ticks = 0;
  last: Cents = MID0;
  dir: -1 | 0 | 1 = 0;
  msg = "";
  private seq = 0;
  readonly rnd: () => number;

  constructor(seed = 7) {
    this.rnd = mulberry32(seed);
    for (let i = 0; i < DEPTH; i++) {
      this.asks.push({ p: MID0 + 1 + i, q: this.ri(6, 24) + i * 4 });
      this.bids.push({ p: MID0 - 1 - i, q: this.ri(6, 24) + i * 4 });
    }
    // Warm the tape with 8 simulated takers.
    for (let k = 0; k < 8; k++) {
      this.ticks++;
      this.fill(this.rnd() < 0.5 ? "buy" : "sell", this.ri(1, 8), "sim");
    }
  }

  ri(lo: number, hi: number): number {
    return lo + Math.floor(this.rnd() * (hi - lo + 1));
  }

  clock(): string {
    const s = this.ticks * 0.7;
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, "0")}:${(s - m * 60).toFixed(1).padStart(4, "0")}`;
  }

  get bestAsk(): Cents {
    return (this.asks[0] as Level).p;
  }
  get bestBid(): Cents {
    return (this.bids[0] as Level).p;
  }

  refill(): void {
    const { asks, bids } = this;
    while (asks.length < DEPTH) {
      const base = asks.length ? (asks[asks.length - 1] as Level).p : this.bestBid;
      asks.push({ p: base + 1, q: this.ri(10, 40) });
    }
    while (bids.length < DEPTH) {
      const base = bids.length ? (bids[bids.length - 1] as Level).p : this.bestAsk;
      bids.push({ p: base - 1, q: this.ri(10, 40) });
    }
    if (this.bestAsk - this.bestBid > 2 && this.rnd() < 0.6) {
      if (this.rnd() < 0.5) asks.unshift({ p: this.bestAsk - 1, q: this.ri(3, 12) });
      else bids.unshift({ p: this.bestBid + 1, q: this.ri(3, 12) });
    }
    if (asks.length > DEPTH) asks.length = DEPTH;
    if (bids.length > DEPTH) bids.length = DEPTH;
  }

  /** Walk the opposite side best-first (price, then time within the level). */
  fill(side: Side, qty: number, who: Trade["who"]): { filled: number; avg: number; fills: Fill[] } {
    const book = side === "buy" ? this.asks : this.bids;
    const prev = this.last;
    const fills: Fill[] = [];
    let left = qty;
    let notional = 0;
    while (left > 0 && book.length) {
      const l = book[0] as Level;
      const t = Math.min(left, l.q);
      l.q -= t;
      left -= t;
      notional += t * l.p;
      fills.push({ p: l.p, q: t });
      this.last = l.p;
      if (l.q === 0) book.shift();
    }
    const filled = qty - left;
    if (this.last !== prev) this.dir = this.last > prev ? 1 : -1;
    this.tape.unshift({ id: ++this.seq, t: this.clock(), side, q: filled, avg: notional / filled, who });
    if (this.tape.length > TAPE) this.tape.length = TAPE;
    this.refill();
    return { filled, avg: notional / filled, fills };
  }

  tick(): void {
    this.ticks++;
    this.flash = new Set();
    const r = this.rnd();
    if (r < 0.5) {
      const side = this.rnd() < 0.5 ? this.asks : this.bids;
      const i = Math.min(side.length - 1, Math.floor(this.rnd() * this.rnd() * 6));
      const l = side[i] as Level;
      if (this.rnd() < 0.6) l.q = Math.min(99, l.q + this.ri(1, 10));
      else {
        l.q -= this.ri(1, 8);
        if (l.q <= 0) side.splice(i, 1);
      }
      this.refill();
    } else if (r < 0.85) {
      this.fill(this.rnd() < 0.5 ? "buy" : "sell", this.ri(1, 8), "sim");
    } else {
      const side = this.rnd() < 0.5 ? this.asks : this.bids;
      if (side.length > 1) side.shift();
      this.refill();
    }
  }

  /** The visitor's market order (Buy 10 / Sell 10). */
  market(side: Side): void {
    this.ticks++;
    const res = this.fill(side, USER_QTY, "you");
    const book = side === "buy" ? this.asks : this.bids;
    this.flash = new Set(res.fills.map((f) => f.p).filter((p) => book.some((l) => l.p === p)));
    if (!this.flash.size && book.length) this.flash.add((book[0] as Level).p);
    const verb = side === "buy" ? "Bought" : "Sold";
    const best = side === "buy" ? "best ask" : "best bid";
    const f0 = res.fills[0] as Fill;
    this.msg =
      res.fills.length === 1
        ? `${verb} ${USER_QTY} @ ${fmt(f0.p)}, filled at the ${best}.`
        : `${verb} ${USER_QTY} across ${res.fills.length} levels: ${res.fills
            .map((f) => `${f.q} @ ${fmt(f.p)}`)
            .join(", ")} (avg ${(res.avg / 100).toFixed(3)}). The ${best} only had ${f0.q}.`;
  }

  /** Values the view needs, as strings (§7.3 Render). */
  view(tapeRows = 8) {
    const a5 = this.asks.slice(0, 5);
    const b5 = this.bids.slice(0, 5);
    let ca = 0;
    let cb = 0;
    const ac = a5.map((l) => (ca += l.q));
    const bc = b5.map((l) => (cb += l.q));
    const max = Math.max(ca, cb, 1);
    const row = (l: Level, cum: number) => ({
      p: l.p,
      price: fmt(l.p),
      size: String(l.q),
      total: String(cum),
      w: Math.round((cum / max) * 100),
      flash: this.flash.has(l.p),
    });
    return {
      asks: a5.map((l, i) => row(l, ac[i] as number)).reverse(),
      bids: b5.map((l, i) => row(l, bc[i] as number)),
      tape: this.tape.slice(0, tapeRows).map((t) => ({
        id: t.id,
        t: t.t,
        side: t.side,
        q: t.q,
        price: Number.isInteger(t.avg) ? (t.avg / 100).toFixed(2) : (t.avg / 100).toFixed(3),
        you: t.who === "you",
      })),
      last: fmt(this.last),
      dir: this.dir,
      mid: ((this.bestAsk + this.bestBid) / 200).toFixed(3),
      spread: fmt(this.bestAsk - this.bestBid),
      bestAsk: fmt(this.bestAsk),
      bestBid: fmt(this.bestBid),
    };
  }
}
