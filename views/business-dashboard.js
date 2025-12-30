import { signOut } from
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
  doc, getDoc, updateDoc,
  collection, query, where, getDocs, deleteDoc, onSnapshot
} from
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import {
  ref, uploadBytes, getDownloadURL, deleteObject
} from
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

import { renderPostsAndStats } from '/index/js/dashboard/posts.js';
import { loadView } from '/index/js/main.js';

let auth, db, storage;

export async function init({ auth: a, db: d, storage: s }) {
  auth = a;
  db = d;
  storage = s;

  if (!auth || !db) return;

  const user = auth.currentUser;
  if (!user) return loadView("home");

  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists() || !snap.data().isBusiness) {
    return loadView("general-dashboard");
  }

  const data = snap.data();

  document.getElementById("bizHeaderName").textContent =
    data.name || "Your Business";

  document.getElementById("bizHeaderTagline").textContent =
    data.name
      ? "Manage your ads, brand, and customers"
      : "Set up your business profile";

  document.getElementById("bizViewName").textContent = data.name || "Add name";
  document.getElementById("bizViewPhone").textContent = data.phone || "Add phone";
  document.getElementById("bizViewArea").textContent = data.area || "Add area";
  document.getElementById("bizViewWebsite").textContent = data.website || "Add website";
  document.getElementById("bizViewBio").textContent = data.bio || "Add bio";

  if (data.avatarUrl) {
    document.getElementById("bizDashboardAvatar").style.backgroundImage =
      `url('${data.avatarUrl}')`;
  }

  const postsSnap = await getDocs(
    query(collection(db, "posts"), where("businessId", "==", user.uid))
  );

  const stats = renderPostsAndStats(
    "bizPosts",
    postsSnap,
    id => {
      window.editingPostId = id;
      loadView("editPost");
    },
    async id => {
      if (!confirm("Delete this ad?")) return;

      const pSnap = await getDoc(doc(db, "posts", id));
      const post = pSnap.data();

      const urls = post.imageUrls || (post.imageUrl ? [post.imageUrl] : []);
      for (const url of urls) {
        const path = decodeURIComponent(url.split("/o/")[1].split("?")[0]);
        await deleteObject(ref(storage, path));
      }

      await deleteDoc(doc(db, "posts", id));
      loadView("business-dashboard");
    }
  );

  document.getElementById("bizStatAdsCount").textContent = stats.adsCount;
  document.getElementById("bizStatTotalViews").textContent = stats.totalViews;
  document.getElementById("bizStatLeads").textContent = stats.totalLeads;

  document.getElementById("bizLogoutBtn").onclick = async () => {
    document.getElementById("bizLogoutOverlay").style.display = "flex";
    await signOut(auth);
    window.location.href = "/";
  };

  document.getElementById("bizNewPostBtn").onclick =
    () => openScreen("post");

  // ============================================================
  // ⭐ UNREAD MESSAGE BADGE LISTENER
  // ============================================================
  initUnreadMessageListener();


  // ============================================================
  // FUNCTION: UNREAD LISTENER
  // ============================================================
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
