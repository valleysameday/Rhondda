import { getFirebase } from '/index/js/firebase/init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import { renderPostsAndStats } from '/index/js/dashboard/posts.js';
import { loadView } from '/index/js/main.js';

let auth, db, storage;

export async function init({ auth: _auth, db: _db, storage: _storage }) {
  auth = _auth; db = _db; storage = _storage;

  onAuthStateChanged(auth, async user => {
    if (!user) return loadView("home");

    const userRef = doc(db, "businesses", user.uid);
    const snap = await getDoc(userRef);
    const data = snap.exists() ? snap.data() : {};

    // Fill profile
    document.getElementById("bizHeaderName").textContent = data.name || "Your Business";
    document.getElementById("bizHeaderTagline").textContent = data.name ? "Manage your ads, brand, and customers" : "Set up your business profile";
    document.getElementById("bizViewName").textContent = data.name || "Add your business name";
    document.getElementById("bizViewPhone").textContent = data.phone || "Add your phone";
    document.getElementById("bizViewArea").textContent = data.area || "Add your area";
    document.getElementById("bizViewWebsite").textContent = data.website || "Add your website";
    document.getElementById("bizViewBio").textContent = data.bio || "Tell customers what you offer";

    // Avatar upload
    const avatarCircle = document.getElementById("bizDashboardAvatar");
    const avatarInput = document.getElementById("bizAvatarUploadInput");
    const avatarClickArea = document.getElementById("bizAvatarClickArea");
    if (data.avatarUrl) avatarCircle.style.backgroundImage = `url('${data.avatarUrl}')`;

    avatarClickArea.addEventListener("click", () => avatarInput.click());
    avatarInput.addEventListener("change", async () => {
      const file = avatarInput.files[0];
      if (!file) return;
      const storageRef = ref(storage, `avatars/${user.uid}.jpg`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(userRef, { avatarUrl: url });
      avatarCircle.style.backgroundImage = `url('${url}')`;
    });

    // Load posts
    const postsSnap = await getDocs(query(collection(db, "posts"), where("businessId", "==", user.uid)));
    const stats = renderPostsAndStats("bizPosts", postsSnap, 
      id => openScreen("editPost"), 
      async id => {
        if (!confirm("Delete this ad?")) return;
        const postSnap = await getDoc(doc(db, "posts", id));
        const post = { id, ...postSnap.data() };

        // Delete images
        const urls = post.imageUrls || (post.imageUrl ? [post.imageUrl] : []);
        for (const url of urls) {
          const path = url.split("/o/")[1].split("?")[0];
          await deleteObject(ref(storage, decodeURIComponent(path)));
        }

        await deleteDoc(doc(db, "posts", id));
        loadView("business-dashboard");
      }
    );

    // Update stats display
    document.getElementById("bizStatAdsCount").textContent = stats.adsCount;
    document.getElementById("bizStatTotalViews").textContent = stats.totalViews;
    document.getElementById("bizStatLeads").textContent = stats.totalLeads;

    // Logout
    document.getElementById("bizLogoutBtn").addEventListener("click", () => {
      document.getElementById("bizLogoutOverlay").style.display = "flex";
      signOut(auth).then(() => setTimeout(() => loadView("home"), 2000));
    });

    // New post
    document.getElementById("bizNewPostBtn").addEventListener("click", () => openScreen("post"));
  });
}
