// index/js/admin/utils.js
export function showToast(msg, success = true) {
  console.log("[Toast]", msg); // log to console for debugging
  const t = document.createElement("div");
  t.textContent = msg;
  t.style.cssText = `
    position:fixed;
    bottom:20px;
    left:50%;
    transform:translateX(-50%);
    background:${success ? "#10b981" : "#ef4444"};
    color:white;
    padding:10px 20px;
    border-radius:6px;
    z-index:10000;
    font-size:14px;
  `;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

export function formatDate(firestoreTimestamp) {
  if (!firestoreTimestamp?.toDate) return "Unknown";
  return firestoreTimestamp.toDate().toLocaleString();
}
