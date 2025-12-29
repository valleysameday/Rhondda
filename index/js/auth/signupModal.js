// index/js/auth/signupModal.js
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const auth = getAuth();

export function openSignupModal() {
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

  if (!signupBtn || !emailInput || !passInput) return;

  signupBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passInput.value.trim();
    feedback.textContent = "";

    if (!email || !password) {
      feedback.textContent = "Please enter both email and password.";
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      feedback.textContent = "Account created!";
      closeModal();
    } catch (err) {
      feedback.textContent = err.message;
      console.error("Signup error:", err);
    }
  });
}
