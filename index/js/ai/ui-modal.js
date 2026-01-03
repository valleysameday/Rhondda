// index/js/ai/ui-modal.js
export function showModal(text, actions = []) {
  const m = document.createElement("div");
  m.className = "ai-modal";
  m.innerHTML = `
    <div class="ai-modal-box">
      <p>${text}</p>
      <div class="ai-actions"></div>
    </div>
  `;

  const actionsEl = m.querySelector(".ai-actions");

  actions.forEach(a => {
    const btn = document.createElement("button");
    btn.textContent = a.label;
    btn.onclick = () => m.remove();
    actionsEl.appendChild(btn);
  });

  document.body.appendChild(m);
}
