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

export async function init({ auth: a, db: d, storage: s }) {
  auth = a; db = d; storage = s;

  const user = auth.currentUser;
  if (!user) return loadView("home");

  const refDoc = doc(db, "businesses", user.uid);
  const snap = await getDoc(refDoc);
  if (!snap.exists()) return loadView("general-dashboard");

  const data = snap.data();

  // Profile
  bizHeaderName.textContent = data.name || "Your Business";
  bizHeaderTagline.textContent = data.name
    ? "Manage your ads, brand, and customers"
    : "Set up your business profile";

  bizViewName.textContent = data.name || "Add your business name";
  bizViewPhone.textContent = data.phone || "Add your phone";
  bizViewArea.textContent = data.area || "Add your area";
  bizViewWebsite.textContent = data.website || "Add your website";
  bizViewBio.textContent = data.bio || "Tell customers what you offer";

  if (data.avatarUrl)
    bizDashboardAvatar.style.backgroundImage = `url('${data.avatarUrl}')`;

  bizAvatarClickArea.onclick = () => bizAvatarUploadInput.click();
  bizAvatarUploadInput.onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;

    const r = ref(storage, `avatars/${user.uid}.jpg`);
    await uploadBytes(r, file);
    const url = await getDownloadURL(r);
    await updateDoc(refDoc, { avatarUrl: url });
    bizDashboardAvatar.style.backgroundImage = `url('${url}')`;
  };

  const postsSnap = await getDocs(
    query(collection(db, "posts"), where("businessId", "==", user.uid))
  );

  const stats = renderPostsAndStats(
    "bizPosts",
    postsSnap,
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

  bizStatAdsCount.textContent = stats.adsCount;
  bizStatTotalViews.textContent = stats.totalViews;
  bizStatLeads.textContent = stats.totalLeads;

  bizLogoutBtn.onclick = async () => {
    bizLogoutOverlay.style.display = "flex";
    await signOut(auth);
    window.location.href = "/";
  };

  bizNewPostBtn.onclick = () => openScreen("post");
}
