import {
  doc,
  getDoc,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { loadView } from "/index/js/main.js";

let auth, db;

export async function init({ auth: a, db: d }) {
  auth = a;
  db = d;

  const convoId = sessionStorage.getItem("activeConversationId");
  if (!convoId) return loadView("home");

  const chatMessages = document.getElementById("chatMessages");
  const chatInput = document.getElementById("chatInput");
  const sendBtn = document.getElementById("chatSendBtn");
  const backBtn = document.getElementById("chatBackBtn");
  const headerName = document.getElementById("chatHeaderName");

  const [userA, userB] = convoId.split("_");
  const otherUserId = auth.currentUser.uid === userA ? userB : userA;

  // Load other user's name
  const otherSnap = await getDoc(doc(db, "users", otherUserId));
  if (otherSnap.exists()) {
    headerName.textContent = otherSnap.data().name || "Chat";
  }

  // Real-time messages
  const messagesRef = collection(db, "conversations", convoId, "messages");
  const messagesQuery = query(messagesRef, orderBy("createdAt"));

  onSnapshot(messagesQuery, (snap) => {
    chatMessages.innerHTML = "";

    snap.forEach(docSnap => {
      const msg = docSnap.data();

      const bubble = document.createElement("div");
      bubble.className = msg.senderId === auth.currentUser.uid
        ? "chat-bubble me"
        : "chat-bubble them";

      bubble.textContent = msg.text;
      chatMessages.appendChild(bubble);
    });

    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  // Send message
  sendBtn.onclick = async () => {
    const text = chatInput.value.trim();
    if (!text) return;

    await addDoc(messagesRef, {
  senderId: auth.currentUser.uid,
  text,
  createdAt: Date.now()
});

// Update conversation metadata
await setDoc(doc(db, "conversations", convoId), {
  lastMessage: text,
  lastMessageSender: auth.currentUser.uid,
  updatedAt: Date.now()
}, { merge: true });

    chatInput.value = "";
  };

// Back button
backBtn.onclick = () => {
  const user = auth.currentUser;
  if (!user) return loadView("home");

  loadView("chat-list");
};
}
