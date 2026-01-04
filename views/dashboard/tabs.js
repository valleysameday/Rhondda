export function switchTab(tab) {
  console.log("Switching to tab:", tab);

  // Highlight sidebar
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });

  // Hide all tabs
  document.querySelectorAll(".tab-content").forEach(sec => {
    sec.classList.remove("active");
  });

  // Show selected tab
  const target = document.querySelector(`.tab-content[data-tab="${tab}"]`);
  if (target) target.classList.add("active");
}
