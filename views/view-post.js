// /views/view-post.js

export function init() {
  const postId = Number(sessionStorage.getItem("viewPostId"));
  if (!postId) return;

  // Mock posts — update later with Firestore
  const mockPosts = [
    { id: 1, title: "Chair for Sale", content: "A comfy chair in good condition.", category: "forsale", price: 25, area: "Tonypandy", image: "/images/chair.jpg", type: "personal" },
    { id: 2, title: "Lawn Mowing", content: "Professional garden service for homes and offices.", category: "jobs", area: "Treorchy", image: "/images/lawn.jpg", type: "business" },
    { id: 3, title: "Flat to Rent", content: "2-bed flat in town, close to shops.", category: "property", price: 450, area: "Porth", image: "/images/flat.jpg", type: "personal" }
  ];

  const post = mockPosts.find(p => p.id === postId);
  if (!post) return;

  // Update DOM
  const titleEl = document.getElementById("viewTitle");
  const descEl = document.getElementById("viewDescription");
  const priceEl = document.getElementById("viewPrice");
  const areaEl = document.getElementById("viewArea");
  const metaEl = document.getElementById("viewMeta");
  const imageEl = document.getElementById("viewImage");

  titleEl.textContent = post.title;
  descEl.textContent = post.content;
  priceEl.textContent = post.price ? `£${post.price}` : "";
  areaEl.textContent = post.area ? `Area: ${post.area}` : "";
  metaEl.textContent = `Category: ${post.category}`;
  
  if (imageEl && post.image) {
    imageEl.src = post.image;
    imageEl.alt = post.title;
  }

  // Report button
  const reportBtn = document.getElementById("reportPost");
  reportBtn.addEventListener("click", () => {
    const reason = prompt(
      "Why are you reporting this post?\n\n• Scam\n• Offensive\n• Spam\n• Misleading\n• Other"
    );
    if (!reason) return;
    console.log("Post reported:", { postId: post.id, reason, time: new Date().toISOString() });
    alert("Thanks — this post has been flagged for review.");
  });
}
