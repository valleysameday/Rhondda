// views/dashboard/messages/renderMessages.js

import { loadUserConversations } from "./loadMessages.js";
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  orderBy, 
  getDocs,
  deleteDoc
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

      document.getElementById("messagesContainer").style.display = "none";
      document.getElementById("chatWindow").style.display = "flex";

      loadChat(convoId, auth, db);
    });
  });

  // 3️⃣ Back button
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

  // 1️⃣ Load conversation doc
  const convoSnap = await getDoc(doc(db, "conversations", convoId));
  const convo = convoSnap.data();

  // 2️⃣ Work out the OTHER user
  const [userA, userB] = convo.participants;
  const otherUserId = auth.currentUser.uid === userA ? userB : userA;

  // 3️⃣ Load the other user's name
  let otherName = "User";
  try {
    const otherSnap = await getDoc(doc(db, "users", otherUserId));
    if (otherSnap.exists()) {
      otherName = otherSnap.data().name || "User";
    }
  } catch (e) {
    console.warn("Failed to load other user:", e);
  }

  // 4️⃣ Load the ad being discussed
  let ad = null;
  try {
    const adSnap = await getDoc(doc(db, "posts", convo.postId));
    if (adSnap.exists()) {
      ad = adSnap.data();
    }
  } catch (e) {
    console.warn("Failed to load ad:", e);
  }

  // 5️⃣ Insert ad preview card
  if (ad) {
    const adCard = `
      <div class="chat-ad-card" onclick="window.open('/post.html?id=${convo.postId}', '_blank')">
        <img src="${ad.imageUrl}" class="chat-ad-thumb" />
        <div class="chat-ad-info">
          <div class="chat-ad-title">${truncate(ad.title, 40)}</div>
          <div class="chat-ad-price">£${ad.price}</div>
          <div class="chat-ad-area">${ad.area || ""}</div>
        </div>
      </div>
    `;
    chatBox.innerHTML = adCard;
  }

  // 6️⃣ Load messages
  const messagesRef = collection(db, "conversations", convoId, "messages");
  const q = query(messagesRef, orderBy("createdAt", "asc"));

  const snap = await getDocs(q);

  snap.forEach(docSnap => {
    const msg = docSnap.data();
    const msgId = docSnap.id;
    const isMe = msg.senderId === auth.currentUser.uid;

    const senderName = isMe ? "You" : otherName;

    chatBox.innerHTML += `
      <div class="chat-message ${isMe ? "me" : "them"}">
        <div class="chat-name">${senderName}</div>

        <div class="chat-bubble-wrapper">
          <div class="chat-bubble ${isMe ? "me" : "them"}">
            ${msg.text}
          </div>

          ${isMe ? `
            <button class="delete-msg-btn" data-id="${msgId}" data-convo="${convoId}">
              🗑️
            </button>
          ` : ""}
        </div>
      </div>
    `;
  });

  // 7️⃣ Auto-scroll
  chatBox.scrollTop = chatBox.scrollHeight;

  // 8️⃣ Attach delete handlers
  document.querySelectorAll(".delete-msg-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const msgId = btn.dataset.id;
      const convoId = btn.dataset.convo;

      await deleteDoc(doc(db, "conversations", convoId, "messages", msgId));

      loadChat(convoId, auth, db); // refresh chat
    });
  });
}

/* ============================================================
   Helper: truncate long ad titles
============================================================ */
function truncate(str, max) {
  return str.length > max ? str.substring(0, max) + "…" : str;
}
