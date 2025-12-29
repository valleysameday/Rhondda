import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { loadView } from "/index/js/main.js";

export function openLoginModal(auth, db) {
  console.log("🔵 openLoginModal() called. auth:", !!auth, "db:", !!db);

  const modal = document.getElementById("login");
  if (!modal) {
    console.log("❌ Login modal element not found");
    return;
  }

  modal.style.display = "flex";
  document.body.classList.add("modal-open");
  console.log("🔵 Login modal opened");

  const closeModal = () => {
    console.log("🔵 Closing login modal");
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

  if (!loginBtn || !emailInput || !passInput) {
    console.log("❌ Login modal missing input/button elements");
    return;
  }

  // Remove previous listeners
  loginBtn.replaceWith(loginBtn.cloneNode(true));
  const newLoginBtn = modal.querySelector("#loginSubmit");

  newLoginBtn.addEventListener("click", async () => {
    console.log("🟡 Login button clicked");

    const email = emailInput.value.trim();
    const password = passInput.value.trim();
    feedback.textContent = "";

    if (!email || !password) {
      console.log("❌ Missing email or password");
      feedback.textContent = "Please enter both email and password.";
      return;
    }

    try {
      console.log("🟡 Attempting Firebase login for:", email);
      const cred = await signInWithEmailAndPassword(auth, email, password);
      console.log("🟢 Firebase login success:", cred.user.uid);

      

      const snap = await getDoc(doc(db, "users", cred.user.uid));
window.firebaseUserDoc = snap.exists() ? snap.data() : null;

      feedback.textContent = "Login successful!";
      closeModal();

      console.log("🟡 Triggering account modal click for routing");
      document.getElementById("openAccountModal").click();

    } catch (err) {
      console.error("❌ Login error:", err);
      feedback.textContent = err.message;
    }
  });
}
