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

/* ---------------------------------------------------
   ✅ IMAGE COMPRESSION (RUNS IN BROWSER)
--------------------------------------------------- */
function compressImage(file, maxWidth = 1200, quality = 0.7) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const scale = img.width > maxWidth ? maxWidth / img.width : 1;
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        blob => resolve(blob || file), // fallback to original if something goes wrong
        "image/jpeg",
        quality
      );
    };
    img.src = URL.createObjectURL(file);
  });
}

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

    const loginFeedback = document.getElementById("loginFeedback");
    const signupFeedback = document.getElementById("signupFeedback");
    const postFeedback = document.getElementById("postFeedback");

    let postAttemptedData = null;

    /* ---------------- POST SUBMISSION ---------------- */
    postSubmitBtn?.addEventListener('click', async e => {
      e.preventDefault();

      const title = document.getElementById('postTitle').value.trim();
      const description = document.getElementById('postDescription').value.trim();
      const category = document.getElementById('postCategory').value;
      const subcategory = document.getElementById('postSubcategory').value;
      const priceInput = document.getElementById('postPrice').value.trim();
      const price = priceInput === "" ? null : Number(priceInput);

      const files = Array.from(document.getElementById('postImage').files || []);
      
      if (!title || !description || !category) {
        postFeedback.textContent = "❌ Please fill all required fields.";
        postFeedback.classList.add("feedback-error", "shake");
        setTimeout(() => postFeedback.classList.remove("shake"), 300);
        return;
      }

      if (!auth.currentUser) {
        postAttemptedData = { title, description, category, subcategory, price };
        // we don’t keep files here (can’t re‑use safely)
        openScreen('login');
        return;
      }

      postFeedback.textContent = "Uploading your ad…";

      // ✅ Upload all images (if any) with compression
      const imageUrls = [];
      for (const file of files) {
        try {
          const compressedBlob = await compressImage(file, 1200, 0.7);
          const slimFileName = file.name.replace(/\.(png|jpg|jpeg|webp|gif)$/i, "") + "_slim.jpg";
          const storageRef = ref(storage, `posts/${Date.now()}_${slimFileName}`);

          await uploadBytes(storageRef, compressedBlob);
          const url = await getDownloadURL(storageRef);
          imageUrls.push(url);
        } catch (err) {
          console.error("Image upload failed for file:", file.name, err);
        }
      }

      // ✅ Thumbnail for home feed = first image or null
      const imageUrl = imageUrls[0] || null;

      await addDoc(collection(db, 'posts'), {
        title,
        description,
        category,
        subcategory,
        price,
        imageUrl,      // ✅ used on home feed
        imageUrls,     // ✅ full gallery on view‑post
        createdAt: serverTimestamp(),
        userId: auth.currentUser.uid,
        businessId: window.firebaseUserDoc?.isBusiness ? auth.currentUser.uid : null
      });

      postFeedback.textContent = "✅ Your ad is live!";
      postFeedback.classList.add("feedback-success");

      setTimeout(() => window.closeScreens(), 800);
    });

    /* ---------------- LOGIN ---------------- */
    loginSubmitBtn?.addEventListener('click', async e => {
      e.preventDefault();

      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;

      loginFeedback.textContent = "Checking details…";

      try {
        await signInWithEmailAndPassword(auth, email, password);

        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));

        if (userDoc.exists()) {
          window.firebaseUserDoc = userDoc.data();

          loginFeedback.textContent = "✅ Correct — loading your dashboard…";
          loginFeedback.classList.add("feedback-success");

          setTimeout(() => {
            window.closeScreens();
            navigateToDashboard();
          }, 600);
        }

      } catch (err) {
        loginFeedback.textContent = "❌ Incorrect email or password.";
        loginFeedback.classList.add("feedback-error", "shake");
        setTimeout(() => loginFeedback.classList.remove("shake"), 300);
      }
    });

    /* ---------------- SIGNUP ---------------- */
    signupSubmitBtn?.addEventListener('click', async e => {
      e.preventDefault();

      const email = document.getElementById('signupEmail').value.trim();
      const password = document.getElementById('signupPassword').value;
      const isBusiness = document.getElementById('isBusinessAccount').checked;

      signupFeedback.textContent = "Creating your account…";

      try {
        await createUserWithEmailAndPassword(auth, email, password);

        await setDoc(doc(db, "users", auth.currentUser.uid), {
          email,
          isBusiness,
          createdAt: serverTimestamp()
        });

        window.firebaseUserDoc = { email, isBusiness };

        signupFeedback.textContent = "✅ Account created — loading dashboard…";
        signupFeedback.classList.add("feedback-success");

        setTimeout(() => {
          window.closeScreens();
          navigateToDashboard();
        }, 600);

      } catch (err) {
        signupFeedback.textContent = "❌ " + err.message;
        signupFeedback.classList.add("feedback-error", "shake");
        setTimeout(() => signupFeedback.classList.remove("shake"), 300);
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
      if (!email) {
        loginFeedback.textContent = "❌ Please enter your email.";
        loginFeedback.classList.add("feedback-error");
        return;
      }
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
