import { getPost, updatePost } from "/index/js/firebase/settings.js";

export async function init({ auth, db, storage }) {
  const postId = window.currentViewOptions?.postId;
  if (!postId) return;

  const post = await getPost(postId);

  document.getElementById("editTitle").value = post.title || "";
  document.getElementById("editDescription").value = post.description || "";
  document.getElementById("editCategory").value = post.category || "";

  document.getElementById("savePostBtn").addEventListener("click", async () => {
    await updatePost(postId, {
      title: document.getElementById("editTitle").value,
      description: document.getElementById("editDescription").value,
      category: document.getElementById("editCategory").value
    });

    loadView("my-ads", { forceInit: true });
  });

  document.getElementById("cancelEditBtn").addEventListener("click", () => {
    loadView("my-ads");
  });
}
