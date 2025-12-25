import { onAuthReady } from "/index/js/auth/state.js";

export function updateAccountLabel() {
  const label = document.querySelector("#openAccountModal .label-main");
  if (!label) return;

  onAuthReady(user => {
    label.textContent = user ? "My Account" : "Login";
  });
}
