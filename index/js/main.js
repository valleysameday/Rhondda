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

// Load all posts on page load
loadPosts();
