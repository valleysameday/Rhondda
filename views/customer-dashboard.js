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

let auth, db;

getFirebase().then(fb => {
  auth = fb.auth;
  db = fb.db;

  onAuthStateChanged(auth, async user => {
    if (!user) {
      loadView("home");
      return;
    }

    /* ---------------- LOAD PROFILE ---------------- */
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const u = snap.data();
      document.getElementById("profileName").value = u.name || "";
      document.getElementById("profilePhone").value = u.phone || "";
      document.getElementById("profileBio").value = u.bio || "";
    }

    /* ---------------- SAVE PROFILE ---------------- */
    document.getElementById("saveProfileBtn").addEventListener("click", async () => {
      const name = document.getElementById("profileName").value.trim();
      const phone = document.getElementById("profilePhone").value.trim();
      const bio = document.getElementById("profileBio").value.trim();
      const feedback = document.getElementById("profileFeedback");

      feedback.textContent = "Saving...";

      await updateDoc(userRef, { name, phone, bio });

      feedback.textContent = "✅ Profile updated!";
      feedback.classList.add("feedback-success");

      setTimeout(() => feedback.textContent = "", 1500);
    });

    /* ---------------- LOAD USER POSTS ---------------- */
    const q = query(collection(db, "posts"), where("userId", "==", user.uid));
    const postsSnap = await getDocs(q);

    const container = document.getElementById("userPosts");
    container.innerHTML = "";

    if (postsSnap.empty) {
      container.innerHTML = `<p class="empty-msg">You haven’t posted anything yet.</p>`;
    }

    postsSnap.forEach(docSnap => {
      const p = docSnap.data();
      const id = docSnap.id;

      container.innerHTML += `
        <div class="dash-card">
          <img src="${p.imageUrl || '/images/post-placeholder.jpg'}" class="dash-img">
          <div class="dash-info">
            <h3>${p.title}</h3>
            <p>${p.description}</p>
            <small>${p.category} ${p.subcategory ? "• " + p.subcategory : ""}</small>
          </div>
          <div class="dash-actions">
            <button class="dash-btn dash-edit" data-id="${id}">Edit</button>
            <button class="dash-btn dash-delete" data-id="${id}">Delete</button>
          </div>
        </div>
      `;
    });

    /* ---------------- DELETE POST ---------------- */
    document.querySelectorAll(".dash-delete").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this ad?")) return;
        await deleteDoc(doc(db, "posts", btn.dataset.id));
        loadView("customer-dashboard");
      });
    });

    /* ---------------- EDIT POST ---------------- */
    document.querySelectorAll(".dash-edit").forEach(btn => {
      btn.addEventListener("click", () => {
        openScreen("editPost");
        window.editPostId = btn.dataset.id;
      });
    });

    /* ---------------- NEW POST ---------------- */
    document.getElementById("newPostBtn").addEventListener("click", () => {
      openScreen("post");
    });

    /* ---------------- LOGOUT ---------------- */
    document.getElementById("logoutBtn").addEventListener("click", () => {
      const overlay = document.getElementById("logoutOverlay");
      overlay.style.display = "flex";

      signOut(auth).then(() => {
        setTimeout(() => navigateToHome(), 2000);
      });
    });
  });
});
