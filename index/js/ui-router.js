// ui-router.js
export function initUIRouter() {

  const routes = {
  login: document.getElementById('login'),
  signup: document.getElementById('signup'),
  forgot: document.getElementById('forgot'),
  resetConfirm: document.getElementById('resetConfirm'),
  post: document.getElementById('posts-grid')
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

  /* -------------------- CATEGORY + SUBCATEGORY -------------------- */
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

  /* -------------------- FORGOT PASSWORD LINK -------------------- */
  const forgotLink = document.getElementById('forgotPasswordLink');
  if (forgotLink) {
    forgotLink.addEventListener('click', e => {
      e.preventDefault();
      openScreen('forgot');
    });
  }

  /* -------------------- FORGOT PASSWORD SUBMIT -------------------- */
  const forgotSubmit = document.getElementById('forgotSubmit');
  const forgotEmail = document.getElementById('forgotEmail');

  if (forgotSubmit && forgotEmail) {
    forgotSubmit.addEventListener('click', () => {
      const email = forgotEmail.value.trim();
      if (!email) {
        alert("Please enter your email");
        return;
      }
      window.resetPassword(email);
    });
  }

  /* -------------------- ACTION BAR BUTTONS -------------------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;

  const action = el.dataset.action;
  const value = el.dataset.value;

  if (action === 'open-screen') {
    openScreen(value);
  }

  if (action === 'close-screens') {
    closeAll();
  }
});
  
  
  
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

  /* -------------------- MY ACCOUNT BUTTON (SPA VERSION) -------------------- */
  document.getElementById('openAccountModal')?.addEventListener('click', async e => {
    e.preventDefault();

    if (!window.firebaseAuthReady) {
      openScreen('login');
      return;
    }

    const user = window.currentUser;

    if (!user) {
      openScreen('login');
      return;
    }

    // ✅ SPA navigation instead of full-page redirect
    navigateToDashboard();
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
