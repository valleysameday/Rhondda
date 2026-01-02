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

  /* ---------------- Fix NaN Date Error ---------------- */
  const joinedTimestamp = user.joined; 
  let reliabilityText = "Verified Member";
  
  if (joinedTimestamp) {
    const joinedDate = new Date(joinedTimestamp);
    if (!isNaN(joinedDate.getTime())) {
      reliabilityText = `Member since ${joinedDate.getFullYear()}`;
    }
  }
  document.getElementById("sellerReliability").textContent = reliabilityText;

  /* ---------------- Unlock Number Logic ---------------- */
  const hasContactNumber = !!(user.phone || user.contactNumber || user.whatsapp);
  const unlockSection = document.getElementById("unlockSection");

  if (!sellerIsPremium && hasContactNumber) {
    unlockSection.style.display = "block";
    document.getElementById("unlockPosterBtn").onclick = () => {
      alert("Opening secure payment for £1.50 to unlock contact details...");
    };
  } else {
    unlockSection.style.display = "none";
  }

  /* ---------------- UI Data Mapping ---------------- */
  document.getElementById("sellerName").textContent = user.name || user.displayName || "User";
  document.getElementById("streakCount").textContent = user.loginStreak || 0;
  document.getElementById("sellerBio").textContent = user.bio || "This user hasn't added a bio yet.";
  
  const avatar = document.getElementById("sellerAvatar");
  if (user.avatarUrl) {
    avatar.style.backgroundImage = `url(${user.avatarUrl})`;
  } else {
    avatar.textContent = (user.name || "U").charAt(0).toUpperCase();
  }

  if (user.isBusiness) {
    document.getElementById("businessRibbon").style.display = "flex";
  }

  loadFollowerCount(userId);
  loadSellerAds(userId);
  setupFollowBtn(userId);

  document.getElementById("backToPost").onclick = () => loadView("view-post", { forceInit: true });
}

async function loadSellerAds(sellerId) {
  const container = document.getElementById("sellerAdsContainer");
  const q = query(collection(db, "posts"), where("userId", "==", sellerId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  container.innerHTML = "";

  if (snap.empty) {
    container.innerHTML = "<p class='empty-msg'>No other ads found.</p>";
    return;
  }

  snap.forEach(docSnap => {
    const post = { id: docSnap.id, ...docSnap.data() };
    const card = document.createElement("div");
    card.className = "post-card";
    card.innerHTML = `
      <input type="checkbox" class="bundle-tick" data-id="${post.id}" data-title="${post.title}" data-price="${post.price || 0}">
      <div class="post-image"><img src="${post.imageUrl || '/images/placeholder.webp'}"></div>
      <div class="post-body">
        <h3>${post.title}</h3>
        <p class="post-price">£${post.price || '0.00'}</p>
      </div>
    `;

    card.querySelector(".bundle-tick").addEventListener("change", updateBundleUI);
    container.appendChild(card);
  });

  setupPopupLogic(sellerId);
}

function updateBundleUI() {
  const selectedCount = document.querySelectorAll(".bundle-tick:checked").length;
  const btn = document.getElementById("combinedEnquiryBtn");
  document.getElementById("selectedCount").textContent = selectedCount;
  btn.style.display = selectedCount > 0 ? "block" : "none";
}

function setupPopupLogic(sellerId) {
  const enquiryBtn = document.getElementById("combinedEnquiryBtn");
  
  enquiryBtn.onclick = () => {
    const selected = document.querySelectorAll(".bundle-tick:checked");
    const summary = document.getElementById("popupItemsSummary");
    const tally = document.getElementById("popupPriceTally");
    let total = 0;

    summary.innerHTML = "";
    selected.forEach(t => {
      const price = parseFloat(t.dataset.price);
      total += price;
      
      if (sellerIsPremium) {
        summary.innerHTML += `<div class="summary-item"><span>${t.dataset.title}</span><span>£${price.toFixed(2)}</span></div>`;
      } else {
        summary.innerHTML += `<p class="plain-item">• ${t.dataset.title}</p>`;
      }
    });

    if (sellerIsPremium) {
      tally.style.display = "flex";
      document.getElementById("totalPriceAmount").textContent = `£${total.toFixed(2)}`;
    }

    document.getElementById("contactPopup").style.display = "flex";

    document.getElementById("popupSendBtn").onclick = () => {
      const userMsg = document.getElementById("popupMessage").value;
      let finalMsg = `Bundle Enquiry:\n`;
      selected.forEach(t => {
        finalMsg += `- ${t.dataset.title} ${sellerIsPremium ? `(£${t.dataset.price})` : ""}\n`;
      });
      if (sellerIsPremium) finalMsg += `Total: £${total.toFixed(2)}\n`;
      if (userMsg) finalMsg += `\nMessage: ${userMsg}`;

      sessionStorage.setItem("pendingMessage", finalMsg);
      loadView("chat", { forceInit: true });
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

function setupFollowBtn(id) {
  const btn = document.getElementById("followSellerBtn");
  btn.onclick = () => {
    btn.classList.toggle("following");
    btn.textContent = btn.classList.contains("following") ? "Following ✓" : "Follow Seller";
  };
}
