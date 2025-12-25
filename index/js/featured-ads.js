export function initFeaturedAds() {
  console.log("⭐ Featured ads initialised");

  const container = document.getElementById("featuredAds");
  if (!container) return;

  container.innerHTML = `
    <div class="featured-card">Local Business Spotlight</div>
  `;
}
