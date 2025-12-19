const postsContainer = document.getElementById('postsContainer');
const categoryBtns = document.querySelectorAll('.category-btn');

const loginModal = document.getElementById('loginModal');
const postModal = document.getElementById('postModal');

// Top action buttons
const loginBtnTop = document.getElementById('loginBtn');
const postAdBtn = document.getElementById('postAdBtn');
const joinBtn = document.getElementById('joinBtn');

/* ======================================================
   MODAL HELPERS
====================================================== */
function openModal(modal) {
  if (!modal) return;
  modal.style.display = 'flex';
  document.body.classList.add('modal-open');
}

function closeModal(modal) {
  if (!modal) return;
  modal.style.display = 'none';
  document.body.classList.remove('modal-open');
}

/* ======================================================
   MODAL EVENTS
====================================================== */
if (loginBtnTop && loginModal) {
  loginBtnTop.addEventListener('click', e => {
    e.preventDefault();
    openModal(loginModal);
  });
}

if (postAdBtn && postModal) {
  postAdBtn.addEventListener('click', e => {
    e.preventDefault();
    openModal(postModal);
  });
}

// Close buttons (X)
document.querySelectorAll('.close').forEach(btn => {
  btn.addEventListener('click', () => {
    const modal = btn.closest('.modal');
    closeModal(modal);
  });
});

// Click outside modal
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal(modal);
  });
});

// ESC key closes modal
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal').forEach(modal => {
      if (modal.style.display === 'flex') {
        closeModal(modal);
      }
    });
  }
});

/* ======================================================
   MOCK POSTS (replace with backend later)
====================================================== */
const mockPosts = [
  { id: '1', title: 'Cafe Discount', content: 'Get 10% off at Joe’s Cafe', category: 'offers', type: 'business' },
  { id: '2', title: 'Charity Run', content: 'Join the charity 5k in Pontypridd', category: 'events' },
  { id: '3', title: 'Plumber Available', content: 'Quick plumbing service this week', category: 'services', type: 'business' },
  { id: '4', title: 'Supermarket Sale', content: 'Weekly specials on groceries', category: 'offers', type: 'ad' },
  { id: '5', title: 'Dog Found', content: 'Lost Beagle spotted in Pontypridd', category: 'community' }
];

/* ======================================================
   LOAD POSTS
====================================================== */
function loadPosts(category = 'all') {
  if (!postsContainer) return;

  postsContainer.innerHTML = '';

  const filtered =
    category === 'all'
      ? mockPosts
      : mockPosts.filter(p => p.category === category);

  if (!filtered.length) {
    postsContainer.innerHTML = '<p>No posts yet!</p>';
    return;
  }

  filtered.forEach(post => {
    const card = document.createElement('div');
    card.className = `post-card ${post.type || ''}`;

    if (post.type === 'business') {
      card.classList.add('business');
    }

    card.innerHTML = `
      <button class="report-btn" data-post-id="${post.id}" title="Report this post">⚑</button>
      <h3>${post.title}</h3>
      <p>${post.content}</p>
      <small>Category: ${post.category}</small>
    `;

    postsContainer.appendChild(card);
  });
}

/* ======================================================
   CATEGORY FILTER
====================================================== */
categoryBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    categoryBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadPosts(btn.dataset.category);
  });
});

/* ======================================================
   REPORT HANDLER
====================================================== */
document.addEventListener('click', e => {
  if (!e.target.classList.contains('report-btn')) return;

  const postId = e.target.dataset.postId;

  const reason = prompt(
    "Why are you reporting this post?\n\n• Scam\n• Offensive\n• Spam\n• Misleading\n• Other"
  );

  if (!reason) return;

  console.log('Post reported:', {
    postId,
    reason,
    time: new Date().toISOString()
  });

  alert("Thanks — this post has been flagged for review.");
});

/* ======================================================
   WEATHER WIDGET
====================================================== */
async function loadWeather() {
  try {
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=51.65&longitude=-3.45&current_weather=true&daily=sunrise,sunset&timezone=auto"
    );
    const data = await res.json();

    const temp = Math.round(data.current_weather.temperature);
    const code = data.current_weather.weathercode;

    let emoji = "🌤️";
    let message = "Another tidy day in the Rhondda.";

    if ([51, 61, 63, 65].includes(code)) {
      emoji = "🌧️";
      message = "Rain’s on — brolly time";
    }

    document.querySelector(".weather-emoji").textContent = emoji;
    document.querySelector(".weather-text").textContent =
      `${message} · ${temp}°C`;

  } catch {
    const text = document.querySelector(".weather-text");
    if (text) text.textContent = "Local updates available — keep an eye out, butt!";
  }
}

/* ======================================================
   INIT
====================================================== */
loadWeather();
loadPosts();
