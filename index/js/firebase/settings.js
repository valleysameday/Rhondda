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
