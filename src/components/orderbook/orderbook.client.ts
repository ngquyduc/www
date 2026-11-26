// Order-book demo runtime (§7.4, §7.5). Budget < 4 KB gzip.
import { Book, TICK_MS } from "./engine";
import { pad, rollHtml, y } from "./roll";

/** Updates a rolling number in place: only columns whose digit changed move. */
function roll(host: HTMLElement, value: string, width = 0): void {
  const sr = host.querySelector(".ob-sr");
  const cols = host.querySelectorAll<HTMLElement>(".ob-roll > *");
  const chars = [...pad(value, width)];
  if (!sr || cols.length !== chars.length) {
    host.innerHTML = rollHtml(value, width);
    return;
  }
  if (sr.textContent === value) return;
  sr.textContent = value;
  chars.forEach((ch, i) => {
    const strip = (cols[i] as HTMLElement).firstElementChild as HTMLElement | null;
    if (strip) strip.style.transform = y(ch);
    else (cols[i] as HTMLElement).textContent = ch;
  });
}

export function mount(root: HTMLElement): void {
  const book = new Book(7);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let paused = reduced;
  let visible = true;
  let timer = 0;
  const $ = (k: string) => root.querySelector<HTMLElement>(`[data-o="${k}"]`) as HTMLElement;
  const idleMsg = () =>
    reduced && paused
      ? "Auto-updates are off because your device asks for reduced motion. Press Play or Step, or place an order."
      : "Place a market order. It fills against the best price on the other side.";

  function rows(group: HTMLElement, data: ReturnType<Book["view"]>["asks"]): void {
    [...group.children].forEach((row, i) => {
      const r = data[i];
      if (!r) return;
      const c = row.children as HTMLCollectionOf<HTMLElement>;
      row.classList.toggle("ob-flash", r.flash);
      (c[0] as HTMLElement).style.width = `${r.w}%`;
      (c[1] as HTMLElement).textContent = r.price;
      roll(c[2] as HTMLElement, r.size, 2);
      (c[3] as HTMLElement).textContent = r.total;
    });
  }

  function render(): void {
    const v = book.view(8);
    const dir = v.dir > 0 ? "ob-up" : v.dir < 0 ? "ob-down" : "";
    const last = $("last");
    last.className = `ob-last ${dir}`;
    roll(last, v.last);
    $("arrow").className = dir;
    $("arrow").textContent = v.dir > 0 ? "▲" : v.dir < 0 ? "▼" : "";
    roll($("mid"), v.mid);
    roll($("spread"), v.spread);
    $("spread2").textContent = v.spread;
    $("mid2").textContent = v.mid;
    rows($("asks"), v.asks);
    rows($("bids"), v.bids);
    $("tape").innerHTML = v.tape
      .map(
        (t) =>
          `<div role="row" class="ob-trow${t.you ? " ob-you" : ""}"><span role="cell" class="ob-m">${t.t}</span><span role="cell" class="${t.side === "buy" ? "ob-buyc" : "ob-sellc"}">${t.side === "buy" ? "BUY" : "SELL"}${t.you ? '<span class="ob-youtag">YOU</span>' : ""}</span><span role="cell" class="r">${t.q}</span><span role="cell" class="r">${t.price}</span></div>`,
      )
      .join("");
    roll($("ask"), v.bestAsk);
    roll($("bid"), v.bestBid);
    $("state").textContent = paused ? (reduced ? "PAUSED · REDUCED MOTION" : "PAUSED") : "LIVE";
    root.querySelector<HTMLElement>(".ob-dot")?.setAttribute("data-live", String(!paused));
    $("pause").textContent = paused ? "Play" : "Pause";
    $("step").hidden = !paused;
    const msg = $("msg");
    msg.textContent = book.msg || idleMsg();
    msg.toggleAttribute("data-idle", !book.msg);
  }

  // Runs only while playing and on screen; going off-screen stops it silently (§7.4).
  function sync(): void {
    const run = !paused && visible;
    if (run && !timer)
      timer = window.setInterval(() => {
        book.tick();
        render();
      }, TICK_MS);
    if (!run && timer) {
      clearInterval(timer);
      timer = 0;
    }
  }

  root.addEventListener("click", (e) => {
    const k = (e.target as Element).closest<HTMLElement>("[data-o]")?.dataset.o;
    if (k === "pause") paused = !paused;
    else if (k === "step") book.tick();
    else if (k === "buy" || k === "sell") book.market(k);
    else return;
    render();
    sync();
  });
  new IntersectionObserver(([e]) => {
    visible = !!e?.isIntersecting;
    sync();
  }).observe(root);
  render();
  sync();
}
