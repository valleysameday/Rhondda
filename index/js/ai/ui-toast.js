// index/js/ai/ui-toast.js
export function showToast(text) {
  const t = document.createElement("div");
  t.className = "ai-toast";
  t.textContent = text;

  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}
