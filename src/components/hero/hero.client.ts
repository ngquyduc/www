// Hero demo runtime (§6.5 UI events): long press, keyboard menu, tray, voice playback,
// tabs and the playback loop. Loaded only when the demo scrolls into view.
import { CANNED, LONG_PRESS, type Msg, type SendKind, Sim, SLOW } from "./sim";
import * as V from "./view";

export function mount(root: HTMLElement): void {
  V.setArt(
    Object.fromEntries([...root.querySelectorAll("template")].map((t) => [t.dataset.art as string, t.innerHTML])),
  );
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sim = new Sim(9);
  sim.noReplies = false;
  const ui: V.UI = { draft: "", userActs: 0, hint: "", playId: null, playPos: 0, instant: reduced, reduced };
  let k = 0;
  let timer = 0;
  let playT = 0;
  let hintT = 0;
  let lp = 0;
  let holdEl: HTMLElement | null = null;
  let typingAt = -1e9;
  let wantFocus = "";

  const $ = <T extends HTMLElement = HTMLElement>(sel: string) => root.querySelector<T>(sel) as T;
  const input = $<HTMLInputElement>("#dm-in");
  const threadEl = $("[data-r=thread]");
  const statusEl = $("[data-e=status]");
  const cache = new Map<string, string>();
  // The server rendered the boot frame with the same view functions, so the first pass only
  // records what is already in the DOM instead of rewriting every region on mount.
  let priming = true;

  const set = (el: HTMLElement, html: string, key: string) => {
    if (cache.get(key) !== html) {
      cache.set(key, html);
      if (!priming) el.innerHTML = html;
    }
  };

  function render(): void {
    const active = document.activeElement as HTMLElement | null;
    const focusKey = wantFocus || (root.contains(active) ? (active?.dataset.f ?? "") : "");
    wantFocus = "";

    $("[data-e=presence]").textContent = V.presence(sim);
    set($("[data-r=banner]"), V.banner(sim), "banner");
    set($("[data-r=hint]"), V.hint(ui), "hint");
    set($("[data-r=reply]"), V.replyBar(sim), "reply");
    set($("[data-r=chips]"), V.chips(sim, ui), "chips");
    set($("[data-r=tray]"), V.tray(sim), "tray");
    $("[data-act=tray]").setAttribute("aria-expanded", String(sim.tray));

    // Keyed thread: reuse each item's element, rewrite only the ones whose markup changed.
    const items = V.thread(sim, ui);
    const keep = new Set(items.map((i) => i.k));
    for (const el of [...threadEl.children] as HTMLElement[]) {
      if (!keep.has(el.dataset.k ?? "")) el.remove();
    }
    let prev: Element | null = null;
    for (const it of items) {
      let el = threadEl.querySelector<HTMLElement>(`:scope > [data-k="${it.k}"]`);
      if (!el) {
        el = document.createElement("div");
        el.className = "dm-item";
        el.dataset.k = it.k;
      }
      set(el, it.html, `i${it.k}`);
      const want: Element | null = prev ? prev.nextElementSibling : threadEl.firstElementChild;
      if (want !== el) threadEl.insertBefore(el, want);
      prev = el;
    }
    if (holdEl && !holdEl.isConnected) holdEl = null;

    $("[data-e=speed]").textContent = ui.instant ? "INSTANT" : `PLAYBACK ×${SLOW}`;
    $("[data-e=conn]").textContent = V.conn(sim);
    $(".eg-dot").dataset.conn = sim.conn;
    $("[data-act=flaky]").setAttribute("aria-pressed", String(sim.flaky));
    $("[data-act=offline]").setAttribute("aria-pressed", String(sim.conn !== "online"));
    set($("[data-e=pipe]"), V.pipeline(sim, ui), "pipe");
    set($("[data-e=logs]"), V.logs(sim), "logs");
    statusEl.textContent = V.status(sim, ui);
    statusEl.toggleAttribute("data-idle", !sim.status);

    if (focusKey && (!root.contains(document.activeElement) || wantFocusChanged(focusKey))) {
      root.querySelector<HTMLElement>(`[data-f="${focusKey}"]`)?.focus();
    }
  }
  const wantFocusChanged = (key: string) => (document.activeElement as HTMLElement | null)?.dataset.f !== key;

  function loop(): void {
    if (ui.instant) {
      sim.drainAll();
      render();
      return;
    }
    if (!timer && sim.q.length)
      timer = window.setInterval(() => {
        const v = sim.v;
        sim.advance(50 / SLOW);
        if (!sim.q.length) {
          clearInterval(timer);
          timer = 0;
        }
        // Most 50 ms ticks only move the clock; re-render only when the simulation changed.
        if (sim.v !== v || !timer) render();
      }, 50);
    render();
  }

  // First visitor action: from now on the engineer status line is announced (§6.6).
  function acted(): void {
    clearTimeout(auto);
    statusEl.setAttribute("aria-live", "polite");
  }

  function flashHint(t: string): void {
    ui.hint = t;
    render();
    clearTimeout(hintT);
    hintT = window.setTimeout(() => {
      ui.hint = "";
      render();
    }, 1800);
  }

  function send(kind: SendKind, data: Partial<Msg> = {}): void {
    acted();
    ui.userActs++;
    sim.send(kind, data);
    loop();
    // Like a chat app: your own send jumps to the newest message (bottom of a column-reverse list).
    threadEl.scrollTop = 0;
  }

  function sendText(): void {
    const text = ui.draft.trim() || (CANNED[k++ % CANNED.length] as string);
    ui.draft = "";
    input.value = "";
    send("text", { text });
  }

  function openMenu(m: Msg, how: string): void {
    acted();
    sim.openMenu(m, how);
    wantFocus = "mpin";
    render();
  }

  function closeMenu(): void {
    const id = sim.menuFor;
    sim.menuFor = null;
    wantFocus = `b${id}`;
    render();
  }

  function togglePlay(m: Msg): void {
    acted();
    clearInterval(playT);
    playT = 0;
    if (ui.playId === m.id) {
      ui.playId = null;
      render();
      return;
    }
    ui.playId = m.id;
    ui.playPos = 0;
    playT = window.setInterval(() => {
      ui.playPos += 0.25;
      if (ui.playPos >= Number(m.dur)) {
        clearInterval(playT);
        playT = 0;
        ui.playId = null;
        ui.playPos = 0;
      }
      render();
    }, 250);
    render();
  }

  const clearHold = () => {
    holdEl?.classList.remove("dm-hold");
    holdEl = null;
  };
  const msgOf = (el: Element | null) => sim.msg(Number((el as HTMLElement | null)?.dataset.id ?? NaN));

  root.addEventListener("pointerdown", (e) => {
    const b = (e.target as Element).closest<HTMLElement>(".dm-b");
    if (!b || e.button > 0) return;
    const m = msgOf(b);
    if (!m) return;
    clearTimeout(lp);
    clearHold();
    holdEl = b;
    b.classList.add("dm-hold");
    lp = window.setTimeout(() => {
      lp = 0;
      clearHold();
      ui.userActs++;
      openMenu(m, `long press ${LONG_PRESS} ms on a ${m.kind} message: actions open`);
    }, LONG_PRESS);
  });
  root.addEventListener("pointerup", (e) => {
    const b = (e.target as Element).closest<HTMLElement>(".dm-b");
    clearHold();
    if (!lp) return;
    clearTimeout(lp);
    lp = 0;
    const m = msgOf(b);
    if (m && sim.menuFor !== m.id)
      flashHint(
        m.kind === "video"
          ? "The video would open in a player. Press and hold to pin."
          : m.kind === "link"
            ? "The link would open. Press and hold to pin."
            : "Press and hold to pin, reply or react",
      );
  });
  for (const ev of ["pointerleave", "pointercancel"])
    root.addEventListener(
      ev,
      (e) => {
        if ((e.target as Element).closest?.(".dm-b") !== holdEl) return;
        clearHold();
        clearTimeout(lp);
        lp = 0;
      },
      true,
    );
  root.addEventListener("contextmenu", (e) => {
    if ((e.target as Element).closest(".dm-b")) e.preventDefault();
  });

  root.addEventListener("click", (e) => {
    const t = e.target as Element;
    const b = t.closest<HTMLElement>(".dm-b");
    if (b) {
      // Enter or Space on a bubble (detail 0) opens the same menu as a long press.
      const m = msgOf(b);
      if (e.detail === 0 && m) openMenu(m, `Enter on a ${m.kind} message: actions open`);
      return;
    }
    const el = t.closest<HTMLElement>("[data-act],[data-send],[data-chip],[data-play],[data-retry],[data-tab]");
    if (!el) return;
    const d = el.dataset;
    if (d.send) return send(d.send as SendKind);
    if (d.chip) {
      if (d.chip !== "hold") return send(d.chip as SendKind);
      const m = sim.msg(sim.starId) ?? sim.msgs.filter((x) => x.kind !== "date" && x.kind !== "system").pop();
      if (!m) return;
      ui.userActs++;
      return openMenu(m, `actions opened on #${m.seq} (on a phone: press and hold ${LONG_PRESS} ms)`);
    }
    if (d.play) return togglePlay(sim.msg(Number(d.play)) as Msg);
    if (d.retry) {
      acted();
      sim.retry(sim.msg(Number(d.retry)) as Msg);
      wantFocus = `b${d.retry}`;
      return loop();
    }
    if (d.tab) return selectTab(d.tab, true);
    const menuMsg = sim.msg(sim.menuFor);
    acted();
    switch (d.act) {
      case "pin":
      case "react":
        if (!menuMsg) return;
        wantFocus = `b${menuMsg.id}`;
        d.act === "pin" ? sim.pin(menuMsg) : sim.react(menuMsg);
        return loop();
      case "reply":
        if (!menuMsg) return;
        sim.reply(menuMsg);
        render();
        input.focus();
        return;
      case "close":
        return closeMenu();
      case "cancel-reply":
        sim.replyTo = null;
        render();
        input.focus();
        return;
      case "tray":
        sim.tray = !sim.tray;
        return render();
      case "send":
        return sendText();
      case "flaky":
        sim.toggleFlaky();
        return render();
      case "offline":
        sim.conn === "online" ? sim.goOffline() : sim.goOnline();
        return loop();
    }
  });

  root.addEventListener("keydown", (e) => {
    const menu = (e.target as Element).closest(".dm-menu");
    if (menu) {
      const items = [...menu.querySelectorAll<HTMLElement>("[role=menuitem]")];
      const i = items.indexOf(e.target as HTMLElement);
      const go = (j: number) => items[(j + items.length) % items.length]?.focus();
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        go(i + 1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        go(i - 1);
      } else if (e.key === "Home" || e.key === "End") {
        e.preventDefault();
        go(e.key === "Home" ? 0 : -1);
      }
      return;
    }
    const tab = (e.target as HTMLElement).dataset?.tab;
    if (tab && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      e.preventDefault();
      selectTab(tab === "user" ? "eng" : "user", true);
    }
  });

  input.addEventListener("input", () => {
    const v = input.value;
    if (!ui.draft && v) {
      acted();
      sim.startAction();
      sim.log("UI", "composing: draft held in memory");
    }
    if (v && Date.now() - typingAt > 3000) {
      typingAt = Date.now();
      sim.log("NET", "typing indicator sent (throttled)");
    }
    ui.draft = v;
    render();
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendText();
    }
  });

  // Under 720 px the panes become tabpanels of a two-tab tablist with shared state (§6.1).
  const tabs = [...root.querySelectorAll<HTMLElement>("[role=tab]")];
  const panes = [...root.querySelectorAll<HTMLElement>("[data-pane]")];
  function selectTab(which: string, focus = false): void {
    for (const t of tabs) {
      const on = t.dataset.tab === which;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    }
    for (const p of panes) p.dataset.hidden = String(p.dataset.pane !== which);
  }
  new ResizeObserver(([entry]) => {
    const narrow = (entry?.contentRect.width ?? 1000) <= 720;
    panes.forEach((p, i) => {
      if (narrow) {
        p.setAttribute("role", "tabpanel");
        p.setAttribute("aria-labelledby", tabs[i]?.id ?? "");
      } else {
        p.removeAttribute("role");
        p.removeAttribute("aria-labelledby");
      }
    });
  }).observe(root);

  render();
  priming = false;
  // Live mode plays one message once (§4.4), then moves only in response to the visitor.
  const auto = reduced
    ? 0
    : window.setTimeout(() => {
        sim.send("text", { text: CANNED[k++] as string });
        loop();
      }, 1500);
}
