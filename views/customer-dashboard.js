import { getFirebase } from '/index/js/firebase/init.js';
import { 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { ref, deleteObject, uploadBytes, getDownloadURL } 
from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

let auth, db, storage;

/* ---------------------------------------------------
   ✅ DELETE POST + IMAGES
--------------------------------------------------- */
async function deletePostAndImages(post) {
  try {
    const allImages = [];

    if (post.imageUrl) allImages.push(post.imageUrl);
    if (Array.isArray(post.imageUrls)) allImages.push(...post.imageUrls);

    for (const url of allImages) {
      const path = url.split("/o/")[1].split("?")[0];
      const storageRef = ref(storage, decodeURIComponent(path));
      await deleteObject(storageRef);
    }

    await deleteDoc(doc(db, "posts", post.id));
    console.log("✅ Deleted post + images:", post.id);

  } catch (err) {
    console.error("❌ Failed to delete post:", err);
  }
}

/* ---------------------------------------------------
   ✅ AUTO DELETE POSTS OLDER THAN 14 DAYS
--------------------------------------------------- */
async function autoDeleteExpiredPosts(userId) {
  const now = Date.now();
  const fourteenDays = 14 * 24 * 60 * 60 * 1000;

  const q = query(collection(db, "posts"), where("userId", "==", userId));
  const snap = await getDocs(q);

  snap.forEach(async docSnap => {
    const post = { id: docSnap.id, ...docSnap.data() };
    if (!post.createdAt) return;

    const age = now - post.createdAt.toMillis();
    if (age > fourteenDays) {
      await deletePostAndImages(post);
    }
  });
}

/* ---------------------------------------------------
   ✅ MAIN DASHBOARD LOGIC
--------------------------------------------------- */
getFirebase().then(fb => {
  auth = fb.auth;
  db = fb.db;
  storage = fb.storage;

  onAuthStateChanged(auth, async user => {
    if (!user) {
      loadView("home");
      return;
    }

    /* ---------------- LOAD PROFILE ---------------- */
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    let name = "", phone = "", area = "", bio = "", avatarUrl = "";

    if (snap.exists()) {
      const u = snap.data();
      name = u.name || "";
      phone = u.phone || "";
      area = u.area || "";
      bio = u.bio || "";
      avatarUrl = u.avatarUrl || "";
    }

    /* ✅ Update header + profile view */
    document.getElementById("headerName").textContent = name || "Your account";
    document.getElementById("headerAreaBadge").textContent = area || "Add your area";
    document.getElementById("headerTagline").textContent =
      name ? "Your Rhondda profile is looking tidy" : "Let’s set up your Rhondda profile";

    document.getElementById("viewName").textContent = name || "Add your name";
    document.getElementById("viewPhone").textContent = phone || "Add your phone";
    document.getElementById("viewArea").textContent = area || "Add your area";
    document.getElementById("viewBio").textContent = bio || "Tell locals a bit about yourself.";

    document.getElementById("profileNameInput").value = name;
    document.getElementById("profilePhoneInput").value = phone;
    document.getElementById("profileAreaInput").value = area;
    document.getElementById("profileBioInput").value = bio;

    /* ---------------------------------------------------
       ✅ AVATAR DISPLAY + UPLOAD
    --------------------------------------------------- */
    const avatarInput = document.getElementById("avatarUploadInput");
    const avatarCircle = document.getElementById("dashboardAvatar");
    const avatarClickArea = document.getElementById("avatarClickArea");

    if (avatarUrl) {
      avatarCircle.style.backgroundImage = `url('${avatarUrl}')`;
    }

    avatarClickArea.addEventListener("click", () => {
      avatarInput.click();
    });

    avatarInput.addEventListener("change", async () => {
      const file = avatarInput.files[0];
      if (!file) return;

      const storageRef = ref(storage, `avatars/${user.uid}.jpg`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await updateDoc(userRef, { avatarUrl: url });

      avatarCircle.style.backgroundImage = `url('${url}')`;
    });

    /* ---------------------------------------------------
       ✅ AREA AUTOCOMPLETE
    --------------------------------------------------- */
    const AREAS = [
      "Porth","Trealaw","Tonypandy","Penygraig","Llwynypia","Ystrad","Gelli",
      "Ton Pentre","Pentre","Treorchy","Treherbert","Ferndale","Tylorstown",
      "Maerdy","Cymmer","Wattstown","Blaenllechau","Blaencwm","Blaenrhondda",
      "Clydach Vale","Edmondstown","Llwyncelyn","Penrhys","Pontygwaith",
      "Williamstown","Ynyshir","Aberdare","Aberaman","Abercynon","Cwmbach",
      "Hirwaun","Llwydcoed","Mountain Ash","Penrhiwceiber","Pen-y-waun",
      "Rhigos","Cefnpennar","Cwaman","Godreaman","Miskin (Mountain Ash)",
      "New Cardiff","Penderyn","Tyntetown","Ynysboeth","Pontypridd","Beddau",
      "Church Village","Cilfynydd","Glyn-coch","Hawthorn","Llantrisant",
      "Llantwit Fardre","Rhydfelen","Taff's Well","Talbot Green","Tonteg",
      "Treforest","Trehafod","Ynysybwl","Coed-y-cwm","Graig","Hopkinstown",
      "Nantgarw","Trallwng","Upper Boat","Brynna","Llanharan","Llanharry",
      "Pontyclun","Tonyrefail","Tyn-y-nant","Gilfach Goch","Groesfaen",
      "Miskin (Llantrisant)","Mwyndy","Thomastown"
    ];

    const areaInput = document.getElementById("profileAreaInput");
    const suggestionBox = document.getElementById("areaSuggestions");

    areaInput.addEventListener("input", () => {
      const value = areaInput.value.toLowerCase();
      suggestionBox.innerHTML = "";

      if (!value) {
        suggestionBox.style.display = "none";
        return;
      }

      const matches = AREAS.filter(a => a.toLowerCase().startsWith(value));

      if (!matches.length) {
        suggestionBox.style.display = "none";
        return;
      }

      suggestionBox.style.display = "block";

      matches.forEach(areaName => {
        const div = document.createElement("div");
        div.className = "suggestion-item";
        div.textContent = areaName;
        div.addEventListener("click", () => {
          areaInput.value = areaName;
          suggestionBox.style.display = "none";
        });
        suggestionBox.appendChild(div);
      });
    });

    document.addEventListener("click", (e) => {
      if (!suggestionBox.contains(e.target) && e.target !== areaInput) {
        suggestionBox.style.display = "none";
      }
    });

    /* ---------------- LOAD POSTS ---------------- */
    const q = query(collection(db, "posts"), where("userId", "==", user.uid));
    const postsSnap = await getDocs(q);

    const container = document.getElementById("userPosts");
    container.innerHTML = "";

    let adsCount = 0, totalViews = 0, totalUnlocks = 0;

    if (postsSnap.empty) {
      container.innerHTML = `<p class="empty-msg">You haven’t posted anything yet.</p>`;
    }

    postsSnap.forEach(docSnap => {
      const p = docSnap.data();
      const id = docSnap.id;

      adsCount++;
      if (p.views) totalViews += p.views;
      if (p.unlocks) totalUnlocks += p.unlocks;

      container.innerHTML += `
        <div class="dash-card">
          <img src="${p.imageUrl || '/images/post-placeholder.jpg'}" class="dash-img">
          <div class="dash-info">
            <h3>${p.title}</h3>
            <p>${p.description}</p>
          </div>
          <div class="dash-actions">
            <button class="dash-btn dash-edit" data-id="${id}">Edit</button>
            <button class="dash-btn dash-delete" data-id="${id}">Delete</button>
          </div>
        </div>
      `;
    });

    document.getElementById("statAdsCount").textContent = adsCount;
    document.getElementById("statTotalViews").textContent = totalViews;
    document.getElementById("statUnlocks").textContent = totalUnlocks;

    /* ---------------- DELETE BUTTONS ---------------- */
    document.querySelectorAll(".dash-delete").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this ad?")) return;

        const postId = btn.dataset.id;
        const postSnap = await getDoc(doc(db, "posts", postId));
        const post = { id: postId, ...postSnap.data() };

        await deletePostAndImages(post);
        loadView("customer-dashboard");
      });
    });

    /* ---------------- AUTO DELETE OLD POSTS ---------------- */
    autoDeleteExpiredPosts(user.uid);

    /* ---------------- EDIT + NEW + LOGOUT ---------------- */
    document.querySelectorAll(".dash-edit").forEach(btn => {
      btn.addEventListener("click", () => {
        openScreen("editPost");
        window.editPostId = btn.dataset.id;
      });
    });

    document.getElementById("newPostBtn").addEventListener("click", () => {
      openScreen("post");
    });

    document.getElementById("logoutBtn").addEventListener("click", () => {
      document.getElementById("logoutOverlay").style.display = "flex";
      signOut(auth).then(() => setTimeout(() => navigateToHome(), 2000));
    });
  });
});
