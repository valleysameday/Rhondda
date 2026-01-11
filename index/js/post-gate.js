console.log("POST-GATE: Loaded");
// ===============================
// POST GATE (MAIN CALLER)
// index/js/post-gate.js
// ===============================

import { getFirebase } from "/index/js/firebase/init.js";

// Posting modules
import { initPostFlow } from "../postingStuff/post-flow.js";
import { initPostImages } from "../postingStuff/post-images.js";
import { initPostSubmit } from "../postingStuff/post-submit.js";

let auth, db, storage;

export function initPostGate() {
console.log("POST-GATE: initPostGate() running");
  getFirebase().then(fb => {
    auth = fb.auth;
    db = fb.db;
    storage = fb.storage;

    window.auth = auth;
    window.db = db;
    window.storage = storage;

    initPostFlow();
    initPostImages();
    initPostSubmit();
  });
}
