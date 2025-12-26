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

    // Text Mapping
    document.getElementById("viewTitle").textContent = post.title;
    document.getElementById("viewDescription").textContent = post.description || post.teaser || "";
    document.getElementById("viewCategory").textContent = post.category || "General";
    document.getElementById("viewArea").textContent = post.area || "Rhondda";
    
    // Multi-price Mapping (Desktop + Mobile UI)
    ["viewPrice", "viewPriceMobile", "viewPriceFloating"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = priceText;
    });

    // Gallery Setup
    const gallery = document.getElementById("galleryContainer");
    gallery.querySelectorAll("img").forEach(i => i.remove());
    
    const images = post.images?.length ? post.images : ["/images/post-placeholder.jpg"];
    images.forEach((url, i) => {
      const img = document.createElement("img");
      img.src = url;
      if (i === 0) img.classList.add("active");
      gallery.appendChild(img);
    });

    // UI State
    let currentIndex = 0;
    const imgEls = gallery.querySelectorAll("img");
    const currentCounter = document.getElementById("currentImg");
    document.getElementById("totalImg").textContent = imgEls.length;

    const updateGallery = (idx) => {
      imgEls.forEach((img, i) => img.classList.toggle("active", i === idx));
      currentCounter.textContent = idx + 1;
    };

    // Controls
    document.getElementById("galleryPrev").onclick = () => {
      currentIndex = (currentIndex - 1 + imgEls.length) % imgEls.length;
      updateGallery(currentIndex);
    };
    document.getElementById("galleryNext").onclick = () => {
      currentIndex = (currentIndex + 1) % imgEls.length;
      updateGallery(currentIndex);
    };

    // Mobile Swipe
    let touchStartX = 0;
    gallery.ontouchstart = e => touchStartX = e.touches[0].clientX;
    gallery.ontouchend = e => {
      const diff = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(diff) > 60) {
        currentIndex = diff < 0 ? (currentIndex + 1) % imgEls.length : (currentIndex - 1 + imgEls.length) % imgEls.length;
        updateGallery(currentIndex);
      }
    };

    // Actions
    const handleContact = () => alert(`Chat with seller coming soon! Ref: ${post.userId}`);
    document.getElementById("messageSeller").onclick = handleContact;
    document.getElementById("messageSellerMobile").onclick = handleContact;

    document.getElementById("reportPost").onclick = () => {
      if (confirm("Report this listing for review?")) alert("Thank you. Our team will investigate.");
    };

  } catch (err) {
    console.error("View Post Error:", err);
  }
}
