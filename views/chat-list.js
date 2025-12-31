import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  deleteDoc,
  setDoc,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { loadView } from "/index/js/main.js";

let auth, db;
let unsubscribeConversations = null;

/* ============================================================
   CUSTOM CONFIRM MODAL
============================================================ */
function showConfirm(message) {
  return new Promise((resolve) => {
    const modal = document.createElement("div");
    modal.className = "confirm-modal";
    modal.innerHTML = `
      <div class="confirm-box">
        <p>${message}</p>
        <div class="confirm-buttons">
          <button id="confirmYes">Delete</button>
          <button id="confirmNo">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector("#confirmYes").onclick = () => {
      modal.remove();
      resolve(true);
    };
    modal.querySelector("#confirmNo").onclick = () => {
      modal.remove();
      resolve(false);
    };
  });
}

/* ============================================================
   INIT CHAT LIST
============================================================ */
export async function init({ auth: a, db: d }) {
  auth = a;
  db = d;

  const user = auth.currentUser;
  if (!user) return loadView("home");

  const chatList = document.getElementById("chatList");
  if (!chatList) return console.warn("Chat list container not found");

  if (unsubscribeConversations) unsubscribeConversations();

  const convosRef = collection(db, "conversations");
  const q = query(
    convosRef,
    where("participants", "array-contains", user.uid),
    orderBy("updatedAt", "desc")
  );

  unsubscribeConversations = onSnapshot(q, async (snap) => {
    chatList.innerHTML = "";

    if (snap.empty) {
      chatList.innerHTML = `<p class="chatlist-empty">No messages yet.</p>`;
      return;
    }

    for (const docSnap of snap.docs) {
      const convo = docSnap.data();
      const convoId = docSnap.id;

      /* ============================================================
         AUTO DELETE AFTER 10 DAYS
      ============================================================ */
      const TEN_DAYS = 10 * 24 * 60 * 60 * 1000;
      if (Date.now() - convo.updatedAt > TEN_DAYS) {
        await deleteDoc(doc(db, "conversations", convoId));
        continue;
      }

      /* ============================================================
         HIDE IF USER DELETED IT
      ============================================================ */
      if (convo.deletedFor?.[user.uid]) continue;

      const [u1, u2, postId] = convoId.split("_");
      const otherId = user.uid === u1 ? u2 : u1;

      const otherSnap = await getDoc(doc(db, "users", otherId));
      const other = otherSnap.exists() ? otherSnap.data() : { name: "User" };

      let postTitle = "";
      try {
        const postSnap = await getDoc(doc(db, "posts", postId));
        if (postSnap.exists()) postTitle = postSnap.data().title || "";
      } catch (err) {
        console.error("Error loading post for chat list:", err);
      }

      const isUnread =
        convo.lastMessageSender && convo.lastMessageSender !== user.uid;

      const initials = other.name
        ? other.name.split(" ").map((n) => n[0]).join("").toUpperCase()
        : "U";

      /* ============================================================
         BUILD CHAT ITEM
      ============================================================ */
      const item = document.createElement("div");
      item.className = "chatlist-item";
      item.title = convo.lastMessage || "";

      item.innerHTML = `
        <div class="chatlist-avatar">${initials}</div>
        <div class="chatlist-info">
          <h3>${other.name || "User"}</h3>
          <p><strong>${postTitle}</strong> — ${convo.lastMessage || ""}</p>
        </div>
        ${isUnread ? `<span class="chatlist-unread"></span>` : ""}
        <div class="chatlist-delete" data-id="${convoId}">✕</div>
      `;

      /* ============================================================
         OPEN CHAT
      ============================================================ */
      item.onclick = () => {
        sessionStorage.setItem("activeConversationId", convoId);
        loadView("chat", { forceInit: true });
      };

      /* ============================================================
         DELETE CHAT (with custom confirm)
      ============================================================ */
      item.querySelector(".chatlist-delete").onclick = async (e) => {
        e.stopPropagation();

        const ok = await showConfirm("Delete this chat?");
        if (!ok) return;

        await setDoc(
          doc(db, "conversations", convoId),
          {
            deletedFor: {
              ...(convo.deletedFor || {}),
              [user.uid]: true
            }
          },
          { merge: true }
        );
      };

      chatList.appendChild(item);
    }
  });

  document
    .getElementById("backToDashboard")
    ?.addEventListener("click", () => loadView("home", { forceInit: true }));
}

/* ============================================================
   CONFIRM MODAL CSS (inject automatically)
============================================================ */
const style = document.createElement("style");
style.textContent = `
.confirm-modal {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.confirm-box {
  background: #fff;
  padding: 20px;
  width: 80%;
  max-width: 300px;
  border-radius: 10px;
  text-align: center;
}
.confirm-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
}
.confirm-buttons button {
  flex: 1;
  margin: 0 5px;
  padding: 10px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
}
#confirmYes {
  background: #d9534f;
  color: white;
}
#confirmNo {
  background: #ccc;
}
.chatlist-delete {
  margin-left: auto;
  font-size: 22px;
  cursor: pointer;
  padding: 10px;
  color: #888;
}
.chatlist-delete:hover {
  color: red;
}
`;
document.head.appendChild(style);
