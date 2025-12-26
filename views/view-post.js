// /views/view-post.js
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export async function init({ db }) {
  const postId = sessionStorage.getItem("viewPostId");
  if (!postId) return;

  try {
    const postRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) return console.warn("Post not found:", postId);

    const post = postSnap.data();

    // DOM Mapping
    document.getElementById("viewTitle").textContent = post.title;
    document.getElementById("viewDescription").textContent = post.description || post.teaser || "";
    document.getElementById("viewPrice").textContent = post.price ? `£${post.price}` : "Contact for price";
    document.getElementById("viewArea").textContent = post.area || "Rhondda";
    document.getElementById("viewCategory").textContent = post.category || "Misc";
    document.getElementById("viewTime").textContent = post.posted || "Just now";

    const gallery = document.getElementById("galleryContainer");
    gallery.querySelectorAll("img").forEach(i => i.remove()); // Clear existing

    // Add images
    const images = post.images?.length ? post.images : ["/images/post-placeholder.jpg"];
    images.forEach((url, i) => {
      const img = document.createElement("img");
      img.src = url;
      img.alt = post.title;
      if (i === 0) img.classList.add("active");
      gallery.appendChild(img);
    });

    let currentIndex = 0;
    const imgEls = gallery.querySelectorAll("img");

    function showImage(idx) {
      imgEls.forEach((img, i) => img.classList.toggle("active", i === idx));
    }

    // Desktop arrows
    document.getElementById("galleryPrev").onclick = () => {
      currentIndex = (currentIndex - 1 + imgEls.length) % imgEls.length;
      showImage(currentIndex);
    };
    document.getElementById("galleryNext").onclick = () => {
      currentIndex = (currentIndex + 1) % imgEls.length;
      showImage(currentIndex);
    };

    // Mobile swipe
    let startX = 0;
    gallery.addEventListener("touchstart", e => startX = e.touches[0].clientX);
    gallery.addEventListener("touchend", e => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) {
        currentIndex = dx < 0 ? (currentIndex + 1) % imgEls.length : (currentIndex - 1 + imgEls.length) % imgEls.length;
        showImage(currentIndex);
      }
    });

    // Action Handlers
    document.getElementById("messageSeller").onclick = () => alert("Chat feature coming soon! User ID: " + post.userId);
    document.getElementById("reportPost").onclick = () => {
      const reason = prompt("Reason for reporting (Scam, Spam, Inappropriate):");
      if (reason) alert("Report submitted. Thank you!");
    };
  } catch (err) {
    console.error("Failed to load post:", err);
  }
}
