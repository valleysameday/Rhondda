// views/dashboard/messages/renderMessages.js

import { loadUserConversations } from "./loadMessages.js";
import { doc, getDoc } 
  from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export async function renderMessages(auth, db) {
  const container = document.getElementById("messagesContainer");
  container.innerHTML = "";

  const user = auth.currentUser;
  const conversations = await loadUserConversations(auth, db);

  if (!conversations.length) {
    container.innerHTML = `<div class="empty-state">No messages yet.</div>`;
    return;
  }

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
      <div class="message-card message-row">
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
}
