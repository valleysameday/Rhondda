// tabs.js

export function switchTab(tab) {
  console.log("Switching to tab:", tab);

  // Highlight the correct sidebar button
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });

  // Hide all tab-content sections
  document.querySelectorAll(".tab-content").forEach(sec => {
    sec.style.display = "none";
  });

  // Show the selected tab-content
  const target = document.querySelector(`.tab-content[data-tab="${tab}"]`);
  if (target) {
    target.style.display = "block";
  }
}
