import { doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * Render posts + stats for both dashboards
 */
export function renderPostsAndStats(containerId, postsSnap, onEdit, onDelete) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  let adsCount = 0, totalViews = 0, totalLeads = 0;

  const isBusiness = containerId === "bizPosts";

  if (postsSnap.empty) {
    container.innerHTML = `<p class="${isBusiness ? "biz-empty-msg" : "empty-msg"}">No posts yet.</p>`;
    return { adsCount, totalViews, totalLeads };
  }

  postsSnap.forEach(docSnap => {
    const p = docSnap.data();
    const id = docSnap.id;

    adsCount++;
    if (p.views) totalViews += p.views;
    if (p.leads) totalLeads += p.leads;

    const imgUrl = p.imageUrl || p.images?.[0] || "/images/image-webholder.webp";

    const card = document.createElement("div");

    if (isBusiness) {
      // BUSINESS DASHBOARD LAYOUT
      card.className = "biz-card";
      card.innerHTML = `
        <img src="${imgUrl}" class="biz-img">
        <div class="biz-info">
          <h3>${p.title}</h3>
          <p>${p.description}</p>
          <small>${p.category || "General"} ${p.subcategory ? "• " + p.subcategory : ""}</small>
        </div>
        <div class="biz-actions">
          <button class="biz-btn biz-edit" data-id="${id}">Edit</button>
          <button class="biz-btn biz-delete" data-id="${id}">Delete</button>
        </div>
      `;
    } else {
      // GENERAL DASHBOARD LAYOUT
      card.className = "dash-card";
      card.innerHTML = `
        <img src="${imgUrl}" class="dash-post-img">
        <div class="dash-info">
          <h3>${p.title}</h3>
          <p>${p.description}</p>
          <small>${p.category || "General"} ${p.subcategory ? "• " + p.subcategory : ""}</small>
        </div>
        <div class="dash-actions">
          <button class="dash-btn dash-edit" data-id="${id}">Edit</button>
          <button class="dash-btn dash-delete" data-id="${id}">Delete</button>
        </div>
      `;
    }

    container.appendChild(card);

    // Attach events
    const editBtn = card.querySelector(isBusiness ? ".biz-edit" : ".dash-edit");
    const deleteBtn = card.querySelector(isBusiness ? ".biz-delete" : ".dash-delete");

    editBtn?.addEventListener("click", () => onEdit(id));
    deleteBtn?.addEventListener("click", async () => await onDelete(id));
  });

  return { adsCount, totalViews, totalLeads };
}
