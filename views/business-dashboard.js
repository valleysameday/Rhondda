// business-dashboard.js
import { getFirebase } from '/index/js/firebase/init.js';
import { onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
  collection, query, where, getDocs,
  doc, getDoc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import {
  ref, deleteObject, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

let auth, db, storage;

/* ---------------------------------------------------
   🔒 SAFE DOM HELPERS
--------------------------------------------------- */
const $ = id => document.getElementById(id);
const show = el => el && (el.style.display = "block");
const hide = el => el && (el.style.display = "none");

/* ---------------------------------------------------
   🧠 WAIT FOR DASHBOARD VIEW (SPA SAFE)
--------------------------------------------------- */
function waitForDashboard() {
  return new Promise(resolve => {
    const check = () => {
      if ($("bizHeaderName")) resolve();
      else requestAnimationFrame(check);
    };
    check();
  });
}

/* ---------------------------------------------------
   🗑️ DELETE POST + IMAGES
--------------------------------------------------- */
async function deletePostAndImages(post) {
  const urls = [
    ...(post.imageUrl ? [post.imageUrl] : []),
    ...(post.imageUrls || [])
  ];

  for (const url of urls) {
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
  const snap = await getDoc(doc(db, "businesses", uid));
  const d = snap.exists() ? snap.data() : {};

  $("bizHeaderName").textContent = d.name || "Your Business";

  $("bizViewName").textContent = d.name || "Add your business name";
  $("bizViewPhone").textContent = d.phone || "Add your phone";
  $("bizViewArea").textContent = d.area || "Add your area";
  $("bizViewWebsite").textContent = d.website || "Add your website";
  $("bizViewBio").textContent = d.bio || "Tell customers what you offer";

  $("bizNameInput").value = d.name || "";
  $("bizPhoneInput").value = d.phone || "";
  $("bizAreaInput").value = d.area || "";
  $("bizWebsiteInput").value = d.website || "";
  $("bizBioInput").value = d.bio || "";

  if (d.avatarUrl && $("bizDashboardAvatar")) {
    $("bizDashboardAvatar").style.backgroundImage = `url('${d.avatarUrl}')`;
  }
}

/* ---------------------------------------------------
   🖼️ AVATAR UPLOAD (FIXED ID)
--------------------------------------------------- */
function setupAvatarUpload(uid) {
  const input = $("avatarUploadInput");
  const clickArea = $("bizAvatarClickArea");
  const avatar = $("bizDashboardAvatar");

  if (!input || !clickArea || !avatar) return;

  clickArea.onclick = () => input.click();

  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;

    const refPath = ref(storage, `avatars/${uid}.jpg`);
    await uploadBytes(refPath, file);
    const url = await getDownloadURL(refPath);

    await updateDoc(doc(db, "businesses", uid), { avatarUrl: url });
    avatar.style.backgroundImage = `url('${url}')`;
  };
}

/* ---------------------------------------------------
   ✏️ EDIT / VIEW MODE TOGGLE
--------------------------------------------------- */
function setupProfileEditToggle(uid) {
  const view = $("bizProfileViewMode");
  const edit = $("bizProfileEditMode");

  $("bizToggleEditProfile")?.addEventListener("click", () => {
    hide(view);
    show(edit);
  });

  $("bizCancelEditProfileBtn")?.addEventListener("click", () => {
    show(view);
    hide(edit);
  });

  $("bizSaveProfileBtn")?.addEventListener("click", async () => {
    await updateDoc(doc(db, "businesses", uid), {
      name: $("bizNameInput").value.trim(),
      phone: $("bizPhoneInput").value.trim(),
      area: $("bizAreaInput").value.trim(),
      website: $("bizWebsiteInput").value.trim(),
      bio: $("bizBioInput").value.trim()
    });

    $("bizProfileFeedback").textContent = "✅ Profile updated";
    show(view);
    hide(edit);
    loadBusinessProfile(uid);
  });
}

/* ---------------------------------------------------
   📦 LOAD BUSINESS ADS
--------------------------------------------------- */
async function loadBusinessPosts(uid) {
  const snap = await getDocs(
    query(collection(db, "posts"), where("businessId", "==", uid))
  );

  const box = $("bizPosts");
  box.innerHTML = "";

  let ads = 0, views = 0, leads = 0;

  if (snap.empty) {
    box.innerHTML = `<p class="biz-empty-msg">No ads yet.</p>`;
  }

  snap.forEach(d => {
    const p = d.data();
    ads++;
    views += p.views || 0;
    leads += p.leads || 0;

    box.insertAdjacentHTML("beforeend", `
      <div class="biz-card">
        <img src="${p.imageUrl || ''}" onerror="this.style.display='none'">
        <div>
          <h3>${p.title}</h3>
          <p>${p.description}</p>
        </div>
        <button class="biz-delete" data-id="${d.id}">Delete</button>
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
   🚪 LOGOUT
--------------------------------------------------- */
function setupLogout() {
  $("bizLogoutBtn")?.addEventListener("click", async () => {
    show($("bizLogoutOverlay"));
    await signOut(auth);
    setTimeout(() => navigateToHome(), 800);
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

    await waitForDashboard();

    loadBusinessProfile(user.uid);
    setupAvatarUpload(user.uid);
    setupProfileEditToggle(user.uid);
    setupLogout();
    loadBusinessPosts(user.uid);
  });
});
