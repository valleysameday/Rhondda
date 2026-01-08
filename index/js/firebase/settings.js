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
  onSnapshot,
  serverTimestamp,
  Timestamp,
  increment
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

let auth, db, storage;

/* ============================================================
   INIT FIREBASE
============================================================ */
export function initFirebase({ auth: a, db: d, storage: s }) {
  auth = a;
  db = d;
  storage = s;
}

/* ============================================================
   POSTS
============================================================ */

export async function fetchFeedPosts({ lastDoc = null, limitCount = 50 } = {}) {
  const postsRef = collection(db, "posts");
  const q = lastDoc
    ? query(postsRef, orderBy("createdAt", "desc"), startAfter(lastDoc), limit(limitCount))
    : query(postsRef, orderBy("createdAt", "desc"), limit(limitCount));

  const snap = await getDocs(q);
  return {
    posts: snap.docs.map(d => ({ id: d.id, ...d.data() })),
    lastDoc: snap.docs[snap.docs.length - 1] || null
  };
}

export async function getPost(postId) {
  if (!db || !postId) return null;
  const snap = await getDoc(doc(db, "posts", postId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function addPost(post) {
  return await addDoc(collection(db, "posts"), post);
}

export async function updatePost(postId, data) {
  if (!db || !postId || !data) return;
  await updateDoc(doc(db, "posts", postId), data);
}

export async function deletePost(post) {
  if (!db || !storage || !post?.id) return;

  const urls = [
    post.imageUrl,
    ...(Array.isArray(post.imageUrls) ? post.imageUrls : [])
  ].filter(Boolean);

  for (const url of urls) {
    try {
      const path = decodeURIComponent(url.split("/o/")[1].split("?")[0]);
      await deleteObject(ref(storage, path));
    } catch {}
  }

  await updateDoc(doc(db, "posts", post.id), { deleted: true }).catch(() =>
    deleteDoc(doc(db, "posts", post.id))
  );
}

export async function getSellerPosts(uid) {
  if (!db || !uid) return [];

  const postsRef = collection(db, "posts");
  const snaps = [];

  const userSnap = await getDocs(query(postsRef, where("userId", "==", uid)));
  userSnap.forEach(d => snaps.push({ id: d.id, ...d.data() }));

  const bizSnap = await getDocs(query(postsRef, where("businessId", "==", uid)));
  bizSnap.forEach(d => {
    if (!snaps.find(x => x.id === d.id)) snaps.push({ id: d.id, ...d.data() });
  });

  return snaps;
}

export async function toggleSavePost({ uid, postId }) {
  const refUser = doc(db, "users", uid);
  const snap = await getDoc(refUser);
  if (!snap.exists()) return false;

  const saved = snap.data().savedPosts || {};
  saved[postId] ? delete saved[postId] : saved[postId] = true;

  await updateDoc(refUser, { savedPosts: saved });
  return !!saved[postId];
}

/* ============================================================
   USERS
============================================================ */

export async function getUser(uid) {
  if (!db || !uid) return null;
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { uid, ...snap.data() } : null;
}

export async function updateUser(uid, data) {
  if (!db || !uid || !data) return;
  await updateDoc(doc(db, "users", uid), data);
}

export async function toggleFollowSeller(userUid, sellerUid, actuallyToggle = true) {
  const sellerRef = doc(db, "users", sellerUid);
  const snap = await getDoc(sellerRef);
  if (!snap.exists()) return false;

  const followers = snap.data().followers || {};
  const isFollowing = !!followers[userUid];

  if (actuallyToggle) {
    isFollowing ? delete followers[userUid] : followers[userUid] = true;
    await updateDoc(sellerRef, { followers });
  }

  return !isFollowing;
}

/* ============================================================
   LEADS / CONTACT COUNTERS (DEDUPED)
============================================================ */

const DEDUPE_MINUTES = 5;

export async function trackContactClick({
  postId,
  sellerUid,
  viewerUid,
  type // "call" | "whatsapp"
}) {
  if (!db || !postId || !sellerUid || !viewerUid || !type) return;

  // ⏱️ Deduplication window
  const since = Timestamp.fromMillis(Date.now() - DEDUPE_MINUTES * 60 * 1000);

  const q = query(
    collection(db, "leads"),
    where("postId", "==", postId),
    where("viewerUid", "==", viewerUid),
    where("type", "==", type),
    where("createdAt", ">", since)
  );

  const snap = await getDocs(q);
  if (!snap.empty) return; // ❌ already counted

  // ✅ Record lead (truth)
  await addDoc(collection(db, "leads"), {
    postId,
    sellerUid,
    viewerUid,
    type,
    createdAt: serverTimestamp()
  });

  // ✅ Update cached post counters
  const postRef = doc(db, "posts", postId);

  const updates = {
    "stats.contacts": increment(1)
  };

  if (type === "call") updates["stats.calls"] = increment(1);
  if (type === "whatsapp") updates["stats.whatsapp"] = increment(1);

  await updateDoc(postRef, updates);
}

/* ============================================================
   STORAGE
============================================================ */

export async function uploadAvatar(uid, file, type = "user") {
  if (!storage || !file || !uid) return null;

  const path = type === "user"
    ? `avatars/${uid}.jpg`
    : `business-avatars/${uid}.jpg`;

  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);

  const url = await getDownloadURL(storageRef);
  await updateDoc(doc(db, type === "user" ? "users" : "businesses", uid), {
    avatarUrl: url
  });

  return url;
}

export async function uploadPostImage(file, uid) {
  if (!storage || !file || !uid) return null;
  const refPath = ref(storage, `posts/${uid}/${Date.now()}-${file.name}`);
  await uploadBytes(refPath, file);
  return await getDownloadURL(refPath);
}

/* ============================================================
   CONVERSATIONS
============================================================ */

export function onUserConversations(userId, cb) {
  if (!db || !userId) return () => {};
  const q = query(
    collection(db, "conversations"),
    where("participants", "array-contains", userId),
    orderBy("updatedAt", "desc")
  );
  return onSnapshot(q, cb);
}

export function onConversationMessages(convoId, cb) {
  if (!db || !convoId) return () => {};
  return onSnapshot(
    query(collection(db, "conversations", convoId, "messages"), orderBy("createdAt")),
    cb
  );
}

export async function sendMessage(convoId, senderId, text) {
  if (!db || !convoId || !senderId || !text) return;

  const now = Date.now();
  await addDoc(collection(db, "conversations", convoId, "messages"), {
    senderId,
    text,
    createdAt: now,
    seen: false
  });

  await setDoc(
    doc(db, "conversations", convoId),
    { lastMessage: text, lastMessageSender: senderId, updatedAt: now },
    { merge: true }
  );

/* ============================================================
   SERVICES
============================================================ */

/**
 * Get ALL active services (for directory load)
 */
export async function fsGetAllServices() {
  if (!db) return [];

  const q = query(
    collection(db, "services"),
    where("isActive", "==", true),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Search services by name, category, or description
 */
export async function fsSearchServices(term) {
  if (!db || !term) return [];

  const q = query(
    collection(db, "services"),
    where("isActive", "==", true)
  );

  const snap = await getDocs(q);

  const lower = term.toLowerCase();

  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(svc =>
      (svc.businessName || "").toLowerCase().includes(lower) ||
      (svc.category || "").toLowerCase().includes(lower) ||
      (svc.description || "").toLowerCase().includes(lower)
    );
}

/**
 * Filter services by category
 */
export async function fsFilterServices(category) {
  if (!db || !category) return [];

  const q = query(
    collection(db, "services"),
    where("isActive", "==", true),
    where("category", "==", category)
  );

  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Get a single service by ID
 */
export async function fsGetServiceById(serviceId) {
  if (!db || !serviceId) return null;

  const snap = await getDoc(doc(db, "services", serviceId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Report a service listing
 */
export async function fsReportService(serviceId, reason) {
  if (!db || !serviceId || !reason) return;

  await addDoc(collection(db, "serviceReports"), {
    serviceId,
    reason,
    reporterUid: auth?.currentUser?.uid || null,
    createdAt: serverTimestamp()
  });
}

