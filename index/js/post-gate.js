/* ---------------------------------------------------
   POST GATE – 2026 UX
--------------------------------------------------- */

const categorySelect = document.getElementById("postCategory");
const subSelect = document.getElementById("postSubcategory");
const subWrap = document.getElementById("subcategoryWrapper");

const priceWrap = document.getElementById("priceWrapper");
const priceInput = document.getElementById("postPrice");

const chooseImageBtn = document.getElementById("chooseImageBtn");
const postImageInput = document.getElementById("postImage");
const previewBox = document.getElementById("imagePreview");

const postFeedback = document.getElementById("postFeedback");
const postSubmitBtn = document.getElementById("postSubmitBtn");

/* CATEGORIES */
const subcategories = {
  forsale: ["Furniture", "Electronics", "Clothes", "Toys", "Other"],
  jobs: ["Trades", "Cleaning", "Care Work", "Driving", "Other"],
  property: ["To Rent", "To Buy", "Rooms", "Commercial"],
  events: ["Music", "Sports", "Community", "Classes"],
  community: ["Lost & Found", "Local Info", "Announcements"],
  free: ["Giveaway", "Scrap", "Leftovers"]
};

/* CATEGORY CHANGE */
categorySelect.addEventListener("change", () => {
  const cat = categorySelect.value;

  subSelect.innerHTML = "";
  subWrap.classList.remove("active");

  if (!cat || !subcategories[cat]) return;

  subcategories[cat].forEach(sub => {
    const opt = document.createElement("option");
    opt.value = sub.toLowerCase();
    opt.textContent = sub;
    subSelect.appendChild(opt);
  });

  subWrap.classList.add("active");

  // Free = no price
  if (cat === "free") {
    priceWrap.classList.add("disabled");
    priceInput.value = "";
  } else {
    priceWrap.classList.remove("disabled");
  }
});

/* IMAGE PICKER */
chooseImageBtn.addEventListener("click", () => postImageInput.click());

postImageInput.addEventListener("change", () => {
  const file = postImageInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    previewBox.innerHTML =
      `<img src="${e.target.result}" class="preview-img">`;
  };
  reader.readAsDataURL(file);
});

/* SUBMIT */
postSubmitBtn.addEventListener("click", async () => {
  const title = postTitle.value.trim();
  const description = postDescription.value.trim();
  const category = categorySelect.value;
  const subcategory = subSelect.value;
  const area = postArea.value.trim();
  const price = postPrice.value ? Number(postPrice.value) : null;

  if (!category || !subcategory || !title || !description) {
    postFeedback.textContent = "❌ Please complete all required fields.";
    postFeedback.className = "feedback-text feedback-error shake";
    return;
  }

  if (!window.currentUser) {
    postFeedback.textContent = "❌ Please log in to post.";
    postFeedback.className = "feedback-text feedback-error";
    return;
  }

  postFeedback.textContent = "Posting your ad…";

  // Image upload handled elsewhere (your existing compression + upload)

  // Firestore write handled in your existing submit logic
});
