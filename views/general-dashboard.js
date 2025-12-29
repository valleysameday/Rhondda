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
      loadView("home");   // ✅ SPA navigation
      return;
    }

    // ✅ Load user's posts
    const q = query(collection(db, "posts"), where("userId", "==", user.uid));
    const snap = await getDocs(q);

    const container = document.getElementById("userPosts");
    container.innerHTML = "";

    if (snap.empty) {
      container.innerHTML = `<p class="empty-msg">You haven’t posted anything yet.</p>`;
      return;
    }

    snap.forEach(docSnap => {
      const p = docSnap.data();
      const id = docSnap.id;

      container.innerHTML += `
        <div class="dash-card">
          <img src="${p.images?.[0] || '/images/image-webholder.webp'}" class="dash-img">
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

    // DELETE HANDLER
    document.querySelectorAll(".dash-delete").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this ad?")) return;
        await deleteDoc(doc(db, "posts", btn.dataset.id));
        loadView("customer-dashboard");   // ✅ SPA reload
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
