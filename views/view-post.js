import { doc, getDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { loadView } from "/index/js/main.js";

/* ============================================================
   SAVE / UNSAVE BUTTON
============================================================ */
async function toggleSave(postId, db, auth) {
  const uid = auth.currentUser?.uid;
  if (!uid) return showToast("Please log in to save ads", "error");

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

  await new Promise(r => setTimeout(r, 50));

  try {
    const postSnap = await getDoc(doc(db, "posts", postId));
    if (!postSnap.exists()) return loadView("home");

    const post = postSnap.data();
    const priceText = post.price ? `£${post.price}` : "Contact for price";

    document.getElementById("viewSellerProfileBtn").onclick = () => {
      sessionStorage.setItem("profileUserId", post.userId);
      loadView("seller-profile", { forceInit: true });
    };

    const safeSetText = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    safeSetText("viewTitle", post.title);
    safeSetText("viewDescription", post.description || post.teaser || "");
    safeSetText("viewCategory", post.category || "General");
    safeSetText("viewArea", post.area || "Rhondda");
    safeSetText("viewTime", post.posted || "Just now");
    ["viewPrice", "viewPriceMobile"].forEach(id => safeSetText(id, priceText));

    /* ============================================================
       SAVE BUTTON
    ============================================================ */
    const saveBtn = document.getElementById("savePostBtn");
    if (saveBtn && auth.currentUser) {
      const savedSnap = await getDoc(
        doc(db, "users", auth.currentUser.uid, "savedPosts", postId)
      );
      if (savedSnap.exists()) {
        saveBtn.classList.add("saved");
        saveBtn.querySelector("span").textContent = "Saved";
      }
      saveBtn.onclick = () => toggleSave(postId, db, auth);
    }

    /* ============================================================
       SHARE BUTTON
    ============================================================ */
    document.getElementById("sharePostBtn")?.addEventListener("click", async () => {
      const url = window.location.href;
      const shareText = `
🏷️ ${post.title}
💷 ${post.price ? "£" + post.price : "Contact for price"}
📍 ${post.area || "Rhondda"}
📁 ${post.category || "General"}

View on Rhondda Noticeboard:
${url}`.trim();

      if (navigator.share) {
        await navigator.share({ title: post.title, text: shareText, url });
      } else {
        await navigator.clipboard.writeText(shareText);
        showToast("Share text copied!", "success");
      }
    });

    /* ============================================================
       MESSAGE SELLER
    ============================================================ */
    document.getElementById("messageSeller")?.addEventListener("click", async () => {
      const buyerId = auth.currentUser?.uid;
      if (!buyerId) return loadView("login");
      if (buyerId === post.userId) return;

      const convoId = `${buyerId}_${post.userId}_${postId}`;

      await setDoc(
        doc(db, "conversations", convoId),
        {
          participants: [buyerId, post.userId],
          postId,
          updatedAt: Date.now()
        },
        { merge: true }
      );

      sessionStorage.setItem("activeConversationId", convoId);
      loadView("chat", { forceInit: true });
    });

    /* ============================================================
       BACK + REPORT
    ============================================================ */
    document.getElementById("backToFeed").onclick = () => {
      sessionStorage.removeItem("viewPostId");
      loadView("home", { forceInit: true });
    };

    document.getElementById("reportPost")?.addEventListener("click", () => {
      if (confirm("Report this listing for review?")) {
        alert("Thank you. This listing has been flagged.");
      }
    });

    /* ============================================================
       NEW GALLERY PREVIEW + LIGHTBOX (LAZY LOADED)
    ============================================================ */

    const preview = document.getElementById("galleryPreview");
    const imageCount = document.getElementById("imageCount");
    const lightbox = document.getElementById("lightbox");
    const lightboxTrack = document.getElementById("lightboxTrack");
    const closeBtn = document.getElementById("lightboxClose");

    const images = post.images?.length
      ? post.images
      : ["/images/image-webholder.webp"];

    let currentIndex = 0;

    /* Build preview (3 images) */
    preview.innerHTML = "";
    images.slice(0, 3).forEach((src, i) => {
      const img = document.createElement("img");
      img.src = src;
      img.loading = "lazy";
      img.className = i === 0 ? "main" : "";
      img.onclick = () => openLightbox(i);
      preview.appendChild(img);
    });

    imageCount.textContent = `${images.length} photos`;

    /* Build lightbox */
    lightboxTrack.innerHTML = "";
    images.forEach(src => {
      const img = document.createElement("img");
      img.src = src;
      img.loading = "lazy";
      lightboxTrack.appendChild(img);
    });

    const updateLightbox = () => {
      lightboxTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
    };

    const openLightbox = index => {
      currentIndex = index;
      updateLightbox();
      lightbox.classList.add("active");
    };

    closeBtn.onclick = () => lightbox.classList.remove("active");

    /* Swipe */
    let startX = 0;
    lightboxTrack.addEventListener("touchstart", e => {
      startX = e.touches[0].clientX;
    });

    lightboxTrack.addEventListener("touchend", e => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) {
        if (dx < 0 && currentIndex < images.length - 1) currentIndex++;
        if (dx > 0 && currentIndex > 0) currentIndex--;
        updateLightbox();
      }
    });

    lightbox.addEventListener("click", e => {
      if (e.target === lightbox) lightbox.classList.remove("active");
    });

  } catch (err) {
    console.error("View Post Error:", err);
  }
}
