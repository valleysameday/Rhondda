// index/js/ai/ui-banner.js
export function showBanner(text) {
  const b = document.createElement("div");
  b.className = "ai-banner";
  b.textContent = text;

  document.body.prepend(b);
  setTimeout(() => b.remove(), 6000);
}
