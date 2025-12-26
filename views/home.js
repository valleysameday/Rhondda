import { initFeed } from "/index/js/feed.js";

export function init({ db }) {
  console.log("🏠 Home view init");

  // Wait until the #feed element exists in the DOM
  const feedContainer = document.getElementById("feed");
  const startFeed = () => {
    if (feedContainer) {
      initFeed({ db }); // ✅ pass db
    }
  };

  if (feedContainer) {
    startFeed();
  } else {
    const observer = new MutationObserver((mutations, obs) => {
      const feed = document.getElementById("feed");
      if (feed) {
        console.log("✅ #feed detected, initializing feed");
        initFeed({ db });
        obs.disconnect();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }
}
