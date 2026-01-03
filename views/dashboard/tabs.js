// tabs.js
export function switchTab(tab){
  const navItems=document.querySelectorAll(".nav-item");
  navItems.forEach(btn=>btn.classList.toggle("active", btn.dataset.tab===tab));
  console.log("Switching to tab:", tab);
}
