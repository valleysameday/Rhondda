import { doc, getDoc, updateDoc } from 
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { loadView } from "/index/js/main.js";

let auth, db;

export async function init({ auth: a, db: d }) {
  auth = a;
  db = d;

  const id = window.editingPostId;
  if (!id) return loadView("home");

  const feedback = document.getElementById("editFeedback");

  try {
    const snap = await getDoc(doc(db, "posts", id));
    if (!snap.exists()) {
      feedback.textContent = "Post not found.";
      return;
    }

    const p = snap.data();

    document.getElementById("editTitle").value = p.title || "";
    document.getElementById("editDescription").value = p.description || "";
    document.getElementById("editCategory").value = p.category || "";

  } catch (err) {
    feedback.textContent = "Error loading post.";
    return;
  }

  document.getElementById("savePostBtn").onclick = async () => {
    const title = document.getElementById("editTitle").value.trim();
    const description = document.getElementById("editDescription").value.trim();
    const category = document.getElementById("editCategory").value.trim();

    if (!title || !description) {
      feedback.textContent = "Title and description are required.";
      return;
    }

    feedback.textContent = "Saving...";

    try {
      await updateDoc(doc(db, "posts", id), {
        title,
        description,
        category
      });

      feedback.textContent = "Saved!";
      setTimeout(() => {
        loadView("business-dashboard");
      }, 400);

    } catch (err) {
      feedback.textContent = "Error saving changes.";
    }
  };

  document.getElementById("cancelEditBtn").onclick = () => {
    loadView("business-dashboard");
  };
}
