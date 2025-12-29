// views/business-dashboard.js

import { signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  doc, getDoc, updateDoc,
  collection, query, where, getDocs, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  ref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

import { renderPostsAndStats } from '/index/js/dashboard/posts.js';
import { loadView } from '/index/js/main.js';

let auth, db, storage;

export async function init({ auth: _auth, db: _db, storage: _storage }) {
  auth = _auth;
  db = _db;
  storage = _storage;

  const user = auth.currentUser;
  if (!user) return loadView("home");

  const userRef = doc(db, "businesses", user.uid);
  const snap = await getDoc(userRef);
  const data = snap.exists() ? snap.data() : {};

  // Profile
  document.getElementById("bizHeaderName").textContent = data.name || "Your Business";
  document.getElementById("bizHeaderTagline").textContent =
    data.name ? "Manage your ads, brand, and customers" : "Set up your business profile";

  document.getElementById("bizViewName").textContent = data.name || "Add your business name";
  document.getElementById("bizViewPhone").textContent = data.phone || "Add your phone";
  document.getElementById("bizViewArea").textContent = data.area || "Add your area";
  document.getElementById("bizViewWebsite").textContent = data.website || "Add your website";
  document.getElementById("bizViewBio").textContent = data.bio || "Tell customers what you offer";

  // Avatar
  const avatar = document.getElementById("bizDashboardAvatar");
  if (data.avatarUrl) avatar.style.backgroundImage = `url('${data.avatarUrl}')`;

  document.getElementById("bizAvatarClickArea").onclick = () =>
    document.getElementById("bizAvatarUploadInput").click();

  document.getElementById("bizAvatarUploadInput").onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;

    const refPath = ref(storage, `avatars/${user.uid}.jpg`);
    await uploadBytes(refPath, file);
    const url = await getDownloadURL(refPath);
    await updateDoc(userRef, { avatarUrl: url });
    avatar.style.backgroundImage = `url('${url}')`;
  };

  // Posts + stats
  const snapPosts = await getDocs(
    query(collection(db, "posts"), where("businessId", "==", user.uid))
  );

  const stats = renderPostsAndStats(
    "bizPosts",
    snapPosts,
    id => openScreen("editPost"),
    async id => {
      if (!confirm("Delete this ad?")) return;
      const pSnap = await getDoc(doc(db, "posts", id));
      const post = pSnap.data();

      const urls = post.imageUrls || (post.imageUrl ? [post.imageUrl] : []);
      for (const url of urls) {
        const path = decodeURIComponent(url.split("/o/")[1].split("?")[0]);
        await deleteObject(ref(storage, path));
      }

      await deleteDoc(doc(db, "posts", id));
      loadView("business-dashboard");
    }
  );

  document.getElementById("bizStatAdsCount").textContent = stats.adsCount;
  document.getElementById("bizStatTotalViews").textContent = stats.totalViews;
  document.getElementById("bizStatLeads").textContent = stats.totalLeads;

  // Logout
  document.getElementById("bizLogoutBtn").onclick = async () => {
  try {
    document.getElementById("bizLogoutOverlay").style.display = "flex";

    // 1. Sign out from Firebase
    await signOut(auth);

    // 2. Clear any cached user data
    sessionStorage.clear();
    localStorage.removeItem("firebaseUserDoc");
    localStorage.removeItem("rhonddaThanksShown");

    // 3. Force a clean reload so no stale state survives
    window.location.href = "/"; // or your home route
  } catch (err) {
    console.error("Logout failed:", err);
    alert("Could not log out. Please try again.");
  }
};

  document.getElementById("bizNewPostBtn").onclick = () => openScreen("post");
}
