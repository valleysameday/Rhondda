// index/js/admin/subscriptions.js
import { collection, doc, getDocs, query, where, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast } from "./utils.js";

let db;

export async function init({ db: d }) {
  db = d;
  console.log("🔹 Subscriptions module init");
  await loadSubscriptions();
}

export async function loadSubscriptions() {
  const tbody = document.getElementById("adminSubscriptionsTable");
  if (!tbody) {
    console.warn("⚠️ Subscriptions table element not found");
    return;
  }

  tbody.innerHTML = "";

  try {
    const snap = await getDocs(query(collection(db, "users"), where("isBusiness", "==", true)));
    console.log(`🔹 Loaded ${snap.size} business users for subscriptions`);

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
  } catch (err) {
    console.error("❌ Failed to load subscriptions", err);
    showToast("❌ Failed to load subscriptions", false);
    return;
  }

  // Handle button clicks for upgrade/downgrade
  tbody.addEventListener("click", async e => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const id = btn.dataset.id;
    const action = btn.dataset.action;
    const ref = doc(db, "users", id);

    try {
      if (action === "upgrade") {
        await updateDoc(ref, { plan: "premium" });
        console.log(`✅ User ${id} upgraded to premium`);
        showToast("✅ Subscription upgraded");
      }
      if (action === "downgrade") {
        await updateDoc(ref, { plan: "free" });
        console.log(`✅ User ${id} downgraded to free`);
        showToast("✅ Subscription downgraded");
      }

      // Refresh table after action
      await loadSubscriptions();
    } catch (err) {
      console.error(`❌ Failed to ${action} subscription for user ${id}`, err);
      showToast(`❌ Failed to ${action} subscription`, false);
    }
  });

  console.log("🔹 Subscriptions module loaded successfully");
}
