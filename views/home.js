import { initFeed } from '/index/js/feed.js';

window.addEventListener("DOMContentLoaded", () => {
  const feedContainer = document.getElementById("feed");
  if (feedContainer) initFeed();
});
