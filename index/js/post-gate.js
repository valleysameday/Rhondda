// ===============================
// POST GATE (MAIN CALLER)
// index/js/post-gate.js
// ===============================

import { getFirebase } from "/index/js/firebase/init.js";

// Posting modules (you will create these)
import { initPostFlow } from "/index/postingStuff/post-flow.js";
import { initPostImages } from "/index/postingStuff/post-images.js";
import { initPostSubmit } from "/index/postingStuff/post-submit.js";

let auth, db, storage;

export function initPostGate() {
  getFirebase().then(fb => {
    auth = fb.auth;
    db = fb.db;
    storage = fb.storage;

    // Make Firebase available globally if needed
    window.auth = auth;
    window.db = db;
    window.storage = storage;

    // Initialise posting modules
    initPostFlow();
    initPostImages();
    initPostSubmit();
  });
}
