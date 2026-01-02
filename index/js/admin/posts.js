// index/js/admin/posts.js
import { collection, doc, getDocs, query, orderBy, limit, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast } from "/index/js/admin/utils.js";

let db;

export async function init({ db: d }) {
  db = d;
  console.log("🔹 Posts module init");
  await loadPostsAndReports();
}

export async function loadPostsAndReports() {
  const postsTbody = document.getElementById("adminPostsTable");
  const reportsTbody = document.getElementById("adminReportsTable");

  if (!postsTbody || !reportsTbody) {
    console.error("❌ Posts module: Table elements not found in DOM");
    return;
  }

  postsTbody.innerHTML = "";
  reportsTbody.innerHTML = "";

  console.log("🔹 Loading posts from Firestore...");
  try {
    const postsSnap = await getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(200)));
    console.log(`✅ ${postsSnap.size} posts fetched`);

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
  } catch (err) {
    console.error("❌ Failed to load posts", err);
    showToast("❌ Failed to load posts", false);
  }

  postsTbody.addEventListener("click", async e => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const id = btn.dataset.id;
    if (btn.dataset.action === "deletePost") {
      if (!confirm("Delete this post?")) return;
      try {
        await deleteDoc(doc(db, "posts", id));
        console.log(`✅ Post ${id} deleted`);
        showToast("✅ Post deleted");
        await loadPostsAndReports();
      } catch (err) {
        console.error(`❌ Failed to delete post ${id}`, err);
        showToast("❌ Failed to delete post", false);
      }
    }
  });

  console.log("🔹 Loading reports from Firestore...");
  try {
    const reportsSnap = await getDocs(query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(200)));
    console.log(`✅ ${reportsSnap.size} reports fetched`);

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
  } catch (err) {
    console.error("❌ Failed to load reports", err);
    showToast("❌ Failed to load reports", false);
  }

  reportsTbody.addEventListener("click", async e => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const id = btn.dataset.id;
    const action = btn.dataset.action;
    const ref = doc(db, "reports", id);

    try {
      if (action === "resolve") {
        await updateDoc(ref, { status: "resolved" });
        console.log(`✅ Report ${id} resolved`);
      }
      if (action === "dismiss") {
        await updateDoc(ref, { status: "dismissed" });
        console.log(`✅ Report ${id} dismissed`);
      }
      showToast("✅ Report updated");
      await loadPostsAndReports();
    } catch (err) {
      console.error(`❌ Failed to update report ${id}`, err);
      showToast("❌ Failed to update report", false);
    }
  });
}
