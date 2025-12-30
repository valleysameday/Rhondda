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
let unsubscribeMessages = null;

export async function init({ auth: a, db: d }) {
  auth = a;
  db = d;

  const user = auth.currentUser;
  if (!user) return loadView("home");

  const convoId = sessionStorage.getItem("activeConversationId");
  if (!convoId) return loadView("chat-list");

  const chatMessages = document.getElementById("chatMessages");
  const chatInput = document.getElementById("chatInput");
  const sendBtn = document.getElementById("chatSendBtn");
  const backBtn = document.getElementById("chatBackBtn");
  const headerName = document.getElementById("chatHeaderName");

  const adPreview = document.getElementById("chatAdPreview");
  const adImage = document.getElementById("chatAdImage");
  const adTitle = document.getElementById("chatAdTitle");
  const adPrice = document.getElementById("chatAdPrice");

  chatMessages.innerHTML = "";
  chatInput.value = "";
  adPreview.style.display = "none";

  const parts = convoId.split("_");
  if (parts.length !== 3) {
    sessionStorage.removeItem("activeConversationId");
    return loadView("chat-list");
  }

  const [userA, userB, postId] = parts;
  const otherUserId = user.uid === userA ? userB : userA;

  const otherSnap = await getDoc(doc(db, "users", otherUserId));
  headerName.textContent = otherSnap.exists() ? (otherSnap.data().name || "Chat") : "Chat";

  try {
    const postSnap = await getDoc(doc(db, "posts", postId));
    if (postSnap.exists()) {
      const post = postSnap.data();
      adPreview.style.display = "flex";
      adImage.src = post.images?.[0] || "/images/image-webholder.webp";
      adTitle.textContent = post.title || "Item";
      adPrice.textContent = post.price ? `£${post.price}` : "No price";
      adPreview.onclick = () => {
        sessionStorage.setItem("viewPostId", postId);
        loadView("view-post", { forceInit: true });
      };
    }
  } catch (err) {
    console.error("Error loading post preview:", err);
  }

  if (unsubscribeMessages) unsubscribeMessages();

  const messagesRef = collection(db, "conversations", convoId, "messages");
  const messagesQuery = query(messagesRef, orderBy("createdAt"));

  unsubscribeMessages = onSnapshot(messagesQuery, snap => {
    chatMessages.innerHTML = "";
    snap.forEach(docSnap => {
      const msg = docSnap.data();
      const bubble = document.createElement("div");
      bubble.className = msg.senderId === user.uid ? "chat-bubble me" : "chat-bubble them";

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

  sendBtn.onclick = async () => {
    const text = chatInput.value.trim();
    if (!text) return;

    const now = Date.now();
    await addDoc(messagesRef, {
      senderId: user.uid,
      text,
      createdAt: now,
      seen: false
    });

    await setDoc(
      doc(db, "conversations", convoId),
      {
        lastMessage: text,
        lastMessageSender: user.uid,
        updatedAt: now
      },
      { merge: true }
    );

    chatInput.value = "";
  };

  backBtn.onclick = () => {
    if (unsubscribeMessages) unsubscribeMessages();
    loadView("chat-list", { forceInit: true });
  };
}   // ← FIXED: closes init()

function timeAgo(timestamp) {
  if (!timestamp) return "";
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
