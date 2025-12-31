import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { BADGE_SVGS, computeBadges, renderBadges } from "/views/seller-badges.js";
import { loadView } from "/index/js/main.js";

let auth, db;

export async function init({ auth: a, db: d }) {
  auth = a;
  db = d;

  const userId = sessionStorage.getItem("profileUserId");
  if (!userId) return loadView("home");

  const profileSnap = await getDoc(doc(db, "users", userId));
  if (!profileSnap.exists()) return loadView("home");

  const user = profileSnap.data();

  /* ---------------- SAFE NAME ---------------- */
  const safeName =
    user.name ||
    user.displayName ||
    user.fullName ||
    "User";

  /* ---------------- Avatar ---------------- */
  const avatar = document.getElementById("sellerAvatar");

  if (user.avatarUrl) {
    avatar.style.backgroundImage = `url(${user.avatarUrl})`;
  } else {
    const initials = safeName
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();

    avatar.textContent = initials;
  }

  /* ---------------- Name ---------------- */
  document.getElementById("sellerName").textContent = safeName;

  /* ---------------- Reliability ---------------- */
  const joinedDate = user.joined
    ? new Date(user.joined).toLocaleDateString()
    : "Unknown";

  document.getElementById("sellerReliability").textContent =
    `Member since ${joinedDate}`;

  /* ---------------- Stats ---------------- */
  const stats = {
    completedJobs: user.completedJobs || 0,
    avgReplyTime: user.avgReplyTime || 999,
    communityEvents: user.communityEvents || 0,
    lastActiveHour: user.lastActiveHour ?? 12,
    loginStreak: user.loginStreak || 0,
    freebieClicks: user.freebieClicks || 0,
    firstInCategory: user.firstInCategory || false,
    helpfulAnswers: user.helpfulAnswers || 0,
    accountAgeYears: user.accountAgeYears || 0
  };

  document.getElementById("sellerStats").textContent =
    `${stats.completedJobs} completed jobs • ${stats.loginStreak} day streak`;

 loadSellerFollowing(userId);
  
  /* ---------------- Badges ---------------- */
  const badgeObject = computeBadges(user, stats);
  document.getElementById("sellerBadges").innerHTML = renderBadges(badgeObject);

  /* ---------------- Bio ---------------- */
  document.getElementById("sellerBio").textContent =
    user.bio || "This seller has not added a bio yet.";

  /* ---------------- Business Enhancements ---------------- */
  if (user.isBusiness) {
    document.getElementById("businessRibbon").style.display = "inline-block";

    const businessInfo = document.getElementById("businessInfo");
    businessInfo.style.display = "block";
    businessInfo.innerHTML = `
      <h4>Business Information</h4>
      <p>${user.businessDescription || "Local business in Rhondda"}</p>
      <p><strong>Opening Hours:</strong> ${user.openingHours || "Not provided"}</p>
    `;
  }

  /* ---------------- FOLLOW BUTTON ---------------- */
  setupFollowButton(userId);

  /* ---------------- Contact Seller ---------------- */
  document.getElementById("contactSellerBtn").onclick = () => {
    sessionStorage.setItem(
      "activeConversationId",
      `${auth.currentUser.uid}_${userId}`
    );
    loadView("chat", { forceInit: true });
  };

  /* ---------------- Load Seller Ads ---------------- */
  loadSellerAds(userId);

  /* ---------------- Back Button ---------------- */
  document.getElementById("backToPost").onclick = () => {
    loadView("view-post", { forceInit: true });
  };
}

/* ---------------- FOLLOW SYSTEM ---------------- */
async function setupFollowButton(sellerId) {
  const btn = document.getElementById("followSellerBtn");

  if (!auth.currentUser) {
    btn.textContent = "Follow Seller";
    btn.onclick = () => loadView("login");
    return;
  }

  const currentUserId = auth.currentUser.uid;

  const followingRef = doc(db, "users", currentUserId, "following", sellerId);
  const followerRef = doc(db, "users", sellerId, "followers", currentUserId);

  const snap = await getDoc(followingRef);
  let isFollowing = snap.exists();

  btn.textContent = isFollowing ? "Following ✓" : "Follow Seller";

  btn.onclick = async () => {
if (isFollowing) {
  await deleteDoc(followingRef);
  await deleteDoc(followerRef);
  btn.textContent = "Follow Seller";
  btn.classList.remove("following");
  isFollowing = false;
} else {
  await setDoc(followingRef, { followedAt: Date.now() });
  await setDoc(followerRef, { followedAt: Date.now() });
  btn.textContent = "Following ✓";
  btn.classList.add("following");
  isFollowing = true;
}
    
  };
}

async function loadSellerFollowing(sellerId) {
  const container = document.getElementById("sellerFollowing");

  const q = collection(db, "users", sellerId, "following");
  const snap = await getDocs(q);

  const count = snap.size;

  if (count === 0) {
    container.textContent = "Following: 0";
    return;
  }

  // If you want just the count:
  container.textContent = `Following: ${count}`;

  // If you want to show names later, we can expand this.
}

/* ---------------- Load Seller Ads ---------------- */
async function loadSellerAds(sellerId) {
  const container = document.getElementById("sellerAdsContainer");
  const PLACEHOLDER = "/images/image-webholder.webp";

  const q = query(
    collection(db, "posts"),
    where("userId", "==", sellerId),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);
  container.innerHTML = "";

  if (snap.empty) {
    container.innerHTML = "<p>This seller has no other ads.</p>";
    return;
  }

  snap.forEach(docSnap => {
    const post = { id: docSnap.id, ...docSnap.data() };

    if (post.id === sessionStorage.getItem("viewPostId")) return;

    const card = document.createElement("div");
    card.className = "post-card";
    card.addEventListener("click", () => {
      sessionStorage.setItem("viewPostId", post.id);
      loadView("view-post", { forceInit: true });
    });

    const imgSrc =
      post.imageUrl ||
      (Array.isArray(post.imageUrls) && post.imageUrls[0]) ||
      PLACEHOLDER;

    const img = document.createElement("img");
    img.src = imgSrc;
    img.alt = post.title || "Ad image";
    img.loading = "lazy";
    img.onerror = () => (img.src = PLACEHOLDER);

    const postImageDiv = document.createElement("div");
    postImageDiv.className = "post-image";
    postImageDiv.appendChild(img);

    const postBody = document.createElement("div");
    postBody.className = "post-body";

    const h3 = document.createElement("h3");
    h3.textContent = post.title || "Untitled";

    
    postBody.appendChild(h3);

    card.appendChild(postImageDiv);
    card.appendChild(postBody);

    container.appendChild(card);
  });
}
