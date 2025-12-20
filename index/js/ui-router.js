document.addEventListener('DOMContentLoaded', () => {

  /* -------------------- ROUTES / MODALS -------------------- */
  const routes = {
    login: document.getElementById('loginModal'),
    post: document.getElementById('postModal'),
    join: document.getElementById('joinModal')
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

/* -------------------- CATEGORY + SUBCATEGORY DATA -------------------- */
const subcategoryMap = {
  forsale: [
    'Appliances',
    'Furniture',
    'Electronics',
    'Baby & Kids',
    'Garden',
    'Tools',
    'Mobility',
    'Misc'
  ],

  jobs: [
    'Plumber',
    'Electrician',
    'Cleaner',
    'Gardener',
    'Handyman',
    'Beauty & Hair',
    'Mechanic',
    'Tutor'
  ],

  property: [
    'To Rent',
    'To Buy',
    'Rooms',
    'Commercial'
  ],

  events: [
    'Music',
    'Charity',
    'Sport',
    'Classes',
    'Markets'
  ],

  /* ✅ These categories have NO subcategories */
  all: null,
  community: null,
  free: null
};
  /* -------------------- FEED SUBCATEGORIES -------------------- */
  const categories = document.querySelectorAll('#categories .category-btn');
  const subcategoriesContainer = document.getElementById('subcategories');

  function showSubcategories(category) {
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
const postSubcategoryWrapper = postSubcategory?.parentElement; // ✅ wrapper to hide/show
const postImage = document.getElementById('postImage');
const imagePreview = document.getElementById('imagePreview');

if (postCategory && postSubcategory) {
  postCategory.addEventListener('change', () => {
    const subs = subcategoryMap[postCategory.value];

    // ✅ If no subcategories → hide the dropdown
    if (!subs || subs.length === 0) {
      postSubcategory.innerHTML = '';
      if (postSubcategoryWrapper) postSubcategoryWrapper.style.display = 'none';
      return;
    }

    // ✅ If subcategories exist → show dropdown
    if (postSubcategoryWrapper) postSubcategoryWrapper.style.display = 'block';

    postSubcategory.innerHTML = '<option value="">Select subcategory</option>';

    subs.forEach(sub => {
      const opt = document.createElement('option');
      opt.value = sub;
      opt.textContent = sub;
      postSubcategory.appendChild(opt);
    });
  });
}

/* -------------------- IMAGE PREVIEW -------------------- */
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

/* -------------------- ACTION BAR BUTTONS (MATCH HTML) -------------------- */
document.getElementById('openPostModal')?.addEventListener('click', e => {
  e.preventDefault();
  openScreen('post');
});

document.getElementById('openLoginModal')?.addEventListener('click', e => {
  e.preventDefault();
  openScreen('login');
});

document.getElementById('openSignupModal')?.addEventListener('click', e => {
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

/* -------------------- EXPOSE -------------------- */
window.openScreen = openScreen;
window.closeScreens = closeAll;
});
