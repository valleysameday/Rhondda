// /index/js/feed.js
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export async function initFeed() {
  const snap = await getDocs(collection(window.db, "posts"));
  const container = document.getElementById("feed");
  container.innerHTML = "";

  snap.forEach(doc => {
    const post = { id: doc.id, ...doc.data() };
    container.appendChild(renderPost(post));
  });
}

function renderPost(post) {
  const div = document.createElement("div");
  div.className = "card";
  div.innerHTML = `
    <h3>${post.title}</h3>
    <p>${post.description}</p>
    <div class="flex gap-2">
      <button class="pill-btn" onclick='editAd(${JSON.stringify(post)})'>Edit</button>
      <button class="pill-btn" onclick='repostAd(${JSON.stringify(post)})'>Repost</button>
      <button class="pill-btn" onclick='shareAd(${JSON.stringify(post)})'>Share</button>
    </div>
  `;
  return div;
}
