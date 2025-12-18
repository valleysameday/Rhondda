const postsContainer = document.getElementById('postsContainer');
const categoryBtns = document.querySelectorAll('.category-btn');
const loginModal = document.getElementById('loginModal');
const postModal = document.getElementById('postModal');

document.querySelector('.header-link[href$="login.html"]').onclick = e => {
  e.preventDefault();
  loginModal.style.display = 'flex';
};

document.querySelector('.header-link.primary').onclick = e => {
  e.preventDefault();
  postModal.style.display = 'flex';
};

document.querySelectorAll('.close').forEach(span => {
  span.onclick = () => { span.parentElement.parentElement.style.display = 'none'; }
});
const mockPosts = [
  { title: 'Cafe Discount', content: 'Get 10% off at Joe’s Cafe', category: 'offers' },
  { title: 'Charity Run', content: 'Join the charity 5k in Pontypridd', category: 'events' },
  { title: 'Plumber Available', content: 'Quick plumbing service this week', category: 'services' },
  { title: 'Supermarket Sale', content: 'Weekly specials on groceries', category: 'offers' },
  { title: 'Dog Found', content: 'Lost Beagle spotted in Pontypridd', category: 'community' }
];

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
    const div = document.createElement('div');
    div.className = 'post-card';

    // Randomly make 1 in 4 posts full-width
    if (Math.random() < 0.25) div.classList.add('full-width');

    div.innerHTML = `
      <h3>${post.title}</h3>
      <p>${post.content}</p>
      <small>Category: ${post.category}</small>
    `;
    postsContainer.appendChild(div);
  });
}

categoryBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    categoryBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadPosts(btn.dataset.category);
  });
});
async function loadWeather() {
  try {
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=51.65&longitude=-3.45&current_weather=true&daily=sunrise,sunset&timezone=auto"
    );
    const data = await res.json();

    const code = data.current_weather.weathercode;
    const temp = Math.round(data.current_weather.temperature);

    // Get sunrise/sunset for today
    const sunrise = new Date(data.daily.sunrise[0]);
    const sunset = new Date(data.daily.sunset[0]);
    const now = new Date(data.current_weather.time);

    const isDay = now >= sunrise && now <= sunset;

    let message = isDay
      ? "Another tidy day in the Rhondda."
      : "Evening in the valley — cosy vibes.";
    let emoji = isDay ? "🌞" : "🌙";

    if ([0].includes(code)) {
      message = isDay
        ? `Clear skies over the valley — perfect for a stroll or a cuppa outside`
        : `Clear night — stars out over the Rhondda, lush for a quiet walk`;
      emoji = isDay ? "☀️" : "✨";
    } else if ([1,2,3].includes(code)) {
      message = isDay
        ? `Bit of cloud about — still lush for popping down the shops or seeing mates`
        : `Cloudy night — good time for a film indoors`;
      emoji = "⛅";
    } else if ([51,61,63,65].includes(code)) {
      message = isDay
        ? `Rain’s on — grab your brolly and maybe support a local café while you’re out`
        : `Rainy night — kettle on, blanket out, support local online`;
      emoji = "🌧️";
    } else if ([71,73,75].includes(code)) {
      message = isDay
        ? `Snow in the valley — wrap up warm if you’re out`
        : `Cold night — best to keep cosy and shop local online`;
      emoji = "❄️";
    }

    document.querySelector(".weather-emoji").textContent = emoji;
    document.querySelector(".weather-text").textContent =
      `${message} · ${temp}°C`;

    // Optional: change background theme
    const widget = document.querySelector(".weather-widget");
    if (widget) {
      widget.style.background = isDay
        ? "linear-gradient(to top, #87CEEB, #ffffff)" // daytime sky
        : "linear-gradient(to top, #001848, #444)"   // night sky
      widget.style.color = isDay ? "#222" : "#eee";
    }

  } catch {
    document.querySelector(".weather-text").textContent =
      "Local updates available — keep an eye out, butt!";
  }
}

loadWeather();
// Load all posts on page load
loadPosts();
