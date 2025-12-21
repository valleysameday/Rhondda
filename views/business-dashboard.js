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

import { ref, deleteObject } 
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

  const q = query(collection(db, "posts"), where("businessId", "==", userId));
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
   ✅ MAIN BUSINESS DASHBOARD LOGIC
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

    /* ---------------- LOAD BUSINESS PROFILE ---------------- */
    const userRef = doc(db, "businesses", user.uid);
    const snap = await getDoc(userRef);

    let name = "", phone = "", area = "", website = "", bio = "";

    if (snap.exists()) {
      const b = snap.data();
      name = b.name || "";
      phone = b.phone || "";
      area = b.area || "";
      website = b.website || "";
      bio = b.bio || "";
    }

    document.getElementById("bizHeaderName").textContent = name || "Your Business";
    document.getElementById("bizHeaderTagline").textContent =
      name ? "Manage your ads, brand, and customers" : "Let’s set up your business profile";

    document.getElementById("bizViewName").textContent = name || "Add your business name";
    document.getElementById("bizViewPhone").textContent = phone || "Add your phone";
    document.getElementById("bizViewArea").textContent = area || "Add your area";
    document.getElementById("bizViewWebsite").textContent = website || "Add your website";
    document.getElementById("bizViewBio").textContent = bio || "Tell customers what you offer";

    document.getElementById("bizNameInput").value = name;
    document.getElementById("bizPhoneInput").value = phone;
    document.getElementById("bizAreaInput").value = area;
    document.getElementById("bizWebsiteInput").value = website;
    document.getElementById("bizBioInput").value = bio;

    /* ---------------------------------------------------
       ✅ AREA AUTOCOMPLETE (Rhondda Cynon Taf)
    --------------------------------------------------- */
    const AREAS = [
      "Porth","Trealaw","Tonypandy","Penygraig","Llwynypia",
      "Ystrad","Gelli","Ton Pentre","Pentre","Treorchy",
      "Treherbert","Ferndale","Tylorstown","Maerdy",
      "Cymmer","Wattstown","Blaenllechau","Blaencwm","Blaenrhondda",
      "Clydach Vale","Edmondstown","Llwyncelyn","Penrhys","Pontygwaith",
      "Williamstown","Ynyshir",

      "Aberdare","Aberaman","Abercynon","Cwmbach","Hirwaun",
      "Llwydcoed","Mountain Ash","Penrhiwceiber","Pen-y-waun",
      "Rhigos","Cefnpennar","Cwaman","Godreaman","Llwyncelyn",
      "Miskin (Mountain Ash)","New Cardiff","Penderyn","Tyntetown",
      "Ynysboeth",

      "Pontypridd","Beddau","Church Village","Cilfynydd","Glyn-coch",
      "Hawthorn","Llantrisant","Llantwit Fardre","Rhydfelen",
      "Taff's Well","Talbot Green","Tonteg","Treforest","Trehafod",
      "Ynysybwl","Coed-y-cwm","Graig","Hopkinstown","Nantgarw",
      "Trallwng","Upper Boat",

      "Brynna","Llanharan","Llanharry","Pontyclun","Tonyrefail",
      "Tyn-y-nant","Gilfach Goch","Groesfaen","Miskin (Llantrisant)",
      "Mwyndy","Thomastown"
    ];

    const areaInput = document.getElementById("bizAreaInput");
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

      name = newName;
      phone = newPhone;
      area = newArea;
      website = newWebsite;
      bio = newBio;

      document.getElementById("bizViewName").textContent = name || "Add your business name";
      document.getElementById("bizViewPhone").textContent = phone || "Add your phone";
      document.getElementById("bizViewArea").textContent = area || "Add your area";
      document.getElementById("bizViewWebsite").textContent = website || "Add your website";
      document.getElementById("bizViewBio").textContent = bio || "Tell customers what you offer";

      feedback.textContent = "✅ Business profile updated!";
      feedback.classList.add("biz-feedback-success");

      setTimeout(() => {
        feedback.textContent = "";
        feedback.classList.remove("biz-feedback-success");
      }, 1500);

      exitEdit();
    });

    /* ---------------- LOAD BUSINESS ADS ---------------- */
    const postsSnap = await getDocs(q);
    const container = document.getElementById("bizPosts");
    container.innerHTML = "";

    let adsCount = 0, totalViews = 0, totalLeads = 0;

    if (postsSnap.empty) {
      container.innerHTML = `<p class="biz-empty-msg">You haven’t posted any business ads yet.</p>`;
    }

    postsSnap.forEach(docSnap => {
      const p = docSnap.data();
      const id = docSnap.id;

      adsCount++;
      if (p.views) totalViews += p.views;
      if (p.leads) totalLeads += p.leads;

      container.innerHTML += `
        <div class="biz-card">
          <img src="${p.imageUrl || '/images/post-placeholder.jpg'}" class="biz-img">
          <div class="biz-info">
            <h3>${p.title}</h3>
            <p>${p.description}</p>
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

    document.getElementById("bizStatAdsCount").textContent = adsCount;
    document.getElementById("bizStatTotalViews").textContent = totalViews;
    document.getElementById("bizStatLeads").textContent = totalLeads;

    /* ---------------- DELETE BUTTONS ---------------- */
    document.querySelectorAll(".biz-delete").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this ad?")) return;

        const postId = btn.dataset.id;
        const postSnap = await getDoc(doc(db, "posts", postId));
        const post = { id: postId, ...postSnap.data() };

        await deletePostAndImages(post);
        loadView("business-dashboard");
      });
    });

    /* ---------------- AUTO DELETE OLD POSTS ---------------- */
    autoDeleteExpiredPosts(user.uid);

    /* ---------------- EDIT + NEW + LOGOUT ---------------- */
    document.querySelectorAll(".biz-edit").forEach(btn => {
      btn.addEventListener("click", () => {
        openScreen("editPost");
        window.editPostId = btn.dataset.id;
      });
    });

    document.getElementById("bizNewPostBtn").addEventListener("click", () => {
      openScreen("post");
    });

    document.getElementById("bizLogoutBtn").addEventListener("click", () => {
      document.getElementById("bizLogoutOverlay").style.display = "flex";
      signOut(auth).then(() => setTimeout(() => navigateToHome(), 2000));
    });
  });
});
