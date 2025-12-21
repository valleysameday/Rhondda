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

import { ref, deleteObject } 
from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

let auth, db, storage;

/* ---------------------------------------------------
   ✅ DELETE POST + IMAGES
--------------------------------------------------- */
async function deletePostAndImages(post) {
  try {
    const allImages = [];

    if (post.imageUrl) allImages.push(post.imageUrl);
    if (Array.isArray(post.imageUrls)) allImages.push(...post.imageUrls);

    for (const url of allImages) {
      const path = url.split("/o/")[1].split("?")[0];
      const storageRef = ref(storage, decodeURIComponent(path));
      await deleteObject(storageRef);
    }

    await deleteDoc(doc(db, "posts", post.id));
    console.log("✅ Deleted post + images:", post.id);

  } catch (err) {
    console.error("❌ Failed to delete post:", err);
  }
}

/* ---------------------------------------------------
   ✅ AUTO DELETE POSTS OLDER THAN 14 DAYS
--------------------------------------------------- */
async function autoDeleteExpiredPosts(userId) {
  const now = Date.now();
  const fourteenDays = 14 * 24 * 60 * 60 * 1000;

  const q = query(collection(db, "posts"), where("userId", "==", userId));
  const snap = await getDocs(q);

  snap.forEach(async docSnap => {
    const post = { id: docSnap.id, ...docSnap.data() };
    if (!post.createdAt) return;

    const age = now - post.createdAt.toMillis();
    if (age > fourteenDays) {
      await deletePostAndImages(post);
    }
  });
}

/* ---------------------------------------------------
   ✅ MAIN DASHBOARD LOGIC
--------------------------------------------------- */
getFirebase().then(fb => {
  auth = fb.auth;
  db = fb.db;
  storage = fb.storage;

  onAuthStateChanged(auth, async user => {
    if (!user) {
      loadView("home");
      return;
    }

    /* ---------------- LOAD PROFILE ---------------- */
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    let name = "", phone = "", area = "", bio = "";

    if (snap.exists()) {
      const u = snap.data();
      name = u.name || "";
      phone = u.phone || "";
      area = u.area || "";
      bio = u.bio || "";
    }

    document.getElementById("headerName").textContent = name || "Your account";
    document.getElementById("headerAreaBadge").textContent = area || "Add your area";
    document.getElementById("headerTagline").textContent =
      name ? "Your Rhondda profile is looking tidy" : "Let’s set up your Rhondda profile";

    document.getElementById("viewName").textContent = name || "Add your name";
    document.getElementById("viewPhone").textContent = phone || "Add your phone";
    document.getElementById("viewArea").textContent = area || "Add your area";
    document.getElementById("viewBio").textContent = bio || "Tell locals a bit about yourself.";

    document.getElementById("profileNameInput").value = name;
    document.getElementById("profilePhoneInput").value = phone;
    document.getElementById("profileAreaInput").value = area;
    document.getElementById("profileBioInput").value = bio;

    /* ---------------- LOAD POSTS ---------------- */
    const q = query(collection(db, "posts"), where("userId", "==", user.uid));
    const postsSnap = await getDocs(q);

    const container = document.getElementById("userPosts");
    container.innerHTML = "";

    let adsCount = 0, totalViews = 0, totalUnlocks = 0;

    if (postsSnap.empty) {
      container.innerHTML = `<p class="empty-msg">You haven’t posted anything yet.</p>`;
    }

    postsSnap.forEach(docSnap => {
      const p = docSnap.data();
      const id = docSnap.id;

      adsCount++;
      if (p.views) totalViews += p.views;
      if (p.unlocks) totalUnlocks += p.unlocks;

      container.innerHTML += `
        <div class="dash-card">
          <img src="${p.imageUrl || '/images/post-placeholder.jpg'}" class="dash-img">
          <div class="dash-info">
            <h3>${p.title}</h3>
            <p>${p.description}</p>
          </div>
          <div class="dash-actions">
            <button class="dash-btn dash-edit" data-id="${id}">Edit</button>
            <button class="dash-btn dash-delete" data-id="${id}">Delete</button>
          </div>
        </div>
      `;
    });

    document.getElementById("statAdsCount").textContent = adsCount;
    document.getElementById("statTotalViews").textContent = totalViews;
    document.getElementById("statUnlocks").textContent = totalUnlocks;

    /* ---------------- DELETE BUTTONS ---------------- */
    document.querySelectorAll(".dash-delete").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this ad?")) return;

        const postId = btn.dataset.id;
        const postSnap = await getDoc(doc(db, "posts", postId));
        const post = { id: postId, ...postSnap.data() };

        await deletePostAndImages(post);
        loadView("customer-dashboard");
      });
    });

    /* ---------------- AUTO DELETE OLD POSTS ---------------- */
    autoDeleteExpiredPosts(user.uid);

    /* ---------------- EDIT + NEW + LOGOUT ---------------- */
    document.querySelectorAll(".dash-edit").forEach(btn => {
      btn.addEventListener("click", () => {
        openScreen("editPost");
        window.editPostId = btn.dataset.id;
      });
    });

    document.getElementById("newPostBtn").addEventListener("click", () => {
      openScreen("post");
    });

    document.getElementById("logoutBtn").addEventListener("click", () => {
      document.getElementById("logoutOverlay").style.display = "flex";
      signOut(auth).then(() => setTimeout(() => navigateToHome(), 2000));
    });
  });
});
