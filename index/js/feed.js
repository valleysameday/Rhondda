export function initFeed() {
  const postsContainer = document.getElementById('postsContainer');
  const categoryBtns = document.querySelectorAll('.category-btn');
  const businessCheckbox = document.getElementById('isBusinessAccount');
  const businessBenefits = document.getElementById('businessBenefits');

  if (businessCheckbox && businessBenefits) {
    businessCheckbox.addEventListener('change', () => {
      businessBenefits.style.display = businessCheckbox.checked ? 'block' : 'none';
    });
  }

  const mockPosts = [/* your mockPosts array here */];

  function loadPosts(category = 'all') {
    postsContainer.innerHTML = '';
    const filtered = category === 'all' ? mockPosts : mockPosts.filter(p => p.category === category);
    if (!filtered.length) return postsContainer.innerHTML = '<p>No posts yet!</p>';
    filtered.forEach(post => {
      const card = document.createElement('div');
      card.className = `post-card ${post.type || ''}`;
      const imgSrc = post.image || '/images/post-placeholder.jpg';
      const overlayText = post.type === 'business' ? `<div class="business-overlay">${post.title}</div>` : '';
      card.innerHTML = `
        <div class="post-image"><img src="${imgSrc}" alt="${post.title}">${overlayText}</div>
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

  categoryBtns.forEach(btn => btn.addEventListener('click', () => {
    categoryBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadPosts(btn.dataset.category);
  }));

  document.addEventListener('click', e => {
    if (!e.target.classList.contains('report-btn')) return;
    const postId = e.target.dataset.postId;
    const reason = prompt(
      "Why are you reporting this post?\n\n• Scam\n• Offensive\n• Spam\n• Misleading\n• Other"
    );
    if (!reason) return;
    console.log('Post reported:', { postId, reason, time: new Date().toISOString() });
    alert("Thanks — this post has been flagged for review.");
  });

  async function loadWeather() {
  const emojiEl = document.querySelector(".weather-emoji");
  const textEl = document.querySelector(".weather-text");

  if (!emojiEl || !textEl) return; // SPA safety

  try {
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=51.65&longitude=-3.45&current_weather=true&hourly=apparent_temperature,precipitation_probability&daily=sunrise,sunset&timezone=auto"
    );
    const data = await res.json();

    // Core values
    const code = data.current_weather.weathercode;
    const temp = Math.round(data.current_weather.temperature);
    const feels = Math.round(data.hourly.apparent_temperature[0]);
    const rainChance = data.hourly.precipitation_probability[0];

    // Day/night detection
    const sunrise = new Date(data.daily.sunrise[0]);
    const sunset = new Date(data.daily.sunset[0]);
    const now = new Date(data.current_weather.time);
    const isDay = now >= sunrise && now <= sunset;

    // ============================
    // ✅ Animated Emoji Selection
    // ============================
    let emoji = isDay ? "🌞" : "🌙";

    if ([51, 61, 63, 65, 80, 81, 82].includes(code)) emoji = "🌧️";
    if ([71, 73, 75].includes(code)) emoji = "❄️";
    if ([45, 48].includes(code)) emoji = "🌫️";
    if ([95, 96, 99].includes(code)) emoji = "⛈️";

    // ============================
    // ✅ Rhondda Personality Messages
    // ============================
    let message = "";

    if (!isDay) {
      message = "Evening in the valley — cosy vibes.";
    } else if (temp <= 3) {
      message = "Cold enough to freeze your nan’s washing.";
    } else if (rainChance > 60) {
      message = "Rain’s on — grab your brolly, butt.";
    } else if (temp >= 20) {
      message = "Warm one in the Rhondda — tidy!";
    } else {
      message = "Another tidy day in the Rhondda.";
    }

    // ============================
    // ✅ Apply to UI
    // ============================
    emojiEl.textContent = emoji;
    emojiEl.classList.add("weather-emoji"); // ensures animation class exists

    textEl.textContent = `${message} · ${temp}°C (feels like ${feels}°C)`;

  } catch (err) {
    textEl.textContent = "Weather’s having a moment — try again soon, butt.";
  }
  }

  loadPosts();
  loadWeather();
}
