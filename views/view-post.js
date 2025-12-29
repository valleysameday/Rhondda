import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export async function init({ db }) {
  const postId = sessionStorage.getItem("viewPostId");
  if (!postId) return;

  // Wait a tick to ensure SPA DOM is ready
  await new Promise(r => setTimeout(r, 50));

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

    const images = post.images?.length ? post.images : ["/images/post-placeholder.jpg"];
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
    safeSetText("totalImg", total);

    // Dots
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

    function updateSlide(idx) {
      currentIndex = (idx + total) % total;
      slides.forEach((img, i) => img.classList.toggle("active", i === currentIndex));
      galleryContainer.style.transform = `translateX(-${currentIndex * 100}%)`;
      safeSetText("currentImg", currentIndex + 1);
      if (dotsContainer) {
        const dots = dotsContainer.querySelectorAll(".gallery-dot");
        dots.forEach((dot, i) => dot.classList.toggle("active", i === currentIndex));
      }
    }

    function goToSlide(idx) {
      updateSlide(idx);
    }

    updateSlide(0);

    // ===== NAV BUTTONS =====
    document.getElementById("galleryPrev")?.addEventListener("click", () => goToSlide(currentIndex - 1));
    document.getElementById("galleryNext")?.addEventListener("click", () => goToSlide(currentIndex + 1));

    // ===== TOUCH / DRAG =====
    let startX = 0, currentX = 0, isDragging = false;

    const startDrag = x => { isDragging = true; startX = x; currentX = x; galleryContainer.classList.add("dragging"); };
    const moveDrag = x => {
      if (!isDragging) return;
      currentX = x;
      const delta = currentX - startX;
      const percent = (delta / galleryContainer.offsetWidth) * 100;
      galleryContainer.style.transform = `translateX(calc(-${currentIndex * 100}% + ${percent}%))`;
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

    galleryContainer.addEventListener("touchstart", e => e.touches.length === 1 && startDrag(e.touches[0].clientX));
    galleryContainer.addEventListener("touchmove", e => moveDrag(e.touches[0].clientX));
    galleryContainer.addEventListener("touchend", endDrag);
    galleryContainer.addEventListener("mousedown", e => { e.preventDefault(); startDrag(e.clientX); });
    window.addEventListener("mousemove", e => moveDrag(e.clientX));
    window.addEventListener("mouseup", endDrag);

    // ===== LIGHTBOX =====
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightboxImage");
    const lightboxClose = document.getElementById("lightboxClose");

    slides.forEach(img => {
      img.style.cursor = "zoom-in";
      img.addEventListener("click", () => {
        lightboxImg.src = img.src;
        lightbox.classList.add("active");
      });
    });

    const closeLightbox = () => lightbox.classList.remove("active");
    lightboxClose?.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", e => e.target === lightbox && closeLightbox());

    // LIGHTBOX SWIPE
    let lbStartX = 0, lbDragging = false;

    lightbox.addEventListener("touchstart", e => {
      if (e.touches.length !== 1) return;
      lbStartX = e.touches[0].clientX;
      lbDragging = true;
    });
    lightbox.addEventListener("touchend", e => {
      if (!lbDragging) return;
      const delta = e.changedTouches[0].clientX - lbStartX;
      if (Math.abs(delta) > 50) delta < 0 ? goToSlide(currentIndex + 1) : goToSlide(currentIndex - 1);
      lightboxImg.src = slides[currentIndex].src;
      lbDragging = false;
    });
    lightbox.addEventListener("mousedown", e => { lbStartX = e.clientX; lbDragging = true; });
    window.addEventListener("mouseup", e => {
      if (!lbDragging) return;
      const delta = e.clientX - lbStartX;
      if (Math.abs(delta) > 50) delta < 0 ? goToSlide(currentIndex + 1) : goToSlide(currentIndex - 1);
      lightboxImg.src = slides[currentIndex].src;
      lbDragging = false;
    });

    // ===== ACTION BUTTONS =====
    document.getElementById("messageSeller")?.addEventListener("click", () => alert(`Chat with seller coming soon! Ref: ${post.userId}`));
    document.getElementById("reportPost")?.addEventListener("click", () => {
      if (confirm("Report this listing for review?")) alert("Thank you. This listing has been flagged.");
    });

  } catch (err) {
    console.error("View Post Error:", err);
  }
}
