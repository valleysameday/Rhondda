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
      "https://api.open-meteo.com/v1/forecast?latitude=51.65&longitude=-3.45&current_weather=true"
    );
    const data = await res.json();

    const code = data.current_weather.weathercode;
    const temp = Math.round(data.current_weather.temperature);

    let message = "A typical day in Rhondda.";
    let emoji = "🌤️";

    if ([0].includes(code)) {
      message = `Clear skies today — ideal for local events`;
      emoji = "☀️";
    } else if ([1,2,3].includes(code)) {
      message = `A bit cloudy today — still good for popping out`;
      emoji = "⛅";
    } else if ([51,61,63,65].includes(code)) {
      message = `Rainy today — check local offers before heading out`;
      emoji = "🌧️";
    } else if ([71,73,75].includes(code)) {
      message = `Cold today — support local businesses from home`;
      emoji = "❄️";
    }

    document.querySelector(".weather-emoji").textContent = emoji;
    document.querySelector(".weather-text").textContent =
      `${message} · ${temp}°C`;

  } catch {
    document.querySelector(".weather-text").textContent =
      "Local updates available today";
  }
}

loadWeather();
// Load all posts on page load
loadPosts();
