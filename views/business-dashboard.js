// business-dashboard.js
import { getFirebase } from '/index/js/firebase/init.js';
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import {
  ref,
  deleteObject,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

let auth, db, storage;
let currentUser = null;

/* ---------------------------------------------------
   🔒 SAFE DOM HELPERS (CRITICAL)
--------------------------------------------------- */
function $(id) {
  return document.getElementById(id);
}

function onClick(id, handler) {
  const el = $(id);
  if (el) el.addEventListener("click", handler);
}

/* ---------------------------------------------------
   🧠 WAIT FOR DASHBOARD VIEW
--------------------------------------------------- */
function waitForDashboard() {
  return new Promise(resolve => {
    const check = () => {
      if ($("bizDashboard")) resolve();
      else requestAnimationFrame(check);
    };
    check();
  });
}

/* ---------------------------------------------------
   🗑️ DELETE POST + IMAGES
--------------------------------------------------- */
async function deletePostAndImages(post) {
  const images = [
    ...(post.imageUrl ? [post.imageUrl] : []),
    ...(Array.isArray(post.imageUrls) ? post.imageUrls : [])
  ];

  for (const url of images) {
    try {
      const path = decodeURIComponent(url.split("/o/")[1].split("?")[0]);
      await deleteObject(ref(storage, path));
    } catch {}
  }

  await deleteDoc(doc(db, "posts", post.id));
}

/* ---------------------------------------------------
   🏗️ LOAD BUSINESS PROFILE
--------------------------------------------------- */
async function loadBusinessProfile(uid) {
  const refDoc = doc(db, "businesses", uid);
  const snap = await getDoc(refDoc);

  const data = snap.exists() ? snap.data() : {};

  $("bizHeaderName").textContent = data.name || "Your Business";
  $("bizViewName").textContent = data.name || "Add business name";
  $("bizViewPhone").textContent = data.phone || "Add phone";
  $("bizViewArea").textContent = data.area || "Add area";
  $("bizViewWebsite").textContent = data.website || "Add website";
  $("bizViewBio").textContent = data.bio || "Describe your business";

  $("bizNameInput").value = data.name || "";
  $("bizPhoneInput").value = data.phone || "";
  $("bizAreaInput").value = data.area || "";
  $("bizWebsiteInput").value = data.website || "";
  $("bizBioInput").value = data.bio || "";

  if (data.avatarUrl && $("bizDashboardAvatar")) {
    $("bizDashboardAvatar").style.backgroundImage = `url('${data.avatarUrl}')`;
  }
}

/* ---------------------------------------------------
   🖼️ AVATAR UPLOAD
--------------------------------------------------- */
function setupAvatarUpload(uid) {
  const input = $("bizAvatarUploadInput");
  const clickArea = $("bizAvatarClickArea");
  const avatar = $("bizDashboardAvatar");

  if (!input || !clickArea || !avatar) return;

  clickArea.onclick = () => input.click();

  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;

    const avatarRef = ref(storage, `avatars/${uid}.jpg`);
    await uploadBytes(avatarRef, file);
    const url = await getDownloadURL(avatarRef);

    await updateDoc(doc(db, "businesses", uid), { avatarUrl: url });
    avatar.style.backgroundImage = `url('${url}')`;
  };
}

/* ---------------------------------------------------
   📦 LOAD BUSINESS ADS
--------------------------------------------------- */
async function loadBusinessPosts(uid) {
  const snap = await getDocs(
    query(collection(db, "posts"), where("businessId", "==", uid))
  );

  const container = $("bizPosts");
  if (!container) return;

  container.innerHTML = "";

  let ads = 0, views = 0, leads = 0;

  if (snap.empty) {
    container.innerHTML = `<p class="biz-empty-msg">No ads yet.</p>`;
    return;
  }

  snap.forEach(docSnap => {
    const p = docSnap.data();
    const id = docSnap.id;

    ads++;
    views += p.views || 0;
    leads += p.leads || 0;

    container.insertAdjacentHTML("beforeend", `
      <div class="biz-card">
        <img src="${p.imageUrl || '/images/post-placeholder.jpg'}">
        <div>
          <h3>${p.title}</h3>
          <p>${p.description}</p>
          <small>${p.category} • ${p.subcategory || ""}</small>
        </div>
        <div>
          <button class="biz-edit" data-id="${id}">Edit</button>
          <button class="biz-delete" data-id="${id}">Delete</button>
        </div>
      </div>
    `);
  });

  $("bizStatAdsCount").textContent = ads;
  $("bizStatTotalViews").textContent = views;
  $("bizStatLeads").textContent = leads;

  document.querySelectorAll(".biz-delete").forEach(btn => {
    btn.onclick = async () => {
      if (!confirm("Delete this ad?")) return;
      const snap = await getDoc(doc(db, "posts", btn.dataset.id));
      await deletePostAndImages({ id: btn.dataset.id, ...snap.data() });
      loadBusinessPosts(uid);
    };
  });
}

/* ---------------------------------------------------
   💾 SAVE PROFILE
--------------------------------------------------- */
function setupSaveProfile(uid) {
  onClick("bizSaveProfileBtn", async () => {
    await updateDoc(doc(db, "businesses", uid), {
      name: $("bizNameInput").value.trim(),
      phone: $("bizPhoneInput").value.trim(),
      area: $("bizAreaInput").value.trim(),
      website: $("bizWebsiteInput").value.trim(),
      bio: $("bizBioInput").value.trim()
    });
  });
}

/* ---------------------------------------------------
   🚪 GLOBAL ACTIONS
--------------------------------------------------- */
function setupGlobalActions() {
  onClick("bizNewPostBtn", () => openScreen("post"));
  onClick("bizLogoutBtn", async () => {
    await signOut(auth);
    navigateToHome();
  });
}

/* ---------------------------------------------------
   🚀 INIT
--------------------------------------------------- */
getFirebase().then(fb => {
  auth = fb.auth;
  db = fb.db;
  storage = fb.storage;

  onAuthStateChanged(auth, async user => {
    if (!user) return;

    currentUser = user;

    await waitForDashboard();

    await loadBusinessProfile(user.uid);
    setupAvatarUpload(user.uid);
    setupSaveProfile(user.uid);
    setupGlobalActions();
    loadBusinessPosts(user.uid);
  });
});
