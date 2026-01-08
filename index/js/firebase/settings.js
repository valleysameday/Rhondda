// ============================================
//  FIRESTORE HELPERS (CLEAN, OPTIMIZED & LOGGED)
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
  console.log("🔥 initFirebase called");

  auth = a;
  db = d;
  storage = s;

  console.log("✅ Firebase injected", {
    auth: !!auth,
    db: !!db,
    storage: !!storage
  });
}

/* ============================================================
   POSTS
============================================================ */

export async function fetchFeedPosts({ lastDoc = null, limitCount = 50 } = {}) {
  console.log("📥 fetchFeedPosts()", { lastDoc, limitCount });

  const postsRef = collection(db, "posts");
  const q = lastDoc
    ? query(postsRef, orderBy("createdAt", "desc"), startAfter(lastDoc), limit(limitCount))
    : query(postsRef, orderBy("createdAt", "desc"), limit(limitCount));

  const snap = await getDocs(q);

  console.log(`✅ ${snap.docs.length} posts loaded`);

  return {
    posts: snap.docs.map(d => ({ id: d.id, ...d.data() })),
    lastDoc: snap.docs[snap.docs.length - 1] || null
  };
}

export async function getPost(postId) {
  console.log("📄 getPost()", postId);

  if (!db || !postId) return null;
  const snap = await getDoc(doc(db, "posts", postId));

  if (!snap.exists()) {
    console.warn("⚠️ Post not found", postId);
    return null;
  }

  return { id: snap.id, ...snap.data() };
}

export async function addPost(post) {
  console.log("➕ addPost()", post);
  return await addDoc(collection(db, "posts"), post);
}

export async function updatePost(postId, data) {
  console.log("✏️ updatePost()", postId, data);

  if (!db || !postId || !data) return;
  await updateDoc(doc(db, "posts", postId), data);
}

export async function deletePost(post) {
  console.log("🗑 deletePost()", post?.id);

  if (!db || !storage || !post?.id) return;

  const urls = [
    post.imageUrl,
    ...(Array.isArray(post.imageUrls) ? post.imageUrls : [])
  ].filter(Boolean);

  for (const url of urls) {
    try {
      const path = decodeURIComponent(url.split("/o/")[1].split("?")[0]);
      console.log("🧹 deleting storage file:", path);
      await deleteObject(ref(storage, path));
    } catch (err) {
      console.warn("⚠️ Failed deleting image", err);
    }
  }

  await updateDoc(doc(db, "posts", post.id), { deleted: true }).catch(() =>
    deleteDoc(doc(db, "posts", post.id))
  );
}

export async function getSellerPosts(uid) {
  console.log("📦 getSellerPosts()", uid);

  if (!db || !uid) return [];

  const postsRef = collection(db, "posts");
  const snaps = [];

  const userSnap = await getDocs(query(postsRef, where("userId", "==", uid)));
  userSnap.forEach(d => snaps.push({ id: d.id, ...d.data() }));

  const bizSnap = await getDocs(query(postsRef, where("businessId", "==", uid)));
  bizSnap.forEach(d => {
    if (!snaps.find(x => x.id === d.id)) snaps.push({ id: d.id, ...d.data() });
  });

  console.log(`✅ ${snaps.length} seller posts found`);
  return snaps;
}

export async function toggleSavePost({ uid, postId }) {
  console.log("⭐ toggleSavePost()", { uid, postId });

  const refUser = doc(db, "users", uid);
  const snap = await getDoc(refUser);
  if (!snap.exists()) return false;

  const saved = snap.data().savedPosts || {};
  saved[postId] ? delete saved[postId] : saved[postId] = true;

  await updateDoc(refUser, { savedPosts: saved });

  console.log("✅ savedPosts updated");
  return !!saved[postId];
}

/* ============================================================
   USERS
============================================================ */

export async function getUser(uid) {
  console.log("👤 getUser()", uid);

  if (!db || !uid) return null;
  const snap = await getDoc(doc(db, "users", uid));

  return snap.exists() ? { uid, ...snap.data() } : null;
}

export async function updateUser(uid, data) {
  console.log("✏️ updateUser()", uid, data);

  if (!db || !uid || !data) return;
  await updateDoc(doc(db, "users", uid), data);
}

export async function toggleFollowSeller(userUid, sellerUid, actuallyToggle = true) {
  console.log("➕ toggleFollowSeller()", { userUid, sellerUid });

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
   LEADS / CONTACT COUNTERS
============================================================ */

const DEDUPE_MINUTES = 5;

export async function trackContactClick({ postId, sellerUid, viewerUid, type }) {
  console.log("📞 trackContactClick()", { postId, sellerUid, viewerUid, type });

  if (!db || !postId || !sellerUid || !viewerUid || !type) return;

  const since = Timestamp.fromMillis(Date.now() - DEDUPE_MINUTES * 60 * 1000);

  const q = query(
    collection(db, "leads"),
    where("postId", "==", postId),
    where("viewerUid", "==", viewerUid),
    where("type", "==", type),
    where("createdAt", ">", since)
  );

  const snap = await getDocs(q);
  if (!snap.empty) {
    console.log("⛔ Duplicate lead ignored");
    return;
  }

  await addDoc(collection(db, "leads"), {
    postId,
    sellerUid,
    viewerUid,
    type,
    createdAt: serverTimestamp()
  });

  await updateDoc(doc(db, "posts", postId), {
    "stats.contacts": increment(1),
    ...(type === "call" && { "stats.calls": increment(1) }),
    ...(type === "whatsapp" && { "stats.whatsapp": increment(1) })
  });

  console.log("✅ Lead recorded");
}

/* ============================================================
   STORAGE
============================================================ */

export async function uploadAvatar(uid, file, type = "user") {
  console.log("🖼 uploadAvatar()", uid);

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

  console.log("✅ Avatar uploaded");
  return url;
}

export async function uploadPostImage(file, uid) {
  console.log("🖼 uploadPostImage()", uid);

  if (!storage || !file || !uid) return null;

  const refPath = ref(storage, `posts/${uid}/${Date.now()}-${file.name}`);
  await uploadBytes(refPath, file);

  const url = await getDownloadURL(refPath);
  console.log("✅ Post image uploaded");

  return url;
}

/* ============================================================
   CONVERSATIONS
============================================================ */

export function onUserConversations(userId, cb) {
  console.log("💬 onUserConversations()", userId);

  if (!db || !userId) return () => {};
  const q = query(
    collection(db, "conversations"),
    where("participants", "array-contains", userId),
    orderBy("updatedAt", "desc")
  );
  return onSnapshot(q, cb);
}

export function onConversationMessages(convoId, cb) {
  console.log("📨 onConversationMessages()", convoId);

  if (!db || !convoId) return () => {};
  return onSnapshot(
    query(collection(db, "conversations", convoId, "messages"), orderBy("createdAt")),
    cb
  );
}

export async function sendMessage(convoId, senderId, text) {
  console.log("✉️ sendMessage()", { convoId, senderId });

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

  console.log("✅ Message sent");
}

/* ============================================================
   SERVICES
============================================================ */

export async function fsGetAllServices() {
  console.log("🛠 fsGetAllServices()");
  const snap = await getDocs(query(
    collection(db, "services"),
    where("isActive", "==", true),
    orderBy("createdAt", "desc")
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fsSearchServices(term) {
  console.log("🔍 fsSearchServices()", term);

  if (!term) return [];
  const snap = await getDocs(query(
    collection(db, "services"),
    where("isActive", "==", true)
  ));

  const lower = term.toLowerCase();
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(s =>
      (s.businessName || "").toLowerCase().includes(lower) ||
      (s.category || "").toLowerCase().includes(lower) ||
      (s.description || "").toLowerCase().includes(lower)
    );
}

export async function fsFilterServices(category) {
  console.log("🏷 fsFilterServices()", category);

  if (!category) return [];
  const snap = await getDocs(query(
    collection(db, "services"),
    where("isActive", "==", true),
    where("category", "==", category)
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fsGetServiceById(serviceId) {
  console.log("📄 fsGetServiceById()", serviceId);

  const snap = await getDoc(doc(db, "services", serviceId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function fsReportService(serviceId, reason) {
  console.log("🚨 fsReportService()", serviceId, reason);

  await addDoc(collection(db, "serviceReports"), {
    serviceId,
    reason,
    reporterUid: auth?.currentUser?.uid || null,
    createdAt: serverTimestamp()
  });
}
export async function fsGetUserServices(uid) {
  console.log("👔 fsGetUserServices()", uid);

  if (!db || !uid) return [];

  const q = query(
    collection(db, "services"),
    where("ownerUid", "==", uid),
    where("isActive", "==", true)
  );

  const snap = await getDocs(q);

  console.log(`📦 ${snap.docs.length} services found for user`);

  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
