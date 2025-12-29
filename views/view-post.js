import { 
  doc, 
  getDoc, 
  setDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { loadView } from "/index/js/main.js";

export async function init({ db, auth }) {
  const postId = sessionStorage.getItem("viewPostId");
  if (!postId) return;

  await new Promise(r => setTimeout(r, 50)); // ensure SPA DOM ready

  try {
    const postRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) return;

    const post = postSnap.data();
    const priceText = post.price ? `£${post.price}` : "Contact for price";

    // ===== TEXT INFO =====
    const safeSetText = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    safeSetText("viewTitle", post.title);
    safeSetText("viewDescription", post.description || post.teaser || "");
    safeSetText("viewCategory", post.category || "General");
    safeSetText("viewArea", post.area || "Rhondda");
    safeSetText("viewTime", post.posted || "Just now");
    ["viewPriceMobile", "viewPrice"].forEach(id => safeSetText(id, priceText));

    // ===== GALLERY =====
    const galleryContainer = document.getElementById("galleryContainer");
    if (!galleryContainer) return;
    galleryContainer.innerHTML = "";

    const images = post.images?.length ? post.images : ["/images/image-webholder.webp"];
    const slides = [];

    images.forEach((url, i) => {
      const img = document.createElement("img");
      img.src = url;
      img.alt = post.title;
      img.loading = "lazy";
      img.className = "gallery-image loading";
      if (i === 0) img.classList.add("active");
      img.addEventListener("load", () => img.classList.remove("loading"));
      galleryContainer.appendChild(img);
      slides.push(img);
    });

    const total = slides.length;

    // ===== DOTS =====
    const dotsContainer = document.getElementById("galleryDots");
    if (dotsContainer) {
      dotsContainer.innerHTML = "";
      slides.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = i === 0 ? "gallery-dot active" : "gallery-dot";
        dot.addEventListener("click", () => goToSlide(i));
        dotsContainer.appendChild(dot);
      });
    }

    // ===== SLIDE FUNCTIONS =====
    let currentIndex = 0;
    let zoomLevel = 1;

    function updateSlide(idx) {
      currentIndex = (idx + total) % total;
      slides.forEach((img, i) => {
        img.classList.toggle("active", i === currentIndex);
        img.style.transform = "scale(1)";
      });
      galleryContainer.style.transform = `translateX(-${currentIndex * 100}%)`;

      if (dotsContainer) {
        const dots = dotsContainer.querySelectorAll(".gallery-dot");
        dots.forEach((dot, i) => dot.classList.toggle("active", i === currentIndex));
      }

      zoomLevel = 1;
    }

    function goToSlide(idx) {
      updateSlide(idx);
    }

    updateSlide(0);

    // ===== DRAG / SWIPE =====
    let startX = 0, currentX = 0, isDragging = false;

    const startDrag = x => { 
      isDragging = true; 
      startX = x; 
      currentX = x; 
      galleryContainer.classList.add("dragging"); 
    };

    const moveDrag = x => {
      if (!isDragging) return;
      currentX = x;
      const delta = currentX - startX;
      const percent = (delta / galleryContainer.offsetWidth) * 100;
      galleryContainer.style.transform = 
        `translateX(calc(-${currentIndex * 100}% + ${percent}%)) scale(${zoomLevel})`;
    };

    const endDrag = () => {
      if (!isDragging) return;
      isDragging = false;
      galleryContainer.classList.remove("dragging");
      const delta = currentX - startX;
      if (Math.abs(delta) > galleryContainer.offsetWidth * 0.15) {
        delta < 0 ? goToSlide(currentIndex + 1) : goToSlide(currentIndex - 1);
      } else {
        updateSlide(currentIndex);
      }
    };

    galleryContainer.addEventListener("touchstart", e => 
      e.touches.length === 1 && startDrag(e.touches[0].clientX)
    );
    galleryContainer.addEventListener("touchmove", e => moveDrag(e.touches[0].clientX));
    galleryContainer.addEventListener("touchend", endDrag);

    galleryContainer.addEventListener("mousedown", e => { 
      e.preventDefault(); 
      startDrag(e.clientX); 
    });
    window.addEventListener("mousemove", e => moveDrag(e.clientX));
    window.addEventListener("mouseup", endDrag);

    // ===== ZOOM =====
    galleryContainer.addEventListener("wheel", e => {
      e.preventDefault();
      zoomLevel += e.deltaY < 0 ? 0.1 : -0.1;
      zoomLevel = Math.min(Math.max(zoomLevel, 1), 3);
      slides[currentIndex].style.transform = `scale(${zoomLevel})`;
    });

    let pinchStartDist = 0;
    galleryContainer.addEventListener("touchstart", e => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        pinchStartDist = Math.hypot(dx, dy);
      }
    });

    galleryContainer.addEventListener("touchmove", e => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        let scale = (dist / pinchStartDist) * zoomLevel;
        scale = Math.min(Math.max(scale, 1), 3);
        slides[currentIndex].style.transform = `scale(${scale})`;
      }
    });

    galleryContainer.addEventListener("touchend", e => {
      zoomLevel = parseFloat(
        slides[currentIndex].style.transform.replace("scale(", "").replace(")", "")
      ) || 1;
    });

    // ===== LIGHTBOX =====
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightboxImage");
    const lightboxClose = document.getElementById("lightboxClose");

    let lbIndex = 0;

    slides.forEach((img, i) => {
      img.style.cursor = "zoom-in";
      img.addEventListener("click", () => {
        lbIndex = i;
        lightboxImg.src = slides[lbIndex].src;
        lightbox.classList.add("active");
      });
    });

    const closeLightbox = () => lightbox.classList.remove("active");
    lightboxClose?.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", e => e.target === lightbox && closeLightbox());

    const goLightbox = delta => {
      lbIndex = (lbIndex + delta + slides.length) % slides.length;
      lightboxImg.src = slides[lbIndex].src;
    };

    window.addEventListener("keydown", e => {
      if (!lightbox.classList.contains("active")) return;
      if (e.key === "ArrowRight") goLightbox(1);
      if (e.key === "ArrowLeft") goLightbox(-1);
      if (e.key === "Escape") closeLightbox();
    });

    let lbStartX = 0;
    let lbDragging = false;

    lightbox.addEventListener("touchstart", e => {
      if (e.touches.length !== 1) return;
      lbStartX = e.touches[0].clientX;
      lbDragging = true;
    });

    lightbox.addEventListener("touchend", e => {
      if (!lbDragging) return;
      const delta = e.changedTouches[0].clientX - lbStartX;
      if (Math.abs(delta) > 50) delta < 0 ? goLightbox(1) : goLightbox(-1);
      lbDragging = false;
    });

    // ============================================================
    // ⭐ REAL MESSAGING SYSTEM (Firebase Conversations)
    // ============================================================

    async function startConversation(post) {
      const buyerId = auth.currentUser?.uid;
      const sellerId = post.userId;

      if (!buyerId) {
        return openScreen("login");
      }

      if (buyerId === sellerId) {
        alert("You cannot message yourself.");
        return;
      }

      // Stable conversation ID
      const convoId = [buyerId, sellerId].sort().join("_");

      // Create or update conversation
      await setDoc(doc(db, "conversations", convoId), {
        participants: [buyerId, sellerId],
        lastMessage: "",
        updatedAt: Date.now()
      }, { merge: true });

      // Store active conversation
      sessionStorage.setItem("activeConversationId", convoId);

      // Load chat screen
      loadView("chat");
    }

    // ===== ACTION BUTTONS =====
    const messageBtn = document.getElementById("messageSeller");
    const reportBtn = document.getElementById("reportPost");
    const contactBtn = document.getElementById("contactSeller");

    // Start conversation
    messageBtn?.addEventListener("click", () => startConversation(post));

    // Report
    reportBtn?.addEventListener("click", () => {
      if (confirm("Report this listing for review?")) 
        alert("Thank you. This listing has been flagged.");
    });

    // Contact seller (phone)
    if (post.contactNumber) {
      contactBtn.style.display = "block";
      contactBtn.addEventListener("click", () => {
        window.location.href = `tel:${post.contactNumber}`;
      });
    } else {
      contactBtn.style.display = "none";
    }

  } catch (err) {
    console.error("View Post Error:", err);
  }
}
