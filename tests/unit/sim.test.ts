import { describe, expect, it } from "vitest";
import { ACK_TIMEOUT, MAX_ATTEMPTS, PIPES, Sim } from "../../src/components/hero/sim";

const sentSeq = (s: Sim) => s.msgs.filter((m) => m.mine && m.seq != null && m.state !== "failed");

describe("hero sim: boot", () => {
  it("is deterministic for a seed, so the SSR boot frame matches the client", () => {
    const a = new Sim(9);
    const b = new Sim(9);
    expect(a.msgs.map((m) => m.cid)).toEqual(b.msgs.map((m) => m.cid));
    expect(a.logs).toEqual(b.logs);
  });

  it("seeds the invented thread with one pinned message from Remy", () => {
    const s = new Sim();
    expect(s.msgs).toHaveLength(12);
    const pinned = s.msgs.filter((m) => m.pinned);
    expect(pinned).toHaveLength(1);
    expect(pinned[0]?.text).toBe("all green. she's now our most reliable engineer");
    expect(s.pinOrder).toEqual([pinned[0]?.id]);
    expect(s.seq).toBe(2010);
  });
});

describe("hero sim: send pipeline", () => {
  it("walks a text through local insert → sent → delivered → seen", () => {
    const s = new Sim();
    const m = s.send("text", { text: "hello" });
    expect(m.state).toBe("local");
    expect(m.stage).toBe(1);
    s.drainUntil(() => m.state === "sent");
    expect(m.seq).toBe(2011);
    expect(m.stage).toBe(PIPES.text.stages.length - 2);
    s.drainUntil(() => m.state === "seen");
    expect(m.state).toBe("seen");
  });

  it("preserves send order through the outbox (window of one)", () => {
    const s = new Sim();
    const a = s.send("text", { text: "one" });
    const b = s.send("text", { text: "two" });
    const c = s.send("sticker", { sticker: "paw" });
    s.drainAll();
    expect([a.seq, b.seq, c.seq]).toEqual([2011, 2012, 2013]);
  });

  it("uploads media before sending, so a later text can overtake a photo", () => {
    const s = new Sim();
    const photo = s.send("image");
    const text = s.send("text", { text: "quick one" });
    s.drainUntil(() => photo.state === "sent");
    expect(text.seq).not.toBeNull();
    expect(text.seq as number).toBeLessThan(photo.seq as number);
    expect(photo.upload).toBe(100);
  });

  it("sends a shared video as a reference without uploading bytes", () => {
    const s = new Sim();
    const v = s.send("video");
    s.drainAll();
    expect(v.upload).toBeNull();
    expect(s.logs.some((l) => l.text === "no video bytes leave the device")).toBe(true);
  });
});

describe("hero sim: retries", () => {
  it("dedupes on a lost ack: the server applied it once, the retry reuses its seq", () => {
    const s = new Sim();
    s.flaky = true;
    s.script = ["acklost", "ok"];
    const m = s.send("text", { text: "please tell me you reverted it" });
    const cid = m.cid;
    s.drainUntil(() => m.state === "sent");
    expect(m.cid).toBe(cid);
    expect(m.attempt).toBe(2);
    expect(m.seq).toBe(2011);
    expect(s.seq).toBe(2011); // one server-side insert, not two
    expect(s.logs.some((l) => l.text.includes("duplicate dropped by client id"))).toBe(true);
  });

  it(`fails after ${MAX_ATTEMPTS} attempts with backoff, then Tap to retry recovers`, () => {
    const s = new Sim();
    s.script = Array(MAX_ATTEMPTS).fill("reqlost");
    const m = s.send("text", { text: "x" });
    const t0 = s.now;
    s.drainUntil(() => m.state === "failed");
    expect(m.state).toBe("failed");
    expect(m.attempt).toBe(MAX_ATTEMPTS);
    // 5 timeouts plus 4 backoffs of at least 200·2^(n−1) ms.
    expect(s.now - t0).toBeGreaterThanOrEqual(MAX_ATTEMPTS * ACK_TIMEOUT + 200 + 400 + 800 + 1600);
    s.retry(m);
    s.drainUntil(() => m.state === "seen");
    expect(m.state).toBe("seen");
  });
});

describe("hero sim: pins and reactions", () => {
  it("pins optimistically, acks with a new pins version and fans out", () => {
    const s = new Sim();
    const target = s.msgs.find((m) => m.text === "and pushed to main");
    if (!target) throw new Error("seed changed");
    s.pin(target);
    expect(target.pinned).toBe(true);
    expect(target.pinPending).toBe(true);
    expect(s.pinOrder.at(-1)).toBe(target.id);
    expect(s.msgs.at(-1)?.text).toBe("You pinned a message");
    s.drainAll();
    expect(target.pinPending).toBe(false);
    expect(s.pinV).toBe(8);
  });

  it("rolls a pin back after the op fails", () => {
    const s = new Sim();
    const target = s.msgs.find((m) => m.text === "and pushed to main");
    if (!target) throw new Error("seed changed");
    s.script = Array(MAX_ATTEMPTS).fill("reqlost");
    s.pin(target);
    s.drainAll();
    expect(target.pinned).toBe(false);
    expect(s.pinOrder).not.toContain(target.id);
    expect(s.status).toBe("Pin failed and was rolled back.");
  });

  it("rolls a reaction back after the op fails", () => {
    const s = new Sim();
    const star = s.msg(s.starId);
    if (!star) throw new Error("seed changed");
    s.script = Array(MAX_ATTEMPTS).fill("reqlost");
    s.react(star);
    expect(star.reactions[0]).toEqual({ e: "😂", n: 3, me: true });
    s.drainAll();
    expect(star.reactions[0]).toEqual({ e: "😂", n: 2, me: false });
  });
});

describe("hero sim: offline", () => {
  it("pauses uploads and queues sends offline, then flushes in order on reconnect", () => {
    const s = new Sim();
    s.goOffline();
    const photo = s.send("image");
    const text = s.send("text", { text: "who gave the cat sudo" });
    s.drainUntil(() => photo.state === "queued" && text.state === "queued");
    s.advance(2000);
    expect(photo.state).toBe("queued");
    expect(text.state).toBe("queued");
    expect(photo.upload ?? 0).toBeLessThan(100);
    expect(sentSeq(s).filter((m) => m === photo || m === text)).toHaveLength(0);

    s.goOnline();
    s.drainAll();
    expect(text.state).toBe("seen");
    expect(photo.state).toBe("seen");
    expect(photo.upload).toBe(100);
    // The queued text flushes first; the photo enters the outbox only after its upload resumes and finishes.
    expect(text.seq as number).toBeLessThan(photo.seq as number);
  });

  it("puts an in-flight op back in the outbox when the connection drops", () => {
    const s = new Sim();
    const m = s.send("text", { text: "x" });
    s.drainUntil(() => m.state === "sending");
    s.goOffline();
    expect(s.inflight).toBeNull();
    s.advance(5000);
    expect(m.state).toBe("queued");
    s.goOnline();
    s.drainAll();
    expect(m.state).toBe("seen");
    expect(m.seq).toBe(2011);
  });
});
