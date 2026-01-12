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
   POSTS (WITH CATEGORY FILTERING)
============================================================ */

export async function fetchFeedPosts({
  lastDoc = null,
  limitCount = 50,
  category = "all"
} = {}) {
  console.log("📥 fetchFeedPosts()", { lastDoc, limitCount, category });
  const postsRef = collection(db, "posts");
  let q;

  // ============================
  // CATEGORY-AWARE QUERY
  // ============================
  if (category === "all") {
    q = lastDoc
      ? query(
          postsRef,
          where("status", "==", "active"),
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          limit(limitCount)
        )
      : query(
          postsRef,
          where("status", "==", "active"),
          orderBy("createdAt", "desc"),
          limit(limitCount)
        );
  } else {
    q = lastDoc
      ? query(
          postsRef,
          where("status", "==", "active"),
          where("category", "==", category),
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          limit(limitCount)
        )
      : query(
          postsRef,
          where("status", "==", "active"),
          where("category", "==", category),
          orderBy("createdAt", "desc"),
          limit(limitCount)
        );
  }

  // ============================
  // FETCH
  // ============================
  const snap = await getDocs(q);

  console.log(`✅ ${snap.docs.length} posts loaded for category: ${category}`);

  return {
    posts: snap.docs.map(d => ({ id: d.id, ...d.data() })),
    lastDoc: snap.docs[snap.docs.length - 1] || null
  };
}
 /* ============================================================
   ADD POST (RESTORED)
============================================================ */
export async function addPost(post) {
  return await addDoc(collection(db, "posts"), {
    ...post,
    status: "active",
    createdAt: Date.now(),
    views: 0,
    stats: { contacts: 0, calls: 0, whatsapp: 0 }
  });
} 
/* ============================================================
   GET SINGLE POST
============================================================ */
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
/* ============================================================
   RENEW & UNPUBLISH POSTS
============================================================ */

export async function renewPost(postId) {
  if (!db || !postId) return;
  await updateDoc(doc(db, "posts", postId), {
    createdAt: Date.now(),
    status: "active"
  });
}

export async function unpublishPost(postId) {
  if (!db || !postId) return;
  await updateDoc(doc(db, "posts", postId), {
    status: "expired"
  });
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

  await updateDoc(doc(db, "posts", post.id), { deleted: true })
    .catch(() => deleteDoc(doc(db, "posts", post.id)));
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
   LEADS / CONTACT COUNTERS (CHEAP & SAFE)
============================================================ */

const DEDUPE_MINUTES = 5;

export async function trackContactClick({ postId, sellerUid, viewerUid, type }) {
  if (!db || !postId || !sellerUid || !viewerUid || !type) return;

  // Prevent seller clicking own ad
  if (viewerUid === sellerUid) return;

  // Cheap dedupe using localStorage
  const key = `lead:${postId}:${viewerUid}:${type}`;
  const last = Number(localStorage.getItem(key));
  if (last && Date.now() - last < DEDUPE_MINUTES * 60 * 1000) return;
  localStorage.setItem(key, Date.now());

  // Create lead
  await addDoc(collection(db, "leads"), {
    postId,
    sellerUid,
    viewerUid,
    type,
    createdAt: serverTimestamp()
  });

  // Increment stats
  await updateDoc(doc(db, "posts", postId), {
    stats: {
      contacts: increment(1),
      ...(type === "call" && { calls: increment(1) }),
      ...(type === "whatsapp" && { whatsapp: increment(1) })
    }
  });
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
  return onSnapshot(
    query(
      collection(db, "conversations"),
      where("participants", "array-contains", userId),
      orderBy("updatedAt", "desc")
    ),
    cb
  );
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
}

/* ============================================================
   SERVICES
============================================================ */

export async function fsGetAllServices() {
  const snap = await getDocs(query(
    collection(db, "services"),
    where("isActive", "==", true),
    orderBy("createdAt", "desc")
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fsSearchServices(term) {
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
  if (!category) return [];
  const snap = await getDocs(query(
    collection(db, "services"),
    where("isActive", "==", true),
    where("category", "==", category)
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fsGetServiceById(serviceId) {
  const snap = await getDoc(doc(db, "services", serviceId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function fsReportService(serviceId, reason) {
  await addDoc(collection(db, "serviceReports"), {
    serviceId,
    reason,
    reporterUid: auth?.currentUser?.uid || null,
    createdAt: serverTimestamp()
  });
}

export async function fsGetUserServices(uid) {
  if (!db || !uid) return [];
  const q = query(
    collection(db, "services"),
    where("ownerUid", "==", uid),
    where("isActive", "==", true)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fsAddService(data) {
  if (!db || !data) return null;
  const docRef = await addDoc(collection(db, "services"), {
    ...data,
    createdAt: Date.now(),
    isActive: true
  });
  return docRef.id;
}

export async function fsUpdateService(serviceId, data) {
  if (!db || !serviceId || !data) return false;
  await updateDoc(doc(db, "services", serviceId), data);
  return true;
}

export async function fsDeleteService(serviceId) {
  if (!db || !serviceId) return false;
  await updateDoc(doc(db, "services", serviceId), {
    isActive: false,
    deletedAt: Date.now()
  });
  return true;
}

export async function fsUploadServiceImage(serviceId, file, index = 0) {
  if (!storage || !file || !serviceId) return null;
  const path = `services/${serviceId}/photo-${index}.jpg`;
  const refPath = ref(storage, path);
  await uploadBytes(refPath, file);
  return await getDownloadURL(refPath);
    }
