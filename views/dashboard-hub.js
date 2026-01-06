import { getFirebase } from "/index/js/firebase/init.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getUser, updateUser, getUserPosts, deletePost, autoDeleteOldPosts,
  uploadAvatar, getBusiness, updateBusiness, getBusinessPosts
} from "/index/js/firebase/settings.js";

const $ = id => document.getElementById(id);
const show = el => el && (el.style.display = "block");
const hide = el => el && (el.style.display = "none");

/* ==========================
   INIT DASHBOARD
========================== */
export async function init() {
  if (!window.currentUser) return window.loadView("home");

  const fb = await getFirebase();
  // initialize Firebase helpers
  uploadAvatar.fbInit?.({ auth: fb.auth, db: fb.db, storage: fb.storage });

  const uid = window.currentUser.uid;
  const userData = await getUser(uid);
  const plan = userData.plan || "free";

  setupHeader(userData, plan);
  setupTabs(plan);
  setupLogout(uid);

  await loadProfile(uid, userData);
  setupAvatar(uid);
  setupProfileEdit(uid, userData);

  const posts = await getUserPosts(uid);
  renderUserPosts(posts);

  autoDeleteOldPosts(uid);

  if (plan === "business") {
    const biz = await getBusiness(uid);
    renderBusinessProfile(biz);
    const bizPosts = await getBusinessPosts(uid);
    renderBusinessPosts(bizPosts);
  }

  setupUpgradeModal(uid, userData);
}

/* ==========================
   HEADER
========================== */
function setupHeader(userData, plan) {
  const name = userData.name || null;
  const area = userData.area || "Add your area";

  $("dashGreeting").textContent = `Shwmae, ${name || "friend"}`;
  $("dashTitle").textContent = name ? "Your Dashboard" : "Welcome to RCT‑X";

  $("headerAreaBadge").textContent = area;

  const planBadge = $("planBadge");
  planBadge.className = "plan-badge " + plan;
  planBadge.textContent =
    plan === "sellerplus" ? "Seller+ Member" :
    plan === "business" ? "Business Member" :
    plan === "classic" ? "Classic Member" :
    "Free Forever";
}

/* ==========================
   TABS
========================== */
function setupTabs(plan) {
  const tabs = document.querySelectorAll(".top-nav-item");
  const views = {
    overviewTab: $("overviewTab"),
    adsTab: $("adsTab"),
    sellerPlusTab: $("sellerPlusTab"),
    businessTab: $("businessTab"),
    settingsTab: $("settingsTab")
  };

  if (plan === "sellerplus") show($("sellerPlusTabBtn"));
  else hide($("sellerPlusTabBtn"));

  if (plan === "business") show($("businessTabBtn"));
  else hide($("businessTabBtn"));

  tabs.forEach(btn => {
    btn.onclick = () => {
      tabs.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      Object.keys(views).forEach(id => {
        views[id].style.display = id === btn.dataset.tab ? "block" : "none";
      });
    };
  });
}

/* ==========================
   LOGOUT
========================== */
function setupLogout(uid) {
  $("logoutBtn").onclick = async () => {
    show($("logoutOverlay"));
    await signOut(window.firebaseAuth);
    window.currentUser = null;
    window.loadView("home");
  };
}

/* ==========================
   PROFILE
========================== */
async function loadProfile(uid, userData) {
  const u = userData;

  $("viewName").textContent = u.name || "Add your name";
  $("viewPhone").textContent = u.phone || "Add your phone";
  $("viewArea").textContent = u.area || "Add your area";
  $("viewBio").textContent = u.bio || "Tell locals a bit about yourself.";

  $("profileNameInput").value = u.name || "";
  $("profilePhoneInput").value = u.phone || "";
  $("profileAreaInput").value = u.area || "";
  $("profileBioInput").value = u.bio || "";

  $("settingsNameInput").value = u.name || "";
  $("settingsAreaInput").value = u.area || "";
  $("settingsBioInput").value = u.bio || "";

  $("dashboardAvatar").style.backgroundImage = `url('${u.avatarUrl || "/index/images/noImage.webp"}')`;
}

function setupAvatar(uid) {
  const input = $("avatarUploadInput");
  const click = $("avatarClickArea");
  const avatar = $("dashboardAvatar");
  if (!input || !click || !avatar) return;

  click.onclick = () => input.click();

  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;

    const url = await uploadAvatar(uid, file, "user");
    avatar.style.backgroundImage = `url('${url}')`;
  };
}

function setupProfileEdit(uid, userData) {
  const view = $("profileViewMode");
  const edit = $("profileEditMode");

  $("toggleEditProfile").onclick = () => { hide(view); show(edit); };
  $("cancelEditProfileBtn").onclick = () => { show(view); hide(edit); };

  $("saveProfileBtn").onclick = async () => {
    const name = $("profileNameInput").value.trim();
    const phone = $("profilePhoneInput").value.trim();
    const area = $("profileAreaInput").value.trim();
    const bio = $("profileBioInput").value.trim();

    await updateUser(uid, { name, phone, area, bio });

    $("profileFeedback").textContent = "✅ Profile updated";
    $("profileFeedback").className = "feedback-text feedback-success";

    $("viewName").textContent = name || "Add your name";
    $("viewPhone").textContent = phone || "Add your phone";
    $("viewArea").textContent = area || "Add your area";
    $("viewBio").textContent = bio || "Tell locals a bit about yourself.";

    $("settingsNameInput").value = name;
    $("settingsAreaInput").value = area;
    $("settingsBioInput").value = bio;

    show(view); hide(edit);
  };
}

/* ==========================
   USER POSTS
========================== */
function renderUserPosts(posts) {
  const box = $("userPosts");
  box.innerHTML = "";

  if (!posts.length) {
    box.innerHTML = `<p class="empty-msg">You haven’t posted anything yet.</p>`;
    return;
  }

  posts.forEach(post => {
    const card = document.createElement("div");
    card.className = "dash-card";
    card.innerHTML = `
      <img src="${post.imageUrl || "/index/images/image-webholder.webp"}" class="dash-img">
      <div class="dash-info">
        <h3>${post.title || "Untitled"}</h3>
        <p>${post.description || ""}</p>
      </div>
      <div class="dash-actions">
        <button class="dash-btn dash-edit" data-id="${post.id}">Edit</button>
        <button class="dash-btn dash-delete" data-id="${post.id}">Delete</button>
      </div>
    `;
    box.appendChild(card);
  });

  box.onclick = async e => {
    const btn = e.target;
    const id = btn.dataset.id;
    if (!id) return;

    if (btn.classList.contains("dash-delete")) {
      if (!confirm("Delete this ad?")) return;
      const post = posts.find(p => p.id === id);
      await deletePost(post);
      renderUserPosts(await getUserPosts(window.currentUser.uid));
    }

    if (btn.classList.contains("dash-edit")) {
      window.editPostId = id;
      window.openScreen("editPost");
    }
  };

  $("newPostBtn").onclick = () => window.openScreen("post");
}

/* ==========================
   BUSINESS PROFILE
========================== */
function renderBusinessProfile(biz) {
  $("bizViewName").textContent = biz.name || "Add your business name";
  $("bizViewPhone").textContent = biz.phone || "Add your phone";
  $("bizViewArea").textContent = biz.area || "Add your area";
  $("bizViewWebsite").textContent = biz.website || "Add your website";
  $("bizViewBio").textContent = biz.bio || "Tell customers what you offer";

  $("bizNameInput").value = biz.name || "";
  $("bizPhoneInput").value = biz.phone || "";
  $("bizAreaInput").value = biz.area || "";
  $("bizWebsiteInput").value = biz.website || "";
  $("bizBioInput").value = biz.bio || "";

  const avatar = $("bizDashboardAvatar");
  if (avatar) avatar.style.backgroundImage = `url('${biz.avatarUrl || "/index/images/noImage.webp"}')`;
}

function setupBusinessAvatar(uid) {
  const input = $("avatarUploadInput");
  const clickArea = $("bizAvatarClickArea");
  const avatar = $("bizDashboardAvatar");
  if (!input || !clickArea || !avatar) return;

  clickArea.onclick = () => input.click();
  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;

    const url = await uploadAvatar(uid, file, "business");
    avatar.style.backgroundImage = `url('${url}')`;
  };
}

function renderBusinessPosts(posts) {
  const box = $("bizPosts");
  box.innerHTML = "";

  if (!posts.length) {
    box.innerHTML = `<p class="biz-empty-msg">No business ads yet.</p>`;
    return;
  }

  posts.forEach(post => {
    const card = document.createElement("div");
    card.className = "biz-card";
    card.innerHTML = `
      <img src="${post.imageUrl || "/index/images/image-webholder2.webp"}" class="biz-card-img">
      <div class="biz-info">
        <h3>${post.title || "Untitled Ad"}</h3>
        <p>${post.description || ""}</p>
      </div>
      <div class="biz-actions">
        <button class="biz-btn biz-delete">Delete</button>
      </div>
    `;
    card.querySelector(".biz-delete").onclick = async () => {
      if (!confirm("Delete this ad?")) return;
      await deletePost(post);
      renderBusinessPosts(await getBusinessPosts(window.currentUser.uid));
    };
    box.appendChild(card);
  });

  $("bizNewPostBtn").onclick = () => window.openScreen("post");
}

/* ==========================
   UPGRADE MODAL
========================== */
function setupUpgradeModal(uid, userData) {
  const overlay = $("upgradeModalOverlay");
  const openBtn = $("openUpgradeModalBtn");
  const settingsBtn = $("settingsChangePlanBtn");
  const closeBtn = $("closeUpgradeModalBtn");
  const planButtons = document.querySelectorAll(".plan-btn");

  const open = () => show(overlay);
  const close = () => hide(overlay);

  if (openBtn) openBtn.onclick = open;
  if (settingsBtn) settingsBtn.onclick = open;
  if (closeBtn) closeBtn.onclick = close;

  overlay.addEventListener("click", e => {
    if (e.target === overlay) close();
  });

  planButtons.forEach(btn => {
    btn.onclick = async () => {
      const plan = btn.dataset.plan; // "free", "sellerplus", "business"
      if (plan === "free") await updateUser(uid, { plan: "free", businessTrial: null, sellerTrial: null });

      if (plan === "sellerplus") {
        const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
        await updateUser(uid, { plan: "sellerplus", sellerTrial: { active: true, expiresAt } });
      }

      if (plan === "business") {
        const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
        await updateUser(uid, { plan: "business", businessTrial: { active: true, expiresAt } });
      }

      window.loadView("dashboard"); // refresh view
    };
  });
}
