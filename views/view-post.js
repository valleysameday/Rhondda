import {
  getPost,
  getUser,
  toggleFollowSeller,
  trackContactClick,
  deletePost
} from "/index/js/firebase/settings.js";

import {
  collection,
  doc,
  setDoc,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* =====================================================
   STATE
===================================================== */
let postId = null;
let sellerUid = null;
let galleryImages = [];
let currentIndex = 0;
let currentPost = null;

/* =====================================================
   DOM
===================================================== */
const titleEl = document.getElementById("postTitle");
const priceEl = document.getElementById("postPrice");
const priceTagEl = document.getElementById("priceTag");
const descEl = document.getElementById("postDescription");
const postTimeEl = document.getElementById("postTime");

const mainImage = document.getElementById("mainImage");
const galleryCount = document.getElementById("galleryCount");

/* Contact + reveal controls */
const revealPhoneBtn = document.getElementById("revealPhoneBtn");
const phoneValueEl = document.getElementById("phoneValue");

const revealWhatsappBtn = document.getElementById("revealWhatsappBtn");
const whatsappValueEl = document.getElementById("whatsappValue");

const sendQuickMessageTopBtn = document.getElementById("sendQuickMessageBtn");
const sendQuickMessageBottomBtn = document.getElementById("sendQuickMessageBtnBottom");
const quickMessageInput = document.getElementById("quickMessage");

/* Seller info */
const followBtn = document.getElementById("followSellerBtn");
const sellerNameEl = document.getElementById("sellerName");
const sellerPostingSinceEl = document.getElementById("sellerPostingSince");
const sellerLastActiveEl = document.getElementById("sellerLastActive");

/* Features */
const propertyFeaturesBlock = document.getElementById("propertyFeaturesBlock");
const featureBadgesContainer = document.getElementById("featureBadges");

/* LIGHTBOX */
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImage");
const lightboxClose = document.getElementById("lightboxClose");

/* =====================================================
   LOGIN GUARD
===================================================== */
function requireLogin(auth, cb) {
  if (auth.currentUser) return cb();

  showToast("Please log in to contact the seller");
  setTimeout(() => {
    const login = document.getElementById("login");
    if (login) login.style.display = "flex";
  }, 1200);
}

/* =====================================================
   INIT
===================================================== */
export async function init({ auth }) {
  const params = new URLSearchParams(window.location.search);
  postId = params.get("id") || sessionStorage.getItem("viewPostId");
  if (!postId) return;

  const post = await getPost(postId);
  if (!post) {
    titleEl.textContent = "Post not found";
    return;
  }

  currentPost = post;
  sellerUid = post.userId || post.businessId;

  const seller = await getUser(sellerUid);

  renderSeller(seller);
  renderPost(post);
  bindActions(auth, post);
}

/* =====================================================
   RENDER SELLER
===================================================== */
function renderSeller(seller) {
  sellerNameEl.textContent = seller?.name || "Seller";

  sellerPostingSinceEl.textContent =
    seller?.createdAt
      ? `Posting since ${new Date(seller.createdAt).toLocaleDateString("en-GB")}`
      : "Posting since unknown";

  sellerLastActiveEl.textContent =
    seller?.lastActive
      ? `Active ${new Date(seller.lastActive).toLocaleDateString("en-GB")}`
      : "Active recently";
}

/* =====================================================
   TIME FORMAT
===================================================== */
function formatPostTime(ts) {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 60) return `Posted ${mins} minutes ago`;
  if (hrs < 24) return `Posted ${hrs} hours ago`;
  if (days === 1) return "Posted yesterday";
  return `Posted ${days} days ago`;
}

/* =====================================================
   PRICE RENDER
===================================================== */
function renderPrice(post) {
  let priceText = "";
  let tagText = "";

  const price = Number(post.price);

  if (!isNaN(price) && price > 0) {
    priceText = `£${price.toLocaleString("en-GB")}`;

    // Try to detect PCM / PW / etc.
    if (post.rentFrequency === "pcm" || post.frequency === "pcm") {
      tagText = "Per calendar month";
      priceText += " PCM";
    } else if (post.rentFrequency === "pw" || post.frequency === "pw") {
      tagText = "Per week";
      priceText += " PW";
    }
  } else {
    priceText = "Free";
    tagText = "No cost to claim";
  }

  priceEl.textContent = priceText;

  if (tagText) {
    priceTagEl.textContent = tagText;
    priceTagEl.style.display = "inline-flex";
  } else {
    priceTagEl.style.display = "none";
  }
}

/* =====================================================
   FEATURES RENDER
===================================================== */
const FEATURE_LABELS = {
  garden: "🌿 Garden access",
  southfacing: "🌞 South-facing",
  parking: "🚗 Off-road parking",
  offers: "💬 Open to offers",
  pets: "🐾 Pet friendly",
  renovated: "🛠 Newly renovated",
  furnished: "🛋 Furnished",
  unfurnished: "🏡 Unfurnished"
};

function renderFeatures(post) {
  const features =
    post.features ||
    post.propertyFeatures ||
    post.selectedFeatures ||
    [];

  if (!Array.isArray(features) || !features.length) {
    propertyFeaturesBlock.style.display = "none";
    return;
  }

  featureBadgesContainer.innerHTML = "";

  features.forEach(key => {
    const label = FEATURE_LABELS[key];
    if (!label) return;

    const span = document.createElement("span");
    span.className = "feature-badge";
    span.textContent = label;
    featureBadgesContainer.appendChild(span);
  });

  if (featureBadgesContainer.children.length) {
    propertyFeaturesBlock.style.display = "block";
  } else {
    propertyFeaturesBlock.style.display = "none";
  }
}

/* =====================================================
   RENDER POST
===================================================== */
function renderPost(post) {
  titleEl.textContent = post.title || "Untitled listing";
  descEl.textContent = post.description || "No description provided yet.";

  if (post.createdAt) {
    postTimeEl.textContent = formatPostTime(post.createdAt);
  }

  renderPrice(post);
  renderFeatures(post);

  galleryImages = [
    ...(post.imageUrls || []),
    post.imageUrl,
    ...(post.images || [])
  ].filter(Boolean);

  if (!galleryImages.length) {
    galleryImages = ["/images/image-webholder.webp"];
  }

  updateMainImage(0);

  // Setup reveal buttons based on post data
  setupRevealButtons(post);
}

/* =====================================================
   IMAGE GALLERY
===================================================== */
function updateMainImage(index) {
  if (index < 0) index = 0;
  if (index >= galleryImages.length) index = galleryImages.length - 1;

  currentIndex = index;
  mainImage.src = galleryImages[currentIndex];
  galleryCount.textContent = `${currentIndex + 1} / ${galleryImages.length}`;
}

if (mainImage) {
  mainImage.addEventListener("click", () => openLightbox(currentIndex));
}

/* =====================================================
   LIGHTBOX
===================================================== */
function openLightbox(index) {
  currentIndex = index;
  lightboxImg.src = galleryImages[currentIndex];
  lightbox.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox.classList.remove("active");
  document.body.style.overflow = "";
}

if (lightboxClose) {
  lightboxClose.addEventListener("click", closeLightbox);
}

/* =====================================================
   CONTACT / REVEAL BUTTONS
===================================================== */
function setupRevealButtons(post) {
  const rawPhone = post.phone || post.mobile || post.contactNumber;

  // Phone reveal
  if (rawPhone) {
    revealPhoneBtn.disabled = false;
  } else {
    revealPhoneBtn.disabled = true;
  }

  // WhatsApp reveal (only if phone exists + allowed)
  if (rawPhone && post.whatsappAllowed) {
    revealWhatsappBtn.style.display = "inline-flex";
  } else {
    revealWhatsappBtn.style.display = "none";
  }
}

/* =====================================================
   ACTIONS
===================================================== */
function bindActions(auth, post) {
  const rawPhone = post.phone || post.mobile || post.contactNumber;

  /* REVEAL PHONE */
  revealPhoneBtn.addEventListener("click", () => {
    if (!rawPhone) return;

    requireLogin(auth, async () => {
      try {
        await trackContactClick({
          postId,
          sellerUid,
          viewerUid: auth.currentUser.uid,
          type: "phone_reveal"
        });

        const clean = rawPhone.trim();
        phoneValueEl.textContent = clean;
        phoneValueEl.style.display = "inline";
        revealPhoneBtn.querySelector(".label").textContent = "Call";
        revealPhoneBtn.onclick = () => {
          window.location.href = `tel:${clean}`;
        };
      } catch (err) {
        console.error("Phone reveal failed", err);
        showToast("Failed to reveal phone");
      }
    });
  });

  /* REVEAL WHATSAPP */
  revealWhatsappBtn.addEventListener("click", () => {
    if (!rawPhone) return;

    requireLogin(auth, async () => {
      try {
        await trackContactClick({
          postId,
          sellerUid,
          viewerUid: auth.currentUser.uid,
          type: "whatsapp_reveal"
        });

        const clean = rawPhone.replace(/\D/g, "");
        whatsappValueEl.textContent = clean;
        whatsappValueEl.style.display = "inline";
        revealWhatsappBtn.querySelector(".label").textContent = "Open WhatsApp";
        revealWhatsappBtn.onclick = () => {
          window.location.href = `https://wa.me/${clean}`;
        };
      } catch (err) {
        console.error("WhatsApp reveal failed", err);
        showToast("Failed to reveal WhatsApp");
      }
    });
  });

  /* FOLLOW */
  followBtn.onclick = () => {
    requireLogin(auth, async () => {
      const following = await toggleFollowSeller(
        auth.currentUser.uid,
        sellerUid,
        true
      );
      followBtn.textContent = following ? "Following" : "Follow";
    });
  };

  /* QUICK MESSAGE (BOTH BUTTONS) */
  const sendMessageHandler = () => {
    requireLogin(auth, async () => {
      const text = (quickMessageInput.value || "").trim();
      if (!text) {
        showToast("Message cannot be empty");
        return;
      }

      try {
        const uid = auth.currentUser.uid;
        const convoId = [uid, sellerUid].sort().join("_");

        await setDoc(
          doc(window.firebaseDb, "conversations", convoId),
          {
            participants: [uid, sellerUid],
            updatedAt: Date.now(),
            lastMessage: text,
            lastMessageSender: uid
          },
          { merge: true }
        );

        await addDoc(
          collection(window.firebaseDb, "conversations", convoId, "messages"),
          {
            senderId: uid,
            text,
            createdAt: Date.now(),
            seen: false
          }
        );

        showToast("Message sent");
        quickMessageInput.value = "";

      } catch (err) {
        console.error("Message send failed", err);
        showToast("Failed to send message");
      }
    });
  };

  if (sendQuickMessageTopBtn) {
    sendQuickMessageTopBtn.addEventListener("click", (e) => {
      e.preventDefault();
      sendMessageHandler();
    });
  }

  if (sendQuickMessageBottomBtn) {
    sendQuickMessageBottomBtn.addEventListener("click", (e) => {
      e.preventDefault();
      sendMessageHandler();
    });
  }

  /* OPTIONAL: DELETE POST (if you still use it) */
  const deleteBtn = document.getElementById("deletePostBtn");
  if (deleteBtn) {
    const isOwner = auth.currentUser && auth.currentUser.uid === sellerUid;

    if (!isOwner) {
      deleteBtn.style.display = "none";
    } else {
      deleteBtn.style.display = "inline-flex";
      deleteBtn.onclick = async () => {
        const ok = confirm("Are you sure you want to delete this ad?");
        if (!ok) return;

        try {
          const fullPost = await getPost(postId);
          await deletePost(fullPost);

          showToast("Ad deleted");

          import("/index/js/main.js").then(({ loadView }) => {
            loadView("my-ads", { forceInit: true });
          });

        } catch (err) {
          console.error("Delete failed", err);
          showToast("Failed to delete ad");
        }
      };
    }
  }
}

/* =====================================================
   TOAST
===================================================== */
function showToast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.body.appendChild(el);

  requestAnimationFrame(() => {
    el.style.opacity = "1";
  });

  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }, 2000);
}
