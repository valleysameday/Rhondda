// renderMessages.js
import { loadUserConversations } from "./loadMessages.js";
import { loadLatestMessage } from "./loadLatestMessage.js";

export async function renderMessages(auth, db) {
  const container = document.getElementById("messagesContainer");
  container.innerHTML = "";

  const conversations = await loadUserConversations(auth, db);

  if (!conversations.length) {
    container.innerHTML = `<div class="empty-state">No messages yet.</div>`;
    return;
  }

  for (const convo of conversations) {
    const latest = await loadLatestMessage(db, convo.id);

    container.innerHTML += `
      <div class="message-card">
        <div class="message-avatar">👤</div>
        <div class="message-body">
          <div class="message-from">${convo.postId}</div>
          <div class="message-preview">${latest?.text || "No messages yet"}</div>
          <div class="message-time">${new Date(convo.updatedAt).toLocaleString()}</div>
        </div>
      </div>
    `;
  }
}
