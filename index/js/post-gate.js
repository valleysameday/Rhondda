import { getFirebase } from '/index/js/firebase/init.js';

let auth, db, storage;

// State
let selectedCategory = null;
let propertyType = null;     // sale | rent
let rentFrequency = null;

getFirebase().then(fb => {
  auth = fb.auth;
  db = fb.db;
  storage = fb.storage;
  initPostGate();
});

function initPostGate() {

  /* =====================================================
     STEP FLOW (NOW 4 STEPS)
  ===================================================== */
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

    // Only Step 2 needs validation
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

  /* =====================================================
     ELEMENTS
  ===================================================== */
  const titleInput = document.getElementById('postTitle');
  const descInput = document.getElementById('postDescription');
  const nextBtn = document.querySelector('.post-step[data-step="2"] .post-next');

  const propertyBox = document.querySelector('.property-options');
  const propertyBtns = [...document.querySelectorAll('[data-property-type]')];
  const rentBtns = [...document.querySelectorAll('[data-rent-frequency]')];

  const priceInput = document.getElementById('postPrice');
  const priceLabel = document.querySelector('label[for="postPrice"]');

  // Universal fields
  const contactInput = document.getElementById('postContact');
  const locationInput = document.getElementById('postLocation');

  // Category-specific blocks
  const forsaleBox = document.querySelector('.forsale-options');
  const jobsBox = document.querySelector('.jobs-options');
  const eventsBox = document.querySelector('.events-options');
  const communityBox = document.querySelector('.community-options');

  const communityTypeSelect = document.getElementById('communityType');
  const lostFoundExtra = document.getElementById('lostFoundExtra');

  /* =====================================================
     CATEGORY SELECTION
  ===================================================== */
  document.querySelectorAll('[data-category]').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedCategory = btn.dataset.category;

      // Reset property state
      propertyType = null;
      rentFrequency = null;

      // Show/hide category-specific blocks (Step 4)
      propertyBox.hidden = selectedCategory !== 'property';
      forsaleBox.hidden = selectedCategory !== 'forsale';
      jobsBox.hidden = selectedCategory !== 'jobs';
      eventsBox.hidden = selectedCategory !== 'events';
      communityBox.hidden = selectedCategory !== 'community';

      // Reset community extras
      if (communityTypeSelect) communityTypeSelect.value = "";
      if (lostFoundExtra) lostFoundExtra.hidden = true;

      // Hide rent frequency until needed
      rentBtns.forEach(b => b.style.display = 'none');
      propertyBtns.forEach(b => b.classList.remove('active'));
      rentBtns.forEach(b => b.classList.remove('active'));

      updatePriceLabel();
      showStep(1);
    });
  });

  /* =====================================================
     PROPERTY TYPE
  ===================================================== */
  propertyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      propertyType = btn.dataset.propertyType;
      rentFrequency = null;

      propertyBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Show rent frequency only if renting
      rentBtns.forEach(b => {
        b.style.display = propertyType === 'rent' ? 'inline-block' : 'none';
        b.classList.remove('active');
      });

      updatePriceLabel();
      validateStep2();
    });
  });

  /* =====================================================
     RENT FREQUENCY
  ===================================================== */
  rentBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      rentFrequency = btn.dataset.rentFrequency;

      rentBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      updatePriceLabel();
      validateStep2();
    });
  });

  /* =====================================================
     COMMUNITY TYPE
  ===================================================== */
  if (communityTypeSelect) {
    communityTypeSelect.addEventListener('change', e => {
      lostFoundExtra.hidden = e.target.value !== 'lost';
    });
  }

  /* =====================================================
     VALIDATION FOR STEP 2
  ===================================================== */
  function validateStep2() {
    const titleOk = titleInput.value.trim().length >= 3;
    const descOk = descInput.value.trim().length >= 10;

    let propertyOk = true;

    if (selectedCategory === 'property') {
      propertyOk = !!propertyType;
      if (propertyType === 'rent') {
        propertyOk = !!rentFrequency;
      }
    }

    nextBtn.disabled = !(titleOk && descOk && propertyOk);
  }

  ['input', 'keyup', 'change'].forEach(evt => {
    titleInput.addEventListener(evt, validateStep2);
    descInput.addEventListener(evt, validateStep2);
  });

  /* =====================================================
     PRICE LABEL LOGIC
  ===================================================== */
  function updatePriceLabel() {
    if (!priceInput || !priceLabel) return;

    if (selectedCategory !== 'property') {
      priceLabel.textContent = 'Price (£)';
      priceInput.placeholder = 'Price (optional)';
      return;
    }

    if (propertyType === 'sale') {
      priceLabel.textContent = 'Sale price (£)';
      priceInput.placeholder = 'Sale price';
    } else if (propertyType === 'rent') {
      priceLabel.textContent =
        rentFrequency === 'weekly'
          ? 'Weekly rent (£)'
          : 'Monthly rent (PCM)';
      priceInput.placeholder = priceLabel.textContent;
    } else {
      priceLabel.textContent = 'Price (£)';
      priceInput.placeholder = 'Price';
    }
  }

  /* =====================================================
   SUBMIT POST
===================================================== */

const submitBtn = document.getElementById("postSubmitBtn");
if (submitBtn) {
  submitBtn.addEventListener("click", submitPost);
}

async function submitPost() {
  console.log("🔵 Submit button clicked");

  // 1️⃣ Must be logged in
  if (!auth.currentUser) {
    console.log("🟡 Not logged in → opening login modal");
    openLoginModal(auth, db);
    return;
  }

  // 2️⃣ Build post object
  const post = {
    userId: auth.currentUser.uid,
    title: document.getElementById("postTitle").value.trim(),
    description: document.getElementById("postDescription").value.trim(),
    category: selectedCategory,
    createdAt: Date.now(),

    // Universal
    contact: document.getElementById("postContact").value.trim(),
    location: document.getElementById("postLocation").value.trim(),

    // Price + area
    price: Number(document.getElementById("postPrice").value) || null,
    area: document.getElementById("postArea").value.trim() || "Rhondda",

    // Property
    propertyType,
    rentFrequency,
    bedrooms: null,
    bathrooms: null,

    // For sale
    condition: document.getElementById("postCondition")?.value || null,
    delivery: document.getElementById("postDelivery")?.value || null,

    // Jobs
    jobType: document.getElementById("jobType")?.value || null,
    jobSalary: document.getElementById("jobSalary")?.value || null,
    jobExperience: document.getElementById("jobExperience")?.value || null,

    // Events
    eventDate: document.getElementById("eventDate")?.value || null,
    eventStart: document.getElementById("eventStart")?.value || null,
    eventEnd: document.getElementById("eventEnd")?.value || null,
    eventVenue: document.getElementById("eventVenue")?.value || null,

    // Community
    communityType: document.getElementById("communityType")?.value || null,
    lostLocation: document.getElementById("lostLocation")?.value || null,
    lostReward: document.getElementById("lostReward")?.value || null,

    images: []
  };

  console.log("🟢 Post object built:", post);

  // 3️⃣ Upload images (if any)
  const files = document.getElementById("postImages").files;
  if (files.length > 0) {
    console.log("🟡 Uploading images…");

    for (let file of files) {
      const path = `posts/${auth.currentUser.uid}/${Date.now()}-${file.name}`;
      const ref = storage.ref(path);
      await ref.put(file);
      const url = await ref.getDownloadURL();
      post.images.push(url);
    }
  }

  // 4️⃣ Save to Firestore
  await db.collection("posts").add(post);

  console.log("🟢 Post saved!");

  // 5️⃣ Close modal + refresh feed
  document.querySelector('[data-action="close-screens"]').click();
  loadView("home");
}
  /* =====================================================
     DONE — POST GATE READY
  ===================================================== */
}
