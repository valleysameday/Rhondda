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
     STEP FLOW
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
    validateStep2();
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

      // Show/hide category-specific blocks
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
     DONE — POST GATE READY
  ===================================================== */
}
