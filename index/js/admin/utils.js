// index/js/admin/utils.js
export function showToast(message, success = true) {
  const toast = document.createElement("div");
  toast.className = `admin-toast ${success ? "success" : "error"}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// optional helper to format Firestore timestamps
export function formatDate(ts) {
  return ts?.toDate ? ts.toDate().toLocaleString() : "Unknown";
}
