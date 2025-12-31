import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { BADGE_SVGS, computeBadges, renderBadges } from "/seller/badges.js";
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

  /* ---------------- Avatar ---------------- */
  const avatar = document.getElementById("sellerAvatar");
  if (user.avatarUrl) {
    avatar.style.backgroundImage = `url(${user.avatarUrl})`;
  } else {
    const initials = user.name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
    avatar.textContent = initials;
  }

  /* ---------------- Name ---------------- */
  document.getElementById("sellerName").textContent = user.name;

  /* ---------------- Reliability ---------------- */
  document.getElementById("sellerReliability").textContent =
    `Member since ${new Date(user.joined).toLocaleDateString()}`;

  /* ---------------- Stats ---------------- */
  const stats = {
    completedJobs: user.completedJobs || 0,
    avgReplyTime: user.avgReplyTime || 999,
    communityEvents: user.communityEvents || 0,
    lastActiveHour: user.lastActiveHour || 12,
    loginStreak: user.loginStreak || 0,
    freebieClicks: user.freebieClicks || 0,
    firstInCategory: user.firstInCategory || false,
    helpfulAnswers: user.helpfulAnswers || 0,
    accountAgeYears: user.accountAgeYears || 0
  };

  document.getElementById("sellerStats").textContent =
    `${stats.completedJobs} completed jobs • ${stats.loginStreak} day streak`;

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

  /* ---------------- Contact Seller ---------------- */
  document.getElementById("contactSellerBtn").onclick = () => {
    sessionStorage.setItem("activeConversationId", `${auth.currentUser.uid}_${userId}`);
    loadView("chat", { forceInit: true });
  };

  /* ---------------- Load Seller Ads ---------------- */
  loadSellerAds(userId);

  /* ---------------- Back Button ---------------- */
  document.getElementById("backToPost").onclick = () => {
    loadView("view-post", { forceInit: true });
  };
}

/* ---------------- Load Seller Ads ---------------- */
async function loadSellerAds(sellerId) {
  const container = document.getElementById("sellerAdsContainer");
  const PLACEHOLDER = "/images/post-placeholder.jpg";

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

    const desc = document.createElement("p");
    desc.className = "post-desc";
    desc.textContent = post.description || "";

    postBody.appendChild(h3);
    postBody.appendChild(desc);

    card.appendChild(postImageDiv);
    card.appendChild(postBody);

    container.appendChild(card);
  });
}
