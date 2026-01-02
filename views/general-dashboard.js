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
  orderBy,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { renderPostsAndStats } from "/index/js/dashboard/posts.js";
import { loadView } from "/index/js/main.js";

let auth, db;

export async function init({ auth: a, db: d }) {
  auth = a;
  db = d;

  if (!auth || !db) return;

  const user = auth.currentUser;
  if (!user) return loadView("home");

  // ============================================================
  // LOAD USER + PLATFORM SETTINGS
  // ============================================================
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.data() || {};

  const settingsRef = doc(db, "settings", "platform");
  const settingsSnap = await getDoc(settingsRef);
  const settingsData = settingsSnap.exists() ? settingsSnap.data() : {};

  const accountType = userData.accountType || "general";
  const upgradeEnabled = settingsData.upgradeEnabled === true;

  // Update header name if you want
  const headerNameEl = document.getElementById("headerName");
  if (headerNameEl && userData.name) {
    headerNameEl.textContent = userData.name;
  }

  // ============================================================
  // APPLY ACCOUNT TYPE RULES
  // ============================================================
  const plansSection = document.getElementById("plansSection");
  const upgradeHint = document.getElementById("upgradeHint");
  const newPostTag = document.getElementById("newPostTag");

  if (accountType === "general") {
    // 3 ad limit, no followers, no analytics
    if (newPostTag) newPostTag.textContent = "3 FREE";

    if (upgradeEnabled) {
      if (plansSection) plansSection.style.display = "block";
      if (upgradeHint) upgradeHint.style.display = "block";
    } else {
      if (plansSection) plansSection.style.display = "none";
      if (upgradeHint) upgradeHint.style.display = "none";
    }
  }

  if (accountType === "sellerPlus") {
    // Unlimited ads, followers, follow feed
    if (newPostTag) newPostTag.textContent = "Unlimited";
    if (plansSection) plansSection.style.display = upgradeEnabled ? "block" : "none";
    if (upgradeHint) upgradeHint.style.display = upgradeEnabled ? "block" : "none";

    // Mark Seller+ as current plan
    const sellerBtn = document.getElementById("chooseSellerPlus");
    if (sellerBtn) {
      sellerBtn.textContent = "Current plan";
      sellerBtn.disabled = true;
      sellerBtn.classList.add("disabled");
    }
  }

  if (accountType === "business") {
    // Unlimited ads, business features
    if (newPostTag) newPostTag.textContent = "Unlimited";
    if (plansSection) plansSection.style.display = upgradeEnabled ? "block" : "none";
    if (upgradeHint) upgradeHint.style.display = upgradeEnabled ? "block" : "none";

    const businessBtn = document.getElementById("chooseBusiness");
    if (businessBtn) {
      businessBtn.textContent = "Current plan";
      businessBtn.disabled = true;
      businessBtn.classList.add("disabled");
    }
  }

  // Scroll to plans when clicking hint
  const scrollToPlans = document.getElementById("scrollToPlans");
  if (scrollToPlans && plansSection) {
    scrollToPlans.onclick = () => {
      plansSection.scrollIntoView({ behavior: "smooth" });
    };
  }

  // ============================================================
  // PLAN UPGRADE BUTTONS (30-DAY TRIAL)
  // ============================================================
  const sellerPlusBtn = document.getElementById("chooseSellerPlus");
  const businessBtn = document.getElementById("chooseBusiness");

  if (sellerPlusBtn) {
    sellerPlusBtn.onclick = async () => {
      await setDoc(userRef, {
        accountType: "sellerPlus",
        trial: {
          plan: "sellerPlus",
          startedAt: Date.now(),
          active: true
        }
      }, { merge: true });

      alert("Your 30-day free trial for Seller+ has started!");
      loadView("general-dashboard", { forceInit: true });
    };
  }

  if (businessBtn) {
    businessBtn.onclick = async () => {
      await setDoc(userRef, {
        accountType: "business",
        trial: {
          plan: "business",
          startedAt: Date.now(),
          active: true
        }
      }, { merge: true });

      alert("Your 30-day free trial for Business has started!");
      loadView("general-dashboard", { forceInit: true });
    };
  }

  // ============================================================
  // LOAD USER POSTS (with accountType-aware limit)
  // ============================================================
  const snap = await getDocs(
    query(collection(db, "posts"), where("userId", "==", user.uid))
  );

  const adsCount = snap.size;
  const statAdsCountEl = document.getElementById("statAdsCount");
  if (statAdsCountEl) statAdsCountEl.textContent = adsCount;

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

  const newPostBtn = document.getElementById("newPostBtn");
  if (newPostBtn) {
    newPostBtn.onclick = () => {
      if (accountType === "general" && adsCount >= 3) {
        alert(
          "You’ve reached your 3 free ads.\n\nUpgrade to Seller+ or Business for unlimited ads and more."
        );
        if (upgradeEnabled && plansSection) {
          plansSection.scrollIntoView({ behavior: "smooth" });
        }
        return;
      }

      window.openScreen("post");
    };
  }

  // ============================================================
  // LOAD SAVED ADS
  // ============================================================
  await loadSavedPosts(user.uid);

  // ============================================================
  // LOAD FOLLOW FEED (you can later adapt to stories logic)
  // ============================================================
  await loadFollowFeed(user.uid);

  async function loadFollowFeed(uid) {
    const container = document.getElementById("followFeed");
    if (!container) return;

    container.innerHTML = `<p style="opacity:0.6;">Loading updates...</p>`;

    const followingSnap = await getDocs(collection(db, "users", uid, "following"));
    const sellerIds = followingSnap.docs.map(doc => doc.id);

    if (sellerIds.length === 0) {
      container.innerHTML = `<p style="opacity:0.6;">Follow sellers and businesses to see their new posts here.</p>`;
      return;
    }

    let posts = [];

    for (const sellerId of sellerIds) {
      const q = query(
        collection(db, "posts"),
        where("userId", "==", sellerId),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(q);
      const latest = snap.docs[0];
      if (!latest) continue;

      const data = latest.data();
      const createdAt = data.createdAt || 0;
      const now = Date.now();
      const hoursDiff = (now - createdAt) / (1000 * 60 * 60);

      if (hoursDiff <= 48) {
        posts.push({ id: latest.id, ...data });
      }
    }

    if (posts.length === 0) {
      container.innerHTML = `<p style="opacity:0.6;">No fresh updates from sellers you follow.</p>`;
      return;
    }

    posts.sort((a, b) => b.createdAt - a.createdAt);

    container.innerHTML = posts
      .map(
        post => `
        <div class="story-card">
          <img src="${post.imageUrl || post.imageUrls?.[0] || '/images/image-webholder.webp'}">
          <div class="story-info">
            <p class="story-title">${post.title || "New post"}</p>
            <p class="story-time">${timeAgo(post.createdAt)}</p>
          </div>
        </div>
      `
      )
      .join("");

    container.querySelectorAll(".story-card").forEach((card, i) => {
      card.onclick = () => {
        sessionStorage.setItem("viewPostId", posts[i].id);
        loadView("view-post", { forceInit: true });
      };
    });
  }

  function timeAgo(timestamp) {
    if (!timestamp) return "";
    const diffMs = Date.now() - timestamp;
    const diffH = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffH < 1) return "Just now";
    if (diffH === 1) return "1 hour ago";
    if (diffH < 24) return `${diffH} hours ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1) return "1 day ago";
    return `${diffD} days ago`;
  }

  // ============================================================
  // LOGOUT
  // ============================================================
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      document.getElementById("logoutOverlay").style.display = "flex";
      await signOut(auth);
      window.location.href = "/";
    };
  }

  // ============================================================
  // UNREAD MESSAGE BADGE LISTENER
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
   LOAD SAVED POSTS
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

  const statSavedCountEl = document.getElementById("statSavedCount");
  if (statSavedCountEl) statSavedCountEl.textContent = posts.length;

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
