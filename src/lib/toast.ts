// Bottom-centre toast, role="status", 2.6 s (§5.15).
let timer: ReturnType<typeof setTimeout> | undefined;

export function toast(message: string): void {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
  el.removeAttribute("data-fade");
  clearTimeout(timer);
  timer = setTimeout(() => {
    el.setAttribute("data-fade", "");
    timer = setTimeout(() => {
      el.hidden = true;
      el.textContent = "";
    }, 180);
  }, 2600);
}
