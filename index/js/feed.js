const postsContainer = document.getElementById('postsContainer');
const categoryBtns = document.querySelectorAll('.category-btn');

/* -------------------- MOCK POSTS -------------------- */
const mockPosts = [
  /* ✅ Jobs & Services (business paying customers) */
  { 
    id: '1',
    title: 'Local Plumber Available',
    content: 'Fast call-outs across Rhondda. Fully insured.',
    category: 'jobs',
    type: 'business'
  },

  { 
    id: '2',
    title: 'Mobile Hairdresser',
    content: 'Cuts, colours & styling. Evening appointments available.',
    category: 'jobs',
    type: 'business'
  },

  /* ✅ For Sale */
  { 
    id: '3',
    title: 'Fridge Freezer',
    content: 'Good condition, fully working.',
    category: 'forsale',
    price: 50
  },

  { 
    id: '4',
    title: 'Sofa Set',
    content: '3-seater + armchair. Smoke-free home.',
    category: 'forsale',
    price: 120
  },

  /* ✅ Property */
  { 
    id: '5',
    title: '2 Bed House To Rent',
    content: 'Treorchy. Close to schools and shops.',
    category: 'property',
    type: 'business'
  },

  /* ✅ Community */
  { 
    id: '6',
    title: 'Lost Dog',
    content: 'Small brown terrier seen near Bute Street.',
    category: 'community'
  },

  /* ✅ Events */
  { 
    id: '7',
    title: 'Charity Quiz Night',
    content: 'Raising funds for Rhondda Foodbank.',
    category: 'events'
  },

  /* ✅ Freebies */
  { 
    id: '8',
    title: 'Free Wardrobe',
    content: 'Collection only from Tonypandy.',
    category: 'free'
  }
];

/* -------------------- LOAD POSTS -------------------- */
function loadPosts(category = 'all') {
  postsContainer.innerHTML = '';

  const filtered = category === 'all'
    ? mockPosts
    : mockPosts.filter(p => p.category === category);

  if (!filtered.length) {
    postsContainer.innerHTML = '<p>No posts yet!</p>';
    return;
  }

  filtered.forEach(post => {
    const card = document.createElement('div');
    card.className = `post-card ${post.type || ''}`;

    const imgSrc = post.image || '/images/post-placeholder.jpg';

    const overlayText = post.type === 'business'
      ? `<div class="business-overlay">${post.title}</div>`
      : '';

    card.innerHTML = `
      <div class="post-image">
        <img src="${imgSrc}" alt="${post.title}">
        ${overlayText}
      </div>

      <div class="post-body">
        <h3>${post.title}</h3>

        ${post.price ? `<div class="post-price">£${post.price}</div>` : ''}

        <p class="post-desc">${post.content}</p>
        <small class="post-category">Category: ${post.category}</small>
      </div>

      <button class="report-btn" title="Report this post" data-post-id="${post.id}">⚑</button>
    `;

    postsContainer.appendChild(card);
  });
}

/* -------------------- CATEGORY FILTER -------------------- */
categoryBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    categoryBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadPosts(btn.dataset.category);
  });
});

/* -------------------- REPORT HANDLER -------------------- */
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

/* -------------------- WEATHER -------------------- */
async function loadWeather() {
  try {
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=51.65&longitude=-3.45&current_weather=true&daily=sunrise,sunset&timezone=auto"
    );
    const data = await res.json();

    const code = data.current_weather.weathercode;
    const temp = Math.round(data.current_weather.temperature);

    const sunrise = new Date(data.daily.sunrise[0]);
    const sunset = new Date(data.daily.sunset[0]);
    const now = new Date(data.current_weather.time);
    const isDay = now >= sunrise && now <= sunset;

    let emoji = isDay ? "🌞" : "🌙";
    let message = isDay
      ? "Another tidy day in the Rhondda."
      : "Evening in the valley — cosy vibes.";

    if ([51, 61, 63, 65].includes(code)) {
      emoji = "🌧️";
      message = "Rain’s on — brolly time";
    }

    document.querySelector(".weather-emoji").textContent = emoji;
    document.querySelector(".weather-text").textContent =
      `${message} · ${temp}°C`;
  } catch {
    document.querySelector(".weather-text").textContent =
      "Local updates available — keep an eye out, butt!";
  }
}

loadWeather();

/* -------------------- INIT -------------------- */
loadPosts();
