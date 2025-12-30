import {
  doc,
  getDoc,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { loadView } from "/index/js/main.js";

let auth, db;

export async function init({ auth: a, db: d }) {
  console.log("🔥 chat.js init() STARTED");

  auth = a;
  db = d;

  const user = auth.currentUser;
  console.log("👤 Current user:", user);

  if (!user) {
    console.warn("❌ No user logged in — redirecting to home");
    return loadView("home");
  }

  const convoId = sessionStorage.getItem("activeConversationId");
  console.log("💬 Loaded convoId:", convoId);

  if (!convoId) {
    console.warn("❌ No convoId found — redirecting to chat-list");
    return loadView("chat-list");
  }

  // DOM elements
  const chatMessages = document.getElementById("chatMessages");
  const chatInput = document.getElementById("chatInput");
  const sendBtn = document.getElementById("chatSendBtn");
  const backBtn = document.getElementById("chatBackBtn");
  const headerName = document.getElementById("chatHeaderName");

  const adPreview = document.getElementById("chatAdPreview");
  const adImage = document.getElementById("chatAdImage");
  const adTitle = document.getElementById("chatAdTitle");
  const adPrice = document.getElementById("chatAdPrice");

  console.log("📦 DOM Elements:", {
    chatMessages,
    chatInput,
    sendBtn,
    backBtn,
    headerName,
    adPreview
  });

  // Validate convoId format
  const parts = convoId.split("_");
  console.log("🔍 convoId parts:", parts);

  if (parts.length !== 3) {
    console.warn("❌ Invalid convoId format — resetting:", convoId);
    sessionStorage.removeItem("activeConversationId");
    return loadView("chat-list");
  }

  const [userA, userB, postId] = parts;
  const otherUserId = user.uid === userA ? userB : userA;

  console.log("👥 Chat participants:", { userA, userB, postId, otherUserId });

  // Load other user's info
  const otherSnap = await getDoc(doc(db, "users", otherUserId));
  console.log("📄 Other user snapshot:", otherSnap.exists());

  headerName.textContent = otherSnap.exists()
    ? (otherSnap.data().name || "Chat")
    : "Chat";

  // Load ad preview
  console.log("📦 Loading ad preview for postId:", postId);

  try {
    const postSnap = await getDoc(doc(db, "posts", postId));
    console.log("📄 Post snapshot exists:", postSnap.exists());

    if (postSnap.exists()) {
      const post = postSnap.data();
      console.log("🖼 Ad data:", post);

      adImage.src = post.images?.[0] || "/images/image-webholder.webp";
      adTitle.textContent = post.title || "Item";
      adPrice.textContent = post.price ? `£${post.price}` : "No price";

      adPreview.onclick = () => {
        console.log("🖼 Ad preview clicked — opening post:", postId);
        sessionStorage.setItem("viewPostId", postId);
        loadView("view-post");
      };
    } else {
      console.warn("⚠ No post found — hiding preview");
      adPreview.style.display = "none";
    }
  } catch (err) {
    console.error("❌ Error loading ad:", err);
    adPreview.style.display = "none";
  }

  // Real-time messages
  console.log("📡 Setting up message listener…");

  const messagesRef = collection(db, "conversations", convoId, "messages");
  const messagesQuery = query(messagesRef, orderBy("createdAt"));

  onSnapshot(messagesQuery, (snap) => {
    console.log("📨 Messages snapshot received:", snap.size);

    chatMessages.innerHTML = "";

    snap.forEach(docSnap => {
      const msg = docSnap.data();
      console.log("💬 Message:", msg);

      const bubble = document.createElement("div");
      bubble.className = msg.senderId === user.uid
        ? "chat-bubble me"
        : "chat-bubble them";

      const text = document.createElement("p");
      text.className = "bubble-text";
      text.textContent = msg.text;

      const time = document.createElement("span");
      time.className = "bubble-time";
      time.textContent = timeAgo(msg.createdAt);

      bubble.appendChild(text);
      bubble.appendChild(time);
      chatMessages.appendChild(bubble);
    });

    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  // Send message
  sendBtn.onclick = async () => {
    console.log("📤 Send button clicked");

    const text = chatInput.value.trim();
    console.log("📝 Message text:", text);

    if (!text) {
      console.warn("⚠ Empty message — ignoring");
      return;
    }

    const now = Date.now();

    await addDoc(messagesRef, {
      senderId: user.uid,
      text,
      createdAt: now,
      seen: false
    });

    console.log("📨 Message saved");

    await setDoc(
      doc(db, "conversations", convoId),
      {
        lastMessage: text,
        lastMessageSender: user.uid,
        updatedAt: now
      },
      { merge: true }
    );

    console.log("🗂 Conversation metadata updated");

    chatInput.value = "";
  };

  // BACK BUTTON
  console.log("🔙 Setting up back button…", backBtn);

  backBtn.onclick = () => {
    console.log("🔙 Back button clicked — loading chat-list");
    loadView("chat-list");
  };

  console.log("✅ chat.js init() FINISHED");
}

// Time ago formatter
function timeAgo(timestamp) {
  if (!timestamp) return "";
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
