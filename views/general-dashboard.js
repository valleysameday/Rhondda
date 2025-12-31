import { signOut } from
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
  onSnapshot,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
  // ⭐ LOAD FOLLOWERS COUNT
  // ============================
  loadMyFollowers(user.uid);

  async function loadMyFollowers(uid) {
    const snap = await getDocs(collection(db, "users", uid, "followers"));
    const count = snap.size;

    const el = document.getElementById("statFollowers");
    if (el) el.textContent = count;
  }

  // ============================
  // ⭐ LOAD SAVED ADS
  // ============================
  await loadSavedPosts(user.uid);

  // ============================
  // ⭐ LOAD FOLLOW FEED (Option C)
  // ============================
  await loadFollowFeed(user.uid);

  async function loadFollowFeed(uid) {
    const container = document.getElementById("followFeed");
    if (!container) return;

    container.innerHTML = `<p style="opacity:0.6;">Loading updates...</p>`;

    // 1. Get sellers the user follows
    const followingSnap = await getDocs(collection(db, "users", uid, "following"));
    const sellerIds = followingSnap.docs.map(doc => doc.id);

    if (sellerIds.length === 0) {
      container.innerHTML = `<p style="opacity:0.6;">You’re not following any sellers yet.</p>`;
      return;
    }

    // 2. Load posts from those sellers
    let posts = [];

    for (const sellerId of sellerIds) {
      const q = query(
        collection(db, "posts"),
        where("userId", "==", sellerId),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(q);
      snap.forEach(docSnap => {
        posts.push({ id: docSnap.id, ...docSnap.data() });
      });
    }

    if (posts.length === 0) {
      container.innerHTML = `<p style="opacity:0.6;">No new posts from sellers you follow.</p>`;
      return;
    }

    // 3. Sort newest first
    posts.sort((a, b) => b.createdAt - a.createdAt);

    // 4. Render
    container.innerHTML = posts.map(post => `
      <div class="follow-update-card">
        <img src="${post.imageUrl || post.imageUrls?.[0] || '/images/image-webholder.webp'}">
        <div>
          <h4>${post.title}</h4>
          <p>${new Date(post.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
    `).join("");

    // 5. Click to view
    container.querySelectorAll(".follow-update-card").forEach((card, i) => {
      card.onclick = () => {
        sessionStorage.setItem("viewPostId", posts[i].id);
        loadView("view-post", { forceInit: true });
      };
    });
  }

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

  function initUnreadMessageListener() {
    const badge = document.getElementById("messageBadge");
    if (!badge) return;

    const convosRef = collection(db, "conversations");
    const q = query(convosRef, where("participants", "array-contains", user.uid));

    onSnapshot(q, (snap) => {
      let hasUnread = false;

      snap.forEach(docSnap => {
        const convo = docSnap.data();

        if (convo.lastMessageSender && convo.lastMessageSender !== user.uid) {
          hasUnread = true;
        }
      });

      badge.style.display = hasUnread ? "block" : "none";
    });
  }
}

/* ============================================================
   ⭐ LOAD SAVED POSTS FUNCTION
============================================================ */
async function loadSavedPosts(uid) {
  const savedContainer = document.getElementById("savedPosts");
  if (!savedContainer) return;

  savedContainer.innerHTML = `<p style="opacity:0.6;">Loading saved ads...</p>`;

  const savedRef = collection(db, "users", uid, "savedPosts");
  const savedSnap = await getDocs(savedRef);

  const posts = [];

  for (let saved of savedSnap.docs) {
    const postId = saved.id;
    const postSnap = await getDoc(doc(db, "posts", postId));

    if (!postSnap.exists() || postSnap.data().isSold === true) {
      await deleteDoc(doc(db, "users", uid, "savedPosts", postId));
      continue;
    }

    posts.push({ id: postId, ...postSnap.data() });
  }

  if (posts.length === 0) {
    savedContainer.innerHTML = `<p style="opacity:0.6;">No saved ads yet.</p>`;
    return;
  }

  savedContainer.innerHTML = "";

  posts.forEach(post => {
    const card = document.createElement("div");
    card.className = "dash-post-card";
    card.innerHTML = `
      <img src="${post.images?.[0] || '/images/image-webholder.webp'}" class="dash-post-img">
      <div class="dash-post-info">
        <h3>${post.title}</h3>
        <p>${post.price ? "£" + post.price : "Contact for price"}</p>
      </div>
    `;
    card.onclick = () => {
      sessionStorage.setItem("viewPostId", post.id);
      loadView("view-post", { forceInit: true });
    };
    savedContainer.appendChild(card);
  });
}
