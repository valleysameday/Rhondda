// /views/home.js
import { initFeed } from "/index/js/feed.js";

export function init() {
  console.log("🏠 Home view init");

  // Wait until the #feed element exists in the DOM
  const feedContainer = document.getElementById("feed");
  if (feedContainer) {
    initFeed(); // safe to run
  } else {
    // If somehow the view HTML isn't fully injected yet
    const observer = new MutationObserver((mutations, obs) => {
      const feed = document.getElementById("feed");
      if (feed) {
        console.log("✅ #feed detected, initializing feed");
        initFeed();
        obs.disconnect(); // stop observing
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }
}
