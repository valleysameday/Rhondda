// loadMessages.js
import { collection, query, where, getDocs } 
  from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export async function loadUserConversations(auth, db) {
  const user = auth.currentUser;
  if (!user) return [];

  const conversationsRef = collection(db, "conversations");

  const q = query(
    conversationsRef,
    where("participants", "array-contains", user.uid)
  );

  const snap = await getDocs(q);

  const conversations = [];
  snap.forEach(doc => {
    conversations.push({ id: doc.id, ...doc.data() });
  });

  return conversations;
}
