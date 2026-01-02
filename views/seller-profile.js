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

import { loadView } from "/index/js/main.js";

let auth, db;
let sellerIsPremium = false; // Business or Seller+

export async function init({ auth: a, db: d }) {
  auth = a;
  db = d;

  const userId = sessionStorage.getItem("profileUserId");
  if (!userId) return loadView("home");

  const profileSnap = await getDoc(doc(db, "users", userId));
  if (!profileSnap.exists()) return loadView("home");

  const user = profileSnap.data();

  /* ---------------- Determine Seller Type ---------------- */
  sellerIsPremium = user.isBusiness || user.isSellerPlus;

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
    loginStreak: user.loginStreak || 0
  };

  document.getElementById("sellerStats").textContent =
    `${stats.completedJobs} completed jobs • ${stats.loginStreak} day streak`;

  /* ---------------- Followers Count ---------------- */
  loadSellerFollowers(userId);

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
  setupFollowButton(userId, safeName);

  /* ---------------- Load Seller Ads ---------------- */
  loadSellerAds(userId);

  /* ---------------- Back Button ---------------- */
  document.getElementById("backToPost").onclick = () => {
    loadView("view-post", { forceInit: true });
  };
}

/* ---------------- FOLLOW SYSTEM ---------------- */
async function setupFollowButton(sellerId, safeName) {
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
  if (isFollowing) btn.classList.add("following");

  btn.onclick = async () => {
    if (isFollowing) {
      await deleteDoc(followingRef);
      await deleteDoc(followerRef);

      btn.textContent = "Follow Seller";
      btn.classList.remove("following");
      isFollowing = false;

      loadSellerFollowers(sellerId);
    } else {
      await setDoc(followingRef, { followedAt: Date.now() });
      await setDoc(followerRef, { followedAt: Date.now() });

      btn.textContent = "Following ✓";
      btn.classList.add("following");
      isFollowing = true;

      loadSellerFollowers(sellerId);
    }
  };
}

/* ---------------- FOLLOWERS COUNT ---------------- */
async function loadSellerFollowers(sellerId) {
  const container = document.getElementById("sellerFollowers");
  const snap = await getDocs(collection(db, "users", sellerId, "followers"));
  container.textContent = `Followers: ${snap.size}`;
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

    /* ---------------- Tick Box (everyone sees it) ---------------- */
    const tick = document.createElement("input");
    tick.type = "checkbox";
    tick.className = "bundle-tick";
    tick.dataset.postId = post.id;
    card.appendChild(tick);

    tick.addEventListener("change", updateButtonVisibility);

    /* ---------------- Image ---------------- */
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

    const price = document.createElement("p");
    price.className = "post-price";
    price.textContent = post.price ? `£${post.price}` : "";
    postBody.appendChild(price);

    card.appendChild(postImageDiv);
    card.appendChild(postBody);

    container.appendChild(card);
  });



/* ---------------- Universal Contact Button Logic ---------------- */
const contactBtn = document.getElementById("combinedEnquiryBtn");

contactBtn.onclick = async () => {
  const selectedIds = [...document.querySelectorAll(".bundle-tick:checked")]
    .map(t => t.dataset.postId);

  if (selectedIds.length === 0) return;

  // Load posts for popup
  const popupItems = document.getElementById("popupItems");
  popupItems.innerHTML = "";

  let total = 0;

  for (const id of selectedIds) {
    const snap = await getDoc(doc(db, "posts", id));
    if (!snap.exists()) continue;

    const post = snap.data();

    const priceText = sellerIsPremium && post.price ? ` (£${post.price})` : "";

    popupItems.innerHTML += `<p>• ${post.title}${priceText}</p>`;

    if (sellerIsPremium) total += Number(post.price || 0);
  }

  // Premium sellers show total
  if (sellerIsPremium) {
    popupItems.innerHTML += `<p><strong>Total: £${total}</strong></p>`;
  }

  // Show popup
  document.getElementById("contactPopup").style.display = "flex";

  // Send button
  document.getElementById("popupSendBtn").onclick = () => {
    const custom = document.getElementById("popupMessage").value.trim();

    let message = "I'm interested in:\n";
    popupItems.querySelectorAll("p").forEach(p => {
      message += p.textContent + "\n";
    });

    if (custom) message += `\n${custom}`;

    sessionStorage.setItem("pendingMessage", message);
    sessionStorage.setItem(
      "activeConversationId",
      `${auth.currentUser.uid}_${sellerId}`
    );

    loadView("chat", { forceInit: true });
  };

  // Cancel button
  document.getElementById("popupCancelBtn").onclick = () => {
    document.getElementById("contactPopup").style.display = "none";
  };
};
