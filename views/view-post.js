import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { loadView } from "/index/js/main.js";

export async function init({ db, auth }) {
  const postId = sessionStorage.getItem("viewPostId");
  if (!postId) return loadView("home");

  await new Promise(r => setTimeout(r, 50)); // tiny delay for DOM ready

  try {
    const postSnap = await getDoc(doc(db, "posts", postId));
    if (!postSnap.exists()) return loadView("home");

    const post = postSnap.data();
    const priceText = post.price ? `£${post.price}` : "Contact for price";

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

    // Messaging button
    document.getElementById("messageSeller")?.addEventListener("click", async () => {
      const buyerId = auth.currentUser?.uid;
      const sellerId = post.userId;
      if (!buyerId) return loadView("login");
      if (buyerId === sellerId) return;

      const convoId = `${buyerId}_${sellerId}_${postId}`;
      await setDoc(
        doc(db, "conversations", convoId),
        {
          participants: [buyerId, sellerId],
          postId,
          lastMessage: "",
          lastMessageSender: "",
          updatedAt: Date.now()
        },
        { merge: true }
      );

      sessionStorage.setItem("activeConversationId", convoId);
      loadView("chat", { forceInit: true });
    });

    document.getElementById("backToFeed").addEventListener("click", () => {
  sessionStorage.removeItem("viewPostId");
  loadView("home", { forceInit: true });
});

    document.getElementById("reportPost")?.addEventListener("click", () => {
      if (confirm("Report this listing for review?")) {
        alert("Thank you. This listing has been flagged.");
      }
    });

    // Gallery setup
    const gallery = document.getElementById("galleryContainer");
    const dotsContainer = document.getElementById("galleryDots");
    if (!gallery) return;

    gallery.innerHTML = "";
    if (dotsContainer) dotsContainer.innerHTML = "";

    const images = post.images?.length ? post.images : ["/images/image-webholder.webp"];
    let currentIndex = 0;
    let zoomLevel = 1;
    const slides = [];

    images.forEach((url, i) => {
      const img = document.createElement("img");
      img.src = url;
      img.alt = post.title;
      img.loading = "lazy";
      img.className = "gallery-image";
      if (i === 0) img.classList.add("active");
      gallery.appendChild(img);
      slides.push(img);

      if (dotsContainer) {
        const dot = document.createElement("button");
        dot.className = i === 0 ? "gallery-dot active" : "gallery-dot";
        dot.onclick = () => updateSlide(i);
        dotsContainer.appendChild(dot);
      }
    });

    const updateSlide = idx => {
      currentIndex = (idx + slides.length) % slides.length;
      slides.forEach((img, i) => {
        img.classList.toggle("active", i === currentIndex);
        img.style.transform = "scale(1)";
      });
      gallery.style.transform = `translateX(-${currentIndex * 100}%)`;
      if (dotsContainer) dotsContainer.querySelectorAll(".gallery-dot").forEach((d, i) => d.classList.toggle("active", i === currentIndex));
      zoomLevel = 1;
    };
    updateSlide(0);

    // Drag/zoom
    let startX = 0, dragging = false;
    gallery.addEventListener("touchstart", e => { if (e.touches.length === 1) { startX = e.touches[0].clientX; dragging = true; } });
    gallery.addEventListener("touchend", e => {
      if (!dragging) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) dx < 0 ? updateSlide(currentIndex + 1) : updateSlide(currentIndex - 1);
      dragging = false;
    });
    gallery.addEventListener("wheel", e => {
      e.preventDefault();
      zoomLevel += e.deltaY < 0 ? 0.1 : -0.1;
      zoomLevel = Math.min(Math.max(zoomLevel, 1), 3);
      slides[currentIndex].style.transform = `scale(${zoomLevel})`;
    });

    // Lightbox
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightboxImage");
    const lightboxClose = document.getElementById("lightboxClose");
    if (lightbox && lightboxImg) {
      slides.forEach((img, i) => {
        img.style.cursor = "zoom-in";
        img.onclick = () => {
          currentIndex = i;
          lightboxImg.src = img.src;
          lightbox.classList.add("active");
        };
      });
      const closeLB = () => lightbox.classList.remove("active");
      lightboxClose?.addEventListener("click", closeLB);
      lightbox.addEventListener("click", e => e.target === lightbox && closeLB());
    }

  } catch (err) {
    console.error("View Post Error:", err);
  }
}
