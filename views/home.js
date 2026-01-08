import { initFeed } from "/index/js/feed.js";

export function init({ db }) {
  console.log("🏠 Home view init");

  const tryStart = () => {
    const feed = document.getElementById("feed");
    if (feed) {
      console.log("✅ Feed found, starting feed");
      initFeed({ db });
      return true;
    }
    return false;
  };

  // Try immediately
  if (tryStart()) return;

  // Otherwise observe ONLY the home view container
  const homeView = document.getElementById("view-home");

  const observer = new MutationObserver(() => {
    if (tryStart()) observer.disconnect();
  });

  observer.observe(homeView, { childList: true, subtree: true });
}
