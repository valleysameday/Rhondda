// index/js/admin/posts.js
import { collection, doc, getDocs, query, orderBy, limit, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast } from "./utils.js";

export async function init({ db }) {
  await loadPostsAndReports(db);
}

export async function loadPostsAndReports(db) {
  const postsTbody = document.getElementById("adminPostsTable");
  const reportsTbody = document.getElementById("adminReportsTable");
  postsTbody.innerHTML = "";
  reportsTbody.innerHTML = "";

  // Load posts
  const postsSnap = await getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(200)));
  for (const docSnap of postsSnap.docs) {
    const d = docSnap.data();
    const created = d.createdAt?.toDate ? d.createdAt.toDate().toLocaleDateString() : "-";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.title || "Untitled"}</td>
      <td>${d.userId || "-"}</td>
      <td>${d.category || "-"}</td>
      <td>${d.views || 0}</td>
      <td>${created}</td>
      <td>
        <button class="admin-btn small danger" data-id="${docSnap.id}" data-action="deletePost">Delete</button>
      </td>
    `;
    postsTbody.appendChild(tr);
  }

  postsTbody.addEventListener("click", async e => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const id = btn.dataset.id;
    if (btn.dataset.action === "deletePost") {
      if (!confirm("Delete this post?")) return;
      try {
        await deleteDoc(doc(db, "posts", id));
        showToast("✅ Post deleted");
        await loadPostsAndReports(db);
      } catch {
        showToast("❌ Failed to delete post", false);
      }
    }
  });

  // Load reports
  const reportsSnap = await getDocs(query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(200)));
  for (const docSnap of reportsSnap.docs) {
    const d = docSnap.data();
    const created = d.createdAt?.toDate ? d.createdAt.toDate().toLocaleString() : "-";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.postId}</td>
      <td>${d.reason || "-"}</td>
      <td>${d.reportedBy || "-"}</td>
      <td>${created}</td>
      <td>${d.status || "open"}</td>
      <td>
        <button class="admin-btn small" data-id="${docSnap.id}" data-action="resolve">Resolve</button>
        <button class="admin-btn small secondary" data-id="${docSnap.id}" data-action="dismiss">Dismiss</button>
      </td>
    `;
    reportsTbody.appendChild(tr);
  }

  reportsTbody.addEventListener("click", async e => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const id = btn.dataset.id;
    const action = btn.dataset.action;
    const ref = doc(db, "reports", id);

    try {
      if (action === "resolve") await updateDoc(ref, { status: "resolved" });
      if (action === "dismiss") await updateDoc(ref, { status: "dismissed" });
      showToast("✅ Report updated");
      await loadPostsAndReports(db);
    } catch {
      showToast("❌ Failed to update report", false);
    }
  });
}
