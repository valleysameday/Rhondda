const postsContainer = document.getElementById('postsContainer');
const categoryBtns = document.querySelectorAll('.category-btn');



/* -------------------- MOCK POSTS -------------------- */
const mockPosts = [
  { id: '1', title: 'Cafe Discount', content: 'Get 10% off at Joe’s Cafe', category: 'offers', type: 'business' },
  { id: '2', title: 'Charity Run', content: 'Join the charity 5k in Pontypridd', category: 'events' },
  { id: '3', title: 'Plumber Available', content: 'Quick plumbing service this week', category: 'services', type: 'business' },
  { id: '4', title: 'Supermarket Sale', content: 'Weekly specials on groceries', category: 'offers', type: 'ad' },
  { id: '5', title: 'Dog Found', content: 'Lost Beagle spotted in Pontypridd', category: 'community' }
];

/* -------------------- LOAD POSTS -------------------- */
function loadPosts(category = 'all') {
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

    // Example featured logic (later replace with paid flag)
    if (post.type === 'business') {
      card.classList.add('business');
    }

    card.innerHTML = `
      <button class="report-btn" title="Report this post" data-post-id="${post.id}">⚑</button>
      <h3>${post.title}</h3>
      <p>${post.content}</p>
      <small>Category: ${post.category}</small>
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
