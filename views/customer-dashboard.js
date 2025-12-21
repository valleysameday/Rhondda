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

    /* ---------------- LOAD PROFILE ---------------- */
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const u = snap.data();

      // Display text
      document.getElementById("profileNameDisplay").textContent = u.name || "Your name";
      document.getElementById("profilePhoneDisplay").textContent = u.phone || "Your phone number";
      document.getElementById("profileBioDisplay").textContent = u.bio || "Tell us a bit about yourself";
      document.getElementById("profileAreaDisplay").textContent = u.area || "Your area";

      // Hidden inputs
      document.getElementById("profileNameInput").value = u.name || "";
      document.getElementById("profilePhoneInput").value = u.phone || "";
      document.getElementById("profileBioInput").value = u.bio || "";
      document.getElementById("profileAreaInput").value = u.area || "";
    }

    /* ---------------- AREA AUTOCOMPLETE (Rhondda Cynon Taf) ---------------- */
const AREAS = [
  // Rhondda Fawr & Rhondda Fach
  "Porth", "Trealaw", "Tonypandy", "Penygraig", "Llwynypia",
  "Ystrad", "Gelli", "Ton Pentre", "Pentre", "Treorchy",
  "Treherbert", "Ferndale", "Tylorstown", "Maerdy",
  "Cymmer", "Wattstown", "Blaenllechau", "Blaencwm", "Blaenrhondda",
  "Clydach Vale", "Edmondstown", "Llwyncelyn", "Penrhys", "Pontygwaith",
  "Williamstown", "Ynyshir",

  // Cynon Valley
  "Aberdare", "Aberaman", "Abercynon", "Cwmbach", "Hirwaun",
  "Llwydcoed", "Mountain Ash", "Penrhiwceiber", "Pen-y-waun",
  "Rhigos", "Cefnpennar", "Cwaman", "Godreaman", "Llwyncelyn",
  "Miskin (Mountain Ash)", "New Cardiff", "Penderyn", "Tyntetown",
  "Ynysboeth",

  // Pontypridd & Taff Ely
  "Pontypridd", "Beddau", "Church Village", "Cilfynydd", "Glyn-coch",
  "Hawthorn", "Llantrisant", "Llantwit Fardre", "Rhydfelen",
  "Taff's Well", "Talbot Green", "Tonteg", "Treforest", "Trehafod",
  "Ynysybwl", "Coed-y-cwm", "Graig", "Hopkinstown", "Nantgarw",
  "Trallwng", "Upper Boat",

  // Llantrisant & South RCT
  "Brynna", "Llanharan", "Llanharry", "Pontyclun", "Tonyrefail",
  "Tyn-y-nant", "Gilfach Goch", "Groesfaen", "Miskin (Llantrisant)",
  "Mwyndy", "Thomastown"
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

      matches.forEach(area => {
        const div = document.createElement("div");
        div.className = "suggestion-item";
        div.textContent = area;
        div.addEventListener("click", () => {
          areaInput.value = area;
          suggestionBox.style.display = "none";
        });
        suggestionBox.appendChild(div);
      });
    });

    /* ---------------- SAVE PROFILE ---------------- */
    document.getElementById("saveProfileBtn").addEventListener("click", async () => {
      const name = document.getElementById("profileNameInput").value.trim();
      const phone = document.getElementById("profilePhoneInput").value.trim();
      const bio = document.getElementById("profileBioInput").value.trim();
      const area = document.getElementById("profileAreaInput").value.trim();
      const feedback = document.getElementById("profileFeedback");

      feedback.textContent = "Saving...";

      await updateDoc(userRef, { name, phone, bio, area });

      // Update display text after save
      document.getElementById("profileNameDisplay").textContent = name || "Your name";
      document.getElementById("profilePhoneDisplay").textContent = phone || "Your phone number";
      document.getElementById("profileBioDisplay").textContent = bio || "Tell us a bit about yourself";
      document.getElementById("profileAreaDisplay").textContent = area || "Your area";

      feedback.textContent = "✅ Profile updated!";
      feedback.classList.add("feedback-success");

      setTimeout(() => feedback.textContent = "", 1500);
    });

    /* ---------------- LOAD USER POSTS ---------------- */
    const q = query(collection(db, "posts"), where("userId", "==", user.uid));
    const postsSnap = await getDocs(q);

    const container = document.getElementById("userPosts");
    container.innerHTML = "";

    if (postsSnap.empty) {
      container.innerHTML = `<p class="empty-msg">You haven’t posted anything yet.</p>`;
    }

    postsSnap.forEach(docSnap => {
      const p = docSnap.data();
      const id = docSnap.id;

      container.innerHTML += `
        <div class="dash-card">
          <img src="${p.imageUrl || '/images/post-placeholder.jpg'}" class="dash-img">
          <div class="dash-info">
            <h3>${p.title}</h3>
            <p>${p.description}</p>
            <small>
              ${p.category} 
              ${p.subcategory ? "• " + p.subcategory : ""} 
              ${p.area ? "• " + p.area : ""}
            </small>
          </div>
          <div class="dash-actions">
            <button class="dash-btn dash-edit" data-id="${id}">Edit</button>
            <button class="dash-btn dash-delete" data-id="${id}">Delete</button>
          </div>
        </div>
      `;
    });

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
