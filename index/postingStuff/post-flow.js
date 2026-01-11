// ===============================================
// POST FLOW MODULE
// Handles steps, categories, property logic,
// validation, and preview modal opening.
// ===============================================

export function initPostFlow() {

  // -------------------------------
  // GLOBAL SHARED STATE
  // -------------------------------
  window.selectedCategory = null;
  window.selectedSubCategory = null;
  window.propertyType = null;
  window.rentFrequency = null;

  // -------------------------------
  // DOM ELEMENTS
  // -------------------------------
  const steps = [...document.querySelectorAll("#posts-grid .post-step")];
  const dots = [...document.querySelectorAll(".post-progress .dot")];

  const titleInput = document.getElementById("postTitle");
  const descInput = document.getElementById("postDescription");
  const contactInput = document.getElementById("postContact");
  const locationInput = document.getElementById("postLocation");
  const priceInput = document.getElementById("postPrice");

  const priceBox = document.querySelector(".price-box");
  const priceLabel = document.querySelector('label[for="postPrice"]');

  const areaBox = document.querySelector(".area-box");

  const nextBtnStep2 = document.querySelector('.post-step[data-step="2"] .post-next');
  const submitBtn = document.getElementById("postSubmitBtn");

  const propertyOptions = document.querySelector(".property-options");
  const propertyFeatures = document.querySelector(".property-features");
  const forSaleOptions = document.querySelector(".forsale-options");
  const jobsOptions = document.querySelector(".jobs-options");
  const eventsOptions = document.querySelector(".events-options");
  const communityOptions = document.querySelector(".community-options");

  const communityType = document.getElementById("communityType");
  const lostFoundExtra = document.getElementById("lostFoundExtra");

  const propertyTypeBtns = [...document.querySelectorAll("[data-property-type]")];
  const rentFreqBtns = [...document.querySelectorAll("[data-rent-frequency]")];

  const previewModal = document.getElementById("postPreviewModal");
  const previewContent = document.getElementById("postPreview");
  const previewClose = previewModal?.querySelector(".preview-close");
  const previewOverlay = previewModal?.querySelector(".preview-overlay");

  // -------------------------------
  // STEP NAVIGATION
  // -------------------------------
  let currentStep = 0;

  function goToStep(index) {
    if (index < 0 || index >= steps.length) return;

    steps.forEach(s => s.classList.remove("active"));
    dots.forEach(d => d.classList.remove("active"));

    steps[index].classList.add("active");
    dots[index].classList.add("active");

    currentStep = index;

    if (index === 1) validateStep2();
  }

  document.querySelectorAll(".post-next").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!btn.disabled) goToStep(currentStep + 1);
    });
  });

  document.querySelectorAll(".post-prev").forEach(btn => {
    btn.addEventListener("click", () => goToStep(currentStep - 1));
  });

  // -------------------------------
  // VALIDATION FOR STEP 2
  // -------------------------------
  function validateStep2() {
    const validTitle = titleInput.value.trim().length >= 3;
    const validDesc = descInput.value.trim().length >= 10;

    let validCategory = !!window.selectedCategory;

    if (window.selectedCategory === "property") {
      validCategory = !!window.selectedSubCategory;

      if (window.selectedSubCategory === "property-rent") {
        validCategory = !!window.rentFrequency;
      }
    }

    nextBtnStep2.disabled = !(validTitle && validDesc && validCategory);
  }

  ["input", "keyup", "change"].forEach(evt => {
    titleInput.addEventListener(evt, validateStep2);
    descInput.addEventListener(evt, validateStep2);
  });

  // -------------------------------
  // PRICE LABEL LOGIC
  // -------------------------------
  function updatePriceLabel() {
    if (window.selectedCategory !== "property") {
      priceLabel.textContent = "Price (£)";
      priceInput.placeholder = "Price (optional)";
      return;
    }

    if (window.propertyType === "sale") {
      priceLabel.textContent = "Sale price (£)";
    } else if (window.propertyType === "rent") {
      priceLabel.textContent =
        window.rentFrequency === "weekly"
          ? "Weekly rent (£)"
          : "Monthly rent (PCM)";
    }
  }

  // -------------------------------
  // CATEGORY SELECTION
  // -------------------------------
  document.querySelectorAll(".category-grid [data-category]").forEach(btn => {
    btn.addEventListener("click", () => {
      window.selectedCategory = btn.dataset.category;
      window.selectedSubCategory = null;
      window.propertyType = null;
      window.rentFrequency = null;

      // Hide all optional sections
      propertyOptions.hidden = true;
      propertyFeatures.hidden = true;
      forSaleOptions.hidden = true;
      jobsOptions.hidden = true;
      eventsOptions.hidden = true;
      communityOptions.hidden = true;
      areaBox.hidden = true;

      // Show relevant sections
      if (window.selectedCategory === "property") {
        propertyOptions.hidden = false;
        propertyFeatures.hidden = false;
        areaBox.hidden = false;
      }

      if (window.selectedCategory === "jobs") {
        jobsOptions.hidden = false;
      }

      if (window.selectedCategory === "community") {
        communityOptions.hidden = false;
      }

      // Price visibility
      priceBox.hidden =
        window.selectedCategory === "free" ||
        window.selectedCategory === "jobs" ||
        window.selectedCategory === "community";

      updatePriceLabel();
      goToStep(1);
    });
  });

  // -------------------------------
  // PROPERTY TYPE (SALE / RENT)
  // -------------------------------
  propertyTypeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      window.propertyType = btn.dataset.propertyType;
      window.selectedSubCategory =
        window.propertyType === "sale" ? "property-sale" : "property-rent";

      window.rentFrequency = null;

      propertyTypeBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      rentFreqBtns.forEach(b => {
        b.style.display = window.propertyType === "rent" ? "inline-block" : "none";
        b.classList.remove("active");
      });

      updatePriceLabel();
      validateStep2();
    });
  });

  // -------------------------------
  // RENT FREQUENCY
  // -------------------------------
  rentFreqBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      window.rentFrequency = btn.dataset.rentFrequency;

      rentFreqBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      updatePriceLabel();
      validateStep2();
    });
  });

  // -------------------------------
  // COMMUNITY: LOST & FOUND EXTRA
  // -------------------------------
  if (communityType) {
    communityType.addEventListener("change", e => {
      lostFoundExtra.hidden = e.target.value !== "lost";
    });
  }

  // -------------------------------
  // PREVIEW MODAL (OPEN ONLY)
  // -------------------------------
  submitBtn.addEventListener("click", () => {
    if (!window.auth?.currentUser) {
      showToast("Please log in to post an ad.", "error");
      return;
    }

    if (!previewModal) return;

    previewContent.innerHTML = `
      <h2>${titleInput.value.trim()}</h2>
      <p>${descInput.value.trim()}</p>

      <p><strong>Location:</strong> ${locationInput.value.trim() || "—"}</p>
      <p><strong>Price:</strong> £${priceInput.value || "—"}</p>
    `;

    previewModal.classList.remove("hidden");
  });

  // -------------------------------
  // PREVIEW MODAL CLOSE
  // -------------------------------
  function closePreview() {
    previewModal?.classList.add("hidden");
  }

  previewClose?.addEventListener("click", closePreview);
  previewOverlay?.addEventListener("click", closePreview);

  // -------------------------------
  // TOAST UTILITY
  // -------------------------------
  function showToast(msg, type = "info") {
    const el = document.createElement("div");
    el.textContent = msg;
    el.className = `toast ${type}`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2800);
  }
}
