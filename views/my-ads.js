import { collection, query, where, orderBy, getDocs } from "firebase/firestore";

export function init({ auth, db }) {
  loadMyAds(auth, db);

  document.getElementById("myAdsCreateBtn")?.addEventListener("click", () => {
    document.getElementById("post-ad-btn")?.click();
  });
}

async function loadMyAds(auth, db) {
  if (!auth.currentUser) {
    showToast("Please log in to view your ads.", "error");
    return;
  }

  const list = document.getElementById("myAdsList");
  const empty = document.getElementById("myAdsEmpty");

  list.innerHTML = "";

  const q = query(
    collection(db, "posts"),
    where("userId", "==", auth.currentUser.uid),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    list.classList.add("hidden");
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");
  list.classList.remove("hidden");

  snap.forEach(doc => {
    const p = doc.data();

    const item = document.createElement("div");
    item.className = "my-ad-item";

    item.innerHTML = `
      <img src="${p.image || '/img/placeholder.png'}" class="my-ad-thumb">
      <div class="my-ad-info">
        <h4>${p.title}</h4>
        <p>${p.location || ''}</p>
        <p class="price">£${p.price || '—'}</p>
      </div>
    `;

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
