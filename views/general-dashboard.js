import { signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
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

import { renderPostsAndStats } from "/index/js/dashboard/posts.js";
import { loadView } from "/index/js/main.js";
import { BADGE_SVGS, computeBadges } from "/views/seller-badges.js";
let auth, db;

async function loadUserBadges(uid) {
  const snap = await getDocs(collection(db, "users", uid, "badges"));
  return snap.docs.map(doc => doc.id);
}
async function unlockBadge(uid, badgeKey) {
  await setDoc(doc(db, "users", uid, "badges", badgeKey), {
    earnedAt: Date.now()
  });
}
function renderDashboardBadges(finalBadges) {
  const container = document.getElementById("dashboardBadges");
  if (!container) return;

  container.innerHTML = Object.entries(finalBadges)
    .map(([key, earned]) => `
      <div class="dash-badge ${earned ? "earned" : "locked"}" data-badge="${key}">
        ${BADGE_SVGS[key]}
        <span class="badge-tooltip">${earned ? "Unlocked!" : "How to unlock: " + key}</span>
      </div>
    `)
    .join("");
}
export async function init({ auth: a, db: d }) {
  auth = a;
  db = d;

  if (!auth || !db) return;

  const user = auth.currentUser;
  // ============================================================
// ⭐ LOAD USER PROFILE + STATS FOR BADGES
// ============================================================
const userSnap = await getDoc(doc(db, "users", user.uid));
const userData = userSnap.data() || {};

const stats = {
  completedJobs: userData.completedJobs || 0,
  avgReplyTime: userData.avgReplyTime || 999,
  communityEvents: userData.communityEvents || 0,
  lastActiveHour: userData.lastActiveHour ?? 12,
  loginStreak: userData.loginStreak || 0,
  freebieClicks: userData.freebieClicks || 0,
  firstInCategory: userData.firstInCategory || false,
  helpfulAnswers: userData.helpfulAnswers || 0,
  accountAgeYears: userData.accountAgeYears || 0
};

// 1. Compute which badges the user SHOULD have
const computed = computeBadges(userData, stats);

// 2. Load badges already earned from Firestore
const earned = await loadUserBadges(user.uid);

// 3. Merge them (earned badges stay unlocked forever)
const finalBadges = {};
for (const key in computed) {
  finalBadges[key] = computed[key] || earned.includes(key);
}

// 4. Save newly unlocked badges
for (const key in computed) {
  if (computed[key] && !earned.includes(key)) {
    await unlockBadge(user.uid, key);
  }
}

// 5. Render badges into dashboard
renderDashboardBadges(finalBadges);
  if (!user) return loadView("home");

  // ============================================================
  // LOAD USER POSTS (with 3‑ad limit)
  // ============================================================
  const snap = await getDocs(
    query(collection(db, "posts"), where("userId", "==", user.uid))
  );

  const adsCount = snap.size;
  document.getElementById("statAdsCount").textContent = adsCount;

  // Render posts normally
  renderPostsAndStats(
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

  // ============================================================
  // ⭐ LIMIT POSTING FOR GENERAL USERS
  // ============================================================
  const newPostBtn = document.getElementById("newPostBtn");

  newPostBtn.onclick = () => {
    if (adsCount >= 3) {
      alert(
        "You’ve reached your 3 free ads.\n\nBecome a business to post unlimited ads, get analytics, and build followers!"
      );
      return;
    }

    window.openScreen("post");
  };

  // ============================================================
  // ⭐ LOAD SAVED ADS
  // ============================================================
  await loadSavedPosts(user.uid);

  // ============================================================
  // ⭐ LOAD FOLLOW FEED
  // ============================================================
  await loadFollowFeed(user.uid);

  async function loadFollowFeed(uid) {
    const container = document.getElementById("followFeed");
    if (!container) return;

    container.innerHTML = `<p style="opacity:0.6;">Loading updates...</p>`;

    // 1. Get sellers the user follows
    const followingSnap = await getDocs(collection(db, "users", uid, "following"));
    const sellerIds = followingSnap.docs.map(doc => doc.id);

    if (sellerIds.length === 0) {
      container.innerHTML = `<p style="opacity:0.6;">Follow sellers and businesses to see their new posts here.</p>`;
      return;
    }

    // 2. Load posts from followed sellers
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
    container.innerHTML = posts
      .map(
        post => `
      <div class="follow-update-card">
        <img src="${post.imageUrl || post.imageUrls?.[0] || '/images/image-webholder.webp'}">
        <div>
          <h4>${post.title}</h4>
          <p>${new Date(post.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
    `
      )
      .join("");

    // 5. Click to view
    container.querySelectorAll(".follow-update-card").forEach((card, i) => {
      card.onclick = () => {
        sessionStorage.setItem("viewPostId", posts[i].id);
        loadView("view-post", { forceInit: true });
      };
    });
  }

  // ============================================================
  // LOGOUT
  // ============================================================
  document.getElementById("logoutBtn").onclick = async () => {
    document.getElementById("logoutOverlay").style.display = "flex";
    await signOut(auth);
    window.location.href = "/";
  };

  // ============================================================
  // ⭐ UNREAD MESSAGE BADGE LISTENER
  // ============================================================
  initUnreadMessageListener();

  function initUnreadMessageListener() {
    const badge = document.getElementById("messageBadge");
    if (!badge) return;

    const convosRef = collection(db, "conversations");
    const q = query(convosRef, where("participants", "array-contains", user.uid));

    onSnapshot(q, snap => {
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
   ⭐ LOAD SAVED POSTS
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
