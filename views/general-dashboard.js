import { signOut } from
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
  collection, query, where, getDocs, doc, deleteDoc, onSnapshot
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

  // ============================
  // LOAD USER POSTS
  // ============================
  const snap = await getDocs(
    query(collection(db, "posts"), where("userId", "==", user.uid))
  );

  const stats = renderPostsAndStats(
    "userPosts",
    snap,
    id => {
      window.editingPostId = id;
      loadView("editPost");
    },
    async id => {
      if (!confirm("Delete this ad?")) return;
      await deleteDoc(doc(db, "posts", id));
      loadView("general-dashboard");
    }
  );

  document.getElementById("statAdsCount").textContent = stats.adsCount;
  document.getElementById("statTotalViews").textContent = stats.totalViews;
  document.getElementById("statUnlocks").textContent = stats.totalLeads;

  // ============================
  // LOGOUT
  // ============================
  document.getElementById("logoutBtn").onclick = async () => {
    document.getElementById("logoutOverlay").style.display = "flex";
    await signOut(auth);
    window.location.href = "/";
  };

  // ============================
  // ⭐ UNREAD MESSAGE BADGE LISTENER
  // ============================
  initUnreadMessageListener();
  

  // ============================
  // FUNCTION: UNREAD LISTENER
  // ============================
  function initUnreadMessageListener() {
    const badge = document.getElementById("messageBadge");
    if (!badge) return;

    const convosRef = collection(db, "conversations");
    const q = query(convosRef, where("participants", "array-contains", user.uid));

    onSnapshot(q, (snap) => {
      let hasUnread = false;

      snap.forEach(docSnap => {
        const convo = docSnap.data();

        // If last message exists AND was sent by the other user → unread
        if (convo.lastMessageSender && convo.lastMessageSender !== user.uid) {
          hasUnread = true;
        }
      });

      badge.style.display = hasUnread ? "block" : "none";
    });
  }
}
