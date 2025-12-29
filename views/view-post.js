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

    /* ================= TEXT ================= */
    document.getElementById("viewTitle").textContent = post.title;
    document.getElementById("viewDescription").textContent =
      post.description || post.teaser || "";
    document.getElementById("viewCategory").textContent =
      post.category || "General";
    document.getElementById("viewArea").textContent = post.area || "Rhondda";

    ["viewPriceMobile", "viewPrice"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = priceText;
    });

    /* ================= GALLERY ================= */
    const track = document.getElementById("galleryContainer");
    if (!track) return;
    track.innerHTML = "";

    const images = post.images?.length
      ? post.images
      : ["/images/post-placeholder.jpg"];

    const lightbox = document.getElementById("imageLightbox");
    const lightboxImg = document.getElementById("lightboxImage");
    const lightboxClose = document.querySelector(".lightbox-close");

    let slides = [];
    let currentIndex = 0;

    images.forEach((url, i) => {
      const img = document.createElement("img");
      img.src = url;
      img.alt = post.title;
      img.loading = "lazy";
      img.className = "gallery-image";
      if (i === 0) img.classList.add("active");

      img.addEventListener("click", () => {
        lightboxImg.src = url;
        lightbox.hidden = false;
        document.body.style.overflow = "hidden";
      });

      track.appendChild(img);
      slides.push(img);
    });

    const total = slides.length;
    document.getElementById("totalImg").textContent = total;

    /* ================= LIGHTBOX CLOSE ================= */
    const closeLightbox = () => {
      lightbox.hidden = true;
      lightboxImg.src = "";
      document.body.style.overflow = "";
    };

    lightboxClose.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", e => {
      if (e.target === lightbox) closeLightbox();
    });

    window.addEventListener("keydown", e => {
      if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
    });

    /* ================= SLIDER ================= */
    const dotsContainer = document.getElementById("galleryDots");
    if (dotsContainer) {
      dotsContainer.innerHTML = "";
      slides.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.className = "gallery-dot" + (i === 0 ? " active" : "");
        dot.addEventListener("click", () => goToSlide(i));
        dotsContainer.appendChild(dot);
      });
    }

    const updateSlide = idx => {
      track.style.transform = `translateX(-${idx * 100}%)`;
      slides.forEach((img, i) =>
        img.classList.toggle("active", i === idx)
      );

      document.getElementById("currentImg").textContent = idx + 1;

      if (dotsContainer) {
        dotsContainer
          .querySelectorAll(".gallery-dot")
          .forEach((dot, i) =>
            dot.classList.toggle("active", i === idx)
          );
      }
    };

    const goToSlide = idx => {
      currentIndex = (idx + total) % total;
      updateSlide(currentIndex);
    };

    updateSlide(0);

    document
      .getElementById("galleryPrev")
      ?.addEventListener("click", () => goToSlide(currentIndex - 1));
    document
      .getElementById("galleryNext")
      ?.addEventListener("click", () => goToSlide(currentIndex + 1));

    /* ================= TOUCH / DRAG ================= */
    let startX = 0;
    let isDragging = false;

    track.addEventListener("touchstart", e => {
      startX = e.touches[0].clientX;
      isDragging = true;
    });

    track.addEventListener("touchend", e => {
      if (!isDragging) return;
      const delta = e.changedTouches[0].clientX - startX;
      if (Math.abs(delta) > 50) {
        delta < 0 ? goToSlide(currentIndex + 1) : goToSlide(currentIndex - 1);
      }
      isDragging = false;
    });

    track.addEventListener("mousedown", e => {
      startX = e.clientX;
      isDragging = true;
    });

    window.addEventListener("mouseup", e => {
      if (!isDragging) return;
      const delta = e.clientX - startX;
      if (Math.abs(delta) > 50) {
        delta < 0 ? goToSlide(currentIndex + 1) : goToSlide(currentIndex - 1);
      }
      isDragging = false;
    });

    /* ================= ACTIONS ================= */
    document
      .getElementById("messageSeller")
      ?.addEventListener("click", () =>
        alert("Messaging coming soon")
      );

    document
      .getElementById("reportPost")
      ?.addEventListener("click", () => {
        if (confirm("Report this post?")) {
          alert("Post reported. Thank you.");
        }
      });

  } catch (err) {
    console.error("View Post Error:", err);
  }
}
