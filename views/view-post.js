// /views/view-post.js
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export async function init({ db }) {
  const postId = sessionStorage.getItem("viewPostId");
  if (!postId) return;

  try {
    // Firestore document reference
    const postRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      console.warn("Post not found:", postId);
      return;
    }

    const post = postSnap.data();

    // DOM Mapping
    document.getElementById("viewTitle").textContent = post.title;
    document.getElementById("viewDescription").textContent = post.description || post.teaser || "";
    document.getElementById("viewPrice").textContent = post.price ? `£${post.price}` : "Contact for price";
    document.getElementById("viewArea").textContent = post.area || "Rhondda";
    document.getElementById("viewCategory").textContent = post.category || "Misc";
    document.getElementById("viewTime").textContent = post.posted || "Just now";

    const imgEl = document.getElementById("viewImage");
    if (imgEl && post.imageUrl) {
      imgEl.src = post.imageUrl;
      imgEl.alt = post.title;
    }

    // Action Handlers
    document.getElementById("messageSeller").onclick = () => {
      alert("Chat feature coming soon! User ID: " + post.userId);
    };

    document.getElementById("reportPost").onclick = () => {
      const reason = prompt("Reason for reporting (Scam, Spam, Inappropriate):");
      if (reason) alert("Report submitted. Thank you for keeping the marketplace safe.");
    };
  } catch (err) {
    console.error("Failed to load post:", err);
  }
}
