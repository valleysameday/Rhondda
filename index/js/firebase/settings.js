// ============================================
//  FIRESTORE HELPERS (CLEAN & OPTIMIZED)
// ============================================

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

let auth, db, storage;

/**
 * Initialize Firestore & Storage
 */
export function initFirebase({ auth: a, db: d, storage: s }) {
  auth = a;
  db = d;
  storage = s;
}

/* ============================================================
   POSTS
============================================================ */

/**
 * Fetch posts feed (paginated)
 */
export async function fetchFeedPosts({ lastDoc = null, limitCount = 50 } = {}) {
  const postsRef = collection(db, "posts");
  let q;

  if (!lastDoc) {
    q = query(postsRef, orderBy("createdAt", "desc"), limit(limitCount));
  } else {
    q = query(postsRef, orderBy("createdAt", "desc"), startAfter(lastDoc), limit(limitCount));
  }

  const snap = await getDocs(q);
  const posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const newLastDoc = snap.docs[snap.docs.length - 1] || null;

  return { posts, lastDoc: newLastDoc };
}

/**
 * Get single post by ID
 */
export async function getPost(postId) {
  if (!db || !postId) return null;
  const snap = await getDoc(doc(db, "posts", postId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Add a new post
 */
export async function addPost(post) {
  return await addDoc(collection(db, "posts"), post);
}

/**
 * Update existing post
 */
export async function updatePost(postId, data) {
  if (!db || !postId || !data) return;
  await updateDoc(doc(db, "posts", postId), data);
}

/**
 * Delete post & images
 */
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

  // Soft delete if update fails
  await updateDoc(doc(db, "posts", post.id), { deleted: true }).catch(async () => {
    await deleteDoc(doc(db, "posts", post.id));
  });
}

/**
 * Fetch all posts from a user or business
 */
export async function getSellerPosts(uid) {
  if (!db || !uid) return [];

  const snaps = [];
  const postsRef = collection(db, "posts");

  const qUser = query(postsRef, where("userId", "==", uid));
  const snapUser = await getDocs(qUser);
  snapUser.forEach(d => snaps.push({ id: d.id, ...d.data() }));

  const qBiz = query(postsRef, where("businessId", "==", uid));
  const snapBiz = await getDocs(qBiz);
  snapBiz.forEach(d => { if (!snaps.find(x => x.id === d.id)) snaps.push({ id: d.id, ...d.data() }); });

  return snaps;
}

/**
 * Toggle save/unsave post for a user
 */
export async function toggleSavePost({ uid, postId }) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) return false;

  const data = snap.data();
  const saved = data.savedPosts || {};

  const isSaved = !!saved[postId];

  if (isSaved) {
    delete saved[postId];
  } else {
    saved[postId] = true;
  }

  await updateDoc(userRef, { savedPosts: saved });

  return !isSaved;
}

/* ============================================================
   USERS
============================================================ */

/**
 * Get user info
 */
export async function getUser(uid) {
  if (!db || !uid) return null;
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { uid, ...snap.data() } : null;
}

/**
 * Update user info
 */
export async function updateUser(uid, data) {
  if (!db || !uid || !data) return;
  await updateDoc(doc(db, "users", uid), data);
}

/**
 * Toggle follow/unfollow seller
 */
export async function toggleFollowSeller(userUid, sellerUid, actuallyToggle = true) {
  const sellerRef = doc(db, "users", sellerUid);
  const snap = await getDoc(sellerRef);
  if (!snap.exists()) return false;

  const followers = snap.data().followers || {};
  const isFollowing = !!followers[userUid];

  if (actuallyToggle) {
    if (isFollowing) delete followers[userUid];
    else followers[userUid] = true;
    await updateDoc(sellerRef, { followers });
    return !isFollowing;
  }

  return isFollowing;
}

/* ============================================================
   BUSINESSES
============================================================ */

export async function getBusiness(uid) {
  if (!db || !uid) return null;
  const snap = await getDoc(doc(db, "businesses", uid));
  return snap.exists() ? { uid, ...snap.data() } : null;
}

export async function updateBusiness(uid, data) {
  if (!db || !uid || !data) return;
  await updateDoc(doc(db, "businesses", uid), data);
}

/**
 * Increment business leads
 */
export async function incrementLeads(uid) {
  const bRef = doc(db, "businesses", uid);
  const snap = await getDoc(bRef);
  if (!snap.exists()) return;
  const b = snap.data();
  await updateDoc(bRef, { leads: (b.leads || 0) + 1 });
}

/* ============================================================
   STORAGE / UPLOADS
============================================================ */

/**
 * Upload avatar
 */
export async function uploadAvatar(uid, file, type = "user") {
  if (!storage || !file || !uid) return null;

  const path = type === "user" ? `avatars/${uid}.jpg` : `business-avatars/${uid}.jpg`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  const coll = type === "user" ? "users" : "businesses";
  await updateDoc(doc(db, coll, uid), { avatarUrl: url });

  return url;
}

/**
 * Upload post image
 */
export async function uploadPostImage(file, uid) {
  if (!storage || !file || !uid) return null;
  const path = `posts/${uid}/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

/* ============================================================
   CONVERSATIONS / MESSAGES
============================================================ */

/**
 * Listen to user conversations
 */
export function onUserConversations(userId, callback) {
  if (!db || !userId) return () => {};

  const convosRef = collection(db, "conversations");
  const q = query(convosRef, where("participants", "array-contains", userId), orderBy("updatedAt", "desc"));
  return onSnapshot(q, callback);
}

/**
 * Listen to messages in a conversation
 */
export function onConversationMessages(convoId, callback) {
  if (!db || !convoId) return () => {};

  const messagesRef = collection(db, "conversations", convoId, "messages");
  const q = query(messagesRef, orderBy("createdAt"));
  return onSnapshot(q, callback);
}

/**
 * Send message in a conversation
 */
export async function sendMessage(convoId, senderId, text) {
  if (!db || !convoId || !senderId || !text) return;

  const now = Date.now();
  const messagesRef = collection(db, "conversations", convoId, "messages");

  await addDoc(messagesRef, { senderId, text, createdAt: now, seen: false });
  await setDoc(doc(db, "conversations", convoId), {
    lastMessage: text,
    lastMessageSender: senderId,
    updatedAt: now
  }, { merge: true });
}
