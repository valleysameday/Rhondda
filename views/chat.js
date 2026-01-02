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
  const bundleNote = document.getElementById("bundleNote");

  chatMessages.innerHTML = "";
  chatInput.value = "";
  adPreview.style.display = "none";
  bundleNote.style.display = "none";

  const parts = convoId.split("_");
  if (parts.length !== 3) return loadView("chat-list");

  const [userA, userB, postId] = parts;
  const otherUserId = user.uid === userA ? userB : userA;

  // Set Header Name
  const otherSnap = await getDoc(doc(db, "users", otherUserId));
  headerName.textContent = otherSnap.exists() ? (otherSnap.data().name || "Seller") : "Chat";

  /* ---------------- 2026 BUNDLE LOGIC ---------------- */
  if (postId === "bundle") {
    adPreview.style.display = "flex";
    adImage.src = "/images/bundle-icon.webp"; // Provide a nice bundle icon
    adTitle.textContent = "Multi-Item Bundle";
    adPrice.textContent = "Negotiable";
    bundleNote.style.display = "block";
    bundleNote.textContent = "Inquiry includes multiple items";
  } else {
    // Standard Single Ad Preview
    try {
      const postSnap = await getDoc(doc(db, "posts", postId));
      if (postSnap.exists()) {
        const post = postSnap.data();
        adPreview.style.display = "flex";
        adImage.src = post.imageUrl || post.images?.[0] || "/images/image-webholder.webp";
        adTitle.textContent = post.title || "Item";
        adPrice.textContent = post.price ? `£${post.price}` : "No price";
        adPreview.onclick = () => {
          sessionStorage.setItem("viewPostId", postId);
          loadView("view-post", { forceInit: true });
        };
      }
    } catch (err) { console.error("Preview error:", err); }
  }

  /* ---------------- AUTO-SEND PENDING MESSAGE ---------------- */
  // This picks up the bundle text from the Profile Page
  const pending = sessionStorage.getItem("pendingMessage");
  if (pending) {
    sessionStorage.removeItem("pendingMessage");
    await sendMessage(convoId, user.uid, pending);
  }

  /* ---------------- MESSAGE LISTENER ---------------- */
  if (unsubscribeMessages) unsubscribeMessages();
  const messagesRef = collection(db, "conversations", convoId, "messages");
  const messagesQuery = query(messagesRef, orderBy("createdAt"));

  unsubscribeMessages = onSnapshot(messagesQuery, snap => {
    chatMessages.innerHTML = "";
    snap.forEach(docSnap => {
      const msg = docSnap.data();
      const bubble = document.createElement("div");
      bubble.className = msg.senderId === user.uid ? "chat-bubble me" : "chat-bubble them";
      
      // Preserve line breaks for Bundles
      bubble.innerHTML = `
        <p class="bubble-text" style="white-space: pre-wrap;">${msg.text}</p>
        <span class="bubble-time">${timeAgo(msg.createdAt)}</span>
      `;
      chatMessages.appendChild(bubble);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  sendBtn.onclick = () => {
    const text = chatInput.value.trim();
    if (text) {
        sendMessage(convoId, user.uid, text);
        chatInput.value = "";
    }
  };

  backBtn.onclick = () => {
    if (unsubscribeMessages) unsubscribeMessages();
    loadView("chat-list", { forceInit: true });
  };
}

async function sendMessage(convoId, senderId, text) {
  const now = Date.now();
  const messagesRef = collection(db, "conversations", convoId, "messages");
  
  await addDoc(messagesRef, {
    senderId,
    text,
    createdAt: now,
    seen: false
  });

  await setDoc(doc(db, "conversations", convoId), {
    lastMessage: text,
    lastMessageSender: senderId,
    updatedAt: now
  }, { merge: true });
}

function timeAgo(t) {
  if (!t) return "";
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return Math.floor(s/60) + "m ago";
  if (s < 86400) return Math.floor(s/3600) + "h ago";
  return Math.floor(s/86400) + "d ago";
}
