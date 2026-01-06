// index/js/auth/signupModal.js
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getFirebase } from "/index/js/firebase/init.js";

export function openSignupModal(auth) {
  const modal = document.getElementById("signup");
  if (!modal) return;
  modal.style.display = "flex";
  document.body.classList.add("modal-open");

  const closeModal = () => {
    modal.style.display = "none";
    document.body.classList.remove("modal-open");
  };

  modal.querySelectorAll(".close").forEach(btn => btn.addEventListener("click", closeModal));

  const signupBtn = modal.querySelector("#signupSubmit");
  const emailInput = modal.querySelector("#signupEmail");
  const passInput = modal.querySelector("#signupPassword");
  const feedback = modal.querySelector("#signupFeedback");

  signupBtn.replaceWith(signupBtn.cloneNode(true));
  const newSignupBtn = modal.querySelector("#signupSubmit");

  newSignupBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passInput.value.trim();
    feedback.textContent = "";

    if (!email || !password) {
      feedback.textContent = "Please enter both email and password.";
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);

      const fb = await getFirebase();
      const db = fb.db;

      await setDoc(doc(db, "users", userCred.user.uid), {
        email,
        createdAt: serverTimestamp(),
        isAdmin: false,
        name: email.split("@")[0]
      });

      feedback.textContent = "Account created!";
      closeModal();

    } catch (err) {
      feedback.textContent = err.message;
      console.error("Signup error:", err);
    }
  });
}
