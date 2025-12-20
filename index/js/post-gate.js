document.addEventListener('DOMContentLoaded', () => {
  const postModal = document.getElementById('postModal');
  const loginModal = document.getElementById('loginModal');
  const signupModal = document.getElementById('signupModal');

  const openPostBtn = document.getElementById('openPostModal');
  const postSubmitBtn = document.getElementById('postSubmitBtn');
  
  // Track attempted post
  let postAttemptedData = null;

  // ----------------- OPEN POST MODAL -----------------
  openPostBtn?.addEventListener('click', e => {
    e.preventDefault();

    const isLoggedIn = !!localStorage.getItem('user');

    // Already logged in → open post modal
    if (isLoggedIn) {
      window.openScreen('post');
      return;
    }

    // Not logged in → open post modal anyway so they can fill form
    window.openScreen('post');
  });

  // ----------------- POST SUBMISSION -----------------
  postSubmitBtn?.addEventListener('click', e => {
    e.preventDefault();

    // Collect inputs
    const title = document.getElementById('postTitle').value.trim();
    const description = document.getElementById('postDescription').value.trim();
    const category = document.getElementById('postCategory').value;
    const subcategory = document.getElementById('postSubcategory').value;
    const image = document.getElementById('postImage').files[0];

    // -------------------- VALIDATION --------------------
    if (!title) return alert("Please enter a title.");
    if (!description) return alert("Please enter a description.");
    if (!category) return alert("Please select a category.");

    // -------------------- CHECK LOGIN --------------------
    const isLoggedIn = !!localStorage.getItem('user');
    if (!isLoggedIn) {
      // Save form data temporarily
      postAttemptedData = { title, description, category, subcategory, image };
      window.openScreen('login');
      return;
    }

    // -------------------- SUBMIT POST --------------------
    console.log({ title, description, category, subcategory, image });
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

    // Reopen post modal if user tried to post
    if (postAttemptedData) {
      window.openScreen('post');

      // Restore previous inputs
      document.getElementById('postTitle').value = postAttemptedData.title || '';
      document.getElementById('postDescription').value = postAttemptedData.description || '';
      document.getElementById('postCategory').value = postAttemptedData.category || '';
      
      // Trigger subcategory population
      const event = new Event('change');
      document.getElementById('postCategory').dispatchEvent(event);

      document.getElementById('postSubcategory').value = postAttemptedData.subcategory || '';

      // Restore image preview if file exists
      if (postAttemptedData.image) {
        const reader = new FileReader();
        reader.onload = e => {
          document.getElementById('imagePreview').innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(postAttemptedData.image);
      }

      // Clear tracking
      postAttemptedData = null;
    }
  };

  loginSubmitBtn?.addEventListener('click', e => {
    e.preventDefault();
    // Perform login logic
    localStorage.setItem('user', 'true');
    afterAuth();
  });

  signupSubmitBtn?.addEventListener('click', e => {
    e.preventDefault();
    // Perform signup logic
    localStorage.setItem('user', 'true');
    afterAuth();
  });
});
