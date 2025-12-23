// /index/js/ui.js
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

export function initUI() {
  bindModals();
  bindAuth();
}

function bindModals() {
  document.addEventListener("click", e => {
    const open = e.target.closest("[data-open]");
    const close = e.target.closest("[data-close]");

    if (open) openModal(open.dataset.open);
    if (close) closeModal(close.dataset.close);
  });
}

function openModal(id) {
  document.body.classList.add("modal-open");
  document.getElementById(id)?.classList.add("active");
}

function closeModal(id) {
  document.body.classList.remove("modal-open");
  document.getElementById(id)?.classList.remove("active");
}

function bindAuth() {
  onAuthStateChanged(window.auth, user => {
    window.currentUser = user || null;
    document.body.classList.toggle("logged-in", !!user);
  });
}

window.loginUser = async (email, password) =>
  signInWithEmailAndPassword(window.auth, email, password);

window.registerUser = async (email, password) =>
  createUserWithEmailAndPassword(window.auth, email, password);

window.resetPassword = async email =>
  sendPasswordResetEmail(window.auth, email);
