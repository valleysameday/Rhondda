document.addEventListener('DOMContentLoaded', () => {
  /* -------------------- ROUTES / MODALS -------------------- */
  const routes = {
    login: document.getElementById('loginModal'),
    post: document.getElementById('postModal'),
    join: document.getElementById('joinModal') // add when ready
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

  /* -------------------- SUBCATEGORIES -------------------- */
  const subcategoryMap = {
    market: ['Electronics', 'Furniture', 'Appliances', 'Clothing', 'Miscellaneous'],
    offers: ['Washer', 'Tumble Dryer', 'Fridge', 'Microwave'],
    events: ['Charity', 'Music', 'Sport', 'Meetup'],
    services: ['Plumber', 'Cleaner', 'Electrician', 'Gardener']
  };

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
      btn.addEventListener('click', () => {
        // Here you can filter posts by category + subcategory
        console.log(`Filter posts by ${category} > ${sub}`);
      });
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

  /* -------------------- BUTTON HOOKS -------------------- */
  document.getElementById('loginBtn')?.addEventListener('click', e => {
    e.preventDefault();
    openScreen('login');
  });

  document.getElementById('postAdBtn')?.addEventListener('click', e => {
    e.preventDefault();
    openScreen('post');
  });

  document.getElementById('joinBtn')?.addEventListener('click', e => {
    e.preventDefault();
    openScreen('join');
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

  /* -------------------- EXPOSE FOR FUTURE -------------------- */
  window.openScreen = openScreen;
  window.closeScreens = closeAll;
});
