// index/js/auth/loginModal.js
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { onAuthReady } from "./state.js";

const auth = getAuth();

export function openLoginModal() {
  const modal = document.getElementById("login");
  if (!modal) return;
  modal.style.display = "flex";
  document.body.classList.add("modal-open");

  const closeModal = () => {
    modal.style.display = "none";
    document.body.classList.remove("modal-open");
  };

  modal.querySelectorAll(".close").forEach(btn => btn.addEventListener("click", closeModal));

  const loginBtn = modal.querySelector("#loginSubmit");
  const emailInput = modal.querySelector("#loginEmail");
  const passInput = modal.querySelector("#loginPassword");
  const feedback = modal.querySelector("#loginFeedback");

  if (!loginBtn || !emailInput || !passInput) return;

  loginBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passInput.value.trim();
    feedback.textContent = "";

    if (!email || !password) {
      feedback.textContent = "Please enter both email and password.";
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      feedback.textContent = "Login successful!";
      closeModal();
    } catch (err) {
      feedback.textContent = err.message;
      console.error("Login error:", err);
    }
  });
}
