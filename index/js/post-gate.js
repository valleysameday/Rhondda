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
  setDoc
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

function initPostGate() {

  const steps = [...document.querySelectorAll('#posts-grid .post-step')];
  const dots = [...document.querySelectorAll('.post-progress .dot')];
  let stepIndex = 0;

  function showStep(i) {
    if (i < 0 || i >= steps.length) return;
    steps.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    steps[i].classList.add('active');
    dots[i].classList.add('active');
    stepIndex = i;

    // Re-run step2 validation when shown
    if (i === 1) validateStep2();
    // Auto-focus title
    if (i === 1) titleInput.focus();
  }

  document.querySelectorAll('.post-next').forEach(btn =>
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      showStep(stepIndex + 1);
    })
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

  /* ---------- STEP 2 VALIDATION ---------- */
  const step2 = document.querySelector('#posts-grid .post-step[data-step="2"]');
  const titleInput = step2.querySelector('#postTitle');
  const descInput = step2.querySelector('#postDescription');
  const nextBtn = step2.querySelector('.post-next');

  function validateStep2() {
    const titleOk = titleInput.value.trim().length >= 3;
    const descOk = descInput.value.trim().length >= 10;
    nextBtn.disabled = !(titleOk && descOk);
  }

  // Run on typing
  ['input', 'keyup', 'change'].forEach(evt => {
    titleInput.addEventListener(evt, validateStep2);
    descInput.addEventListener(evt, validateStep2);
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
  const postSubmitBtn = document.getElementById('postSubmitBtn');
  postSubmitBtn?.addEventListener('click', async e => {
    e.preventDefault();

    const title = titleInput.value.trim();
    const description = descInput.value.trim();
    const area = document.getElementById('postArea').value.trim() || null;
    const price = document.getElementById('postPrice').value
      ? Number(document.getElementById('postPrice').value)
      : null;

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
    postDraft = null;
  });

  /* ---------- AUTH ---------- */
  onAuthStateChanged(auth, async user => {
    window.currentUser = user;
    if (user && postDraft) {
      await submitPost(postDraft, images);
      postDraft = null;
    }
  });

  /* ---------- LOGIN / SIGNUP / RESET ---------- */
  loginSubmit?.addEventListener('click', async () => {
    await signInWithEmailAndPassword(auth, loginEmail.value.trim(), loginPassword.value);
    closeScreens();
  });

  signupSubmit?.addEventListener('click', async () => {
    const isBusiness = isBusinessAccount.checked;
    await createUserWithEmailAndPassword(auth, signupEmail.value.trim(), signupPassword.value);
    await setDoc(doc(db, 'users', auth.currentUser.uid), {
      email: auth.currentUser.email,
      isBusiness,
      createdAt: serverTimestamp()
    });
    closeScreens();
  });

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

/* ================= CSS ADDITIONS ================= */
/* Add to your CSS file or <style> */
const style = document.createElement('style');
style.textContent = `
  .shake {
    animation: shake 0.3s;
  }
  @keyframes shake {
    0% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    50% { transform: translateX(5px); }
    75% { transform: translateX(-5px); }
    100% { transform: translateX(0); }
  }
`;
document.head.appendChild(style);
