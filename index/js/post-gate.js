// ============================================
// POST GATE (FULL – ALIGNED WITH CATEGORY FLOW)
// ============================================

import { getFirebase } from '/index/js/firebase/init.js';
import {
  getUser,
  addPost,
  uploadPostImage
} from "/index/js/firebase/settings.js";

let auth, db, storage;

// CATEGORY STATE
let selectedCategory = null;      // e.g. vehicles, property
let selectedSubCategory = null;   // e.g. cars, property-rent
let propertyType = null;          // sale | rent
let rentFrequency = null;         // pcm | weekly

getFirebase().then(fb => {
  auth = fb.auth;
  db = fb.db;
  storage = fb.storage;
  initPostGate();
});

function initPostGate() {

  /* ==============================
     STEP NAVIGATION
  ============================== */
  const steps = [...document.querySelectorAll('#posts-grid .post-step')];
  const dots = [...document.querySelectorAll('.post-progress .dot')];
  let stepIndex = 0;

  function showStep(i) {
    if (i < 0 || i >= steps.length) return;
    steps.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    steps[i].classList.add('active');
    dots[i].classList.add('active');
    stepIndex = i;
    if (i === 1) validateStep2();
  }

  document.querySelectorAll('.post-next').forEach(btn =>
    btn.addEventListener('click', () => {
      if (!btn.disabled) showStep(stepIndex + 1);
    })
  );

  document.querySelectorAll('.post-prev').forEach(btn =>
    btn.addEventListener('click', () => showStep(stepIndex - 1))
  );

  /* ==============================
     INPUT REFERENCES
  ============================== */
  const titleInput = document.getElementById('postTitle');
  const descInput = document.getElementById('postDescription');
  const contactInput = document.getElementById('postContact');
  const locationInput = document.getElementById('postLocation');
  const priceInput = document.getElementById('postPrice');
  const priceBox = document.querySelector('.price-box');
  const priceLabel = document.querySelector('label[for="postPrice"]');
  const areaBox = document.querySelector('.area-box');
  const nextBtn = document.querySelector('.post-step[data-step="2"] .post-next');
  const submitBtn = document.getElementById('postSubmitBtn');
  const imagesInput = document.getElementById('postImages');

  const propertyBox = document.querySelector('.property-options');
  const propertyFeaturesBox = document.querySelector('.property-features');
  const forsaleBox = document.querySelector('.forsale-options');
  const jobsBox = document.querySelector('.jobs-options');
  const eventsBox = document.querySelector('.events-options');
  const communityBox = document.querySelector('.community-options');
  const communityTypeSelect = document.getElementById('communityType');
  const lostFoundExtra = document.getElementById('lostFoundExtra');

  const propertyBtns = [...document.querySelectorAll('[data-property-type]')];
  const rentBtns = [...document.querySelectorAll('[data-rent-frequency]')];

  /* ==============================
     STEP 1 – CATEGORY SELECTION
  ============================== */
  document.querySelectorAll('.category-grid [data-category]').forEach(btn => {
    btn.addEventListener('click', () => {

      selectedCategory = btn.dataset.category;
      selectedSubCategory = null;
      propertyType = null;
      rentFrequency = null;

      // Reset visibility
      propertyBox.hidden = true;
      propertyFeaturesBox.hidden = true;
      forsaleBox.hidden = true;
      jobsBox.hidden = true;
      eventsBox.hidden = true;
      communityBox.hidden = true;
      areaBox.hidden = true;

      if (selectedCategory === 'property') {
        propertyBox.hidden = false;
        propertyFeaturesBox.hidden = false;
        areaBox.hidden = false;
      }

      if (selectedCategory === 'jobs') jobsBox.hidden = false;
      if (selectedCategory === 'community') communityBox.hidden = false;

      updatePriceVisibility();
      updatePriceLabel();
      showStep(1);
    });
  });

  /* ==============================
     PROPERTY TYPE
  ============================== */
  propertyBtns.forEach(btn => {
    btn.addEventListener('click', () => {

      propertyType = btn.dataset.propertyType;
      selectedSubCategory =
        propertyType === 'sale'
          ? 'property-sale'
          : 'property-rent';

      rentFrequency = null;

      propertyBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      rentBtns.forEach(b => {
        b.style.display = propertyType === 'rent' ? 'inline-block' : 'none';
        b.classList.remove('active');
      });

      updatePriceLabel();
      validateStep2();
    });
  });

  /* ==============================
     RENT FREQUENCY
  ============================== */
  rentBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      rentFrequency = btn.dataset.rentFrequency;
      rentBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updatePriceLabel();
      validateStep2();
    });
  });

  /* ==============================
     COMMUNITY EXTRA
  ============================== */
  if (communityTypeSelect) {
    communityTypeSelect.addEventListener('change', e => {
      lostFoundExtra.hidden = e.target.value !== 'lost';
    });
  }

  /* ==============================
     VALIDATION
  ============================== */
  function validateStep2() {
    const titleOk = titleInput.value.trim().length >= 3;
    const descOk = descInput.value.trim().length >= 10;

    let categoryOk = !!selectedCategory;

    if (selectedCategory === 'property') {
      categoryOk = !!selectedSubCategory;
      if (selectedSubCategory === 'property-rent') {
        categoryOk = !!rentFrequency;
      }
    }

    nextBtn.disabled = !(titleOk && descOk && categoryOk);
  }

  ['input', 'keyup', 'change'].forEach(evt => {
    titleInput.addEventListener(evt, validateStep2);
    descInput.addEventListener(evt, validateStep2);
  });

  /* ==============================
     PRICE VISIBILITY / LABEL
  ============================== */
  function updatePriceVisibility() {
    priceBox.hidden = selectedCategory === 'free' || selectedCategory === 'jobs' || selectedCategory === 'community';
  }

  function updatePriceLabel() {
    if (selectedCategory !== 'property') {
      priceLabel.textContent = 'Price (£)';
      priceInput.placeholder = 'Price (optional)';
      return;
    }

    if (propertyType === 'sale') {
      priceLabel.textContent = 'Sale price (£)';
    } else if (propertyType === 'rent') {
      priceLabel.textContent =
        rentFrequency === 'weekly' ? 'Weekly rent (£)' : 'Monthly rent (PCM)';
    }
  }

/* ==============================
   SUBMIT POST (CLEAN VERSION)
============================== */
submitBtn.addEventListener('click', async () => {

  if (!auth.currentUser) {
    return showToast("Please log in to post an ad.", "error");
  }

  try {
    const features = [...document.querySelectorAll('.property-features input:checked')]
      .map(i => i.dataset.feature);

    const post = {
      userId: auth.currentUser.uid,

      category: selectedCategory,
      subCategory: selectedSubCategory,

      title: titleInput.value.trim(),
      description: descInput.value.trim(),
      createdAt: Date.now(),

      contact: contactInput.value.trim(),
      location: locationInput.value.trim(),

      price: Number(priceInput.value) || null,
      area: document.getElementById("postArea")?.value || null,

      propertyType,
      rentFrequency,
      propertyFeatures: features,

      images: [],
      image: null
    };

    // Upload images
    if (imagesInput.files.length) {
      for (const file of imagesInput.files) {
        const compressed = await compressImage(file);
        const url = await uploadPostImage(compressed, auth.currentUser.uid);
        post.images.push(url);
      }
      post.image = post.images[0];
    }

    await addPost(post);

    showToast("Your ad is live!", "success");
    document.querySelector('[data-action="close-screens"]').click();
    loadView("home");

  } catch (err) {
    console.error(err);
    showToast("Failed to post ad.", "error");
  }
});
  /* ==============================
     IMAGE COMPRESSION
  ============================== */
  function compressImage(file, max = 1280, quality = 0.72) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > height && width > max) {
            height = height * max / width;
            width = max;
          } else if (height > max) {
            width = width * max / height;
            height = max;
          }
          const c = document.createElement('canvas');
          c.width = width;
          c.height = height;
          c.getContext('2d').drawImage(img, 0, 0, width, height);
          c.toBlob(b => resolve(b), 'image/jpeg', quality);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /* ==============================
     TOAST
  ============================== */
  function showToast(msg, type = "info") {
    const t = document.createElement('div');
    t.textContent = msg;
    t.className = `toast ${type}`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2800);
  }
}
