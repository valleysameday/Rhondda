import { doc, getDoc, updateDoc } from 
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { loadView } from "/index/js/main.js";

let auth, db;

export async function init({ auth: a, db: d }) {
  auth = a;
  db = d;

  const id = window.editingPostId;
  if (!id) return loadView("home");

  const snap = await getDoc(doc(db, "posts", id));
  if (!snap.exists()) return loadView("home");

  const p = snap.data();

  document.getElementById("editTitle").value = p.title || "";
  document.getElementById("editDescription").value = p.description || "";
  document.getElementById("editCategory").value = p.category || "";

  document.getElementById("savePostBtn").onclick = async () => {
    await updateDoc(doc(db, "posts", id), {
      title: document.getElementById("editTitle").value,
      description: document.getElementById("editDescription").value,
      category: document.getElementById("editCategory").value
    });

    loadView("business-dashboard"); // or general-dashboard depending on user
  };

  document.getElementById("cancelEditBtn").onclick = () => {
    loadView("business-dashboard");
  };
}
