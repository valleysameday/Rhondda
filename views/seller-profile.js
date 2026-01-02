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
let sellerIsPremium = false; 

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

  /* ---------------- Conditional Unlock Logic (2026) ---------------- */
  // Check if any contact number field exists and is not empty
  const hasContactNumber = !!(user.phone || user.contactNumber || user.whatsapp);
  const unlockSection = document.getElementById("unlockSection");

  if (!sellerIsPremium && hasContactNumber) {
    unlockSection.style.display = "block";
    document.getElementById("unlockPosterBtn").onclick = () => {
      // payment integration hook for £1.50
      console.log("Initiating payment for user: " + userId);
    };
  } else {
    unlockSection.style.display = "none";
  }

  /* ---------------- UI Enhancements ---------------- */
  const safeName = user.name || user.displayName || "User";
  const avatar = document.getElementById("sellerAvatar");

  if (user.avatarUrl) {
    avatar.style.backgroundImage = `url(${user.avatarUrl})`;
  } else {
    avatar.textContent = safeName.charAt(0).toUpperCase();
  }

  document.getElementById("sellerName").textContent = safeName;
  document.getElementById("sellerReliability").textContent = `Member since ${new Date(user.joined).getFullYear()}`;

  // Bento-grid stats
  document.getElementById("jobCount").textContent = user.completedJobs || 0;
  document.getElementById("streakCount").textContent = user.loginStreak || 0;
  loadFollowerCount(userId);

  document.getElementById("sellerBio").textContent = user.bio || "No bio provided.";

  if (user.isBusiness) {
    const ribbon = document.getElementById("businessRibbon");
    ribbon.style.display = "flex";
    const info = document.getElementById("businessInfo");
    info.style.display = "block";
    info.innerHTML = `<h4>Business Info</h4><p>${user.businessDescription || "Local Business"}</p>`;
  }

  setupFollowSystem(userId);
  loadSellerAds(userId);

  document.getElementById("backToPost").onclick = () => loadView("view-post", { forceInit: true });
}

async function loadSellerAds(sellerId) {
  const container = document.getElementById("sellerAdsContainer");
  const q = query(collection(db, "posts"), where("userId", "==", sellerId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  container.innerHTML = "";

  if (snap.empty) {
    container.innerHTML = "<p class='empty-msg'>No ads posted yet.</p>";
    return;
  }

  snap.forEach(docSnap => {
    const post = { id: docSnap.id, ...docSnap.data() };
    const card = document.createElement("div");
    card.className = "post-card";
    
    card.innerHTML = `
      <input type="checkbox" class="bundle-tick" 
             data-id="${post.id}" 
             data-title="${post.title}" 
             data-price="${post.price || 0}">
      <div class="post-image">
        <img src="${post.imageUrl || '/images/image-webholder.webp'}" loading="lazy">
      </div>
      <div class="post-body">
        <h3>${post.title}</h3>
        <p class="post-price">£${post.price || '0.00'}</p>
      </div>
    `;

    card.querySelector(".bundle-tick").addEventListener("change", updateBundleBar);
    container.appendChild(card);
  });

  initEnquiryButton(sellerId);
}

function updateBundleBar() {
  const selected = document.querySelectorAll(".bundle-tick:checked");
  const btn = document.getElementById("combinedEnquiryBtn");
  document.getElementById("selectedCount").textContent = selected.length;
  btn.style.display = selected.length > 0 ? "block" : "none";
}

function initEnquiryButton(sellerId) {
  document.getElementById("combinedEnquiryBtn").onclick = () => {
    const selected = document.querySelectorAll(".bundle-tick:checked");
    const summary = document.getElementById("popupItemsSummary");
    const tally = document.getElementById("popupPriceTally");
    let total = 0;

    summary.innerHTML = "";
    selected.forEach(t => {
      const price = parseFloat(t.dataset.price);
      total += price;
      
      summary.innerHTML += sellerIsPremium 
        ? `<div class="summary-item"><span>${t.dataset.title}</span><span>£${price.toFixed(2)}</span></div>`
        : `<p>• ${t.dataset.title}</p>`;
    });

    if (sellerIsPremium) {
      tally.style.display = "flex";
      document.getElementById("totalPriceAmount").textContent = `£${total.toFixed(2)}`;
    }

    document.getElementById("contactPopup").style.display = "flex";

    document.getElementById("popupSendBtn").onclick = () => {
      const msg = document.getElementById("popupMessage").value;
      const finalMsg = `Bundle Order:\n${Array.from(selected).map(t => t.dataset.title).join(", ")}\n\n${msg}`;
      sessionStorage.setItem("pendingMessage", finalMsg);
      loadView("chat");
    };
  };

  document.getElementById("popupCancelBtn").onclick = () => {
    document.getElementById("contactPopup").style.display = "none";
  };
}

async function loadFollowerCount(id) {
  const snap = await getDocs(collection(db, "users", id, "followers"));
  document.getElementById("followerCount").textContent = snap.size;
}

async function setupFollowSystem(id) {
  const btn = document.getElementById("followSellerBtn");
  btn.onclick = async () => {
    // Logic for follow/unfollow toggle
    btn.classList.toggle("following");
    btn.textContent = btn.classList.contains("following") ? "Following" : "Follow";
  };
}
