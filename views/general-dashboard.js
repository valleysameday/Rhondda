import { signOut } from
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
  collection, query, where, getDocs, doc, deleteDoc
} from
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { renderPostsAndStats } from '/index/js/dashboard/posts.js';
import { loadView } from '/index/js/main.js';

let auth, db;

export async function init({ auth: a, db: d }) {
  auth = a;
  db = d;

  if (!auth || !db) return;

  const user = auth.currentUser;
  if (!user) return loadView("home");

  const snap = await getDocs(
    query(collection(db, "posts"), where("userId", "==", user.uid))
  );

  const stats = renderPostsAndStats(
    "userPosts",
    snap,
    id => openScreen("editPost"),
    async id => {
      if (!confirm("Delete this ad?")) return;
      await deleteDoc(doc(db, "posts", id));
      loadView("general-dashboard");
    }
  );

  document.getElementById("statAdsCount").textContent = stats.adsCount;
  document.getElementById("statTotalViews").textContent = stats.totalViews;
  document.getElementById("statUnlocks").textContent = stats.totalLeads;

  document.getElementById("logoutBtn").onclick = async () => {
    document.getElementById("logoutOverlay").style.display = "flex";
    await signOut(auth);
    window.location.href = "/";
  };
}
