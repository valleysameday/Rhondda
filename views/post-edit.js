import { getPost, updatePost } from "/index/js/firebase/settings.js";
import { loadView } from "/index/js/main.js";

export async function init({ auth, db, storage }) {
  const postId = window.currentViewOptions?.postId;

  if (!postId) {
    console.warn("❌ No postId passed to edit view");
    return;
  }

  let failCount = 0;
  const feedback = document.getElementById("editFeedback");

  // Load post data
  const post = await getPost(postId);
  if (!post) {
    feedback.textContent = "Unable to load this ad. Please try again.";
    feedback.className = "edit-feedback error";
    return;
  }

  // Populate fields
  document.getElementById("editTitle").value = post.title || "";
  document.getElementById("editDescription").value = post.description || "";
  document.getElementById("editCategory").value = post.category || "";

  // Save button
  document.getElementById("savePostBtn").addEventListener("click", async () => {
    feedback.textContent = "";
    feedback.className = "edit-feedback";

    try {
      await updatePost(postId, {
        title: document.getElementById("editTitle").value,
        description: document.getElementById("editDescription").value,
        category: document.getElementById("editCategory").value
      });

      feedback.textContent = "Your ad has been updated successfully.";
      feedback.className = "edit-feedback success";

      setTimeout(() => {
        loadView("my-ads", { forceInit: true });
      }, 800);

    } catch (err) {
      failCount++;
      feedback.textContent = "Failed to update your ad. Please try again.";
      feedback.className = "edit-feedback error";

      // After 3 failures → show contact button
      if (failCount >= 3) {
        const btn = document.createElement("button");
        btn.textContent = "Contact Support";
        btn.className = "edit-contact-btn";
        btn.addEventListener("click", () => loadView("contact", { forceInit: true }));
        feedback.appendChild(document.createElement("br"));
        feedback.appendChild(btn);
      }
    }
  });

  // Cancel button
  document.getElementById("cancelEditBtn").addEventListener("click", () => {
    loadView("my-ads", { forceInit: true });
  });
}
