// post-gate.js

let selectedCategory = null;
let propertyType = null;      // sale | rent
let rentFrequency = null;     // pcm | weekly

document.addEventListener('DOMContentLoaded', () => {

  const steps = document.querySelectorAll('.post-step');
  const dots = document.querySelectorAll('.post-progress .dot');
  let stepIndex = 0;

  const titleInput = document.getElementById('postTitle');
  const descInput = document.getElementById('postDescription');
  const priceInput = document.getElementById('postPrice');

  const nextBtn = document.querySelector('.post-step[data-step="2"] .post-next');

  const propertyButtons = document.querySelectorAll('[data-property-type]');
  const rentButtons = document.querySelectorAll('[data-rent-frequency]');

  /* ---------------- STEP CONTROL ---------------- */

  function showStep(i) {
    steps.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));

    steps[i].classList.add('active');
    dots[i].classList.add('active');
    stepIndex = i;

    validateStep2();
  }

  document.querySelectorAll('.post-next').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!btn.disabled) showStep(stepIndex + 1);
    });
  });

  document.querySelectorAll('.post-prev').forEach(btn => {
    btn.addEventListener('click', () => showStep(stepIndex - 1));
  });

  /* ---------------- CATEGORY ---------------- */

  document.querySelectorAll('[data-category]').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedCategory = btn.dataset.category;

      // reset property state
      propertyType = null;
      rentFrequency = null;

      // hide all property controls by default
      propertyButtons.forEach(b => b.style.display = 'none');
      rentButtons.forEach(b => b.style.display = 'none');

      // show property controls only if needed
      if (selectedCategory === 'property') {
        propertyButtons.forEach(b => b.style.display = 'inline-block');
      }

      updatePricePlaceholder();
      showStep(1);
    });
  });

  /* ---------------- PROPERTY TYPE ---------------- */

  propertyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      propertyType = btn.dataset.propertyType;
      rentFrequency = null;

      // button active state
      propertyButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // show rent frequency ONLY if rent
      rentButtons.forEach(b => {
        b.style.display = propertyType === 'rent' ? 'inline-block' : 'none';
        b.classList.remove('active');
      });

      updatePricePlaceholder();
      validateStep2();
    });
  });

  /* ---------------- RENT FREQUENCY ---------------- */

  rentButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      rentFrequency = btn.dataset.rentFrequency;

      rentButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      updatePricePlaceholder();
      validateStep2();
    });
  });

  /* ---------------- VALIDATION ---------------- */

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

  ['input', 'keyup'].forEach(evt => {
    titleInput.addEventListener(evt, validateStep2);
    descInput.addEventListener(evt, validateStep2);
  });

  /* ---------------- PRICE PLACEHOLDER ---------------- */

  function updatePricePlaceholder() {
    if (!priceInput) return;

    if (selectedCategory !== 'property') {
      priceInput.placeholder = 'Price (optional)';
      return;
    }

    if (propertyType === 'sale') {
      priceInput.placeholder = 'Sale price (£)';
    } else if (propertyType === 'rent') {
      priceInput.placeholder =
        rentFrequency === 'weekly'
          ? 'Weekly rent (£)'
          : 'Monthly rent (PCM)';
    } else {
      priceInput.placeholder = 'Price';
    }
  }

});
