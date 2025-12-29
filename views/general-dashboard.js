// views/general-dashboard.js

import { signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  collection, query, where, getDocs, doc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { renderPostsAndStats } from '/index/js/dashboard/posts.js';
import { loadView } from '/index/js/main.js';

let auth, db;

export async function init({ auth: _auth, db: _db }) {
  auth = _auth;
  db = _db;

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
  try {
    document.getElementById("logoutOverlay").style.display = "flex";

    // 1. Sign out from Firebase
    await signOut(auth);

    // 2. Clear any cached user/session data
    sessionStorage.clear();
    localStorage.removeItem("firebaseUserDoc");
    localStorage.removeItem("rhonddaThanksShown");

    // 3. Hard redirect to fully reset the SPA
    window.location.href = "/";
  } catch (err) {
    console.error("Logout failed:", err);
    alert("Could not log out. Please try again.");
  }
};
}
