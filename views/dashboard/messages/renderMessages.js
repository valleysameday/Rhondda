// views/dashboard/messages/renderMessages.js

import { loadUserConversations } from "./loadMessages.js";
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  orderBy, 
  getDocs 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export async function renderMessages(auth, db) {
  const container = document.getElementById("messagesContainer");
  container.innerHTML = "";

  const user = auth.currentUser;
  const conversations = await loadUserConversations(auth, db);

  if (!conversations.length) {
    container.innerHTML = `<div class="empty-state">No messages yet.</div>`;
    return;
  }

  // 1️⃣ Render inbox cards
  for (const convo of conversations) {
    const [userA, userB] = convo.participants;
    const otherUserId = user.uid === userA ? userB : userA;

    let otherName = "User";
    try {
      const snap = await getDoc(doc(db, "users", otherUserId));
      if (snap.exists()) {
        otherName = snap.data().name || "User";
      }
    } catch (e) {
      console.warn("Failed to load user:", otherUserId, e);
    }

    const preview = convo.lastMessage || "No messages yet";
    const time = convo.updatedAt
      ? new Date(convo.updatedAt).toLocaleString()
      : "";

    container.innerHTML += `
      <div class="message-card message-row" data-convo="${convo.id}">
        <div class="message-avatar">👤</div>

        <div class="message-main">
          <div class="message-from">${otherName}</div>
          <div class="message-preview">${preview}</div>
        </div>

        <div class="message-meta">
          <div class="message-time">${time}</div>
        </div>
      </div>
    `;
  }

  // 2️⃣ Attach click handlers AFTER rendering
  document.querySelectorAll(".message-card").forEach(card => {
    card.addEventListener("click", () => {
      const convoId = card.dataset.convo;

      // Hide inbox, show chat window
      document.getElementById("messagesContainer").style.display = "none";
      document.getElementById("chatWindow").style.display = "flex";

      loadChat(convoId, auth, db);
    });
  });

  // 3️⃣ Back button (wired once)
  const backBtn = document.getElementById("backToInbox");
  if (backBtn) {
    backBtn.onclick = () => {
      document.getElementById("chatWindow").style.display = "none";
      document.getElementById("messagesContainer").style.display = "flex";
    };
  }
}

/* ============================================================
   CHAT LOADER — loads full messages ONLY when convo clicked
============================================================ */
async function loadChat(convoId, auth, db) {
  const chatBox = document.getElementById("chatMessages");
  chatBox.innerHTML = "";

  const messagesRef = collection(db, "conversations", convoId, "messages");
  const q = query(messagesRef, orderBy("createdAt", "asc"));

  const snap = await getDocs(q);

  snap.forEach(doc => {
  const msg = doc.data();
  const isMe = msg.senderId === auth.currentUser.uid;

  const senderName = isMe ? "You" : otherName;

  chatBox.innerHTML += `
    <div class="chat-message ${isMe ? "me" : "them"}">
      <div class="chat-name">${senderName}</div>
      <div class="chat-bubble ${isMe ? "me" : "them"}">
        ${msg.text}
      </div>
    </div>
  `;
});

  // Auto-scroll to bottom
  chatBox.scrollTop = chatBox.scrollHeight;
}
