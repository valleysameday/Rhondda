// index/js/admin/subscriptions.js
import { collection, doc, getDocs, query, where, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast } from "./utils.js";

export async function init({ db }) {
  await loadSubscriptions(db);
}

export async function loadSubscriptions(db) {
  const tbody = document.getElementById("adminSubscriptionsTable");
  if (!tbody) return;
  tbody.innerHTML = "";

  const snap = await getDocs(query(collection(db, "users"), where("isBusiness", "==", true)));
  for (const docSnap of snap.docs) {
    const d = docSnap.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.name || "(no name)"}</td>
      <td>${d.plan || "free"}</td>
      <td>${d.stripeStatus || "-"}</td>
      <td>${d.nextBillingDate || "-"}</td>
      <td>
        <button class="admin-btn small" data-id="${docSnap.id}" data-action="upgrade">Upgrade</button>
        <button class="admin-btn small secondary" data-id="${docSnap.id}" data-action="downgrade">Downgrade</button>
      </td>
    `;
    tbody.appendChild(tr);
  }

  tbody.addEventListener("click", async e => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const id = btn.dataset.id;
    const action = btn.dataset.action;
    const ref = doc(db, "users", id);

    try {
      if (action === "upgrade") await updateDoc(ref, { plan: "premium" });
      if (action === "downgrade") await updateDoc(ref, { plan: "free" });
      showToast("✅ Subscription updated");
      await loadSubscriptions(db);
    } catch {
      showToast("❌ Failed to update subscription", false);
    }
  });
}
