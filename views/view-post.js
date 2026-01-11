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

/* =====================================================
   DOM
===================================================== */
const titleEl = document.getElementById("postTitle");
const priceEl = document.getElementById("postPrice");
const descEl = document.getElementById("postDescription");
const postTimeEl = document.getElementById("postTime");

const mainImage = document.getElementById("mainImage");
const galleryCount = document.getElementById("galleryCount");

const callBtn = document.getElementById("callSellerBtn");
const whatsappBtn = document.getElementById("whatsappSellerBtn");
const followBtn = document.getElementById("followSellerBtn");

const sellerNameEl = document.getElementById("sellerName");
const sellerPostingSinceEl = document.getElementById("sellerPostingSince");
const sellerLastActiveEl = document.getElementById("sellerLastActive");

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
   RENDER POST
===================================================== */
function renderPost(post) {
  titleEl.textContent = post.title || "Untitled";
  priceEl.textContent = post.price ? `£${post.price}` : "Free";
  descEl.textContent = post.description || "No description provided.";

  if (post.createdAt) {
    postTimeEl.textContent = formatPostTime(post.createdAt);
  }

  galleryImages = [
    ...(post.imageUrls || []),
    post.imageUrl,
    ...(post.images || [])
  ].filter(Boolean);

  if (!galleryImages.length) {
    galleryImages = ["/images/image-webholder.webp"];
  }

  updateMainImage(0);
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

mainImage.addEventListener("click", () => openLightbox(currentIndex));

/* =====================================================
   LIGHTBOX
===================================================== */
function openLightbox(index) {
  currentIndex = index;
  lightboxImg.src = galleryImages[currentIndex];
  lightbox.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox.style.display = "none";
  document.body.style.overflow = "";
}

let startX = 0;
let endX = 0;

lightbox.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
}, { passive: true });

lightbox.addEventListener("touchend", e => {
  endX = e.changedTouches[0].clientX;
  handleSwipe();
});

function handleSwipe() {
  const diff = startX - endX;

  if (Math.abs(diff) < 40) return; // dead zone

  if (diff > 0) {
    // swipe left → next
    currentIndex = (currentIndex + 1) % galleryImages.length;
  } else {
    // swipe right → previous
    currentIndex =
      (currentIndex - 1 + galleryImages.length) % galleryImages.length;
  }

  lightboxImg.src = galleryImages[currentIndex];
}

lightboxClose.addEventListener("click", closeLightbox);

/* =====================================================
   ACTIONS
===================================================== */
function bindActions(auth, post) {

  /* CALL */
  if (post.phone) {
    callBtn.style.display = "inline-flex";
    callBtn.onclick = function () {
      requireLogin(auth, async function () {
        await trackContactClick({
          postId,
          sellerUid,
          viewerUid: auth.currentUser.uid,
          type: "call"
        });

        window.location.href = `tel:${post.phone}`;
      });
    };
  } else {
    callBtn.style.display = "none";
  }

  /* WHATSAPP */
  if (post.phone && post.whatsappAllowed) {
    whatsappBtn.style.display = "inline-flex";
    whatsappBtn.onclick = function () {
      requireLogin(auth, async function () {
        await trackContactClick({
          postId,
          sellerUid,
          viewerUid: auth.currentUser.uid,
          type: "whatsapp"
        });

        const clean = post.phone.replace(/\D/g, "");
        window.location.href = `https://wa.me/${clean}`;
      });
    };
  } else {
    whatsappBtn.style.display = "none";
  }

  /* FOLLOW */
  followBtn.onclick = function () {
    requireLogin(auth, async function () {
      const following = await toggleFollowSeller(
        auth.currentUser.uid,
        sellerUid,
        true
      );
      followBtn.textContent = following ? "Following" : "Follow";
    });
  };

  /* SEND QUICK MESSAGE (NO REDIRECT) */
  const sendQuickMessageBtn = document.getElementById("sendQuickMessageBtn");
  const quickMessageInput = document.getElementById("quickMessage");

  if (sendQuickMessageBtn) {
    sendQuickMessageBtn.onclick = async () => {
      requireLogin(auth, async () => {
        const text = quickMessageInput.value.trim();
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
  }

  /* DELETE POST */
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
  el.textContent = msg;
  el.style.cssText = `
    position:fixed;
    bottom:20px;
    left:50%;
    transform:translateX(-50%);
    background:rgba(0,0,0,0.85);
    color:#fff;
    padding:12px 18px;
    border-radius:8px;
    font-size:15px;
    z-index:999999;
    opacity:0;
    transition:opacity .3s;
  `;
  document.body.appendChild(el);

  requestAnimationFrame(() => (el.style.opacity = "1"));
  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }, 2000);
}
