import { signOut } from
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
  doc, getDoc, updateDoc,
  collection, query, where, getDocs, deleteDoc, onSnapshot
} from
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import {
  ref, uploadBytes, getDownloadURL, deleteObject
} from
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

import { renderPostsAndStats } from '/index/js/dashboard/posts.js';
import { loadView } from '/index/js/main.js';

let auth, db, storage;

export async function init({ auth: a, db: d, storage: s }) {
  auth = a;
  db = d;
  storage = s;

  if (!auth || !db) return;

  const user = auth.currentUser;
  if (!user) return loadView("home");

  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists() || !snap.data().isBusiness) {
    return loadView("general-dashboard");
  }

  const data = snap.data();

  // ⭐ Load global settings (for premium toggle)
  let premiumEnabled = false;
  try {
    const settingsSnap = await getDoc(doc(db, "settings", "global"));
    premiumEnabled = settingsSnap.exists() && settingsSnap.data().businessPremiumEnabled === true;
  } catch (e) {
    console.warn("No global settings doc yet, premium disabled by default.");
  }

  const plan = data.plan || "free"; // "free" or "premium"

  document.getElementById("bizHeaderName").textContent =
    data.name || "Your Business";

  document.getElementById("bizHeaderTagline").textContent =
    data.name
      ? "Manage your ads, brand, and customers"
      : "Set up your business profile";

  document.getElementById("bizViewName").textContent = data.name || "Add name";
  document.getElementById("bizViewPhone").textContent = data.phone || "Add phone";
  document.getElementById("bizViewArea").textContent = data.area || "Add area";
  document.getElementById("bizViewWebsite").textContent = data.website || "Add website";
  document.getElementById("bizViewBio").textContent = data.bio || "Add bio";

  if (data.avatarUrl) {
    const avatarEl = document.getElementById("bizDashboardAvatar");
    if (avatarEl) {
      avatarEl.style.backgroundImage = `url('${data.avatarUrl}')`;
    }
  }

  // ⭐ Plan tag on button
  const planTag = document.getElementById("bizPlanTag");
  if (premiumEnabled) {
    if (plan === "premium") {
      planTag.textContent = "Premium";
      planTag.style.background = "#16a34a";
    } else {
      planTag.textContent = "Upgrade available";
      planTag.style.background = "#f97316";
    }
  } else {
    planTag.textContent = "Business";
    planTag.style.background = "#007bff";
  }

  const postsSnap = await getDocs(
    query(collection(db, "posts"), where("userId", "==", user.uid))
  );

  const stats = renderPostsAndStats(
    "bizPosts",
    postsSnap,
    id => {
      window.editingPostId = id;
      loadView("editPost");
    },
    async id => {
      if (!confirm("Delete this ad?")) return;

      const pSnap = await getDoc(doc(db, "posts", id));
      const post = pSnap.data();

      const urls = post.imageUrls || (post.imageUrl ? [post.imageUrl] : []);
      for (const url of urls) {
        const path = decodeURIComponent(url.split("/o/")[1].split("?")[0]);
        await deleteObject(ref(storage, path));
      }

      await deleteDoc(doc(db, "posts", id));
      loadView("business-dashboard");
    }
  );

  document.getElementById("bizStatAdsCount").textContent = stats.adsCount;
  document.getElementById("bizStatTotalViews").textContent = stats.totalViews;
  document.getElementById("bizStatLeads").textContent = stats.totalLeads;

  // ============================================================
  // ⭐ LOAD FOLLOWERS COUNT
  // ============================================================
  loadMyFollowers(user.uid);

  async function loadMyFollowers(userId) {
    const snap = await getDocs(collection(db, "users", userId, "followers"));
    const count = snap.size;

    const el = document.getElementById("myFollowersCount");
    if (el) el.textContent = count;
  }

  // ============================================================
  // LOGOUT
  // ============================================================
  document.getElementById("bizLogoutBtn").onclick = async () => {
    document.getElementById("bizLogoutOverlay").style.display = "flex";
    await signOut(auth);
    window.location.href = "/";
  };

  // ============================================================
  // NEW POST BUTTON
  // ============================================================
  document.getElementById("bizNewPostBtn").onclick = () => {
    // If premium is required later, you can gate featured options here
    // For now, just open the normal post screen
    window.openScreen("post");
  };

  // ============================================================
  // ⭐ UNREAD MESSAGE BADGE LISTENER
  // ============================================================
  initUnreadMessageListener();

  function initUnreadMessageListener() {
    const badge = document.getElementById("messageBadge");
    if (!badge) return;

    const convosRef = collection(db, "conversations");
    const q = query(convosRef, where("participants", "array-contains", user.uid));

    onSnapshot(q, (snap) => {
      let hasUnread = false;

      snap.forEach(docSnap => {
        const convo = docSnap.data();

        if (convo.lastMessageSender && convo.lastMessageSender !== user.uid) {
          hasUnread = true;
        }
      });

      badge.style.display = hasUnread ? "block" : "none";
    });
  }
}
