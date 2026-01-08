import {
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  PhoneAuthProvider,
  multiFactor,
  PhoneMultiFactorGenerator
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

  // Fill fields
  document.getElementById("acc-name").value = data.name || "";
  document.getElementById("acc-phone").value = data.phone || "";
  document.getElementById("acc-email").value = user.email || "";
  document.getElementById("acc-2fa-phone").value = data.twoFAphone || "";

  /* ============================
     SAVE PROFILE (Firestore)
  ============================ */
  document.getElementById("saveProfile").addEventListener("click", async () => {
    const name = document.getElementById("acc-name").value.trim();
    const phone = document.getElementById("acc-phone").value.trim();

    await updateDoc(userRef, { name, phone });

    alert("Profile updated");
  });

  /* ============================
     CHANGE EMAIL (Auth)
  ============================ */
  document.getElementById("changeEmail").addEventListener("click", async () => {
    const newEmail = document.getElementById("acc-email").value.trim();
    const pass = document.getElementById("acc-email-pass").value;

    if (!newEmail || !pass) {
      alert("Enter email + password");
      return;
    }

    try {
      const cred = EmailAuthProvider.credential(user.email, pass);
      await reauthenticateWithCredential(user, cred);
      await updateEmail(user, newEmail);

      alert("Email updated");
    } catch (err) {
      console.error(err);
      alert("Email update failed: " + err.message);
    }
  });

  /* ============================
     CHANGE PASSWORD (Auth)
  ============================ */
  document.getElementById("changePassword").addEventListener("click", async () => {
    const oldPass = document.getElementById("acc-old-pass").value;
    const newPass = document.getElementById("acc-new-pass").value;

    if (!oldPass || !newPass) {
      alert("Enter old + new password");
      return;
    }

    try {
      const cred = EmailAuthProvider.credential(user.email, oldPass);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPass);

      alert("Password updated");
    } catch (err) {
      console.error(err);
      alert("Password update failed: " + err.message);
    }
  });

  /* ============================
     ENABLE 2FA (SMS)
  ============================ */
  document.getElementById("enable2FA").addEventListener("click", async () => {
    const phone = document.getElementById("acc-2fa-phone").value.trim();
    if (!phone) return alert("Enter phone number");

    try {
      const session = await multiFactor(user).getSession();
      const phoneOpts = { phoneNumber: phone, session };

      const provider = new PhoneAuthProvider(auth);
      const verificationId = await provider.verifyPhoneNumber(phoneOpts, window.recaptchaVerifier);

      const code = prompt("Enter the SMS code");
      const cred = PhoneAuthProvider.credential(verificationId, code);

      await multiFactor(user).enroll(cred, "SMS 2FA");

      await updateDoc(userRef, { twoFAphone: phone });

      alert("2FA enabled");
    } catch (err) {
      console.error(err);
      alert("Failed to enable 2FA: " + err.message);
    }
  });

  /* ============================
     DISABLE 2FA
  ============================ */
  document.getElementById("disable2FA").addEventListener("click", async () => {
    try {
      const enrolled = multiFactor(user).enrolledFactors;
      if (enrolled.length === 0) return alert("2FA is not enabled");

      await multiFactor(user).unenroll(enrolled[0]);

      await updateDoc(userRef, { twoFAphone: "" });

      alert("2FA disabled");
    } catch (err) {
      console.error(err);
      alert("Failed to disable 2FA: " + err.message);
    }
  });

  /* ============================
     DEACTIVATE ACCOUNT
  ============================ */
  document.getElementById("deactivateAccount").addEventListener("click", async () => {
    if (!confirm("Are you sure you want to deactivate your account?")) return;

    await updateDoc(userRef, { deactivated: true });

    auth.signOut();

    alert("Your account has been deactivated");
  });
}
