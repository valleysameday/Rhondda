// firebase/feed.firestore.js

import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  doc,
  getDoc,
  setDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { db } from "./settings.js";

/* ============================================================
   FETCH POSTS (PAGINATED)
============================================================ */

export async function fsFetchFeedPosts({ lastDoc = null, initial = false }) {
  let q;

  if (initial || !lastDoc) {
    q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(50)
    );
  } else {
    q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      startAfter(lastDoc),
      limit(50)
    );
  }

  const snap = await getDocs(q);

  if (snap.empty) {
    return { posts: [], lastDoc: null };
  }

  const newLastDoc = snap.docs[snap.docs.length - 1];

  const posts = snap.docs.map(docSnap => {
    const d = docSnap.data();
    return {
      id: docSnap.id,
      userId: d.userId,
      title: d.title,
      teaser: d.description || "",
      category: d.category || "misc",
      categoryLabel: d.categoryLabel || d.category,
      price: d.price || null,
      area: d.area || "Rhondda",
      image: d.images?.[0] || "/images/image-webholder.webp",
      type: d.isFeatured ? "featured" : "standard",
      isBusiness: d.isBusiness === true,
      cta: d.cta || null,
      rentFrequency: d.rentFrequency || null,
      bedrooms: d.bedrooms || null,
      bathrooms: d.bathrooms || null,
      furnished: d.furnished || null,
      condition: d.condition || null,
      delivery: d.delivery || null,
      jobType: d.jobType || null,
      jobSalary: d.jobSalary || null,
      eventDate: d.eventDate || null,
      eventStart: d.eventStart || null,
      communityType: d.communityType || null,
      lostLocation: d.lostLocation || null,
      lostReward: d.lostReward || null,
      createdAt: d.createdAt || Date.now()
    };
  });

  return { posts, lastDoc: newLastDoc };
}

/* ============================================================
   SAVE / UNSAVE POST
============================================================ */

export async function fsToggleSavePost({ uid, postId }) {
  const ref = doc(db, "users", uid, "savedPosts", postId);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    await deleteDoc(ref);
    return false; // now unsaved
  } else {
    await setDoc(ref, {
      postId,
      savedAt: Date.now()
    });
    return true; // now saved
  }
}


/* =====================================================
   USER PROFILE (USED BY main.js)
===================================================== */

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * Load & normalise user profile
 */
export async function fsLoadUserProfile(uid) {
  let snap = await getDoc(doc(db, "users", uid));

  // Retry once if doc not created yet
  if (!snap.exists()) {
    await new Promise(r => setTimeout(r, 200));
    snap = await getDoc(doc(db, "users", uid));
  }

  if (!snap.exists()) return {};

  const data = snap.data();

  // Defaults
  if (!data.plan) data.plan = "free";

  // Business trial expiry
  const trial = data.businessTrial;
  if (trial?.active && Date.now() > trial.expiresAt) {
    data.plan = "free";
    data.businessTrial.active = false;
  }

  return data;
}

/* =====================================================
   POST GATE FIRESTORE HELPERS
===================================================== */

import {
  collection,
  addDoc,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db, storage } from "./settings.js";

/**
 * Get user info
 */
export async function fsGetUser(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : {};
}

/**
 * Add a new post to Firestore
 * @param {object} post
 */
export async function fsAddPost(post) {
  return await addDoc(collection(db, "posts"), post);
}

/**
 * Upload a single image to Firebase Storage
 * @param {File} file
 * @param {string} uid
 */
export async function fsUploadImage(file, uid) {
  const path = `posts/${uid}/${Date.now()}-${file.name}`;
  const ref = storage.ref(path);
  await ref.put(file);
  return await ref.getDownloadURL();
}
