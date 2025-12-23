import { initFeed } from '/index/js/feed.js';

export function init() {
  console.log("🏠 Home view init");

  // ensure postsContainer exists
  const containerCheck = setInterval(() => {
    if (document.getElementById("feed")) {
      clearInterval(containerCheck);
      initFeed();
    }
  }, 10);
}
