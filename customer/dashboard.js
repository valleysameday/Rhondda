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

  onAuthStateChanged(auth, async user => {
    if (!user) return window.location.href = "/";

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

    // DELETE HANDLER
    document.querySelectorAll(".dash-delete").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this ad?")) return;
        await deleteDoc(doc(db, "posts", btn.dataset.id));
        location.reload();
      });
    });
  });

  document.getElementById("logoutBtn").addEventListener("click", () => {
    signOut(auth).then(() => window.location.href = "/");
  });
});
