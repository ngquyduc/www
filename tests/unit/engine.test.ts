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
    expect(a.tape).toHaveLength(8);
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
    expect(b.tape[0]).toMatchObject({ side: "buy", q: USER_QTY, who: "you" });
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

  it("formats the view: mid to 3 dp, spread and prices to 2 dp", () => {
    const v = new Book(7).view();
    expect(v.mid).toMatch(/^\d+\.\d{3}$/);
    expect(v.spread).toMatch(/^\d+\.\d{2}$/);
    expect(v.asks).toHaveLength(5);
    expect(Number(v.asks[0]?.price)).toBeGreaterThan(Number(v.asks[4]?.price)); // highest ask on top
  });
});
