import { getFirebase } from "/index/js/firebase/init.js";
import { doc, getDoc, collection, query, where, orderBy, getDocs } 
from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { computeBadges, renderBadges } from "/index/js/badges.js";

let db;

getFirebase().then(fb => {
  db = fb.db;
  loadSellerProfile();
});

async function loadSellerProfile() {
  const sellerId = window.selectedSellerId;
  if (!sellerId) return;

  const sellerRef = doc(db, "users", sellerId);
  const sellerSnap = await getDoc(sellerRef);

  if (!sellerSnap.exists()) {
    document.getElementById("sellerName").textContent = "Seller not found";
    return;
  }

  const seller = sellerSnap.data();

  /* ---------------- SELLER NAME ---------------- */
  document.getElementById("sellerName").textContent = seller.displayName || seller.email;

  /* ---------------- RELIABILITY ---------------- */
  const stats = await computeSellerStats(sellerId);
  const reliability = computeReliability(stats);
  document.getElementById("sellerReliability").textContent = `Reliability: ${reliability}%`;

  /* ---------------- BADGES ---------------- */
  const badges = computeBadges(seller, stats);
  document.getElementById("sellerBadges").innerHTML = renderBadges(badges);

  /* ---------------- STATS ---------------- */
  document.getElementById("sellerStats").innerHTML = `
    <div>Posts: ${stats.postCount}</div>
    <div>Member: ${stats.accountAgeYears} years</div>
    <div>Avg Reply: ${stats.avgReplyTime} mins</div>
  `;

  /* ---------------- BIO ---------------- */
  document.getElementById("sellerBio").textContent =
    seller.bio || "This seller has not added a bio yet.";

  /* ---------------- CONTACT BUTTON ---------------- */
  document.getElementById("contactSellerBtn").onclick = () => {
    alert("Messaging coming soon!");
  };

  /* ---------------- LOAD SELLER ADS ---------------- */
  loadSellerAds(sellerId);
}

/* ---------------- LOAD SELLER ADS ---------------- */
async function loadSellerAds(sellerId) {
  const container = document.getElementById("sellerAdsContainer");

  const q = query(
    collection(db, "posts"),
    where("userId", "==", sellerId),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  container.innerHTML = "";

  snap.forEach(docSnap => {
    const post = { id: docSnap.id, ...docSnap.data() };

    const card = document.createElement("div");
    card.className = "post-card";

    card.onclick = () => {
      window.selectedPostId = post.id;
      loadView("view-post");
    };

    const img = post.imageUrl || (post.imageUrls && post.imageUrls[0]);

    card.innerHTML = `
      <div class="post-image">
        <img src="${img}" alt="${post.title}">
      </div>
      <div class="post-body">
        <h3>${post.title}</h3>
        <p class="post-desc">${post.description}</p>
      </div>
    `;

    container.appendChild(card);
  });
}

/* ---------------- STATS + RELIABILITY ---------------- */
async function computeSellerStats(sellerId) {
  const postsSnap = await getDocs(
    query(collection(db, "posts"), where("userId", "==", sellerId))
  );

  const postCount = postsSnap.size;

  return {
    postCount,
    avgReplyTime: 30, // placeholder until messaging exists
    accountAgeYears: 1,
    completedJobs: 0,
    communityEvents: 0,
    lastActiveHour: 14,
    loginStreak: 3,
    freebieClicks: 0,
    helpfulAnswers: 0,
    firstInCategory: false
  };
}

function computeReliability(stats) {
  let score = 50;

  if (stats.postCount > 10) score += 10;
  if (stats.accountAgeYears > 1) score += 20;
  if (stats.avgReplyTime < 60) score += 20;

  return Math.min(100, score);
}
