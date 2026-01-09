import { getSellerPosts, deletePost, renewPost } from "/index/js/firebase/settings.js";

export function init({ auth }) {
  loadMyAds(auth);

  document.getElementById("myAdsCreateBtn")?.addEventListener("click", () => {
    document.getElementById("post-ad-btn")?.click();
  });
}

async function loadMyAds(auth) {
  if (!auth.currentUser) {
    showToast("Please log in to view your ads.", "error");
    return;
  }

  const list = document.getElementById("myAdsList");
  const empty = document.getElementById("myAdsEmpty");

  list.innerHTML = "";

  const posts = await getSellerPosts(auth.currentUser.uid);

  if (!posts.length) {
    list.classList.add("hidden");
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");
  list.classList.remove("hidden");

  posts.forEach(p => {
    const age = window.daysSince(p.createdAt);
    const isRenewDay = age >= 6 && age < 7;
    const isExpired = age >= 7;

    const item = document.createElement("div");
    item.className = "my-ad-item";

    item.innerHTML = `
      <img src="${p.image || '/img/placeholder.png'}" class="my-ad-thumb">

      <div class="my-ad-info">
        <h4>${p.title}</h4>
        <p>${p.location || ''}</p>
        <p class="price">£${p.price || '—'}</p>

        <div class="my-ad-stats">
          👁️ ${p.views || 0} views · Posted ${window.timeAgo(p.createdAt)}
        </div>

        ${isExpired ? `<div class="expired-label">Expired</div>` : ""}
      </div>

      <div class="my-ad-actions">
        ${isExpired ? `
          <button class="renew-btn">Renew</button>
          <button class="delete-btn danger">Delete</button>
        ` : isRenewDay ? `
          <button class="renew-btn">Renew</button>
          <button class="edit-btn">Edit</button>
        ` : `
          <button class="edit-btn">Edit</button>
          <button class="delete-btn danger">Delete</button>
        `}
      </div>
    `;

    // OPEN AD
    item.querySelector(".my-ad-thumb").addEventListener("click", () => {
      loadView("view-post", { postId: p.id });
    });

    // EDIT
    item.querySelector(".edit-btn")?.addEventListener("click", () => {
      loadView("post-edit", { postId: p.id, forceInit: true });
    });

    // DELETE
    item.querySelector(".delete-btn")?.addEventListener("click", async () => {
      if (!confirm("Delete this ad?")) return;
      await deletePost(p.id);
      showToast("Ad deleted", "success");
      loadMyAds(auth);
    });

    // RENEW
    item.querySelector(".renew-btn")?.addEventListener("click", async () => {
      await renewPost(p.id);
      showToast("Ad renewed for 7 more days", "success");
      loadMyAds(auth);
    });

    list.appendChild(item);
  });
}

function showToast(msg, type = "info") {
  const t = document.createElement("div");
  t.textContent = msg;
  t.className = `toast ${type}`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}
