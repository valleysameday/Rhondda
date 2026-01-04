import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { loadView } from "/index/js/main.js";

let auth, db;
let sellerIsPremium = false;

/* ===============================
   INIT
================================ */
export async function init({ auth: a, db: d }) {
  auth = a;
  db = d;

  const userId = sessionStorage.getItem("profileUserId");
  if (!userId) return loadView("home");

  const profileSnap = await getDoc(doc(db, "users", userId));
  if (!profileSnap.exists()) return loadView("home");

  const user = profileSnap.data();

  /* ---------------- Seller Tier ---------------- */
  // ONLY business & seller+ get totals
  sellerIsPremium = !!(user.isBusiness || user.isSellerPlus);

  /* ---------------- Reliability ---------------- */
  let reliabilityText = "Verified Member";
  if (user.joined?.toDate) {
    const joinedDate = user.joined.toDate();
    reliabilityText = `Member since ${joinedDate.getFullYear()}`;
  }

  setText("sellerReliability", reliabilityText);

  /* ---------------- Profile Data ---------------- */
  setText("sellerName", user.name || user.displayName || "User");
  setText("streakCount", user.loginStreak || 0);
  setText(
    "sellerBio",
    user.bio || "This user hasn't added a bio yet."
  );

  /* ---------------- Avatar ---------------- */
  const avatar = document.getElementById("sellerAvatar");
  if (avatar) {
    if (user.avatarUrl) {
      avatar.style.backgroundImage = `url(${user.avatarUrl})`;
      avatar.textContent = "";
    } else {
      avatar.textContent = (user.name || "U").charAt(0).toUpperCase();
    }
  }

  /* ---------------- Business Ribbon ---------------- */
  const ribbon = document.getElementById("businessRibbon");
  if (ribbon && user.isBusiness) {
    ribbon.style.display = "flex";
  }

  /* ---------------- Load Data ---------------- */
  await loadFollowerCount(userId);
  await loadSellerAds(userId);
  setupFollowBtn();

  /* ---------------- Back Button ---------------- */
  const backBtn = document.getElementById("backToPost");
  if (backBtn) {
    backBtn.onclick = () =>
      loadView("view-post", { forceInit: true });
  }
}

/* ===============================
   LOAD SELLER ADS
================================ */
async function loadSellerAds(sellerId) {
  const container = document.getElementById("sellerAdsContainer");
  if (!container) return;

  container.innerHTML = "";

  const q = query(
    collection(db, "posts"),
    where("userId", "==", sellerId),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    container.innerHTML =
      "<p class='empty-msg'>No other ads found.</p>";
    return;
  }

  snap.forEach(docSnap => {
    const post = { id: docSnap.id, ...docSnap.data() };

    const card = document.createElement("div");
    card.className = "post-card";
    card.innerHTML = `
      <input
        type="checkbox"
        class="bundle-tick"
        data-id="${post.id}"
        data-title="${post.title}"
        data-price="${post.price || 0}"
      >
      <div class="post-image">
        <img src="${post.imageUrl || "/images/placeholder.webp"}">
      </div>
      <div class="post-body">
        <h3>${post.title}</h3>
        <p class="post-price">£${post.price || "0.00"}</p>
      </div>
    `;

    card
      .querySelector(".bundle-tick")
      .addEventListener("change", updateBundleUI);

    container.appendChild(card);
  });

  setupPopupLogic();
}

/* ===============================
   BUNDLE UI
================================ */
function updateBundleUI() {
  const count = document.querySelectorAll(".bundle-tick:checked").length;
  const btn = document.getElementById("combinedEnquiryBtn");
  const countEl = document.getElementById("selectedCount");

  if (countEl) countEl.textContent = count;
  if (btn) btn.style.display = count > 0 ? "block" : "none";
}

/* ===============================
   POPUP LOGIC
================================ */
function setupPopupLogic() {
  const enquiryBtn = document.getElementById("combinedEnquiryBtn");
  if (!enquiryBtn) return;

  enquiryBtn.onclick = () => {
    const selected = document.querySelectorAll(".bundle-tick:checked");
    const summary = document.getElementById("popupItemsSummary");
    const tally = document.getElementById("popupPriceTally");
    const popup = document.getElementById("contactPopup");

    let total = 0;
    if (summary) summary.innerHTML = "";

    selected.forEach(t => {
      const price = parseFloat(t.dataset.price || 0);
      total += price;

      // ALWAYS show item titles
      summary.innerHTML += `
        <div class="summary-item">
          <span>${t.dataset.title}</span>
          ${
            sellerIsPremium
              ? `<span>£${price.toFixed(2)}</span>`
              : ``
          }
        </div>
      `;
    });

    // ONLY business & seller+ see totals
    if (tally) {
      tally.style.display = sellerIsPremium ? "flex" : "none";
      if (sellerIsPremium) {
        document.getElementById("totalPriceAmount").textContent =
          `£${total.toFixed(2)}`;
      }
    }

    popup.style.display = "flex";

    const sendBtn = document.getElementById("popupSendBtn");
    if (sendBtn) {
      sendBtn.onclick = () => {
        let msg = "Bundle Enquiry:\n\n";

        selected.forEach(t => {
          msg += `• ${t.dataset.title}`;
          if (sellerIsPremium) {
            msg += ` (£${parseFloat(t.dataset.price || 0).toFixed(2)})`;
          }
          msg += "\n";
        });

        if (sellerIsPremium) {
          msg += `\nTotal: £${total.toFixed(2)}`;
        }

        sessionStorage.setItem("pendingMessage", msg);
        loadView("chat", { forceInit: true });
      };
    }
  };

  const cancelBtn = document.getElementById("popupCancelBtn");
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      const popup = document.getElementById("contactPopup");
      if (popup) popup.style.display = "none";
    };
  }
}

/* ===============================
   FOLLOWERS
================================ */
async function loadFollowerCount(id) {
  const countEl = document.getElementById("followerCount");
  if (!countEl) return;

  const snap = await getDocs(
    collection(db, "users", id, "followers")
  );

  countEl.textContent = snap.size;
}

function setupFollowBtn() {
  const btn = document.getElementById("followSellerBtn");
  if (!btn) return;

  btn.onclick = () => {
    btn.classList.toggle("following");
    btn.textContent = btn.classList.contains("following")
      ? "Following ✓"
      : "Follow Seller";
  };
}

/* ===============================
   HELPERS
================================ */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
