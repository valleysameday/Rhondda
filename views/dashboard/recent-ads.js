// recent-ads.js
import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export async function loadRecentAds(auth, db) {
  const list = document.getElementById("adsList");
  list.innerHTML = "";
  const user = auth.currentUser; if(!user) return;

  const q = query(collection(db,"posts"), where("userId","==",user.uid), orderBy("createdAt","desc"));
  const snap = await getDocs(q);

  if(snap.empty) { list.innerHTML = `<p class="widget-sub">No ads yet. Post your first one!</p>`; return; }

  let count=0;
  snap.forEach(docSnap => {
    if(count>=5) return;
    const post = docSnap.data();
    const div = document.createElement("div");
    div.className = "mini-ad";
    div.innerHTML = `<img src="${post.imageUrl || '/images/image-webholder.webp'}" alt=""><p>${post.title || "Untitled"}</p>`;
    list.appendChild(div);
    count++;
  });
}
