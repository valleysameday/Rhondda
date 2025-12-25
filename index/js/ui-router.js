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
    if (!routes[name]) {
      console.warn("Modal not found:", name);
      return;
    }
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

  /* -------------------- POST BUTTON -------------------- */
  document.getElementById('openPostModal')?.addEventListener('click', e => {
    e.preventDefault();
    openScreen('post');
  });

  /* -------------------- LOGIN LINKS -------------------- */
  document.getElementById('openLoginModal')?.addEventListener('click', e => {
    e.preventDefault();
    openScreen('login');
  });

  document.getElementById('opensignupModal')?.addEventListener('click', e => {
    e.preventDefault();
    openScreen('signup');
  });

  /* -------------------- CLOSE HANDLERS -------------------- */
  document.querySelectorAll('.close').forEach(btn => {
    btn.addEventListener('click', closeAll);
  });

  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', e => {
      if (e.target === modal) closeAll();
    });
  });
}
