import { describe, expect, it } from "vitest";
import { Book, USER_QTY } from "../../src/components/orderbook/engine";

const invariant = (b: Book) => {
  expect(b.bestAsk).toBeGreaterThan(b.bestBid);
  expect(b.asks.length).toBeLessThanOrEqual(8);
  expect(b.bids.length).toBeLessThanOrEqual(8);
  for (let i = 1; i < b.asks.length; i++) expect(b.asks[i]?.p).toBeGreaterThan(b.asks[i - 1]?.p as number);
  for (let i = 1; i < b.bids.length; i++) expect(b.bids[i]?.p).toBeLessThan(b.bids[i - 1]?.p as number);
  for (const l of [...b.asks, ...b.bids]) expect(l.q).toBeGreaterThan(0);
};

describe("order book engine", () => {
  it("boots deterministically with 8 levels a side and a warm tape", () => {
    const a = new Book(7);
    const b = new Book(7);
    expect(a.view()).toEqual(b.view());
    expect(a.asks).toHaveLength(8);
    expect(a.tape.length).toBeGreaterThanOrEqual(8); // 8 takers, one print per level each
    invariant(a);
  });

  it("keeps the book uncrossed and sorted over many ticks", () => {
    const b = new Book(42);
    for (let i = 0; i < 2000; i++) {
      b.tick();
      invariant(b);
    }
  });

  it("fills a market buy best-price first, walking levels when the best one is thin", () => {
    const b = new Book(7);
    const best = b.asks[0];
    if (!best) throw new Error("empty");
    best.q = 6;
    const second = b.asks[1]?.p as number;
    b.market("buy");
    // One print per level at that level's price, newest (the deeper level) first.
    expect(b.tape[0]).toMatchObject({ side: "buy", q: 4, p: second, who: "you" });
    expect(b.tape[1]).toMatchObject({ side: "buy", q: 6, p: best.p, who: "you" });
    expect((b.tape[0]?.q ?? 0) + (b.tape[1]?.q ?? 0)).toBe(USER_QTY);
    expect(b.msg).toMatch(
      /^Bought 10 across 2 levels: 6 @ \d+\.\d{2}, 4 @ \d+\.\d{2} \(avg \d+\.\d{3}\)\. The best ask only had 6\.$/,
    );
    expect(b.last).toBe(second);
    expect(b.dir).toBe(1);
    invariant(b);
  });

  it("reports a single-level fill plainly", () => {
    const b = new Book(7);
    const best = b.bids[0];
    if (!best) throw new Error("empty");
    best.q = 40;
    b.market("sell");
    expect(b.msg).toBe(`Sold 10 @ ${(best.p / 100).toFixed(2)}, filled at the best bid.`);
    expect(b.flash.has(best.p)).toBe(true);
  });

  it("never prints a trade between ticks: every tape price is a level price", () => {
    const b = new Book(11);
    for (let i = 0; i < 500; i++) {
      b.tick();
      if (i % 50 === 0) b.market(i % 100 === 0 ? "buy" : "sell");
    }
    for (const t of b.view(12).tape) expect(t.price).toMatch(/^\d+\.\d{2}$/);
    for (const t of b.tape) expect(Number.isInteger(t.p)).toBe(true);
  });

  it("formats the view: mid to 3 dp, spread and prices to 2 dp", () => {
    const v = new Book(7).view();
    expect(v.mid).toMatch(/^\d+\.\d{3}$/);
    expect(v.spread).toMatch(/^\d+\.\d{2}$/);
    expect(v.asks).toHaveLength(5);
    expect(Number(v.asks[0]?.price)).toBeGreaterThan(Number(v.asks[4]?.price)); // highest ask on top
  });
});
