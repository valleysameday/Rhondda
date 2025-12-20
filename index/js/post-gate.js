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

    if (!isLoggedIn) {
      // Save post inputs if any
      postAttemptedData = {
        title: document.getElementById('postTitle').value,
        description: document.getElementById('postDescription').value,
        category: document.getElementById('postCategory').value,
        subcategory: document.getElementById('postSubcategory').value
      };

      // Open login modal
      window.openScreen('login');
      return;
    }

    // Already logged in → open post modal
    window.openScreen('post');
  });

  // ----------------- POST SUBMISSION -----------------
  postSubmitBtn?.addEventListener('click', e => {
    e.preventDefault();

    const isLoggedIn = !!localStorage.getItem('user');
    if (!isLoggedIn) {
      // Should not happen, but safeguard
      window.openScreen('login');
      return;
    }

    // Collect inputs
    const title = document.getElementById('postTitle').value.trim();
    const description = document.getElementById('postDescription').value.trim();
    const category = document.getElementById('postCategory').value;
    const subcategory = document.getElementById('postSubcategory').value;
    const image = document.getElementById('postImage').files[0];

    // Submit the post — replace this with your API call
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
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');
  const signupSubmitBtn = document.getElementById('signupSubmitBtn');

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

      // Clear tracking
      postAttemptedData = null;
    }
  };

  loginSubmitBtn?.addEventListener('click', e => {
    e.preventDefault();
    // Perform login logic
    // On success:
    localStorage.setItem('user', 'true');
    afterAuth();
  });

  signupSubmitBtn?.addEventListener('click', e => {
    e.preventDefault();
    // Perform signup logic
    // On success:
    localStorage.setItem('user', 'true');
    afterAuth();
  });
});
