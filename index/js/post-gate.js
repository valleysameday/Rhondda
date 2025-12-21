// post-gate.js
import { getFirebase } from '/index/js/firebase/init.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';

let auth, db, storage;

getFirebase().then(fb => {
  auth = fb.auth;
  db = fb.db;
  storage = fb.storage;

  console.log("✅ Firebase loaded");

  document.addEventListener('DOMContentLoaded', () => {

    const postSubmitBtn = document.getElementById('postSubmitBtn');
    const loginSubmitBtn = document.getElementById('loginSubmit');
    const signupSubmitBtn = document.getElementById('signupSubmit');

    let postAttemptedData = null;

    // ----------------- POST SUBMISSION -----------------
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

    // ----------------- LOGIN -----------------
    loginSubmitBtn?.addEventListener('click', async e => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;

      try {
        await signInWithEmailAndPassword(auth, email, password);
        window.closeScreens();
      } catch (err) {
        alert(err.message);
      }
    });

    // ----------------- SIGNUP -----------------
    signupSubmitBtn?.addEventListener('click', async e => {
      e.preventDefault();
      const email = document.getElementById('signupEmail').value.trim();
      const password = document.getElementById('signupPassword').value;

      try {
        await createUserWithEmailAndPassword(auth, email, password);
        window.closeScreens();
      } catch (err) {
        alert(err.message);
      }
    });

    // ----------------- RESET PASSWORD -----------------
    window.resetPassword = async function (email) {
      try {
        await sendPasswordResetEmail(auth, email);
        openScreen('resetConfirm');
      } catch (err) {
        alert(err.message);
      }
    };

    // ----------------- AUTH STATE -----------------
    onAuthStateChanged(auth, user => {
      if (user) console.log('User logged in:', user.email);
      else console.log('No user logged in');
    });

  });
});
