import { getFirebase } from '/index/js/firebase/init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, query, where, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { renderPostsAndStats } from '/index/js/dashboard/posts.js';
import { loadView } from '/index/js/main.js';

let auth, db;

export async function init({ auth: _auth, db: _db }) {
  auth = _auth; db = _db;

  onAuthStateChanged(auth, async user => {
    if (!user) return loadView("home");

    const q = query(collection(db, "posts"), where("userId", "==", user.uid));
    const snap = await getDocs(q);

    const stats = renderPostsAndStats("userPosts", snap,
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

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", () => {
      document.getElementById("logoutOverlay").style.display = "flex";
      signOut(auth).then(() => setTimeout(() => loadView("home"), 2000));
    });
  });
}
