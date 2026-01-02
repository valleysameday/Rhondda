// index/js/admin/traffic.js
import { collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export async function init({ db }) {
  console.log("🔹 Traffic module init");
  await loadTraffic(db);
}

/**
 * Load top posts and categories for dashboard
 */
async function loadTraffic(db) {
  const topPostsEl = document.getElementById("adminTopPosts");
  const topCatsEl = document.getElementById("adminTopCategories");

  if (!topPostsEl || !topCatsEl) {
    console.warn("⚠️ Traffic elements not found in DOM");
    return;
  }

  try {
    // Top posts
    const postsSnap = await getDocs(query(collection(db, "posts"), orderBy("views", "desc"), limit(5)));
    console.log(`🔹 Loaded ${postsSnap.size} top posts`);

    topPostsEl.innerHTML = "";
    postsSnap.forEach(docSnap => {
      const d = docSnap.data();
      const div = document.createElement("div");
      div.className = "admin-list-item";
      div.innerHTML = `<span>${d.title || "Untitled"}</span> <span>${d.views || 0} views</span>`;
      topPostsEl.appendChild(div);
    });

    // Top categories
    const allPostsSnap = await getDocs(collection(db, "posts"));
    const catCounts = {};
    allPostsSnap.forEach(docSnap => {
      const cat = docSnap.data().category || "other";
      catCounts[cat] = (catCounts[cat] || 0) + 1;
    });

    const sortedCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    console.log(`🔹 Top categories: ${sortedCats.map(c => `${c[0]} (${c[1]})`).join(", ")}`);

    topCatsEl.innerHTML = "";
    sortedCats.forEach(([cat, count]) => {
      const div = document.createElement("div");
      div.className = "admin-list-item";
      div.innerHTML = `<span>${cat}</span> <span>${count} posts</span>`;
      topCatsEl.appendChild(div);
    });

    console.log("✅ Traffic module loaded successfully");
  } catch (err) {
    console.error("❌ Failed to load traffic data", err);
  }
}
