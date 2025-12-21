import { auth, db, storage } from './firebase/init.js';
import { initUIRouter } from './ui-router.js';
import { initFeed } from './feed.js';
import './post-gate.js'; // post-gate already imports firebase, no need to call init

document.addEventListener('DOMContentLoaded', () => {
  initUIRouter();
  initFeed();
});
