import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { loadView } from "/index/js/main.js";

export function openLoginModal() {

  const auth = window.firebaseAuth;
  const db = window.firebaseDb;

  if (!auth || !db) {
    console.error("❌ Firebase not ready");
    return;
  }

  const modal = document.getElementById("login");
  if (!modal) return;

  modal.style.display = "flex";
  document.body.classList.add("modal-open");

  const closeModal = () => {
    modal.style.display = "none";
    document.body.classList.remove("modal-open");
  };

  modal.querySelectorAll(".close").forEach(btn =>
    btn.addEventListener("click", closeModal)
  );

  const loginBtn = modal.querySelector("#loginSubmit");
  const emailInput = modal.querySelector("#loginEmail");
  const passInput = modal.querySelector("#loginPassword");
  const feedback = modal.querySelector("#loginFeedback");

  if (!loginBtn || !emailInput || !passInput) return;

  // ⭐ prevent duplicate listeners
  loginBtn.replaceWith(loginBtn.cloneNode(true));
  const newLoginBtn = modal.querySelector("#loginSubmit");

  newLoginBtn.addEventListener("click", async () => {

    const email = emailInput.value.trim();
    const password = passInput.value.trim();
    feedback.textContent = "";

    if (!email || !password) {
      feedback.textContent = "Please enter email and password";
      return;
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      const snap = await getDoc(doc(db, "users", cred.user.uid));
      window.firebaseUserDoc = snap.exists() ? snap.data() : null;

      closeModal();

      const redirect = sessionStorage.getItem("redirectAfterLogin");
      if (redirect === "chat-list") {
        sessionStorage.removeItem("redirectAfterLogin");
        loadView("chat-list");
        return;
      }

      document.getElementById("openAccountModal")?.click();

    } catch (err) {
      console.error("❌ Login failed:", err);
      feedback.textContent = err.message;
    }
  });
}
