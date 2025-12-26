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

    // ========== TEXT ==========
    document.getElementById("viewTitle").textContent = post.title;
    document.getElementById("viewDescription").textContent = post.description || post.teaser || "";
    document.getElementById("viewCategory").textContent = post.category || "General";

    const areaText = post.area || "Rhondda";
    document.getElementById("viewArea").textContent = areaText;

    const timeEl = document.getElementById("viewTime");
    if (timeEl) timeEl.textContent = post.posted || "Just now";

    ["viewPriceMobile", "viewPrice"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = priceText;
    });

    // ========== GALLERY ==========
    const track = document.getElementById("galleryContainer");
    if (!track) return;
    track.innerHTML = "";

    const images = post.images?.length ? post.images : ["/images/post-placeholder.jpg"];

    images.forEach((url, i) => {
      const img = document.createElement("img");
      img.src = url;
      img.alt = post.title;
      img.loading = "lazy";
      img.classList.add("gallery-image", "loading");
      if (i === 0) img.classList.add("active");
      img.addEventListener("load", () => img.classList.remove("loading"));
      track.appendChild(img);
    });

    const slides = Array.from(track.querySelectorAll(".gallery-image"));
    const total = slides.length;

    document.getElementById("totalImg").textContent = total;

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

    const updateTrackTransform = idx => {
      track.style.transform = `translateX(-${idx * 100}%)`;
      slides.forEach((img, i) => img.classList.toggle("active", i === idx));

      const currentCounter = document.getElementById("currentImg");
      if (currentCounter) currentCounter.textContent = idx + 1;

      if (dotsContainer) {
        const dots = dotsContainer.querySelectorAll(".gallery-dot");
        dots.forEach((dot, i) => dot.classList.toggle("active", i === idx));
      }
    };

    const goToSlide = idx => {
      if (!total) return;
      currentIndex = (idx + total) % total;
      updateTrackTransform(currentIndex);
    };

    updateTrackTransform(0);

    // Gallery nav buttons
    document.getElementById("galleryPrev")?.addEventListener("click", () => goToSlide(currentIndex - 1));
    document.getElementById("galleryNext")?.addEventListener("click", () => goToSlide(currentIndex + 1));

    // Touch / drag support
    let touchStartX = 0, touchCurrentX = 0, isDragging = false;

    const startDrag = x => { isDragging = true; touchStartX = x; touchCurrentX = x; track.classList.add("dragging"); };
    const moveDrag = x => {
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
      const threshold = track.offsetWidth * 0.15;
      if (Math.abs(delta) > threshold) delta < 0 ? goToSlide(currentIndex + 1) : goToSlide(currentIndex - 1);
      else updateTrackTransform(currentIndex);
    };

    track.addEventListener("touchstart", e => e.touches.length === 1 && startDrag(e.touches[0].clientX));
    track.addEventListener("touchmove", e => moveDrag(e.touches[0].clientX));
    track.addEventListener("touchend", endDrag);
    track.addEventListener("mousedown", e => { e.preventDefault(); startDrag(e.clientX); });
    window.addEventListener("mousemove", e => moveDrag(e.clientX));
    window.addEventListener("mouseup", endDrag);

    // Actions
    const handleContact = () => alert(`Chat with seller coming soon! Ref: ${post.userId}`);
    document.getElementById("messageSeller")?.addEventListener("click", handleContact);

    document.getElementById("reportPost")?.addEventListener("click", () => {
      if (confirm("Report this listing for review?")) alert("Thank you. This listing has been flagged for review.");
    });

  } catch (err) {
    console.error("View Post Error:", err);
  }
}
