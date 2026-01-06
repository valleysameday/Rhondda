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
// Firestore logic for bundle.js
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let auth, db;

export function initFirebase({ auth: a, db: d }) {
  auth = a;
  db = d;
}

// Get seller data by UID
export async function getSeller(sellerId) {
  if (!db || !sellerId) return null;
  const snap = await getDoc(doc(db, "users", sellerId));
  return snap.exists() ? snap.data() : null;
}

// Get post data by post ID
export async function getPost(postId) {
  if (!db || !postId) return null;
  const snap = await getDoc(doc(db, "posts", postId));
  return snap.exists() ? snap.data() : null;
}
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let auth, db;

export function initFirebase({ auth: a, db: d }) {
  auth = a;
  db = d;
}

// Listen to user's conversations in real-time
export function onUserConversations(userId, callback) {
  if (!db || !userId) return () => {};

  const convosRef = collection(db, "conversations");
  const q = query(
    convosRef,
    where("participants", "array-contains", userId),
    orderBy("updatedAt", "desc")
  );

  return onSnapshot(q, callback);
}

// Get user data by UID
export async function getUser(uid) {
  if (!db || !uid) return null;
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

// Get post data by postId
export async function getPost(postId) {
  if (!db || !postId) return null;
  const snap = await getDoc(doc(db, "posts", postId));
  return snap.exists() ? snap.data() : null;
}

// Mark conversation deleted for a user
export async function markConversationDeleted(convoId, userId, existingDeleted = {}) {
  if (!db || !convoId || !userId) return;
  await setDoc(
    doc(db, "conversations", convoId),
    { deletedFor: { ...existingDeleted, [userId]: true } },
    { merge: true }
  );
}

// Delete a conversation doc
export async function deleteConversation(convoId) {
  if (!db || !convoId) return;
  await deleteDoc(doc(db, "conversations", convoId));
}
import {
  collection,
  doc,
  getDoc,
  addDoc,
  setDoc,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let auth, db;

export function initFirebase({ auth: a, db: d }) {
  auth = a;
  db = d;
}

// Get user info by UID
export async function getUser(uid) {
  if (!db || !uid) return null;
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

// Get post info by postId
export async function getPost(postId) {
  if (!db || !postId) return null;
  const snap = await getDoc(doc(db, "posts", postId));
  return snap.exists() ? snap.data() : null;
}

// Listen to messages in a conversation in real-time
export function onConversationMessages(convoId, callback) {
  if (!db || !convoId) return () => {};

  const messagesRef = collection(db, "conversations", convoId, "messages");
  const q = query(messagesRef, orderBy("createdAt"));

  return onSnapshot(q, callback);
}

// Send a message in a conversation
export async function sendMessage(convoId, senderId, text) {
  if (!db || !convoId || !senderId || !text) return;

  const now = Date.now();
  const messagesRef = collection(db, "conversations", convoId, "messages");

  await addDoc(messagesRef, {
    senderId,
    text,
    createdAt: now,
    seen: false
  });

  await setDoc(
    doc(db, "conversations", convoId),
    {
      lastMessage: text,
      lastMessageSender: senderId,
      updatedAt: now
    },
    { merge: true }
  );
}
import {
  doc, getDoc, getDocs, collection,
  updateDoc, deleteDoc, query, where
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

let auth, db, storage;

export function initFirebase({ auth: a, db: d, storage: s }) {
  auth = a;
  db = d;
  storage = s;
}

// USERS
export async function getUser(uid) {
  if (!db || !uid) return null;
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : {};
}

export async function updateUser(uid, data) {
  if (!db || !uid || !data) return;
  await updateDoc(doc(db, "users", uid), data);
}

// POSTS
export async function getUserPosts(uid) {
  if (!db || !uid) return [];
  const snap = await getDocs(query(collection(db, "posts"), where("userId", "==", uid)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deletePost(post) {
  if (!db || !storage || !post || !post.id) return;

  const urls = [];
  if (post.imageUrl) urls.push(post.imageUrl);
  if (Array.isArray(post.imageUrls)) urls.push(...post.imageUrls);

  for (const url of urls) {
    try {
      const path = decodeURIComponent(url.split("/o/")[1].split("?")[0]);
      await deleteObject(ref(storage, path));
    } catch {}
  }

  await updateDoc(doc(db, "posts", post.id), { deleted: true }).catch(async () => {
    await deleteDoc(doc(db, "posts", post.id));
  });
}

// AUTO DELETE OLD POSTS
export async function autoDeleteOldPosts(uid, limitDays = 14) {
  const limitMs = limitDays * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const posts = await getUserPosts(uid);
  posts.forEach(p => {
    let createdAtMs = 0;
    if (typeof p.createdAt === "number") createdAtMs = p.createdAt;
    else if (p.createdAt?.toMillis) createdAtMs = p.createdAt.toMillis();

    if (createdAtMs && now - createdAtMs > limitMs) deletePost(p);
  });
}

// AVATARS
export async function uploadAvatar(uid, file, type = "user") {
  if (!storage || !file || !uid) return null;

  const path = type === "user" ? `avatars/${uid}.jpg` : `business-avatars/${uid}.jpg`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  // update Firestore
  const coll = type === "user" ? "users" : "businesses";
  await updateDoc(doc(db, coll, uid), { avatarUrl: url });

  return url;
}

// BUSINESSES
export async function getBusiness(uid) {
  if (!db || !uid) return {};
  const snap = await getDoc(doc(db, "businesses", uid));
  return snap.exists() ? snap.data() : {};
}

export async function updateBusiness(uid, data) {
  if (!db || !uid || !data) return;
  await updateDoc(doc(db, "businesses", uid), data);
}

export async function getBusinessPosts(uid) {
  if (!db || !uid) return [];
  const snap = await getDocs(query(collection(db, "posts"), where("businessId", "==", uid)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./init.js"; // your initialized Firebase DB

export async function getPost(id) {
  const snap = await getDoc(doc(db, "posts", id));
  return snap.exists() ? snap.data() : null;
}

export async function updatePost(id, data) {
  await updateDoc(doc(db, "posts", id), data);
}
