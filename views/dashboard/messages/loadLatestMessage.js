// loadLatestMessage.js
import { collection, query, orderBy, limit, getDocs }
  from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export async function loadLatestMessage(db, conversationId) {
  const messagesRef = collection(db, "conversations", conversationId, "messages");

  const q = query(messagesRef, orderBy("timestamp", "desc"), limit(1));

  const snap = await getDocs(q);

  if (snap.empty) return null;

  return snap.docs[0].data();
}
