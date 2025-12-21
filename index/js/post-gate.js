// post-gate.js
import { getFirebase } from '/index/js/firebase/init.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';

let auth, db, storage;

// ✅ Load Firebase FIRST
getFirebase().then(fb => {
  auth = fb.auth;
  db = fb.db;
  storage = fb.storage;

  console.log("✅ Firebase loaded");

  // ✅ Now safe to run your app logic
  document.addEventListener('DOMContentLoaded', () => {

    const postModal = document.getElementById('postModal');
    const loginModal = document.getElementById('loginModal');
    const signupModal = document.getElementById('signupModal');

    const openPostBtn = document.getElementById('openPostModal');
    const postSubmitBtn = document.getElementById('postSubmitBtn');

    let postAttemptedData = null;

    // ----------------- OPEN POST MODAL -----------------
    openPostBtn?.addEventListener('click', e => {
      e.preventDefault();
      window.openScreen('post');
    });

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
        window.openScreen('login');
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

      // Clear form
      document.getElementById('postTitle').value = '';
      document.getElementById('postDescription').value = '';
      document.getElementById('postCategory').value = '';
      document.getElementById('postSubcategory').innerHTML = '<option value="">Select subcategory</option>';
      document.getElementById('imagePreview').innerHTML = '';
      document.getElementById('postImage').value = '';

      window.closeScreens();
    });

    // ----------------- LOGIN / SIGNUP -----------------
    const loginSubmitBtn = document.getElementById('loginSubmit');
    const signupSubmitBtn = document.getElementById('signupSubmit');

    const afterAuth = () => {
      window.closeScreens();

      if (postAttemptedData) {
        window.openScreen('post');

        document.getElementById('postTitle').value = postAttemptedData.title || '';
        document.getElementById('postDescription').value = postAttemptedData.description || '';
        document.getElementById('postCategory').value = postAttemptedData.category || '';

        const event = new Event('change');
        document.getElementById('postCategory').dispatchEvent(event);

        document.getElementById('postSubcategory').value = postAttemptedData.subcategory || '';

        if (postAttemptedData.image) {
          const reader = new FileReader();
          reader.onload = e => {
            document.getElementById('imagePreview').innerHTML = `<img src="${e.target.result}" alt="Preview">`;
          };
          reader.readAsDataURL(postAttemptedData.image);
        }

        postAttemptedData = null;
      }
    };

    loginSubmitBtn?.addEventListener('click', async e => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;

      try {
        await signInWithEmailAndPassword(auth, email, password);
        afterAuth();
      } catch (err) {
        alert(err.message);
      }
    });

    signupSubmitBtn?.addEventListener('click', async e => {
      e.preventDefault();
      const email = document.getElementById('signupEmail').value.trim();
      const password = document.getElementById('signupPassword').value;

      try {
        await createUserWithEmailAndPassword(auth, email, password);
        afterAuth();
      } catch (err) {
        alert(err.message);
      }
    });

    // ----------------- AUTH STATE -----------------
    onAuthStateChanged(auth, user => {
      if (user) {
        console.log('User logged in:', user.email);
      } else {
        console.log('No user logged in');
      }
    });

  }); // DOMContentLoaded
}); // getFirebase().then
