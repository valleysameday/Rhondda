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

// ===============================================
// INIT
// ===============================================
export function init({ auth: a, db: d, storage: s }) {
  auth = a;
  db = d;
  storage = s;

  console.log("📘 Business Onboarding Loaded");

  setupNavigation();
  setupPostcodeCheck();
  setupPhotoPreview();
  setupSubmit();
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
  document.querySelectorAll(".onboarding-step").forEach(step => step.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
  window.scrollTo(0, 0);
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
      e.stopImmediatePropagation();
      return;
    }

    error.classList.add("hidden");
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

  logoInput.addEventListener("change", e => {
    logoFile = e.target.files[0] || null;
    renderPreview();
  });

  photosInput.addEventListener("change", e => {
    photoFiles = Array.from(e.target.files).slice(0, 6);
    renderPreview();
  });

  function renderPreview() {
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
// SUBMIT LISTING
// ===============================================
function setupSubmit() {
  const btn = document.getElementById("submitListingBtn");

  btn.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) return alert("You must be logged in.");

    const data = collectFormData();
    if (!data) return;

    const listingId = await saveListing(user.uid, data);

    if (!listingId) {
      alert("Something went wrong saving your listing.");
      return;
    }

    showStep("step-success");

    document.getElementById("goToMyBusiness").addEventListener("click", () => {
      loadView("view-service", { forceInit: true, serviceId: listingId });
    });
  });
}

// ===============================================
// COLLECT FORM DATA
// ===============================================
function collectFormData() {
  const name = document.getElementById("bizName").value.trim();
  const category = document.getElementById("bizCategory").value.trim();
  const desc = document.getElementById("bizDescription").value.trim();
  const phone = document.getElementById("bizPhone").value.trim();
  const website = document.getElementById("bizWebsite").value.trim();
  const town = document.getElementById("bizTown").value.trim();
  const area = document.getElementById("bizArea").value.trim();

  if (!name || !category || !desc || !phone || !town) {
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
    createdAt: Date.now(),
    isActive: true
  };
}

// ===============================================
// SAVE LISTING TO FIRESTORE
// ===============================================
async function saveListing(uid, data) {
  try {
    const slug = createSlug(data);

    const docRef = await addDoc(collection(db, "services"), {
      ...data,
      ownerUid: uid,
      slug,
      logoUrl: null,
      photoUrls: []
    });

    const id = docRef.id;

    // Upload images
    const logoUrl = await uploadLogo(id);
    const photoUrls = await uploadPhotos(id);

    await updateDoc(doc(db, "services", id), {
      logoUrl,
      photoUrls
    });

    return id;

  } catch (err) {
    console.error("❌ Failed to save listing:", err);
    return null;
  }
}

// ===============================================
// SLUG GENERATION
// ===============================================
function createSlug(data) {
  const clean = str =>
    str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

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
