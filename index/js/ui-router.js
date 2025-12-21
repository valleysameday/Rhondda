export function initUIRouter() {
  /* -------------------- ROUTES / MODALS -------------------- */
  const routes = {
    login: document.getElementById('loginModal'),
    post: document.getElementById('postModal'),
    signup: document.getElementById('signupModal')
  };

  function openScreen(name) {
    closeAll();
    if (!routes[name]) return;
    document.body.classList.add('modal-open');
    routes[name].style.display = 'flex';
  }

  function closeAll() {
    document.body.classList.remove('modal-open');
    Object.values(routes).forEach(m => {
      if (m) m.style.display = 'none';
    });
  }

  window.openScreen = openScreen;
  window.closeScreens = closeAll;

  /* -------------------- CATEGORY + SUBCATEGORY DATA -------------------- */
  const subcategoryMap = {
    forsale: ['Appliances','Furniture','Electronics','Baby & Kids','Garden','Tools','Mobility','Misc'],
    jobs: ['Plumber','Electrician','Cleaner','Gardener','Handyman','Beauty & Hair','Mechanic','Tutor'],
    property: ['To Rent','To Buy','Rooms','Commercial'],
    events: ['Music','Charity','Sport','Classes','Markets'],
    all: null,
    community: null,
    free: null
  };

  const categories = document.querySelectorAll('#categories .category-btn');
  const subcategoriesContainer = document.getElementById('subcategories');

  function showSubcategories(category) {
    if (!subcategoriesContainer) return;
    subcategoriesContainer.innerHTML = '';
    const subs = subcategoryMap[category];
    if (!subs) {
      subcategoriesContainer.style.display = 'none';
      return;
    }
    subs.forEach(sub => {
      const btn = document.createElement('button');
      btn.className = 'subcategory-btn';
      btn.textContent = sub;
      btn.onclick = () => console.log(`Filter feed: ${category} > ${sub}`);
      subcategoriesContainer.appendChild(btn);
    });
    subcategoriesContainer.style.display = 'flex';
  }

  categories.forEach(btn => {
    btn.addEventListener('click', () => {
      categories.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      showSubcategories(btn.dataset.category);
    });
  });

  /* -------------------- POST AN AD UX -------------------- */
  const postCategory = document.getElementById('postCategory');
  const postSubcategory = document.getElementById('postSubcategory');
  const postSubcategoryWrapper = document.querySelector('.subcategory-wrapper');
  const postPrice = document.getElementById('postPrice');
  const priceWrapper = document.querySelector('.price-wrapper');

  if (postSubcategoryWrapper) postSubcategoryWrapper.style.display = 'none';
  if (priceWrapper) priceWrapper.style.display = 'none';

  if (postCategory) {
    postCategory.addEventListener('change', () => {
      const category = postCategory.value;
      const subs = subcategoryMap[category];

      // Subcategory logic
      if (!subs || subs.length === 0) {
        postSubcategory.innerHTML = '';
        postSubcategoryWrapper.style.display = 'none';
      } else {
        postSubcategoryWrapper.style.display = 'block';
        postSubcategory.innerHTML = '<option value="">Select subcategory</option>';
        subs.forEach(sub => {
          const opt = document.createElement('option');
          opt.value = sub;
          opt.textContent = sub;
          postSubcategory.appendChild(opt);
        });
      }

      // Price logic
      if (!category || category === 'free') {
        priceWrapper.style.display = 'none';
        postPrice.value = '';
      } else {
        priceWrapper.style.display = 'block';
      }
    });
  }

  /* -------------------- IMAGE PREVIEW -------------------- */
  const postImage = document.getElementById('postImage');
  const imagePreview = document.getElementById('imagePreview');

  if (postImage && imagePreview) {
    postImage.addEventListener('change', () => {
      const file = postImage.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
      };
      reader.readAsDataURL(file);
    });
  }

  /* -------------------- ACTION BAR BUTTONS -------------------- */
  document.getElementById('openPostModal')?.addEventListener('click', e => {
    e.preventDefault();
    openScreen('post');
  });

  document.getElementById('openLoginModal')?.addEventListener('click', e => {
    e.preventDefault();
    openScreen('login');
  });

  document.getElementById('opensignupModal')?.addEventListener('click', e => {
    e.preventDefault();
    openScreen('signup');
  });

  /* -------------------- CLOSE MODALS -------------------- */
  document.querySelectorAll('.close').forEach(btn => {
    btn.addEventListener('click', closeAll);
  });

  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', e => {
      if (e.target === modal) closeAll();
    });
  });
}
