// ===============================================
// POST IMAGES MODULE
// Handles image selection, compression,
// preview thumbnails, and deletion.
// ===============================================

export function initPostImages() {

  // -----------------------------------
  // GLOBAL SHARED IMAGE ARRAY
  // -----------------------------------
  window.selectedImages = [];

  // -----------------------------------
  // DOM ELEMENTS
  // -----------------------------------
  const fileInput = document.getElementById("postImages");
  const addPhotosBtn = document.getElementById("addPhotosBtn");
  const previewGrid = document.getElementById("imagePreview");

  if (!fileInput || !addPhotosBtn || !previewGrid) return;

  // -----------------------------------
  // IMAGE COMPRESSION
  // -----------------------------------
  async function compressImage(file, maxSize = 1280, quality = 0.72) {
    return new Promise(resolve => {
      const reader = new FileReader();

      reader.onload = event => {
        const img = new Image();

        img.onload = () => {
          let { width, height } = img;

          // Resize logic
          if (width > height && width > maxSize) {
            height = height * (maxSize / width);
            width = maxSize;
          } else if (height > maxSize) {
            width = width * (maxSize / height);
            height = maxSize;
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            blob => resolve(blob),
            "image/jpeg",
            quality
          );
        };

        img.src = event.target.result;
      };

      reader.readAsDataURL(file);
    });
  }

  // -----------------------------------
  // TOAST UTILITY
  // -----------------------------------
  function showToast(msg, type = "info") {
    const el = document.createElement("div");
    el.textContent = msg;
    el.className = `toast ${type}`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2800);
  }

  // -----------------------------------
  // RENDER THUMBNAILS
  // -----------------------------------
  function renderThumbnails() {
    previewGrid.innerHTML = "";

    window.selectedImages.forEach((file, index) => {
      const wrapper = document.createElement("div");
      wrapper.className = "preview-thumb-wrapper";

      const img = document.createElement("img");
      img.className = "preview-thumb";
      img.src = URL.createObjectURL(file);

      const delBtn = document.createElement("button");
      delBtn.className = "delete-thumb";
      delBtn.textContent = "×";

      delBtn.onclick = () => {
        window.selectedImages.splice(index, 1);
        renderThumbnails();
      };

      wrapper.appendChild(img);
      wrapper.appendChild(delBtn);
      previewGrid.appendChild(wrapper);
    });
  }

  // -----------------------------------
  // ADD PHOTOS BUTTON
  // -----------------------------------
  addPhotosBtn.addEventListener("click", () => fileInput.click());

  // -----------------------------------
  // FILE INPUT CHANGE
  // -----------------------------------
  fileInput.addEventListener("change", async () => {
    const newFiles = [...fileInput.files];

    if (window.selectedImages.length + newFiles.length > 6) {
      showToast("Max 6 images allowed", "error");
      return;
    }

    // Add raw files (compression happens in submit module)
    window.selectedImages.push(...newFiles);

    renderThumbnails();
  });
}
