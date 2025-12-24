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

// ✅ Load Firebase FIRST
getFirebase().then(fb => {
  auth = fb.auth;
  db = fb.db;
  storage = fb.storage;

  console.log("✅ Firebase loaded");

  function startPostGate() {

    const postSubmitBtn = document.getElementById('postSubmitBtn');
    const loginSubmitBtn = document.getElementById('loginSubmit');
    const signupSubmitBtn = document.getElementById('signupSubmit');
    const forgotSubmit = document.getElementById('forgotSubmit');
    const forgotEmail = document.getElementById('forgotEmail');

    let postAttemptedData = null;

    /* ---------------- POST SUBMISSION ---------------- */
    postSubmitBtn?.addEventListener('click', async e => {
      e.preventDefault();

      const title = document.getElementById('postTitle').value.trim();
      const description = document.getElementById('postDescription').value.trim();
      const category = document.getElementById('postCategory').value;
      const subcategory = document.getElementById('postSubcategory').value;
      const image = document.getElementById('postImage').files[0];

      if (!title || !description || !category) {
        alert('Please fill all required fields.');
        return;
      }

      if (!auth.currentUser) {
        postAttemptedData = { title, description, category, subcategory, image };
        openScreen('login');
        return;
      }

      let imageUrl = null;
      if (image) {
        const storageRef = ref(storage, `posts/${Date.now()}_${image.name}`);
        await uploadBytes(storageRef, image);
        imageUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, 'posts'), {
        title,
        description,
        category,
        subcategory,
        imageUrl,
        createdAt: serverTimestamp(),
        userId: auth.currentUser.uid
      });

      alert('Your ad has been posted!');
      window.closeScreens();
    });

    /* ---------------- LOGIN ---------------- */
    loginSubmitBtn?.addEventListener('click', async e => {
      e.preventDefault();

      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;

      try {
        await signInWithEmailAndPassword(auth, email, password);

        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));

        if (userDoc.exists()) {
          window.firebaseUserDoc = userDoc.data();
          navigateToDashboard();   // ✅ SPA navigation
        }

      } catch (err) {
        alert(err.message);
      }
    });

    /* ---------------- SIGNUP ---------------- */
    signupSubmitBtn?.addEventListener('click', async e => {
      e.preventDefault();

      const email = document.getElementById('signupEmail').value.trim();
      const password = document.getElementById('signupPassword').value;
      const isBusiness = document.getElementById('isBusinessAccount').checked;

      try {
        await createUserWithEmailAndPassword(auth, email, password);

        await setDoc(doc(db, "users", auth.currentUser.uid), {
          email,
          isBusiness,
          createdAt: serverTimestamp()
        });

        window.firebaseUserDoc = { email, isBusiness };
        navigateToDashboard();   // ✅ SPA navigation

      } catch (err) {
        alert(err.message);
      }
    });

    /* ---------------- RESET PASSWORD ---------------- */
    window.resetPassword = async function (email) {
      try {
        await sendPasswordResetEmail(auth, email);
        openScreen('resetConfirm');
      } catch (err) {
        alert(err.message);
      }
    };

    forgotSubmit?.addEventListener('click', () => {
      const email = forgotEmail.value.trim();
      if (!email) return alert("Please enter your email");
      window.resetPassword(email);
    });

    /* ---------------- AUTH STATE ---------------- */
    onAuthStateChanged(auth, async user => {
      window.currentUser = user;

      if (user) {
        const snap = await getDoc(doc(db, "users", user.uid));
        window.firebaseUserDoc = snap.exists() ? snap.data() : null;
      } else {
        window.firebaseUserDoc = null;
      }

      window.firebaseAuthReady = true;
    });
  }

  // ✅ Ensure startPostGate ALWAYS runs
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startPostGate);
  } else {
    startPostGate();
  }

});
