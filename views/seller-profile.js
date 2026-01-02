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
let selectedPosts = []; // Track full post objects for the "Nice" popup

export async function init({ auth: a, db: d }) {
  auth = a;
  db = d;

  const userId = sessionStorage.getItem("profileUserId");
  if (!userId) return loadView("home");

  const profileSnap = await getDoc(doc(db, "users", userId));
  if (!profileSnap.exists()) return loadView("home");

  const user = profileSnap.data();

  /* ---------------- Determine Seller Type ---------------- */
  sellerIsPremium = !!(user.isBusiness || user.isSellerPlus);

  /* ---------------- Paywall Logic (2026 Update) ---------------- */
  const paywallNotice = document.getElementById("sellerPaywallNotice");
  if (!sellerIsPremium) {
    paywallNotice.style.display = "block";
    document.getElementById("unlockPosterBtn").onclick = () => {
      alert("Redirecting to secure £1.50 payment to unlock contact...");
      // Logic for payment processing would go here
    };
  }

  /* ---------------- UI Setup ---------------- */
  const safeName = user.name || user.displayName || user.fullName || "User";
  const avatar = document.getElementById("sellerAvatar");

  if (user.avatarUrl) {
    avatar.style.backgroundImage = `url(${user.avatarUrl})`;
  } else {
    avatar.textContent = safeName.split(" ").map(n => n[0]).join("").toUpperCase();
  }

  document.getElementById("sellerName").textContent = safeName;
  const joinedDate = user.joined ? new Date(user.joined).toLocaleDateString() : "Unknown";
  document.getElementById("sellerReliability").textContent = `Member since ${joinedDate}`;

  const stats = { completedJobs: user.completedJobs || 0, loginStreak: user.loginStreak || 0 };
  document.getElementById("sellerStats").textContent = `${stats.completedJobs} completed jobs • ${stats.loginStreak} day streak`;

  loadSellerFollowers(userId);
  document.getElementById("sellerBio").textContent = user.bio || "This seller has not added a bio yet.";

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

  setupFollowButton(userId, safeName);
  loadSellerAds(userId);

  document.getElementById("backToPost").onclick = () => loadView("view-post", { forceInit: true });
}

async function loadSellerAds(sellerId) {
  const container = document.getElementById("sellerAdsContainer");
  const PLACEHOLDER = "/images/image-webholder.webp";

  const q = query(collection(db, "posts"), where("userId", "==", sellerId), orderBy("createdAt", "desc"));
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

    // Tick Box with dataset for Price and Title
    const tick = document.createElement("input");
    tick.type = "checkbox";
    tick.className = "bundle-tick ad-selector";
    tick.dataset.postId = post.id;
    tick.dataset.postTitle = post.title;
    tick.dataset.postPrice = post.price || 0;
    card.appendChild(tick);

    tick.addEventListener("change", () => updateBundleUI());

    const imgSrc = post.imageUrl || (Array.isArray(post.imageUrls) && post.imageUrls[0]) || PLACEHOLDER;
    const img = document.createElement("img");
    img.src = imgSrc;
    img.loading = "lazy";

    const postBody = document.createElement("div");
    postBody.className = "post-body";
    postBody.innerHTML = `<h3>${post.title || "Untitled"}</h3><p class="post-price">${post.price ? `£${post.price}` : ""}</p>`;

    card.appendChild(img);
    card.appendChild(postBody);
    container.appendChild(card);
  });

  setupContactLogic(sellerId);
}

function updateBundleUI() {
  const selected = document.querySelectorAll(".bundle-tick:checked");
  const contactBtn = document.getElementById("combinedEnquiryBtn");
  const countSpan = document.getElementById("selectedCount");

  countSpan.textContent = selected.length;
  contactBtn.style.display = selected.length > 0 ? "block" : "none";
}

function setupContactLogic(sellerId) {
  const contactBtn = document.getElementById("combinedEnquiryBtn");

  contactBtn.onclick = () => {
    const selectedTicks = document.querySelectorAll(".bundle-tick:checked");
    const summaryContainer = document.getElementById("popupItemsSummary");
    const tallyRow = document.getElementById("popupPriceTally");
    const totalAmount = document.getElementById("totalPriceAmount");

    summaryContainer.innerHTML = "";
    let total = 0;

    selectedTicks.forEach(tick => {
      const title = tick.dataset.postTitle;
      const price = parseFloat(tick.dataset.postPrice);

      if (sellerIsPremium) {
        // "Nice" UI for Business/Seller+
        summaryContainer.innerHTML += `
          <div class="summary-item">
            <span>${title}</span>
            <span>£${price.toFixed(2)}</span>
          </div>`;
        total += price;
      } else {
        // Plain List for Free Sellers
        summaryContainer.innerHTML += `<p>• ${title}</p>`;
      }
    });

    if (sellerIsPremium) {
      tallyRow.style.display = "flex";
      totalAmount.textContent = `£${total.toFixed(2)}`;
    } else {
      tallyRow.style.display = "none";
    }

    document.getElementById("contactPopup").style.display = "flex";

    // Handle Send
    document.getElementById("popupSendBtn").onclick = () => {
      const customMessage = document.getElementById("popupMessage").value.trim();
      let finalMessage = "Bundle Enquiry:\n";

      selectedTicks.forEach(tick => {
        finalMessage += `- ${tick.dataset.postTitle} ${sellerIsPremium ? `(£${tick.dataset.postPrice})` : ""}\n`;
      });

      if (sellerIsPremium) finalMessage += `Total: £${total.toFixed(2)}\n`;
      if (customMessage) finalMessage += `\nNote: ${customMessage}`;

      sessionStorage.setItem("pendingMessage", finalMessage);
      sessionStorage.setItem("activeConversationId", `${auth.currentUser.uid}_${sellerId}_bundle`);
      loadView("chat", { forceInit: true });
    };
  };

  document.getElementById("popupCancelBtn").onclick = () => {
    document.getElementById("contactPopup").style.display = "none";
  };
}

/* --- Follow System Functions (loadSellerFollowers, setupFollowButton) remain same as provided in your snippet --- */
async function setupFollowButton(sellerId, safeName) {
  const btn = document.getElementById("followSellerBtn");
  if (!auth.currentUser) {
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
      await deleteDoc(followingRef); await deleteDoc(followerRef);
      btn.textContent = "Follow Seller"; btn.classList.remove("following");
      isFollowing = false;
    } else {
      await setDoc(followingRef, { followedAt: Date.now() }); await setDoc(followerRef, { followedAt: Date.now() });
      btn.textContent = "Following ✓"; btn.classList.add("following");
      isFollowing = true;
    }
    loadSellerFollowers(sellerId);
  };
}

async function loadSellerFollowers(sellerId) {
  const container = document.getElementById("sellerFollowers");
  const snap = await getDocs(collection(db, "users", sellerId, "followers"));
  container.textContent = `Followers: ${snap.size}`;
}
