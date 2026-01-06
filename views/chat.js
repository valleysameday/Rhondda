import { loadView } from "/index/js/main.js";
import { getUser, getPost, onConversationMessages, sendMessage } from "/index/js/firebase/settings.js";

let unsubscribeMessages = null;

export async function init({ auth }) {
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
  const otherSnap = await getUser(otherUserId);
  headerName.textContent = otherSnap ? (otherSnap.name || "Seller") : "Chat";

  /* ---------------- 2026 BUNDLE LOGIC ---------------- */
  if (postId === "bundle") {
    adPreview.style.display = "flex";
    adImage.src = "/images/bundle-icon.webp";
    adTitle.textContent = "Multi-Item Bundle";
    adPrice.textContent = "Negotiable";
    bundleNote.style.display = "block";
    bundleNote.textContent = "Inquiry includes multiple items";
  } else {
    const postSnap = await getPost(postId);
    if (postSnap) {
      adPreview.style.display = "flex";
      adImage.src = postSnap.imageUrl || postSnap.images?.[0] || "/images/image-webholder.webp";
      adTitle.textContent = postSnap.title || "Item";
      adPrice.textContent = postSnap.price ? `£${postSnap.price}` : "No price";
      adPreview.onclick = () => {
        sessionStorage.setItem("viewPostId", postId);
        loadView("view-post", { forceInit: true });
      };
    }
  }

  /* ---------------- AUTO-SEND PENDING MESSAGE ---------------- */
  const pending = sessionStorage.getItem("pendingMessage");
  if (pending) {
    sessionStorage.removeItem("pendingMessage");
    await sendMessage(convoId, user.uid, pending);
  }

  /* ---------------- MESSAGE LISTENER ---------------- */
  if (unsubscribeMessages) unsubscribeMessages();
  unsubscribeMessages = onConversationMessages(convoId, snap => {
    chatMessages.innerHTML = "";
    snap.forEach(docSnap => {
      const msg = docSnap.data();
      const bubble = document.createElement("div");
      bubble.className = msg.senderId === user.uid ? "chat-bubble me" : "chat-bubble them";
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

function timeAgo(t) {
  if (!t) return "";
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return Math.floor(s/60) + "m ago";
  if (s < 86400) return Math.floor(s/3600) + "h ago";
  return Math.floor(s/86400) + "d ago";
}
