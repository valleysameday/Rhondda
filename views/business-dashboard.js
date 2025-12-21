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
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let auth, db;

getFirebase().then(fb => {
  auth = fb.auth;
  db = fb.db;

  let authResolved = false;

  onAuthStateChanged(auth, async user => {
    authResolved = true;

    if (!user) {
      navigateToHome();   // ✅ SPA navigation
      return;
    }

    // ✅ Check business status
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists() || !userDoc.data().isBusiness) {
      loadView("customer-dashboard");   // ✅ SPA navigation
      return;
    }

    // ✅ Load business posts
    const q = query(collection(db, "posts"), where("userId", "==", user.uid));
    const snap = await getDocs(q);

    const container = document.getElementById("businessPosts");
    container.innerHTML = "";

    if (snap.empty) {
      container.innerHTML = `<p class="empty-msg">You haven’t posted any business ads yet.</p>`;
      return;
    }

    snap.forEach(docSnap => {
      const p = docSnap.data();
      const id = docSnap.id;

      container.innerHTML += `
        <div class="dash-card business">
          <img src="${p.imageUrl || '/images/post-placeholder.jpg'}" class="dash-img">
          <div class="dash-info">
            <h3>${p.title}</h3>
            <p>${p.description}</p>
            <small>${p.category} ${p.subcategory ? "• " + p.subcategory : ""}</small>
          </div>
          <div class="dash-actions">
            <button class="dash-btn dash-edit" data-id="${id}">Edit</button>
            <button class="dash-btn dash-delete" data-id="${id}">Delete</button>
            <button class="dash-btn dash-feature" data-id="${id}">Feature</button>
          </div>
        </div>
      `;
    });

    // DELETE HANDLER
    document.querySelectorAll(".dash-delete").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this ad?")) return;
        await deleteDoc(doc(db, "posts", btn.dataset.id));
        loadView("business-dashboard");   // ✅ SPA reload
      });
    });

    // FEATURE HANDLER
    document.querySelectorAll(".dash-feature").forEach(btn => {
      btn.addEventListener("click", () => {
        alert("Featured ads coming soon!");
      });
    });
  });

  // ✅ Safety timeout
  setTimeout(() => {
    if (!authResolved && !auth.currentUser) {
      loadView("home");
    }
  }, 500);

  /* ---------------- LOGOUT WITH OVERLAY ---------------- */
  document.getElementById("logoutBtn").addEventListener("click", () => {
    const overlay = document.getElementById("logoutOverlay");
    overlay.style.display = "flex";

    signOut(auth).then(() => {
      setTimeout(() => {
        loadView("home");   // ✅ SPA navigation
      }, 3000);
    });
  });
});
