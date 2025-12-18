const dashboardPosts = document.getElementById('dashboardPosts');
const createPostBtn = document.getElementById('createPostBtn');

let mockDashboardPosts = []; // stores the business's posts locally

function renderDashboardPosts() {
  dashboardPosts.innerHTML = '';
  if (!mockDashboardPosts.length) {
    dashboardPosts.innerHTML = '<p>No posts yet. Create one above!</p>';
    return;
  }

  mockDashboardPosts.forEach((post, index) => {
    const div = document.createElement('div');
    div.className = 'post-card';
    div.innerHTML = `
      <h3>${post.title}</h3>
      <p>${post.content}</p>
      <small>Category: ${post.category}</small>
      <button onclick="deletePost(${index})" style="float:right;margin-top:-24px;">Delete</button>
    `;
    dashboardPosts.appendChild(div);
  });
}

function deletePost(index) {
  mockDashboardPosts.splice(index, 1);
  renderDashboardPosts();
}

createPostBtn.addEventListener('click', () => {
  const title = document.getElementById('postTitle').value.trim();
  const content = document.getElementById('postContent').value.trim();
  const category = document.getElementById('postCategory').value;

  if (!title || !content) return alert('Please enter both title and content');

  mockDashboardPosts.push({ title, content, category });
  
  document.getElementById('postTitle').value = '';
  document.getElementById('postContent').value = '';
  
  renderDashboardPosts();
});

// Initial render
renderDashboardPosts();
