export function initFeed() {
  const postsContainer = document.getElementById('feed'); // make sure your home view has id="feed"
  const categoryBtns = document.querySelectorAll('.category-btn');
  const businessCheckbox = document.getElementById('isBusinessAccount');
  const businessBenefits = document.getElementById('businessBenefits');

  if (!postsContainer) return console.warn("Feed container not found");

  // Toggle business benefits panel
  if (businessCheckbox && businessBenefits) {
    businessCheckbox.addEventListener('change', () => {
      businessBenefits.style.display = businessCheckbox.checked ? 'block' : 'none';
    });
  }

  // Mock posts
  const mockPosts = [
    { id: 1, title: "Chair for Sale", content: "A comfy chair", category: "forsale", price: 25 },
    { id: 2, title: "Lawn Mowing", content: "Professional service", category: "jobs" },
    { id: 3, title: "Flat to Rent", content: "2-bed flat in town", category: "property", price: 450 },
  ];

  // Load posts function
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

      card.addEventListener('click', e => {
  if (e.target.closest('.report-btn')) return;

  sessionStorage.setItem("viewPostId", post.id);
  loadView("view-post");
});
      
      postsContainer.appendChild(card);
    });
  }

  // Category buttons
  categoryBtns.forEach(btn => btn.addEventListener('click', () => {
    categoryBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadPosts(btn.dataset.category);
  }));

  // Report post
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

  // Weather function
  async function loadWeather() {
    const emojiEl = document.querySelector(".weather-emoji");
    const textEl = document.querySelector(".weather-text");
    if (!emojiEl || !textEl) return;

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
      let message = isDay ? "Another tidy day in the Rhondda." : "Evening in the valley — cosy vibes.";

      if ([51, 61, 63, 65].includes(code)) {
        emoji = "🌧️";
        message = "Rain’s on — brolly time";
      }

      emojiEl.textContent = emoji;
      textEl.textContent = `${message} · ${temp}°C`;
    } catch {
      textEl.textContent = "Local updates available — keep an eye out, butt!";
    }
  }

/* ===== FEATURED ADS AUTO SLIDER ===== */
  function initFeaturedAds() {
  const track = document.getElementById("featuredTrack");
  if (!track) return;

  // Make sure children exist
  const checkInterval = setInterval(() => {
    const cards = track.children;
    if (!cards.length) return;

    clearInterval(checkInterval); // stop waiting once we have cards

    let index = 0;
    track.style.transition = 'transform 0.5s ease-in-out';

    setInterval(() => {
      index = (index + 1) % cards.length;
      track.style.transform = `translateX(-${index * 100}%)`;
    }, 4500);

  }, 100); // check every 100ms
  }

  
  // Initial load
  loadPosts();
  loadWeather();
  initFeaturedAds();
}
