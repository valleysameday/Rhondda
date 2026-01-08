import { initFeed } from "/index/js/feed.js";

export function init({ db }) {
  console.log("🏠 Home view init");

  const startFeed = () => {
    const feed = document.getElementById("feed");
    if (!feed) return false;

    console.log("✅ Feed found, starting feed");
    initFeed({ db });
    return true;
  };

  const homeView = document.getElementById("view-home");
  if (!homeView) return;

  // If feed exists now, start immediately
  if (startFeed()) return;

  // Otherwise, observe for feed being added
  const observer = new MutationObserver(() => {
    if (startFeed()) observer.disconnect();
  });

  observer.observe(homeView, { childList: true, subtree: true });
}
