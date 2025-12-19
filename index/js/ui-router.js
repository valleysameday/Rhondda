document.addEventListener('DOMContentLoaded', () => {
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

  /* -------- BUTTON HOOKS -------- */

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

  /* -------- CLOSE CONTROLS -------- */

  document.querySelectorAll('.close').forEach(btn => {
    btn.addEventListener('click', closeAll);
  });

  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', e => {
      if (e.target === modal) closeAll();
    });
  });

  /* -------- EXPOSE FOR FUTURE -------- */
  window.openScreen = openScreen;
  window.closeScreens = closeAll;
});
