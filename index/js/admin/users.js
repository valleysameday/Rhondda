// index/js/admin/users.js
import { collection, doc, getDocs, getDoc, updateDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast, formatDate } from "/index/js/admin/utils.js";

export async function init({ db }) {
  console.log("🔹 Users module init");
  await loadUsers(db);
}

/**
 * Load users table and attach click handlers
 */
export async function loadUsers(db) {
  const tbody = document.getElementById("adminUsersTable");
  if (!tbody) {
    console.warn("⚠️ Users table not found in DOM");
    return;
  }
  tbody.innerHTML = "";

  try {
    const snap = await getDocs(collection(db, "users"));
    console.log(`🔹 Loaded ${snap.size} users`);

    for (const docSnap of snap.docs) {
      const d = docSnap.data();
      const uid = docSnap.id;
      const type = d.isAdmin ? "Admin" : d.isBusiness ? "Business" : "User";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${d.name || "(no name)"}</td>
        <td>${d.email || "-"}</td>
        <td>${type}</td>
        <td>${d.plan || "free"}</td>
        <td>${d.area || "-"}</td>
        <td>${d.followersCount || 0}</td>
        <td>${d.adsCount || 0}</td>
        <td>${d.suspended ? "Suspended" : "Active"}</td>
        <td>
          <button class="admin-btn small" data-action="view" data-id="${uid}">View</button>
          <button class="admin-btn small secondary" data-action="toggleSuspend" data-id="${uid}">${d.suspended ? "Unsuspend" : "Suspend"}</button>
          <button class="admin-btn small danger" data-action="deleteUser" data-id="${uid}">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    }

    // Event delegation for buttons
    tbody.addEventListener("click", async e => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;

      const uid = btn.dataset.id;
      const action = btn.dataset.action;
      const userRef = doc(db, "users", uid);

      console.log(`🔹 User action: ${action} on ${uid}`);

      try {
        if (action === "toggleSuspend") {
          const snap = await getDoc(userRef);
          await updateDoc(userRef, { suspended: !snap.data().suspended });
          showToast("✅ User status updated");
          console.log(`🔹 User ${uid} suspended status toggled`);
          return loadUsers(db);
        }

        if (action === "deleteUser") {
          if (!confirm("Delete this user and ALL their data?")) return;
          await deleteUserAndData(uid, db);
          showToast("✅ User deleted");
          console.log(`🔹 User ${uid} deleted`);
          return loadUsers(db);
        }

        if (action === "view") {
          openUserModal(uid, db);
        }
      } catch (err) {
        console.error(`❌ Failed action ${action} for user ${uid}`, err);
        showToast(`❌ Failed action ${action}`, false);
      }
    });
  } catch (err) {
    console.error("❌ Failed to load users", err);
    showToast("❌ Failed to load users", false);
  }
}

/**
 * Delete user and associated data
 */
async function deleteUserAndData(uid, db) {
  try {
    // Delete posts
    const postsSnap = await getDocs(query(collection(db, "posts"), where("userId", "==", uid)));
    for (const p of postsSnap.docs) await deleteDoc(doc(db, "posts", p.id));

    // Delete followers
    const followersSnap = await getDocs(collection(db, "users", uid, "followers"));
    for (const f of followersSnap.docs) await deleteDoc(doc(db, "users", uid, "followers", f.id));

    // Delete user doc
    await deleteDoc(doc(db, "users", uid));
    console.warn("⚠️ Firebase Auth deletion must be done via Admin SDK or Cloud Function");
  } catch (err) {
    console.error(`❌ Failed to delete user ${uid} data`, err);
    showToast("❌ Failed to delete user data", false);
  }
}

/**
 * Open modal to view user details
 */
export async function openUserModal(uid, db) {
  const modal = document.getElementById("adminUserModal");
  const body = document.getElementById("adminUserModalBody");
  if (!modal || !body) {
    console.warn("⚠️ User modal elements not found");
    return;
  }

  try {
    const snap = await getDoc(doc(db, "users", uid));
    const d = snap.data();
    if (!d) throw new Error("User data not found");

    console.log(`🔹 Viewing user ${uid}`);

    body.innerHTML = `
      <h3>${d.name || "(no name)"}</h3>
      <p><strong>Email:</strong> ${d.email || "-"}</p>
      <p><strong>Type:</strong> ${d.isAdmin ? "Admin" : d.isBusiness ? "Business" : "User"}</p>
      <p><strong>Plan:</strong> ${d.plan || "free"}</p>
      <p><strong>Status:</strong> ${d.suspended ? "Suspended" : "Active"}</p>
      <hr>
      <p><strong>Area:</strong> ${d.area || "-"}</p>
      <p><strong>Followers:</strong> ${d.followersCount || 0}</p>
      <p><strong>Ads:</strong> ${d.adsCount || 0}</p>
      <hr>
      <p><strong>Created At:</strong> ${formatDate(d.createdAt)}</p>
      <p><strong>Last Login:</strong> ${formatDate(d.lastLogin)}</p>
      <hr>
      <h4>User JSON</h4>
      <pre style="background:#f3f4f6;padding:10px;border-radius:6px;max-height:200px;overflow:auto;">${JSON.stringify(d, null, 2)}</pre>
      <button id="adminCloseUserModal" class="admin-btn secondary" style="margin-top:10px;">Close</button>
    `;

    modal.style.display = "flex";
    document.getElementById("adminCloseUserModal").onclick = () => (modal.style.display = "none");
    modal.onclick = e => { if (e.target === modal) modal.style.display = "none"; };

    console.log("✅ User modal displayed");
  } catch (err) {
    console.error(`❌ Failed to open user modal for ${uid}`, err);
    showToast("❌ Failed to open user modal", false);
  }
}
