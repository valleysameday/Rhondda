import { auth, db, storage } from '/index/js/firebase/init.js';
import { initUIRouter } from '/index/js/ui-router.js';
import { initFeed } from '/index/js/feed.js';
import './post-gate.js'; // post-gate already imports firebase, no need to call init

document.addEventListener('DOMContentLoaded', () => {
  initUIRouter();
  initFeed();
});
