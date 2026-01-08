import {
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  updateDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function init({ auth, db }) {
  console.log("⚙️ My Details init");

  const user = auth.currentUser;
  if (!user) return;

  const uid = user.uid;

  // Load Firestore profile
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  const data = snap.data() || {};

  // Auto-fill fields
  document.getElementById("acc-name").value = data.name || "";
  document.getElementById("acc-phone").value = data.phone || "";
  document.getElementById("acc-email").value = user.email || "";

  /* =====================================================
     CONFIRMATION MODAL LOGIC
  ===================================================== */
  const modal = document.getElementById("confirmModal");
  const title = document.getElementById("confirmTitle");
  const message = document.getElementById("confirmMessage");
  const btnYes = document.getElementById("confirmYes");
  const btnCancel = document.getElementById("confirmCancel");

  function confirmAction(titleText, msg, callback) {
    title.innerText = titleText;
    message.innerText = msg;

    modal.classList.remove("hidden");

    btnYes.onclick = () => {
      modal.classList.add("hidden");
      callback();
    };

    btnCancel.onclick = () => {
      modal.classList.add("hidden");
    };
  }

  /* =====================================================
     SAVE PROFILE (Firestore)
  ===================================================== */
  document.getElementById("saveProfile").addEventListener("click", async () => {
    await updateDoc(userRef, {
      name: document.getElementById("acc-name").value.trim(),
      phone: document.getElementById("acc-phone").value.trim()
    });

    alert("Profile updated");
  });

  /* =====================================================
     CHANGE EMAIL
  ===================================================== */
  document.getElementById("changeEmail").addEventListener("click", () => {
    confirmAction(
      "Confirm Email Change",
      "Are you sure you want to update your email?",
      async () => {
        const newEmail = document.getElementById("acc-email").value.trim();
        const pass = document.getElementById("acc-email-pass").value;

        try {
          const cred = EmailAuthProvider.credential(user.email, pass);
          await reauthenticateWithCredential(user, cred);
          await updateEmail(user, newEmail);
          alert("Email updated");
        } catch (err) {
          alert("Email update failed: " + err.message);
        }
      }
    );
  });

  /* =====================================================
     CHANGE PASSWORD
  ===================================================== */
  document.getElementById("changePassword").addEventListener("click", () => {
    confirmAction(
      "Confirm Password Change",
      "Are you sure you want to change your password?",
      async () => {
        const oldPass = document.getElementById("acc-old-pass").value;
        const newPass = document.getElementById("acc-new-pass").value;

        try {
          const cred = EmailAuthProvider.credential(user.email, oldPass);
          await reauthenticateWithCredential(user, cred);
          await updatePassword(user, newPass);
          alert("Password updated");
        } catch (err) {
          alert("Password update failed: " + err.message);
        }
      }
    );
  });

  /* =====================================================
     DEACTIVATE ACCOUNT
  ===================================================== */
  document.getElementById("deactivateAccount").addEventListener("click", () => {
    confirmAction(
      "Deactivate Account",
      "Are you sure you want to deactivate your account?",
      async () => {
        await updateDoc(userRef, { deactivated: true });
        auth.signOut();
        alert("Your account has been deactivated");
      }
    );
  });
}
