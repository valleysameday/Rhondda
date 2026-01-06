import { loadView } from "/index/js/main.js";
import { getPost, updatePost } from "/index/js/firebase/settings.js";

export async function init() {
  const id = window.editingPostId;
  const feedback = document.getElementById("editFeedback");

  if (!id) {
    loadView("home");
    return;
  }

  // Load existing post
  let post;
  try {
    post = await getPost(id);
    if (!post) {
      feedback.textContent = "Post not found.";
      return;
    }

    document.getElementById("editTitle").value = post.title || "";
    document.getElementById("editDescription").value = post.description || "";
    document.getElementById("editCategory").value = post.category || "";

  } catch (err) {
    console.error("Error loading post:", err);
    feedback.textContent = "Error loading post.";
    return;
  }

  // Save post
  document.getElementById("savePostBtn").onclick = async () => {
    const title = document.getElementById("editTitle").value.trim();
    const description = document.getElementById("editDescription").value.trim();
    const category = document.getElementById("editCategory").value;

    if (!title || !description) {
      feedback.textContent = "Title and description are required.";
      return;
    }
    if (!category) {
      feedback.textContent = "Please select a category.";
      return;
    }

    feedback.textContent = "Saving...";

    try {
      await updatePost(id, { title, description, category });
      feedback.textContent = "✅ Saved!";
      setTimeout(() => loadView("business-dashboard"), 400);
    } catch (err) {
      console.error("Error updating post:", err);
      feedback.textContent = "Error saving changes.";
    }
  };

  // Cancel editing
  document.getElementById("cancelEditBtn").onclick = () => {
    loadView("business-dashboard");
  };
}
