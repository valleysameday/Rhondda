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

  // ConvoId format: buyer_seller_postId
  const parts = convoId.split("_");
  if (parts.length !== 3) return loadView("chat-list");

  const [userA, userB, postId] = parts;
  const otherUserId = user.uid === userA ? userB : userA;

  // Load other user's info
  const otherSnap = await getDoc(doc(db, "users", otherUserId));
  headerName.textContent = otherSnap.exists() ? otherSnap.data().name : "Chat";

  // Load ad snippet
  const postSnap = await getDoc(doc(db, "posts", postId));
  if (postSnap.exists()) {
    const post = postSnap.data();
    adImage.src = post.images?.[0] || "/images/image-webholder.webp";
    adTitle.textContent = post.title || "Item";
    adPrice.textContent = post.price ? `£${post.price}` : "No price";

    adPreview.onclick = () => {
      sessionStorage.setItem("viewPostId", postId);
      loadView("view-post");
    };
  } else {
    adPreview.style.display = "none";
  }

  // Real-time messages
  const messagesRef = collection(db, "conversations", convoId, "messages");
  const messagesQuery = query(messagesRef, orderBy("createdAt"));

  onSnapshot(messagesQuery, (snap) => {
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

  // Send message
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

    // Update convo
    await setDoc(doc(db, "conversations", convoId), {
      lastMessage: text,
      lastMessageSender: user.uid,
      updatedAt: now
    }, { merge: true });

    chatInput.value = "";
  };

  // Back button works
  backBtn.onclick = () => loadView("chat-list");
}

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
