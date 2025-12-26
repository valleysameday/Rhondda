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

/* ================= POST GATE ================= */
function initPostGate() {
  /* ---------- STEP FLOW ---------- */
  const steps = [...document.querySelectorAll('#posts-grid .post-step')];
  const dots = [...document.querySelectorAll('.post-progress .dot')];
  let stepIndex = 0;

  function showStep(i) {
    if (i < 0 || i >= steps.length) return;

    steps.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));

    steps[i].classList.add('active');
    dots[i]?.classList.add('active');

    stepIndex = i;

    // Auto-focus title in step 2
    if (i === 1) {
      titleInput.focus();
      validateStep2();
    }
  }

  showStep(0);

  document.querySelectorAll('.post-next').forEach(btn =>
    btn.addEventListener('click', () => {
      if (btn.disabled) {
        // Shake animation for invalid step 2
        if (stepIndex === 1) {
          step2.classList.add('shake');
          setTimeout(() => step2.classList.remove('shake'), 300);
        }
        return;
      }
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

  // Add counters
  const titleCounter = document.createElement('small');
  titleCounter.style.fontSize = '12px';
  titleCounter.style.color = '#666';
  titleCounter.style.textAlign = 'right';
  titleInput.after(titleCounter);

  const descCounter = document.createElement('small');
  descCounter.style.fontSize = '12px';
  descCounter.style.color = '#666';
  descCounter.style.textAlign = 'right';
  descInput.after(descCounter);

  function validateStep2() {
    const titleVal = titleInput.value.trim();
    const descVal = descInput.value.trim();
    const titleOk = titleVal.length >= 3;
    const descOk = descVal.length >= 10;

    // Update counters
    titleCounter.textContent = `${titleVal.length}/70`;
    descCounter.textContent = `${descVal.length}/500`;

    nextBtn.disabled = !(titleOk && descOk);
  }

  ['input', 'keyup', 'change'].forEach(evt => {
    titleInput.addEventListener(evt, validateStep2);
    descInput.addEventListener(evt, validateStep2);
  });

  // Observe class changes to revalidate step 2 when shown
  const stepObserver = new MutationObserver(() => {
    if (step2.classList.contains('active')) validateStep2();
  });
  stepObserver.observe(step2, { attributes: true, attributeFilter: ['class'] });

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
