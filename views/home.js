// /views/home.js
import { initFeed } from '/index/js/feed.js';

export function init() {
  // this runs after home.html is inserted
  console.log("🏠 Home view init");
  initFeed();  // now #feed exists
}
