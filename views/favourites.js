import { getPost, getUserFavourites } from "/index/js/firebase/settings.js";
import { loadView } from "/index/js/main.js";

export async function init({ auth }) {
  const favList = document.getElementById("favList");
  const favEmpty = document.getElementById("favEmpty");

  if (!auth.currentUser) {
    favEmpty.textContent = "Please log in to view your favourites.";
    favEmpty.classList.remove("hidden");
    return;
  }

  // Load favourite IDs from Firestore
  const favIds = await getUserFavourites(auth.currentUser.uid);

  if (!favIds.length) {
    favEmpty.classList.remove("hidden");
    favList.classList.add("hidden");
    return;
  }

  favEmpty.classList.add("hidden");
  favList.classList.remove("hidden");
  favList.innerHTML = "";

  for (const id of favIds) {
    const post = await getPost(id);

    const item = document.createElement("div");
    item.className = "fav-item";

    if (!post) {
      // Ad deleted or expired
      item.innerHTML = `
        <img src="/images/image-webholder.webp" class="fav-thumb">
        <div class="fav-info">
          <h4>Unavailable</h4>
          <p class="fav-unavailable">This listing is no longer available.</p>
        </div>
      `;
      favList.appendChild(item);
      continue;
    }

    const img = post.imageUrl || post.image || (post.imageUrls?.[0]) || "/images/image-webholder.webp";

    item.innerHTML = `
      <img src="${img}" class="fav-thumb">

      <div class="fav-info">
        <h4>${post.title}</h4>
        <p>£${post.price || "—"}</p>
        <p>${post.location || ""}</p>
      </div>
    `;

    // Open the ad if still live
    item.addEventListener("click", () => {
      loadView("view-post", { postId: id });
    });

    favList.appendChild(item);
  }
}
