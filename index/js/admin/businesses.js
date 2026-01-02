// index/js/admin/businesses.js
import { collection, doc, getDocs, query, where, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast } from "./utils.js";

let db;

export async function init({ db: d }) {
  db = d;
  console.log("🔹 Businesses module init");
  await loadBusinesses();
}

export async function loadBusinesses() {
  const tbody = document.getElementById("adminBusinessesTable");
  if (!tbody) {
    console.error("❌ Businesses module: #adminBusinessesTable not found in DOM");
    return;
  }

  tbody.innerHTML = "";
  console.log("🔹 Loading businesses from Firestore...");

  try {
    const snap = await getDocs(query(collection(db, "users"), where("isBusiness", "==", true)));
    console.log(`🔹 Found ${snap.size} business users`);

    for (const docSnap of snap.docs) {
      const d = docSnap.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${d.name || "(no name)"}</td>
        <td>${d.area || "-"}</td>
        <td>${d.followersCount || 0}</td>
        <td>${d.adsCount || 0}</td>
        <td>${d.plan || "free"}</td>
        <td>${d.suspended ? "Suspended" : "Active"}</td>
        <td>
          <button class="admin-btn small" data-id="${docSnap.id}" data-action="upgrade">Upgrade</button>
          <button class="admin-btn small secondary" data-id="${docSnap.id}" data-action="downgrade">Downgrade</button>
          <button class="admin-btn small danger" data-id="${docSnap.id}" data-action="toggleSuspend">
            ${d.suspended ? "Unsuspend" : "Suspend"}
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    }

    console.log("✅ Businesses table rendered successfully");
  } catch (err) {
    console.error("❌ Failed to load businesses:", err);
    showToast("❌ Failed to load businesses", false);
  }

  // Attach click listener once
  if (!tbody._listenerAttached) {
    tbody.addEventListener("click", async e => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;

      const id = btn.dataset.id;
      const action = btn.dataset.action;
      const ref = doc(db, "users", id);

      console.log(`🔹 Button clicked: action=${action}, userId=${id}`);

      try {
        if (action === "upgrade") {
          await updateDoc(ref, { plan: "premium" });
          console.log(`✅ Upgraded user ${id} to premium`);
        }
        if (action === "downgrade") {
          await updateDoc(ref, { plan: "free" });
          console.log(`✅ Downgraded user ${id} to free`);
        }
        if (action === "toggleSuspend") {
          const snap = await getDoc(ref);
          const suspended = snap.data().suspended;
          await updateDoc(ref, { suspended: !suspended });
          console.log(`✅ User ${id} suspended state toggled: ${!suspended}`);
        }

        showToast("✅ Action applied successfully");
        await loadBusinesses();
      } catch (err) {
        console.error("❌ Action failed:", err);
        showToast("❌ Action failed", false);
      }
    });

    tbody._listenerAttached = true;
  }
}
