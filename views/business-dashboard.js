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

    /* ---------------- ELEMENTS ---------------- */
    const headerName = document.getElementById("bizHeaderName");
    const headerTagline = document.getElementById("bizHeaderTagline");
    const headerTypeBadge = document.getElementById("bizHeaderTypeBadge");

    const viewName = document.getElementById("bizViewName");
    const viewPhone = document.getElementById("bizViewPhone");
    const viewArea = document.getElementById("bizViewArea");
    const viewWebsite = document.getElementById("bizViewWebsite");
    const viewBio = document.getElementById("bizViewBio");

    const nameInput = document.getElementById("bizNameInput");
    const phoneInput = document.getElementById("bizPhoneInput");
    const areaInput = document.getElementById("bizAreaInput");
    const websiteInput = document.getElementById("bizWebsiteInput");
    const bioInput = document.getElementById("bizBioInput");

    const viewMode = document.getElementById("bizProfileViewMode");
    const editMode = document.getElementById("bizProfileEditMode");

    const toggleEditBtn = document.getElementById("bizToggleEditProfile");
    const cancelEditBtn = document.getElementById("bizCancelEditProfileBtn");
    const feedback = document.getElementById("bizProfileFeedback");

    const statAds = document.getElementById("bizStatAdsCount");
    const statViews = document.getElementById("bizStatTotalViews");
    const statLeads = document.getElementById("bizStatLeads");

    /* ---------------- LOAD BUSINESS PROFILE ---------------- */
    const userRef = doc(db, "businesses", user.uid);
    const snap = await getDoc(userRef);

    let name = "";
    let phone = "";
    let area = "";
    let website = "";
    let bio = "";

    if (snap.exists()) {
      const b = snap.data();
      name = b.name || "";
      phone = b.phone || "";
      area = b.area || "";
      website = b.website || "";
      bio = b.bio || "";
    }

    // Header
    headerName.textContent = name || "Your Business";
    headerTagline.textContent = name
      ? "Manage your ads, brand, and customers"
      : "Let’s set up your business profile";

    // View mode
    viewName.textContent = name || "Add your business name";
    viewPhone.textContent = phone || "Add your phone";
    viewArea.textContent = area || "Add your area";
    viewWebsite.textContent = website || "Add your website";
    viewBio.textContent = bio || "Tell customers what you offer";

    // Edit mode
    nameInput.value = name;
    phoneInput.value = phone;
    areaInput.value = area;
    websiteInput.value = website;
    bioInput.value = bio;

    /* ---------------- EDIT MODE TOGGLE ---------------- */
    const enterEdit = () => {
      viewMode.style.display = "none";
      editMode.style.display = "block";
      toggleEditBtn.textContent = "Done";
    };

    const exitEdit = () => {
      viewMode.style.display = "block";
      editMode.style.display = "none";
      toggleEditBtn.textContent = "Edit";
    };

    toggleEditBtn.addEventListener("click", () => {
      if (editMode.style.display === "block") exitEdit();
      else enterEdit();
    });

    cancelEditBtn.addEventListener("click", () => {
      nameInput.value = name;
      phoneInput.value = phone;
      areaInput.value = area;
      websiteInput.value = website;
      bioInput.value = bio;
      exitEdit();
    });

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

    const suggestionBox = document.getElementById("bizAreaSuggestions");

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
        div.className = "biz-suggestion-item";
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

    /* ---------------- SAVE BUSINESS PROFILE ---------------- */
    document.getElementById("bizSaveProfileBtn").addEventListener("click", async () => {
      const newName = nameInput.value.trim();
      const newPhone = phoneInput.value.trim();
      const newArea = areaInput.value.trim();
      const newWebsite = websiteInput.value.trim();
      const newBio = bioInput.value.trim();

      feedback.textContent = "Saving...";

      await updateDoc(userRef, {
        name: newName,
        phone: newPhone,
        area: newArea,
        website: newWebsite,
        bio: newBio
      });

      // Update local state
      name = newName;
      phone = newPhone;
      area = newArea;
      website = newWebsite;
      bio = newBio;

      // Update view mode
      viewName.textContent = name || "Add your business name";
      viewPhone.textContent = phone || "Add your phone";
      viewArea.textContent = area || "Add your area";
      viewWebsite.textContent = website || "Add your website";
      viewBio.textContent = bio || "Tell customers what you offer";

      feedback.textContent = "✅ Business profile updated!";
      feedback.classList.add("biz-feedback-success");

      setTimeout(() => {
        feedback.textContent = "";
        feedback.classList.remove("biz-feedback-success");
      }, 1500);

      exitEdit();
    });

    /* ---------------- LOAD BUSINESS ADS + STATS ---------------- */
    const q = query(collection(db, "posts"), where("businessId", "==", user.uid));
    const postsSnap = await getDocs(q);

    const container = document.getElementById("bizPosts");
    container.innerHTML = "";

    let adsCount = 0;
    let totalViews = 0;
    let totalLeads = 0;

    if (postsSnap.empty) {
      container.innerHTML = `<p class="biz-empty-msg">You haven’t posted any business ads yet.</p>`;
    }

    postsSnap.forEach(docSnap => {
      const p = docSnap.data();
      const id = docSnap.id;

      adsCount += 1;
      if (typeof p.views === "number") totalViews += p.views;
      if (typeof p.leads === "number") totalLeads += p.leads;

      container.innerHTML += `
        <div class="biz-card">
          <img src="${p.imageUrl || '/images/post-placeholder.jpg'}" class="biz-img">
          <div class="biz-info">
            <h3>${p.title || "Untitled ad"}</h3>
            <p>${p.description || ""}</p>
            <small>
              ${p.category || "General"}
              ${p.subcategory ? " • " + p.subcategory : ""}
              ${p.area ? " • " + p.area : ""}
            </small>
          </div>
          <div class="biz-actions">
            <button class="biz-btn biz-edit" data-id="${id}">Edit</button>
            <button class="biz-btn biz-delete" data-id="${id}">Delete</button>
          </div>
        </div>
      `;
    });

    statAds.textContent = adsCount;
    statViews.textContent = totalViews;
    statLeads.textContent = totalLeads;

    /* ---------------- DELETE POST ---------------- */
    document.querySelectorAll(".biz-delete").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this ad?")) return;
        await deleteDoc(doc(db, "posts", btn.dataset.id));
        loadView("business-dashboard");
      });
    });

    /* ---------------- EDIT POST ---------------- */
    document.querySelectorAll(".biz-edit").forEach(btn => {
      btn.addEventListener("click", () => {
        openScreen("editPost");
        window.editPostId = btn.dataset.id;
      });
    });

    /* ---------------- NEW POST ---------------- */
    document.getElementById("bizNewPostBtn").addEventListener("click", () => {
      openScreen("post");
    });

    /* ---------------- LOGOUT ---------------- */
    document.getElementById("bizLogoutBtn").addEventListener("click", () => {
      const overlay = document.getElementById("bizLogoutOverlay");
      overlay.style.display = "flex";

      signOut(auth).then(() => {
        setTimeout(() => navigateToHome(), 2000);
      });
    });
  });
});
