// /views/view-post.js
export function init() {
  const postId = Number(sessionStorage.getItem("viewPostId"));
  if (!postId) return;

  const mockPosts = [
    { id: 1, title: "Vintage Velvet Lounge Chair", content: "A stunning mid-century modern chair. Minor wear on the left arm, but otherwise perfect. Very comfy and heavy duty.", category: "Furniture", price: 125, area: "Tonypandy", image: "/images/chair.jpg", posted: "2 hours ago" },
    // ... other posts
  ];

  const post = mockPosts.find(p => p.id === postId);
  if (!post) return;

  // DOM Mapping
  document.getElementById("viewTitle").textContent = post.title;
  document.getElementById("viewDescription").textContent = post.content;
  document.getElementById("viewPrice").textContent = post.price ? `£${post.price}` : "Contact for price";
  document.getElementById("viewArea").textContent = post.area;
  document.getElementById("viewCategory").textContent = post.category;
  document.getElementById("viewTime").textContent = post.posted || "Just now";
  
  const imgEl = document.getElementById("viewImage");
  if (imgEl && post.image) {
    imgEl.src = post.image;
    imgEl.alt = post.title;
  }

  // Action Handlers
  document.getElementById("messageSeller").onclick = () => {
    alert("Chat feature coming soon! User ID: " + post.id);
  };

  document.getElementById("reportPost").onclick = () => {
    const reason = prompt("Reason for reporting (Scam, Spam, Inappropriate):");
    if (reason) alert("Report submitted. Thank you for keeping the marketplace safe.");
  };
}
