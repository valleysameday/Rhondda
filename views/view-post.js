export function init() {
  const postId = sessionStorage.getItem("viewPostId");
  if (!postId) return;

  // TEMP: mock data (replace with Firestore later)
  const mockPosts = [
    { id: 1, title: "Chair for Sale", content: "A comfy chair", category: "forsale", price: 25 },
    { id: 2, title: "Lawn Mowing", content: "Professional service", category: "jobs" },
    { id: 3, title: "Flat to Rent", content: "2-bed flat in town", category: "property", price: 450 }
  ];

  const post = mockPosts.find(p => p.id == postId);
  if (!post) return;

  document.getElementById("viewTitle").textContent = post.title;
  document.getElementById("viewDescription").textContent = post.content;
  document.getElementById("viewMeta").textContent = `Category: ${post.category}`;

  const priceEl = document.getElementById("viewPrice");
  if (post.price) {
    priceEl.textContent = `£${post.price}`;
  } else {
    priceEl.style.display = "none";
  }
}
