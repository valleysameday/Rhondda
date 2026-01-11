// ===============================================
// POST SUBMIT MODULE
// Handles preview content, image upload,
// post object creation, and saving to Firestore.
// ===============================================

import { addPost, uploadPostImage } from "/index/js/firebase/settings.js";

export function initPostSubmit() {

  // -----------------------------------
  // DOM ELEMENTS
  // -----------------------------------
  const previewModal = document.getElementById("postPreviewModal");
  const previewContent = document.getElementById("postPreview");
  const confirmBtn = document.getElementById("confirmPostBtn");

  const titleInput = document.getElementById("postTitle");
  const descInput = document.getElementById("postDescription");
  const contactInput = document.getElementById("postContact");
  const locationInput = document.getElementById("postLocation");
  const priceInput = document.getElementById("postPrice");
  const areaInput = document.getElementById("postArea");

  const featureInputs = [...document.querySelectorAll(".property-features input:checked")];

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
  // IMAGE COMPRESSION (same logic as post-images.js)
  // -----------------------------------
  async function compressImage(file, maxSize = 1280, quality = 0.72) {
    return new Promise(resolve => {
      const reader = new FileReader();

      reader.onload = event => {
        const img = new Image();

        img.onload = () => {
          let { width, height } = img;

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
  // FILL PREVIEW WITH IMAGES
  // -----------------------------------
  function fillPreviewImages() {
    if (!previewContent) return;

    const imageHTML = window.selectedImages
      .map(file => `<img src="${URL.createObjectURL(file)}">`)
      .join("");

    previewContent.innerHTML += `
      <div class="preview-images">
        ${imageHTML}
      </div>
    `;
  }

  // -----------------------------------
  // CONFIRM POST (UPLOAD + SAVE)
  // -----------------------------------
  confirmBtn?.addEventListener("click", async () => {
    if (!window.auth?.currentUser) {
      showToast("Please log in to post an ad.", "error");
      return;
    }

    confirmBtn.classList.add("loading");
    const originalText = confirmBtn.textContent;
    confirmBtn.textContent = "Uploading…";

    try {
      // Collect property features
      const features = [...document.querySelectorAll(".property-features input:checked")]
        .map(el => el.dataset.feature);

      // Build post object
      const postData = {
        userId: window.auth.currentUser.uid,
        category: window.selectedCategory,
        subCategory: window.selectedSubCategory,
        title: titleInput.value.trim(),
        description: descInput.value.trim(),
        createdAt: Date.now(),
        contact: contactInput.value.trim(),
        location: locationInput.value.trim(),
        price: Number(priceInput.value) || null,
        area: areaInput?.value || null,
        propertyType: window.propertyType,
        rentFrequency: window.rentFrequency,
        propertyFeatures: features,
        images: [],
        image: null
      };

      // Upload images
      for (const file of window.selectedImages) {
        const compressed = await compressImage(file);
        const url = await uploadPostImage(compressed, window.auth.currentUser.uid);
        postData.images.push(url);
      }

      // First image becomes cover
      postData.image = postData.images[0] || null;

      // Save post to Firestore
      await addPost(postData);

      showToast("Your ad is live!", "success");

      // Close modal
      previewModal?.classList.add("hidden");

      // Close posting screen
      document.querySelector('[data-action="close-screens"]')?.click();

      // Return to home
      if (typeof loadView === "function") loadView("home");

    } catch (err) {
      console.error(err);
      showToast("Failed to post ad.", "error");
    }

    confirmBtn.classList.remove("loading");
    confirmBtn.textContent = originalText;
  });

  // -----------------------------------
  // When preview modal opens, fill images
  // -----------------------------------
  const submitBtn = document.getElementById("postSubmitBtn");
  submitBtn?.addEventListener("click", () => {
    if (!window.auth?.currentUser) return;

    fillPreviewImages();
  });
                             }
