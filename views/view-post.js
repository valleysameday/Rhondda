import { 
  doc, 
  getDoc, 
  setDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { loadView } from "/index/js/main.js";

export async function init({ db, auth }) {
  const postId = sessionStorage.getItem("viewPostId");
  if (!postId) return;

  // Ensure SPA DOM is ready
  await new Promise(r => setTimeout(r, 50));

  try {
    const postRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) return;

    const post = postSnap.data();
    const priceText = post.price ? `£${post.price}` : "Contact for price";

    // ===============================
    // SAFE TEXT SETTER
    // ===============================
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

    // ===============================
    // CONTACT NUMBER REVEAL
    // ===============================
    const revealBtn = document.getElementById("revealNumberBtn");
    const revealedBox = document.getElementById("revealedNumber");
    const disclaimer = document.querySelector(".contact-disclaimer");

    if (revealBtn && revealedBox && disclaimer) {
      revealBtn.style.display = "none";
      revealedBox.style.display = "none";
      disclaimer.style.display = "none";

      if (post.contact) {
        revealBtn.style.display = "block";
        disclaimer.style.display = "block";

        revealBtn.addEventListener("click", () => {
          const ok = confirm(
            "This phone number is only to be used to contact the seller regarding this ad."
          );
          if (!ok) return;

          revealedBox.textContent = post.contact;
          revealedBox.style.display = "block";

          revealBtn.textContent = "Call Seller";
          revealBtn.onclick = () => {
            window.location.href = `tel:${post.contact}`;
          };
        });
      }
    }

    // ===============================
    // GALLERY
    // ===============================
    const gallery = document.getElementById("galleryContainer");
    const dotsContainer = document.getElementById("galleryDots");
    if (!gallery) return;

    gallery.innerHTML = "";
    dotsContainer && (dotsContainer.innerHTML = "");

    const images = post.images?.length
      ? post.images
      : ["/images/image-webholder.webp"];

    const slides = [];
    let currentIndex = 0;
    let zoomLevel = 1;

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

      dotsContainer &&
        dotsContainer.querySelectorAll(".gallery-dot").forEach((d, i) =>
          d.classList.toggle("active", i === currentIndex)
        );

      zoomLevel = 1;
    };

    updateSlide(0);

    // Swipe / drag
    let startX = 0, dragging = false;

    gallery.addEventListener("touchstart", e => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        dragging = true;
      }
    });

    gallery.addEventListener("touchend", e => {
      if (!dragging) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) dx < 0 ? updateSlide(currentIndex + 1) : updateSlide(currentIndex - 1);
      dragging = false;
    });

    // Zoom
    gallery.addEventListener("wheel", e => {
      e.preventDefault();
      zoomLevel += e.deltaY < 0 ? 0.1 : -0.1;
      zoomLevel = Math.min(Math.max(zoomLevel, 1), 3);
      slides[currentIndex].style.transform = `scale(${zoomLevel})`;
    });

    // ===============================
    // LIGHTBOX
    // ===============================
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

    // ===============================
    // REAL MESSAGING SYSTEM
    // ===============================
    async function startConversation(post) {
  const buyerId = auth.currentUser?.uid;
  const sellerId = post.userId;
  const postId = sessionStorage.getItem("viewPostId");

  if (!buyerId) return loadView("login");
  if (buyerId === sellerId) return;

  // NEW FORMAT: buyer_seller_postId
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
  loadView("chat");
    }

    // ===============================
    // ACTION BUTTONS
    // ===============================
    document
      .getElementById("messageSeller")
      ?.addEventListener("click", () => startConversation(post));

document.getElementById("backToFeed").addEventListener("click", () => {
  sessionStorage.removeItem("viewPostId");   // ⭐ FIX
  loadView("home");
});
    
    document
      .getElementById("reportPost")
      ?.addEventListener("click", () => {
        if (confirm("Report this listing for review?")) {
          alert("Thank you. This listing has been flagged.");
        }
      });

  } catch (err) {
    console.error("View Post Error:", err);
  }
            }
