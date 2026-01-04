import {
  doc,
  getDoc,
  setDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

import { loadView } from "/index/js/main.js";

let auth, db;

/* =====================================================
   INIT SETTINGS MODULE
===================================================== */
export function initSettingsModule(a, d) {
  auth = a;
  db = d;
}

/* =====================================================
   RENDER SETTINGS TAB
===================================================== */
export async function renderSettingsTab() {
  const container = document.getElementById("settingsContainer");
  if (!container) return;

  const user = auth.currentUser;
  if (!user) {
    container.innerHTML = "<p>Please log in to view settings.</p>";
    return;
  }

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  const data = snap.data() || {};

  const joinedAt = data.createdAt
    ? new Date(data.createdAt).toLocaleDateString()
    : "Unknown";

  container.innerHTML = `
    <div class="settings-card">

      <h2>Your Profile</h2>

      <!-- PROFILE PHOTO -->
      <div class="settings-row">
        <label>Profile Photo</label>
        <div class="profile-photo-wrap">
          <img id="profilePhotoPreview" src="${data.photoURL || '/images/default-avatar.png'}" />
          <input type="file" id="profilePhotoInput" accept="image/*" />
        </div>
      </div>

      <!-- DISPLAY NAME -->
      <div class="settings-row">
        <label>Display Name</label>
        <input id="settingsDisplayName" type="text" value="${data.displayName || ""}" />
      </div>

      <!-- BIO -->
      <div class="settings-row">
        <label>Bio</label>
        <textarea id="settingsBio" placeholder="Tell people a bit about yourself...">${data.bio || ""}</textarea>
      </div>

      <!-- ACCOUNT TYPE -->
      <div class="settings-row readonly">
        <label>Account Type</label>
        <span>${data.isBusiness ? "Business Account" : "Seller Account"}</span>
      </div>

      <!-- JOIN DATE -->
      <div class="settings-row readonly">
        <label>Member Since</label>
        <span>${joinedAt}</span>
      </div>

      <button id="saveSettingsBtn" class="primary-btn">Save Changes</button>

      <hr class="settings-divider" />

      <h2>Security</h2>

      <!-- CHANGE EMAIL -->
      <div class="settings-row">
        <label>Change Email</label>
        <input id="settingsEmail" type="email" value="${user.email}" />
        <button id="changeEmailBtn" class="secondary-btn">Update Email</button>
      </div>

      <!-- CHANGE PASSWORD -->
      <div class="settings-row">
        <label>Change Password</label>
        <input id="settingsPassword" type="password" placeholder="New password" />
        <button id="changePasswordBtn" class="secondary-btn">Update Password</button>
      </div>

      <hr class="settings-divider" />

      <h2>Business Verification</h2>

      <div class="settings-row">
        <label>Upload Verification Document</label>
        <input type="file" id="verificationUpload" accept="image/*,.pdf" />
        <button id="uploadVerificationBtn" class="secondary-btn">Upload</button>
      </div>

      <hr class="settings-divider" />

      <h2>Public Profile</h2>

      <button id="previewProfileBtn" class="primary-btn">Preview My Profile</button>

      <hr class="settings-divider" />

      <h2>Danger Zone</h2>

      <button id="deleteAccountBtn" class="danger-btn">Delete My Account</button>

    </div>
  `;

  wireSettingsActions(userRef, user);
}

/* =====================================================
   WIRE BUTTON ACTIONS
===================================================== */
function wireSettingsActions(userRef, user) {
  /* SAVE PROFILE */
  document.getElementById("saveSettingsBtn").onclick = async () => {
    const displayName = document.getElementById("settingsDisplayName").value.trim();
    const bio = document.getElementById("settingsBio").value.trim();

    await setDoc(
      userRef,
      { displayName, bio, updatedAt: Date.now() },
      { merge: true }
    );

    alert("Profile updated");
  };

  /* PROFILE PHOTO UPLOAD */
  document.getElementById("profilePhotoInput").onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;

    const storage = getStorage();
    const fileRef = ref(storage, `profilePhotos/${user.uid}.jpg`);

    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);

    await setDoc(userRef, { photoURL: url }, { merge: true });

    document.getElementById("profilePhotoPreview").src = url;
    alert("Profile photo updated");
  };

  /* CHANGE EMAIL */
  document.getElementById("changeEmailBtn").onclick = async () => {
    const newEmail = document.getElementById("settingsEmail").value.trim();
    try {
      await user.updateEmail(newEmail);
      alert("Email updated");
    } catch (err) {
      alert("Error updating email: " + err.message);
    }
  };

  /* CHANGE PASSWORD */
  document.getElementById("changePasswordBtn").onclick = async () => {
    const newPass = document.getElementById("settingsPassword").value.trim();
    try {
      await user.updatePassword(newPass);
      alert("Password updated");
    } catch (err) {
      alert("Error updating password: " + err.message);
    }
  };

  /* BUSINESS VERIFICATION UPLOAD */
  document.getElementById("uploadVerificationBtn").onclick = async () => {
    const file = document.getElementById("verificationUpload").files[0];
    if (!file) return alert("Choose a file first");

    const storage = getStorage();
    const fileRef = ref(storage, `verification/${user.uid}/${file.name}`);

    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);

    await setDoc(userRef, { verificationFile: url }, { merge: true });

    alert("Verification uploaded");
  };

  /* PUBLIC PROFILE PREVIEW */
  document.getElementById("previewProfileBtn").onclick = () => {
    sessionStorage.setItem("profileUserId", user.uid);
    loadView("seller-profile", { forceInit: true });
  };

  /* DELETE ACCOUNT */
  document.getElementById("deleteAccountBtn").onclick = async () => {
    if (!confirm("Are you sure you want to permanently delete your account?")) return;

    await deleteDoc(userRef);
    await user.delete();

    alert("Account deleted");
    window.location.href = "/";
  };
}
