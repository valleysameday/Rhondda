// /views/view-post.js
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export async function init({ db }) {
  const postId = sessionStorage.getItem("viewPostId");
  if (!postId) return;

  try {
    const postRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) return;

    const post = postSnap.data();
    const priceText = post.price ? `£${post.price}` : "Contact for price";

    /* ========= TEXT MAPPING ========= */
    document.getElementById("viewTitle").textContent = post.title;
    document.getElementById("viewDescription").textContent =
      post.description || post.teaser || "";
    document.getElementById("viewCategory").textContent =
      post.category || "General";

    const areaText = post.area || "Rhondda";
    const areaElMobile = document.getElementById("viewArea");
    const areaElDesk = document.getElementById("viewAreaDesk");
    if (areaElMobile) areaElMobile.textContent = areaText;
    if (areaElDesk) areaElDesk.textContent = areaText;

    const timeEl = document.getElementById("viewTime");
    if (timeEl) timeEl.textContent = post.posted || "Just now";

    ["viewPrice", "viewPriceMobile", "viewPriceFloating"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = priceText;
    });

    /* ========= GALLERY SETUP ========= */
    const track = document.getElementById("galleryContainer");
    if (!track) return;

    // Clear any existing content (defensive)
    track.innerHTML = "";

    const images = post.images?.length
      ? post.images
      : ["/images/post-placeholder.jpg"];

    images.forEach((url, i) => {
      const img = document.createElement("img");
      img.src = url;
      img.alt = post.title;
      img.loading = "lazy";
      img.classList.add("gallery-image", "loading");
      if (i === 0) img.classList.add("active");

      img.addEventListener("load", () => {
        img.classList.remove("loading");
      });

      track.appendChild(img);
    });

    const slides = Array.from(track.querySelectorAll(".gallery-image"));
    const total = slides.length;

    const currentCounter = document.getElementById("currentImg");
    const totalCounter = document.getElementById("totalImg");
    if (totalCounter) totalCounter.textContent = total;

    const dotsContainer = document.getElementById("galleryDots");
    if (dotsContainer) {
      dotsContainer.innerHTML = "";
      slides.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "gallery-dot" + (i === 0 ? " active" : "");
        dot.setAttribute("aria-label", `Show image ${i + 1}`);
        dot.addEventListener("click", () => goToSlide(i));
        dotsContainer.appendChild(dot);
      });
    }

    let currentIndex = 0;

    const updateTrackTransform = (idx) => {
      track.style.transform = `translateX(-${idx * 100}%)`;
      slides.forEach((img, i) => {
        img.classList.toggle("active", i === idx);
      });
      if (currentCounter) currentCounter.textContent = idx + 1;

      if (dotsContainer) {
        const dots = dotsContainer.querySelectorAll(".gallery-dot");
        dots.forEach((dot, i) => {
          dot.classList.toggle("active", i === idx);
        });
      }
    };

    const goToSlide = (idx) => {
      if (!total) return;
      currentIndex = (idx + total) % total;
      updateTrackTransform(currentIndex);
    };

    // Initial position
    updateTrackTransform(0);

    /* ========= DESKTOP CONTROLS ========= */
    const prevBtn = document.getElementById("galleryPrev");
    const nextBtn = document.getElementById("galleryNext");

    if (prevBtn) {
      prevBtn.onclick = () => {
        goToSlide(currentIndex - 1);
      };
    }

    if (nextBtn) {
      nextBtn.onclick = () => {
        goToSlide(currentIndex + 1);
      };
    }

    /* ========= TOUCH SWIPE (MOBILE) ========= */
    let touchStartX = 0;
    let touchCurrentX = 0;
    let isDragging = false;

    const startDrag = (x) => {
      isDragging = true;
      touchStartX = x;
      touchCurrentX = x;
      track.classList.add("dragging");
    };

    const moveDrag = (x) => {
      if (!isDragging) return;
      touchCurrentX = x;
      const delta = touchCurrentX - touchStartX;
      const percent = (delta / track.offsetWidth) * 100;
      track.style.transform = `translateX(calc(-${currentIndex * 100}% + ${percent}%))`;
    };

    const endDrag = () => {
      if (!isDragging) return;
      isDragging = false;
      track.classList.remove("dragging");

      const delta = touchCurrentX - touchStartX;
      const threshold = track.offsetWidth * 0.15; // 15% of width

      if (Math.abs(delta) > threshold) {
        if (delta < 0) {
          goToSlide(currentIndex + 1);
        } else {
          goToSlide(currentIndex - 1);
        }
      } else {
        updateTrackTransform(currentIndex);
      }
    };

    track.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 1) return;
      startDrag(e.touches[0].clientX);
    });

    track.addEventListener("touchmove", (e) => {
      if (!isDragging) return;
      moveDrag(e.touches[0].clientX);
    });

    track.addEventListener("touchend", () => {
      endDrag();
    });

    track.addEventListener("mousedown", (e) => {
      // Allow mouse drag on desktop too
      e.preventDefault();
      startDrag(e.clientX);
    });

    window.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      moveDrag(e.clientX);
    });

    window.addEventListener("mouseup", () => {
      if (!isDragging) return;
      endDrag();
    });

    /* ========= ACTIONS ========= */
    const handleContact = () => {
      alert(`Chat with seller coming soon! Ref: ${post.userId}`);
    };

    const msgSellerBtn = document.getElementById("messageSeller");
    const msgSellerMobileBtn = document.getElementById("messageSellerMobile");
    if (msgSellerBtn) msgSellerBtn.onclick = handleContact;
    if (msgSellerMobileBtn) msgSellerMobileBtn.onclick = handleContact;

    const reportBtn = document.getElementById("reportPost");
    if (reportBtn) {
      reportBtn.onclick = () => {
        if (confirm("Report this listing for review?")) {
          alert("Thank you. This listing has been flagged for review.");
        }
      };
    }
  } catch (err) {
    console.error("View Post Error:", err);
  }
}
