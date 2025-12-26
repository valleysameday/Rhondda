// post-gate.js
import { getFirebase } from '/index/js/firebase/init.js';

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

import {
  ref,
  uploadBytes,
  getDownloadURL
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';

let auth, db, storage;
let postDraft = null;

/* ================= FIREBASE INIT ================= */
getFirebase().then(fb => {
  auth = fb.auth;
  db = fb.db;
  storage = fb.storage;
  initPostGate();
});

/* ================= POST GATE ================= */
function initPostGate() {

  /* ---------- STEP FLOW ---------- */
  const steps = [...document.querySelectorAll('#posts-grid .post-step')];
  let stepIndex = 0;

  function showStep(i) {
    steps.forEach(s => s.classList.remove('active'));
    steps[i]?.classList.add('active');
    stepIndex = i;
  }

  showStep(0);

  document.querySelectorAll('.post-next').forEach(btn =>
    btn.addEventListener('click', () => showStep(stepIndex + 1))
  );

  document.querySelectorAll('.post-prev').forEach(btn =>
    btn.addEventListener('click', () => showStep(stepIndex - 1))
  );

  /* ---------- CATEGORY SELECTION ---------- */
  let selectedCategory = null;

  document.querySelectorAll('[data-category]').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedCategory = btn.dataset.category;
      showStep(1);
    });
  });

  /* ---------- IMAGE PREVIEW ---------- */
  const imageInput = document.getElementById('postImages');
  const previewGrid = document.getElementById('imagePreview');
  let images = [];

  document.getElementById('addPhotosBtn')?.addEventListener('click', () => {
    imageInput.click();
  });

  imageInput?.addEventListener('change', () => {
    previewGrid.innerHTML = '';
    images = Array.from(imageInput.files).slice(0, 4);

    images.forEach(file => {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      previewGrid.appendChild(img);
    });
  });

  /* ---------- POST SUBMIT ---------- */
  document.getElementById('postSubmitBtn')?.addEventListener('click', async e => {
    e.preventDefault();

    const title = postTitle.value.trim();
    const description = postDescription.value.trim();
    const area = postArea.value.trim() || null;
    const price = postPrice.value ? Number(postPrice.value) : null;

    if (!title || !description || !selectedCategory) {
      alert('Please complete all required fields');
      return;
    }

    postDraft = { title, description, area, price, category: selectedCategory };

    if (!auth.currentUser) {
      openScreen('login');
      return;
    }

    await submitPost(postDraft, images);
  });

  /* ---------- AUTH ---------- */
  onAuthStateChanged(auth, async user => {
    window.currentUser = user;

    if (user && postDraft) {
      await submitPost(postDraft, images);
      postDraft = null;
    }
  });

  /* ---------- LOGIN ---------- */
  loginSubmit?.addEventListener('click', async () => {
    await signInWithEmailAndPassword(
      auth,
      loginEmail.value.trim(),
      loginPassword.value
    );
    closeScreens();
  });

  /* ---------- SIGNUP ---------- */
  signupSubmit?.addEventListener('click', async () => {
    const isBusiness = isBusinessAccount.checked;

    await createUserWithEmailAndPassword(
      auth,
      signupEmail.value.trim(),
      signupPassword.value
    );

    await setDoc(doc(db, 'users', auth.currentUser.uid), {
      email: auth.currentUser.email,
      isBusiness,
      createdAt: serverTimestamp()
    });

    closeScreens();
  });

  /* ---------- PASSWORD RESET ---------- */
  forgotSubmit?.addEventListener('click', async () => {
    await sendPasswordResetEmail(auth, forgotEmail.value.trim());
    openScreen('resetConfirm');
  });
}

/* ================= POST UPLOAD ================= */
async function submitPost(data, images) {

  const imageUrls = [];

  for (const img of images) {
    const storageRef = ref(storage, `posts/${auth.currentUser.uid}/${Date.now()}_${img.name}`);
    await uploadBytes(storageRef, img);
    imageUrls.push(await getDownloadURL(storageRef));
  }

  await addDoc(collection(db, 'posts'), {
    ...data,
    images: imageUrls,
    userId: auth.currentUser.uid,
    createdAt: serverTimestamp(),
    status: 'live'
  });

  alert('Your ad is live 🎉');
  closeScreens();
}
