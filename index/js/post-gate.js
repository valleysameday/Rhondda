document.addEventListener('DOMContentLoaded', () => {
  const postModal = document.getElementById('postModal');
  const loginModal = document.getElementById('loginModal');
  const signupModal = document.getElementById('signupModal');

  const openPostBtn = document.getElementById('openPostModal');
  const postSubmitBtn = document.getElementById('postSubmitBtn');
  const loginSubmitBtn = document.getElementById('loginSubmit');
  const signupSubmitBtn = document.getElementById('signupSubmit');

  // Track attempted post if user is not logged in
  let postAttemptedData = null;

  // ----------------- OPEN POST MODAL -----------------
  openPostBtn?.addEventListener('click', e => {
    e.preventDefault();
    window.openScreen('post'); // Always open form first
  });

  // ----------------- POST SUBMISSION -----------------
  postSubmitBtn?.addEventListener('click', e => {
    e.preventDefault();

    // Collect post data
    postAttemptedData = {
      title: document.getElementById('postTitle').value.trim(),
      description: document.getElementById('postDescription').value.trim(),
      category: document.getElementById('postCategory').value,
      subcategory: document.getElementById('postSubcategory').value,
      image: document.getElementById('postImage').files[0]
    };

    const isLoggedIn = !!localStorage.getItem('user');

    if (!isLoggedIn) {
      // Open login modal
      window.openScreen('login');
      return;
    }

    // Already logged in → submit immediately
    submitPost(postAttemptedData);
    postAttemptedData = null;
  });

  // ----------------- LOGIN / SIGNUP SUCCESS -----------------
  const afterAuth = () => {
    window.closeScreens();

    if (postAttemptedData) {
      // Submit saved post automatically
      submitPost(postAttemptedData);
      postAttemptedData = null;
    }
  };

  loginSubmitBtn?.addEventListener('click', e => {
    e.preventDefault();
    // TODO: Replace with real login logic
    localStorage.setItem('user', 'true'); // Mock login
    afterAuth();
  });

  signupSubmitBtn?.addEventListener('click', e => {
    e.preventDefault();
    // TODO: Replace with real signup logic
    localStorage.setItem('user', 'true'); // Mock signup
    afterAuth();
  });

  // ----------------- SUBMIT POST FUNCTION -----------------
  function submitPost(data) {
    console.log('Submitting post:', data);

    // Mock submission — replace with actual API call
    alert('Your ad has been posted!');

    // Clear form
    document.getElementById('postTitle').value = '';
    document.getElementById('postDescription').value = '';
    document.getElementById('postCategory').value = '';
    document.getElementById('postSubcategory').innerHTML = '<option value="">Select subcategory</option>';
    document.getElementById('imagePreview').innerHTML = '';
    document.getElementById('postImage').value = '';
  }
});
