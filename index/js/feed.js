// /index/js/feed.js
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export async function initFeed() {
  const container = document.getElementById("feed");

  // 🛡️ Guard: view not loaded or ID missing
  if (!container) {
    console.warn("initFeed skipped: #feed not found");
    return;
  }

  container.innerHTML = "<p class='muted'>Loading posts…</p>";

  try {
    const snap = await getDocs(collection(window.db, "posts"));
    container.innerHTML = "";

    if (snap.empty) {
      container.innerHTML = "<p class='muted'>No posts yet</p>";
      return;
    }

    snap.forEach(doc => {
      const post = { id: doc.id, ...doc.data() };
      container.appendChild(renderPost(post));
    });

  } catch (err) {
    console.error("Feed load error:", err);
    container.innerHTML = "<p class='error'>Failed to load posts</p>";
  }
}

function renderPost(post) {
  const div = document.createElement("div");
  div.className = "card";

  div.innerHTML = `
    <h3>${post.title || "Untitled"}</h3>
    <p>${post.description || ""}</p>

    <div class="flex gap-2">
      <button class="pill-btn" data-id="${post.id}" data-action="edit">Edit</button>
      <button class="pill-btn" data-id="${post.id}" data-action="repost">Repost</button>
      <button class="pill-btn" data-id="${post.id}" data-action="share">Share</button>
    </div>
  `;

  return div;
}
