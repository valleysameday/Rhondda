import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { loadView } from "/index/js/main.js";

let auth, db;

export async function init({ auth: a, db: d }) {
  auth = a;
  db = d;

  const user = auth.currentUser;
  if (!user) return loadView("home");

  const chatList = document.getElementById("chatList");

  const convosRef = collection(db, "conversations");
  const q = query(
    convosRef,
    where("participants", "array-contains", user.uid),
    orderBy("updatedAt", "desc")
  );

  onSnapshot(q, async (snap) => {
    chatList.innerHTML = "";

    if (snap.empty) {
      chatList.innerHTML = `<p class="chatlist-empty">No messages yet.</p>`;
      return;
    }

    for (const docSnap of snap.docs) {
      const convo = docSnap.data();
      const convoId = docSnap.id;

      const [u1, u2] = convo.participants;
      const otherId = user.uid === u1 ? u2 : u1;

      const otherSnap = await getDoc(doc(db, "users", otherId));
      const other = otherSnap.exists() ? otherSnap.data() : { name: "User" };

      const isUnread = convo.lastMessageSender && convo.lastMessageSender !== user.uid;

      const initials = other.name ? other.name.split(' ').map(n => n[0]).join('').toUpperCase() : "U";

      const item = document.createElement("div");
      item.className = "chatlist-item";
      item.title = convo.lastMessage || ""; // tooltip for full message
      item.innerHTML = `
        <div class="chatlist-avatar">${initials}</div>
        <div class="chatlist-info">
          <h3>${other.name || "User"}</h3>
          <p>${convo.lastMessage || ""}</p>
        </div>
        ${isUnread ? `<span class="chatlist-unread"></span>` : ""}
      `;

      item.onclick = () => {
        sessionStorage.setItem("activeConversationId", convoId);
        loadView("chat");
      };

      chatList.appendChild(item);
    }
  });
}
