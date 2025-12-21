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

let auth, db;

getFirebase().then(fb => {
  auth = fb.auth;
  db = fb.db;

  onAuthStateChanged(auth, async user => {
    if (!user) {
      loadView("home");
      return;
    }
import { deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { ref, deleteObject } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

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
    /* ---------------- ELEMENT REFERENCES ---------------- */
    const headerNameEl = document.getElementById("headerName");
    const headerAreaBadgeEl = document.getElementById("headerAreaBadge");
    const headerTaglineEl = document.getElementById("headerTagline");

    const viewNameEl = document.getElementById("viewName");
    const viewPhoneEl = document.getElementById("viewPhone");
    const viewAreaEl = document.getElementById("viewArea");
    const viewBioEl = document.getElementById("viewBio");

    const nameInput = document.getElementById("profileNameInput");
    const phoneInput = document.getElementById("profilePhoneInput");
    const areaInput = document.getElementById("profileAreaInput");
    const bioInput = document.getElementById("profileBioInput");

    const profileViewMode = document.getElementById("profileViewMode");
    const profileEditMode = document.getElementById("profileEditMode");
    const toggleEditBtn = document.getElementById("toggleEditProfile");
    const cancelEditBtn = document.getElementById("cancelEditProfileBtn");
    const feedback = document.getElementById("profileFeedback");

    const statAdsCount = document.getElementById("statAdsCount");
    const statTotalViews = document.getElementById("statTotalViews");
    const statUnlocks = document.getElementById("statUnlocks");

    /* ---------------- LOAD PROFILE ---------------- */
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    let name = "";
    let phone = "";
    let area = "";
    let bio = "";

    if (snap.exists()) {
      const u = snap.data();
      name = u.name || "";
      phone = u.phone || "";
      bio = u.bio || "";
      area = u.area || "";
    }

    // Header
    headerNameEl.textContent = name || "Your account";
    headerAreaBadgeEl.textContent = area || "Add your area";
    headerTaglineEl.textContent = name
      ? "Your Rhondda profile is looking tidy"
      : "Let’s set up your Rhondda profile";

    // View mode
    viewNameEl.textContent = name || "Add your name";
    viewPhoneEl.textContent = phone || "Add your phone";
    viewAreaEl.textContent = area || "Add your area";
    viewBioEl.textContent = bio || "Tell locals a bit about yourself and what you’re selling.";

    // Edit mode
    nameInput.value = name;
    phoneInput.value = phone;
    areaInput.value = area;
    bioInput.value = bio;

    /* ---------------- EDIT MODE TOGGLE ---------------- */
    const enterEditMode = () => {
      profileViewMode.style.display = "none";
      profileEditMode.style.display = "block";
      toggleEditBtn.textContent = "Done editing";
      feedback.textContent = "";
    };

    const exitEditMode = () => {
      profileViewMode.style.display = "block";
      profileEditMode.style.display = "none";
      toggleEditBtn.textContent = "Edit profile";
    };

    toggleEditBtn.addEventListener("click", () => {
      if (profileEditMode.style.display === "block") {
        exitEditMode();
      } else {
        enterEditMode();
      }
    });

    cancelEditBtn.addEventListener("click", () => {
      // Reset inputs to last saved state
      nameInput.value = name;
      phoneInput.value = phone;
      areaInput.value = area;
      bioInput.value = bio;
      exitEditMode();
    });

    /* ---------------- AREA AUTOCOMPLETE (Rhondda Cynon Taf) ---------------- */
    const AREAS = [
      "Porth", "Trealaw", "Tonypandy", "Penygraig", "Llwynypia",
      "Ystrad", "Gelli", "Ton Pentre", "Pentre", "Treorchy",
      "Treherbert", "Ferndale", "Tylorstown", "Maerdy",
      "Cymmer", "Wattstown", "Blaenllechau", "Blaencwm", "Blaenrhondda",
      "Clydach Vale", "Edmondstown", "Llwyncelyn", "Penrhys", "Pontygwaith",
      "Williamstown", "Ynyshir",
      "Aberdare", "Aberaman", "Abercynon", "Cwmbach", "Hirwaun",
      "Llwydcoed", "Mountain Ash", "Penrhiwceiber", "Pen-y-waun",
      "Rhigos", "Cefnpennar", "Cwaman", "Godreaman",
      "Miskin (Mountain Ash)", "New Cardiff", "Penderyn", "Tyntetown",
      "Ynysboeth",
      "Pontypridd", "Beddau", "Church Village", "Cilfynydd", "Glyn-coch",
      "Hawthorn", "Llantrisant", "Llantwit Fardre", "Rhydfelen",
      "Taff's Well", "Talbot Green", "Tonteg", "Treforest", "Trehafod",
      "Ynysybwl", "Coed-y-cwm", "Graig", "Hopkinstown", "Nantgarw",
      "Trallwng", "Upper Boat",
      "Brynna", "Llanharan", "Llanharry", "Pontyclun", "Tonyrefail",
      "Tyn-y-nant", "Gilfach Goch", "Groesfaen", "Miskin (Llantrisant)",
      "Mwyndy", "Thomastown"
    ];

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

    /* ---------------- SAVE PROFILE ---------------- */
    document.getElementById("saveProfileBtn").addEventListener("click", async () => {
      const newName = nameInput.value.trim();
      const newPhone = phoneInput.value.trim();
      const newBio = bioInput.value.trim();
      const newArea = areaInput.value.trim();

      feedback.textContent = "Saving...";

      await updateDoc(userRef, { name: newName, phone: newPhone, bio: newBio, area: newArea });

      // Update local state
      name = newName;
      phone = newPhone;
      bio = newBio;
      area = newArea;

      // Update header
      headerNameEl.textContent = name || "Your account";
      headerAreaBadgeEl.textContent = area || "Add your area";
      headerTaglineEl.textContent = name
        ? "Your Rhondda profile is looking tidy"
        : "Let’s set up your Rhondda profile";

      // Update view mode
      viewNameEl.textContent = name || "Add your name";
      viewPhoneEl.textContent = phone || "Add your phone";
      viewAreaEl.textContent = area || "Add your area";
      viewBioEl.textContent = bio || "Tell locals a bit about yourself and what you’re selling.";

      feedback.textContent = "✅ Profile updated!";
      feedback.classList.add("feedback-success");

      setTimeout(() => {
        feedback.textContent = "";
        feedback.classList.remove("feedback-success");
      }, 1500);

      exitEditMode();
    });

    /* ---------------- LOAD USER POSTS + STATS ---------------- */
    const q = query(collection(db, "posts"), where("userId", "==", user.uid));
    const postsSnap = await getDocs(q);

    const container = document.getElementById("userPosts");
    container.innerHTML = "";

    let adsCount = 0;
    let totalViews = 0;
    let totalUnlocks = 0;

    if (postsSnap.empty) {
      container.innerHTML = `<p class="empty-msg">You haven’t posted anything yet. Your first ad will show up here.</p>`;
    }

    postsSnap.forEach(docSnap => {
      const p = docSnap.data();
      const id = docSnap.id;

      adsCount += 1;
      if (typeof p.views === "number") totalViews += p.views;
      if (typeof p.unlocks === "number") totalUnlocks += p.unlocks;

      container.innerHTML += `
        <div class="dash-card">
          <img src="${p.imageUrl || '/images/post-placeholder.jpg'}" class="dash-img">
          <div class="dash-info">
            <h3>${p.title || "Untitled ad"}</h3>
            <p>${p.description || ""}</p>
            <small>
              ${p.category || "General"}
              ${p.subcategory ? " • " + p.subcategory : ""}
              ${p.area ? " • " + p.area : (area ? " • " + area : "")}
            </small>
          </div>
          <div class="dash-actions">
            <button class="dash-btn dash-edit" data-id="${id}">Edit</button>
            <button class="dash-btn dash-delete" data-id="${id}">Delete</button>
          </div>
        </div>
      `;
    });

    // Stats
    statAdsCount.textContent = adsCount;
    statTotalViews.textContent = totalViews;
    statUnlocks.textContent = totalUnlocks;

    /* ---------------- DELETE POST ---------------- */
    document.querySelectorAll(".dash-delete").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this ad?")) return;
        await deleteDoc(doc(db, "posts", btn.dataset.id));
        loadView("customer-dashboard");
      });
    });

    /* ---------------- EDIT POST ---------------- */
    document.querySelectorAll(".dash-edit").forEach(btn => {
      btn.addEventListener("click", () => {
        openScreen("editPost");
        window.editPostId = btn.dataset.id;
      });
    });

    /* ---------------- NEW POST ---------------- */
    document.getElementById("newPostBtn").addEventListener("click", () => {
      openScreen("post");
    });

    /* ---------------- LOGOUT ---------------- */
    document.getElementById("logoutBtn").addEventListener("click", () => {
      const overlay = document.getElementById("logoutOverlay");
      overlay.style.display = "flex";

      signOut(auth).then(() => {
        setTimeout(() => navigateToHome(), 2000);
      });
    });
  });
});
