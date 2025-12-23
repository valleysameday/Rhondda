// =========================
// AD MODALS & ACTIONS
// =========================

const postModal = document.getElementById('postModal');
const postFeedback = document.getElementById('postFeedback');

// Open new ad modal
export function openAdModal() {
  postModal.style.display = 'flex';
  resetPostForm();
}

// Open edit ad modal with pre-filled data
export function openAdEditForm(adData) {
  postModal.style.display = 'flex';
  // Fill form with existing ad data
  document.getElementById('postTitle').value = adData.title;
  document.getElementById('postDescription').value = adData.description;
  document.getElementById('postPrice').value = adData.price || '';
  document.getElementById('postArea').value = adData.area || '';
  // Handle image preview if exists
  if (adData.imageUrl) {
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = `<img src="${adData.imageUrl}" alt="Ad Image" style="max-width:100px; max-height:100px;">`;
  }
  postFeedback.textContent = '';
}

// Open repost modal (duplicate an existing ad)
export function openAdRepostForm(adData) {
  postModal.style.display = 'flex';
  // Fill form but reset fields you want user to change
  document.getElementById('postTitle').value = adData.title;
  document.getElementById('postDescription').value = adData.description;
  document.getElementById('postPrice').value = adData.price || '';
  document.getElementById('postArea').value = adData.area || '';
  // Reset image preview
  document.getElementById('imagePreview').innerHTML = '';
  postFeedback.textContent = '';
}

// Share ad (copy link or open share options)
export function shareAd(adId) {
  const adUrl = `${window.location.origin}/ad/${adId}`;
  navigator.clipboard.writeText(adUrl)
    .then(() => alert('Ad link copied to clipboard!'))
    .catch(() => alert('Failed to copy ad link.'));
}

// Close modals
document.querySelectorAll('.modal .close').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.closest('.modal').style.display = 'none';
  });
});

// Reset post form
function resetPostForm() {
  document.getElementById('postTitle').value = '';
  document.getElementById('postDescription').value = '';
  document.getElementById('postPrice').value = '';
  document.getElementById('postArea').value = '';
  document.getElementById('postImage').value = '';
  document.getElementById('imagePreview').innerHTML = '';
  postFeedback.textContent = '';
  // Reset post flow to step 1
  document.querySelectorAll('#postFlow .post-step').forEach(step => step.style.display = 'none');
  document.querySelector('#postFlow .post-step[data-step="1"]').style.display = 'block';
}

// =========================
// POST FLOW NAVIGATION
// =========================
document.querySelectorAll('.post-next').forEach(btn => {
  btn.addEventListener('click', () => {
    const currentStep = btn.closest('.post-step');
    const nextStepNum = parseInt(currentStep.dataset.step) + 1;
    const nextStep = document.querySelector(`#postFlow .post-step[data-step="${nextStepNum}"]`);
    if (nextStep) {
      currentStep.style.display = 'none';
      nextStep.style.display = 'block';
    }
  });
});

document.querySelectorAll('.post-prev').forEach(btn => {
  btn.addEventListener('click', () => {
    const currentStep = btn.closest('.post-step');
    const prevStepNum = parseInt(currentStep.dataset.step) - 1;
    const prevStep = document.querySelector(`#postFlow .post-step[data-step="${prevStepNum}"]`);
    if (prevStep) {
      currentStep.style.display = 'none';
      prevStep.style.display = 'block';
    }
  });
});

// =========================
// IMAGE SELECT & PREVIEW
// =========================
const chooseImageBtn = document.getElementById('chooseImageBtn');
const postImage = document.getElementById('postImage');
const imagePreview = document.getElementById('imagePreview');

chooseImageBtn.addEventListener('click', () => postImage.click());
postImage.addEventListener('change', () => {
  const file = postImage.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width:100px; max-height:100px;">`;
  };
  reader.readAsDataURL(file);
});
