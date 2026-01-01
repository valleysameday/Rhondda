import { doc, getDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { loadView } from "/index/js/main.js";
function showToast(message) {
  alert(message);
}
/* ============================================================
   SAVE / UNSAVE BUTTON (With Haptics)
============================================================ */
async function toggleSave(postId, db, auth) {
  const uid = auth.currentUser?.uid;
  if (!uid) return showToast("Please log in to save ads", "error");

  // 2026 Standard: Haptic feedback for mobile
  if (window.navigator.vibrate) window.navigator.vibrate(10);

  const ref = doc(db, "users", uid, "savedPosts", postId);
  const snap = await getDoc(ref);
  const btn = document.getElementById("savePostBtn");

  if (snap.exists()) {
    await deleteDoc(ref);
    btn.classList.remove("saved");
    btn.querySelector("span").textContent = "Save";
    showToast("Removed from saved ads", "info");
  } else {
    await setDoc(ref, { postId, savedAt: Date.now() });
    btn.classList.add("saved");
    btn.querySelector("span").textContent = "Saved";
    showToast("Saved!", "success");
  }
}

/* ============================================================
   VIEW POST INITIALISATION
============================================================ */
export async function init({ db, auth }) {
  const postId = sessionStorage.getItem("viewPostId");
  if (!postId) return loadView("home");

  // Minor delay to ensure smooth transition
  await new Promise(r => setTimeout(r, 50));

  try {
    const postSnap = await getDoc(doc(db, "posts", postId));
    if (!postSnap.exists()) return loadView("home");

    const post = postSnap.data();
    const priceText = post.price ? `£${post.price}` : "Contact for price";

    // Text Content Mapping
    const safeSetText = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    safeSetText("viewTitle", post.title);
    safeSetText("viewDescription", post.description || post.teaser || "No description provided.");
    safeSetText("viewCategory", post.category || "General");
    safeSetText("viewArea", post.area || "Rhondda");
    safeSetText("viewTime", post.posted || "Just now");
    safeSetText("viewPriceMobile", priceText);

    /* ============================================================
       CONTACT & REVEAL LOGIC
    ============================================================ */
    const revealBtn = document.getElementById("revealNumberBtn");
    const revealedNum = document.getElementById("revealedNumber");

    if (post.phone) {
      revealBtn.onclick = () => {
        revealBtn.style.display = "none";
        revealedNum.innerHTML = `<a href="tel:${post.phone}" class="phone-link">${post.phone}</a>`;
        revealedNum.style.display = "block";
      };
    } else {
      revealBtn.style.display = "none";
    }

    /* ============================================================
       GALLERY & LIGHTBOX (Modern Implementation)
    ============================================================ */
    const preview = document.getElementById("galleryPreview");
    const imageCount = document.getElementById("imageCount");
    const lightbox = document.getElementById("lightbox");
    const lightboxTrack = document.getElementById("lightboxTrack");
    const closeBtn = document.getElementById("lightboxClose");

    const images = post.images?.length ? post.images : ["/images/image-webholder.webp"];
    let currentIndex = 0;

    // Build Premium Preview
    preview.innerHTML = "";
    images.slice(0, 3).forEach((src, i) => {
      const img = document.createElement("img");
      img.src = src;
      img.loading = "lazy";
      // First image is "main", others are sidebar thumbs
      img.className = i === 0 ? "main" : "thumb";
      img.onclick = () => openLightbox(i);
      preview.appendChild(img);
    });

    imageCount.textContent = `${images.length} photos`;

    // Build Lightbox Track
    lightboxTrack.innerHTML = "";
    images.forEach(src => {
      const slide = document.createElement("div");
      slide.style.minWidth = "100%";
      slide.style.display = "flex";
      slide.style.justifyContent = "center";
      slide.style.alignItems = "center";
      
      const img = document.createElement("img");
      img.src = src;
      slide.appendChild(img);
      lightboxTrack.appendChild(slide);
    });

    const openLightbox = (index) => {
      currentIndex = index;
      updateLightboxPosition();
      lightbox.classList.add("active");
      document.body.style.overflow = "hidden"; // Prevent scroll
    };

    const updateLightboxPosition = () => {
      lightboxTrack.style.transition = "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)";
      lightboxTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
    };

    closeBtn.onclick = () => {
      lightbox.classList.remove("active");
      document.body.style.overflow = "";
    };

    /* Swipe Physics for 2026 Displays */
    let startX = 0;
    let currentTranslate = 0;

    lightboxTrack.addEventListener("touchstart", e => {
        startX = e.touches[0].clientX;
        lightboxTrack.style.transition = "none";
    });

    lightboxTrack.addEventListener("touchmove", e => {
        const moveX = e.touches[0].clientX - startX;
        const translate = (-currentIndex * lightboxTrack.offsetWidth) + moveX;
        lightboxTrack.style.transform = `translateX(${translate}px)`;
    });

    lightboxTrack.addEventListener("touchend", e => {
        const endX = e.changedTouches[0].clientX;
        const diff = startX - endX;

        if (Math.abs(diff) > 80) {
            if (diff > 0 && currentIndex < images.length - 1) currentIndex++;
            else if (diff < 0 && currentIndex > 0) currentIndex--;
        }
        updateLightboxPosition();
    });

    /* ============================================================
       BUTTON ACTIONS (Share, Chat, Save)
    ============================================================ */
    
    // Save Post
    const saveBtn = document.getElementById("savePostBtn");
    if (saveBtn && auth.currentUser) {
      const savedSnap = await getDoc(doc(db, "users", auth.currentUser.uid, "savedPosts", postId));
      if (savedSnap.exists()) {
        saveBtn.classList.add("saved");
        saveBtn.querySelector("span").textContent = "Saved";
      }
      saveBtn.onclick = () => toggleSave(postId, db, auth);
    }

    // Share Post
    document.getElementById("sharePostBtn")?.addEventListener("click", async () => {
      const shareData = {
        title: post.title,
        text: `Check out this ${post.title} for ${priceText} in ${post.area || 'Rhondda'}`,
        url: window.location.href
      };
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(window.location.href);
        showToast("Link copied to clipboard!", "success");
      }
    });

    // Chat Logic
    document.getElementById("messageSeller")?.addEventListener("click", async () => {
      const buyerId = auth.currentUser?.uid;
      if (!buyerId) return loadView("login");
      if (buyerId === post.userId) return showToast("This is your own ad", "info");

      const convoId = [buyerId, post.userId, postId].sort().join("_");
      await setDoc(doc(db, "conversations", convoId), {
        participants: [buyerId, post.userId],
        postId,
        updatedAt: Date.now(),
        lastMessage: "Interested in " + post.title
      }, { merge: true });

      sessionStorage.setItem("activeConversationId", convoId);
      loadView("chat", { forceInit: true });
    });

    // Navigation
    document.getElementById("backToFeed").onclick = () => loadView("home");
    document.getElementById("viewSellerProfileBtn").onclick = () => {
      sessionStorage.setItem("profileUserId", post.userId);
      loadView("seller-profile", { forceInit: true });
    };

  } catch (err) {
    console.error("2026 Init Error:", err);
    showToast("Error loading post details", "error");
  }
}
