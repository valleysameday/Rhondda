import { getPost, updatePost } from "/index/js/firebase/settings.js";
import { loadView } from "/index/js/main.js";

export async function init({ auth, db, storage }) {
  const postId = window.currentViewOptions?.postId;

  if (!postId) {
    console.warn("❌ No postId passed to edit view");
    return;
  }

  // Load post data
  const post = await getPost(postId);
  if (!post) {
    console.warn("❌ Post not found");
    return;
  }

  // Populate fields
  document.getElementById("editTitle").value = post.title || "";
  document.getElementById("editDescription").value = post.description || "";
  document.getElementById("editCategory").value = post.category || "";

  // Save button
  document.getElementById("savePostBtn").addEventListener("click", async () => {
    await updatePost(postId, {
      title: document.getElementById("editTitle").value,
      description: document.getElementById("editDescription").value,
      category: document.getElementById("editCategory").value
    });

    loadView("my-ads", { forceInit: true });
  });

  // Cancel button
  document.getElementById("cancelEditBtn").addEventListener("click", () => {
    loadView("my-ads", { forceInit: true });
  });
}
