import { getFirebase } from '/index/js/firebase/init.js';
import { fsGetUser, fsAddPost, fsUploadImage } from '/index/js/firebase/settings.js';

let auth, db, storage;
let selectedCategory = null;
let propertyType = null;
let rentFrequency = null;

getFirebase().then(fb => {
  auth = fb.auth;
  db = fb.db;
  storage = fb.storage;
  initPostGate();
});

function initPostGate() {
  /* ------------------------------
     STEP NAVIGATION
  ------------------------------ */
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
    btn.addEventListener('click', () => { if (!btn.disabled) showStep(stepIndex + 1); })
  );

  document.querySelectorAll('.post-prev').forEach(btn =>
    btn.addEventListener('click', () => showStep(stepIndex - 1))
  );

  /* ------------------------------
     INPUTS
  ------------------------------ */
  const titleInput = document.getElementById('postTitle');
  const descInput = document.getElementById('postDescription');
  const nextBtn = document.querySelector('.post-step[data-step="2"] .post-next');
  const priceBox = document.querySelector('.price-box');
  const priceInput = document.getElementById('postPrice');
  const priceLabel = document.querySelector('label[for="postPrice"]');
  const areaBox = document.querySelector('.area-box');
  const contactInput = document.getElementById('postContact');
  const locationInput = document.getElementById('postLocation');
  const propertyBox = document.querySelector('.property-options');
  const propertyBtns = [...document.querySelectorAll('[data-property-type]')];
  const rentBtns = [...document.querySelectorAll('[data-rent-frequency]')];
  const propertyFeaturesBox = document.querySelector('.property-features');
  const forsaleBox = document.querySelector('.forsale-options');
  const jobsBox = document.querySelector('.jobs-options');
  const eventsBox = document.querySelector('.events-options');
  const communityBox = document.querySelector('.community-options');
  const communityTypeSelect = document.getElementById('communityType');
  const lostFoundExtra = document.getElementById('lostFoundExtra');
  const submitBtn = document.getElementById('postSubmitBtn');
  const imagesInput = document.getElementById('postImages');

  /* ------------------------------
     CATEGORY SELECTION
  ------------------------------ */
  document.querySelectorAll('[data-category]').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedCategory = btn.dataset.category;
      propertyType = null;
      rentFrequency = null;

      propertyBox.hidden = selectedCategory !== 'property';
      propertyFeaturesBox.hidden = selectedCategory !== 'property';
      forsaleBox.hidden = selectedCategory !== 'forsale';
      jobsBox.hidden = selectedCategory !== 'jobs';
      eventsBox.hidden = selectedCategory !== 'events';
      communityBox.hidden = selectedCategory !== 'community';

      if (communityTypeSelect) communityTypeSelect.value = "";
      if (lostFoundExtra) lostFoundExtra.hidden = true;

      rentBtns.forEach(b => b.style.display = 'none');
      propertyBtns.forEach(b => b.classList.remove('active'));
      rentBtns.forEach(b => b.classList.remove('active'));

      updatePriceVisibility();
      updateAreaVisibility();
      updatePriceLabel();

      showStep(1);
    });
  });

  /* ------------------------------
     PROPERTY TYPE
  ------------------------------ */
  propertyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      propertyType = btn.dataset.propertyType;
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

  /* ------------------------------
     RENT FREQUENCY
  ------------------------------ */
  rentBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      rentFrequency = btn.dataset.rentFrequency;
      rentBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updatePriceLabel();
      validateStep2();
    });
  });

  /* ------------------------------
     COMMUNITY EXTRA
  ------------------------------ */
  if (communityTypeSelect) {
    communityTypeSelect.addEventListener('change', e => {
      lostFoundExtra.hidden = e.target.value !== 'lost';
    });
  }

  /* ------------------------------
     VALIDATION
  ------------------------------ */
  function validateStep2() {
    const titleOk = titleInput.value.trim().length >= 3;
    const descOk = descInput.value.trim().length >= 10;
    let propertyOk = true;
    if (selectedCategory === 'property') {
      propertyOk = !!propertyType;
      if (propertyType === 'rent') propertyOk = !!rentFrequency;
    }
    nextBtn.disabled = !(titleOk && descOk && propertyOk);
  }

  ['input', 'keyup', 'change'].forEach(evt => {
    titleInput.addEventListener(evt, validateStep2);
    descInput.addEventListener(evt, validateStep2);
  });

  /* ------------------------------
     PRICE LABEL / VISIBILITY
  ------------------------------ */
  function updatePriceLabel() {
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
        rentFrequency === 'weekly' ? 'Weekly rent (£)' : 'Monthly rent (PCM)';
      priceInput.placeholder = priceLabel.textContent;
    }
  }
  function updatePriceVisibility() {
    priceBox.hidden = !(selectedCategory === 'forsale' || selectedCategory === 'property');
  }
  function updateAreaVisibility() {
    areaBox.hidden = selectedCategory !== 'property';
  }

  /* ------------------------------
     SUBMIT POST
  ------------------------------ */
  submitBtn.addEventListener('click', async () => {
    if (!auth.currentUser) return showToast("Please log in to post an ad.", "error");

    try {
      const userData = await fsGetUser(auth.currentUser.uid);
      const isBusiness = userData.isBusiness === true;

      const featureInputs = document.querySelectorAll('.property-features input:checked');
      const propertyFeatures = [...featureInputs].map(i => i.dataset.feature);

      const post = {
        userId: auth.currentUser.uid,
        businessId: isBusiness ? auth.currentUser.uid : null,
        isBusiness,
        title: titleInput.value.trim(),
        description: descInput.value.trim(),
        category: selectedCategory,
        createdAt: Date.now(),
        contact: contactInput.value.trim(),
        location: locationInput.value.trim(),
        price: Number(priceInput.value) || null,
        area: document.getElementById("postArea")?.value.trim() || null,
        propertyType,
        rentFrequency,
        propertyFeatures,
        condition: document.getElementById("postCondition")?.value || null,
        delivery: document.getElementById("postDelivery")?.value || null,
        jobType: document.getElementById("jobType")?.value || null,
        jobSalary: document.getElementById("jobSalary")?.value || null,
        jobExperience: document.getElementById("jobExperience")?.value || null,
        eventDate: document.getElementById("eventDate")?.value || null,
        eventStart: document.getElementById("eventStart")?.value || null,
        eventEnd: document.getElementById("eventEnd")?.value || null,
        eventVenue: document.getElementById("eventVenue")?.value || null,
        communityType: document.getElementById("communityType")?.value || null,
        lostLocation: document.getElementById("lostLocation")?.value || null,
        lostReward: document.getElementById("lostReward")?.value || null,
        images: []
      };

      if (imagesInput.files.length > 0) {
        for (let file of imagesInput.files) {
          const compressed = await compressImage(file);
          const url = await fsUploadImage(compressed, auth.currentUser.uid);
          post.images.push(url);
        }
      }

      await fsAddPost(post);
      showToast("Your ad is live!", "success");
      document.querySelector('[data-action="close-screens"]').click();
      loadView("home");

    } catch (err) {
      console.error(err);
      showToast("Something went wrong posting your ad.", "error");
    }
  });

  /* ------------------------------
     IMAGE COMPRESSION
  ------------------------------ */
  function compressImage(file, maxSize = 1280, quality = 0.72) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > height && width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else if (height > width && height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            blob => blob ? resolve(blob) : reject("Compression failed"),
            'image/jpeg', quality
          );
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /* ------------------------------
     TOAST
  ------------------------------ */
  function showToast(message, type = "info") {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      container.style.position = 'fixed';
      container.style.bottom = '16px';
      container.style.left = '50%';
      container.style.transform = 'translateX(-50%)';
      container.style.zIndex = '99999';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '8px';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.padding = '10px 14px';
    toast.style.borderRadius = '999px';
    toast.style.fontSize = '.9rem';
    toast.style.color = '#fff';
    toast.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2)';
    toast.style.background = type === 'error' ? '#ef4444' :
                             type === 'success' ? '#16a34a' : '#4b5563';
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.2s ease';
      setTimeout(() => toast.remove(), 200);
    }, 2600);
  }
}
