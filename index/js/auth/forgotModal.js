// index/js/auth/forgotModal.js
import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const auth = getAuth();

export function openForgotModal() {
  const modal = document.getElementById("forgot");
  if (!modal) return;
  modal.style.display = "flex";
  document.body.classList.add("modal-open");

  const closeModal = () => {
    modal.style.display = "none";
    document.body.classList.remove("modal-open");
  };

  modal.querySelectorAll(".close").forEach(btn => btn.addEventListener("click", closeModal));

  const sendBtn = modal.querySelector("#forgotSubmit");
  const emailInput = modal.querySelector("#forgotEmail");

  if (!sendBtn || !emailInput) return;

  sendBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    if (!email) {
      alert("Enter your email");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      closeModal();
      const confirmModal = document.getElementById("resetConfirm");
      confirmModal.style.display = "flex";
      document.body.classList.add("modal-open");
    } catch (err) {
      alert(err.message);
      console.error("Password reset error:", err);
    }
  });
}
