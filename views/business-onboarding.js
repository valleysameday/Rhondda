import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

let auth, db, storage;
let editingService = null; // holds service being edited (if any)
let isSubmitting = false;

// ===============================================
// INIT
// ===============================================
export function init({ auth: a, db: d, storage: s, editService = null }) {
  auth = a;
  db = d;
  storage = s;
  editingService = editService;

  console.log("📘 Business Onboarding Loaded", editingService ? "(edit mode)" : "(new)");

  setupNavigation();
  setupPostcodeCheck();
  setupPhotoPreview();
  setupSubmit();
  setupPreviewTrigger();

  if (editingService) {
    populateEditMode(editingService);
  }
}

// ===============================================
// STEP NAVIGATION
// ===============================================
function setupNavigation() {
  document.querySelectorAll(".onboarding-next").forEach(btn => {
    btn.addEventListener("click", () => {
      const next = btn.dataset.next;
      if (next) showStep(next);
    });
  });

  document.querySelectorAll(".onboarding-back").forEach(btn => {
    btn.addEventListener("click", () => {
      const back = btn.dataset.back;
      if (back) showStep(back);
    });
  });
}

function showStep(id) {
  document.querySelectorAll(".onboarding-step").forEach(step => {
    step.classList.add("hidden");
    step.classList.remove("step-active");
  });
  const target = document.getElementById(id);
  target.classList.remove("hidden");
  target.classList.add("step-active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ===============================================
// POSTCODE CHECK
// ===============================================
function setupPostcodeCheck() {
  const btn = document.querySelector("#step-postcode .onboarding-next");
  const input = document.getElementById("onboardingPostcode");
  const error = document.getElementById("postcodeError");

  btn.addEventListener("click", e => {
    const val = input.value.trim().toUpperCase();

    const allowed = ["CF41", "CF42", "CF43", "CF44"];
    const prefix = val.substring(0, 4);

    if (!allowed.includes(prefix)) {
      error.classList.remove("hidden");
      input.classList.add("field-error");
      e.stopImmediatePropagation();
      return;
    }

    error.classList.add("hidden");
    input.classList.remove("field-error");
  });
}

// ===============================================
// PHOTO PREVIEW
// ===============================================
let logoFile = null;
let photoFiles = [];

function setupPhotoPreview() {
  const logoInput = document.getElementById("bizLogo");
  const photosInput = document.getElementById("bizPhotos");
  const preview = document.getElementById("photoPreview");

  if (!logoInput || !photosInput) return;

  logoInput.addEventListener("change", e => {
    logoFile = e.target.files[0] || null;
    renderThumbPreview();
  });

  photosInput.addEventListener("change", e => {
    photoFiles = Array.from(e.target.files).slice(0, 6);
    renderThumbPreview();
  });

  function renderThumbPreview() {
    preview.innerHTML = "";

    if (logoFile) {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(logoFile);
      img.className = "preview-logo";
      preview.appendChild(img);
    }

    photoFiles.forEach(file => {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      img.className = "preview-photo";
      preview.appendChild(img);
    });
  }
}

// ===============================================
// PREVIEW TRIGGER
// ===============================================
function setupPreviewTrigger() {
  const btn = document.querySelector('[data-next="step-preview"]');
  if (!btn) return;

  btn.addEventListener("click", () => {
    const valid = validateFormFields();
    if (!valid) return;
    generatePreview();
  });
}

// ===============================================
// SUBMIT LISTING
// ===============================================
function setupSubmit() {
  const btn = document.getElementById("submitListingBtn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    if (isSubmitting) return;
    const user = auth.currentUser;
    if (!user) return alert("You must be logged in.");

    const data = collectFormData();
    if (!data) return;

    isSubmitting = true;
    setButtonLoading(btn, true);

    let listingId = null;

    if (editingService && editingService.id) {
      listingId = await updateListing(editingService.id, data);
    } else {
      listingId = await saveListing(user.uid, data);
    }

    setButtonLoading(btn, false);
    isSubmitting = false;

    if (!listingId) {
      alert("Something went wrong saving your listing.");
      return;
    }

    showStep("step-success");

    const goBtn = document.getElementById("goToMyBusiness");
    if (goBtn) {
      goBtn.onclick = () => {
        loadView("view-service", { forceInit: true, serviceId: listingId });
      };
    }
  });
}

function setButtonLoading(btn, isLoading) {
  if (isLoading) {
    btn.dataset.originalText = btn.textContent;
    btn.textContent = "Saving…";
    btn.classList.add("btn-loading");
    btn.disabled = true;
  } else {
    btn.textContent = btn.dataset.originalText || "Publish Listing";
    btn.classList.remove("btn-loading");
    btn.disabled = false;
  }
}

// ===============================================
// COLLECT FORM DATA + VALIDATION
// ===============================================
function collectFormData() {
  const nameEl = document.getElementById("bizName");
  const categoryEl = document.getElementById("bizCategory");
  const descEl = document.getElementById("bizDescription");
  const phoneEl = document.getElementById("bizPhone");
  const websiteEl = document.getElementById("bizWebsite");
  const townEl = document.getElementById("bizTown");
  const areaEl = document.getElementById("bizArea");

  const name = nameEl.value.trim();
  const category = categoryEl.value.trim();
  const desc = descEl.value.trim();
  const phone = phoneEl.value.trim();
  const website = websiteEl.value.trim();
  const town = townEl.value.trim();
  const area = areaEl.value.trim();

  // reset errors
  [nameEl, categoryEl, descEl, phoneEl, townEl].forEach(el => el.classList.remove("field-error"));

  let hasError = false;

  if (!name) { nameEl.classList.add("field-error"); hasError = true; }
  if (!category) { categoryEl.classList.add("field-error"); hasError = true; }
  if (!desc) { descEl.classList.add("field-error"); hasError = true; }
  if (!phone) { phoneEl.classList.add("field-error"); hasError = true; }
  if (!town) { townEl.classList.add("field-error"); hasError = true; }

  if (hasError) {
    alert("Please fill in all required fields.");
    return null;
  }

  return {
    name,
    category,
    description: desc,
    phone,
    website,
    town,
    area,
    createdAt: editingService?.createdAt || Date.now(),
    isActive: true
  };
}

function validateFormFields() {
  const data = collectFormData();
  return !!data;
}

// ===============================================
// SAVE NEW LISTING
// ===============================================
async function saveListing(uid, data) {
  try {
    const slug = createSlug(data);

    const docRef = await addDoc(collection(db, "services"), {
      ...data,
      ownerUid: uid,
      slug,
      logoUrl: editingService?.logoUrl || null,
      photoUrls: editingService?.photoUrls || []
    });

    const id = docRef.id;

    const logoUrl = await uploadLogo(id);
    const photoUrls = await uploadPhotos(id);

    await updateDoc(doc(db, "services", id), {
      logoUrl: logoUrl || editingService?.logoUrl || null,
      photoUrls: photoUrls.length ? photoUrls : (editingService?.photoUrls || [])
    });

    return id;

  } catch (err) {
    console.error("❌ Failed to save listing:", err);
    return null;
  }
}

// ===============================================
// UPDATE EXISTING LISTING
// ===============================================
async function updateListing(serviceId, data) {
  try {
    const slug = createSlug(data);

    const logoUrl = await uploadLogo(serviceId);
    const photoUrls = await uploadPhotos(serviceId);

    await updateDoc(doc(db, "services", serviceId), {
      ...data,
      slug,
      logoUrl: logoUrl || editingService?.logoUrl || null,
      photoUrls: photoUrls.length ? photoUrls : (editingService?.photoUrls || [])
    });

    return serviceId;

  } catch (err) {
    console.error("❌ Failed to update listing:", err);
    return null;
  }
}

// ===============================================
// SLUG GENERATION
// ===============================================
function createSlug(data) {
  const clean = str =>
    (str || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  return `${clean(data.category)}/${clean(data.town)}/${clean(data.name)}`;
}

// ===============================================
// IMAGE UPLOADS
// ===============================================
async function uploadLogo(id) {
  if (!logoFile) return null;

  const path = `services/${id}/logo.jpg`;
  const refPath = ref(storage, path);

  await uploadBytes(refPath, logoFile);
  return await getDownloadURL(refPath);
}

async function uploadPhotos(id) {
  const urls = [];

  for (let i = 0; i < photoFiles.length; i++) {
    const file = photoFiles[i];
    const path = `services/${id}/photo-${i}.jpg`;
    const refPath = ref(storage, path);

    await uploadBytes(refPath, file);
    const url = await getDownloadURL(refPath);
    urls.push(url);
  }

  return urls;
}

// ===============================================
// PREVIEW GENERATION
// ===============================================
function generatePreview() {
  const container = document.getElementById("previewContainer");
  if (!container) return;
  container.innerHTML = "";

  const name = document.getElementById("bizName").value.trim();
  const category = document.getElementById("bizCategory").value.trim();
  const desc = document.getElementById("bizDescription").value.trim();
  const phone = document.getElementById("bizPhone").value.trim();
  const website = document.getElementById("bizWebsite").value.trim();
  const town = document.getElementById("bizTown").value.trim();
  const area = document.getElementById("bizArea").value.trim();

  const logoUrl = logoFile
    ? URL.createObjectURL(logoFile)
    : (editingService?.logoUrl || "/assets/default-logo.png");

  let photosHtml = "";
  if (photoFiles.length) {
    photoFiles.forEach(f => {
      photosHtml += `<img src="${URL.createObjectURL(f)}" class="preview-photo-large">`;
    });
  } else if (editingService?.photoUrls?.length) {
    editingService.photoUrls.forEach(u => {
      photosHtml += `<img src="${u}" class="preview-photo-large">`;
    });
  }

  container.innerHTML = `
    <div class="service-card-preview">

      <div class="service-card-header">
        <img src="${logoUrl}" class="service-card-logo">
        <div>
          <h3>${name}</h3>
          <p>${category} • ${town}</p>
        </div>
      </div>

      <p class="service-card-desc">${desc}</p>

      <div class="service-card-gallery">
        ${photosHtml}
      </div>

      <div class="service-card-contact">
        <p><strong>Phone:</strong> ${phone}</p>
        ${website ? `<p><strong>Website:</strong> ${website}</p>` : ""}
        <p><strong>Service Area:</strong> ${area}</p>
      </div>

    </div>
  `;
}

// ===============================================
// EDIT MODE POPULATION
// ===============================================
function populateEditMode(service) {
  document.getElementById("bizName").value = service.name || service.businessName || "";
  document.getElementById("bizCategory").value = service.category || "";
  document.getElementById("bizDescription").value = service.description || "";
  document.getElementById("bizPhone").value = service.phone || "";
  document.getElementById("bizWebsite").value = service.website || "";
  document.getElementById("bizTown").value = service.town || "";
  document.getElementById("bizArea").value = service.area || "";

  const btn = document.getElementById("submitListingBtn");
  if (btn) btn.textContent = "Save Changes";

  // optional: jump straight to details step in edit mode
  showStep("step-details");
}
