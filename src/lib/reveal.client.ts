// First-view motion (§13.2, §13.5): the one IntersectionObserver for the section-head rule, the
// rolling figures, the About route and the case-study cover plates. Elements opt in with [data-io].
// Each gets `io-wait` while off-screen and `io-in` once it enters; CSS keys the animations off those.
// With no JS, or under reduced motion, neither class is set and everything is simply drawn.
if (!matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const t = e.target;
        // Start from the waiting state even when already on screen, so first view still animates.
        t.classList.add("io-wait");
        if (e.isIntersecting) {
          void (t as HTMLElement).offsetWidth;
          t.classList.replace("io-wait", "io-in");
          io.unobserve(t);
        }
      }
    },
    { rootMargin: "0px 0px -10% 0px" },
  );
  for (const el of document.querySelectorAll("[data-io]")) io.observe(el);
}
