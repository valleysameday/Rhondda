// assistant-ui.js

// Create a container if it doesn't exist
let container = document.getElementById("ai-popup-container");
if(!container){
  container = document.createElement("div");
  container.id = "ai-popup-container";
  container.style.position = "fixed";
  container.style.bottom = "20px";
  container.style.right = "20px";
  container.style.width = "300px";
  container.style.zIndex = "9999";
  document.body.appendChild(container);
}

export function showAIPopup(message, duration = 5000){
  const popup = document.createElement("div");
  popup.className = "ai-popup";
  popup.style.background = "#2563eb";
  popup.style.color = "#fff";
  popup.style.padding = "12px 16px";
  popup.style.borderRadius = "12px";
  popup.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
  popup.style.marginTop = "8px";
  popup.style.opacity = "0";
  popup.style.transform = "translateY(20px)";
  popup.style.transition = "all 0.4s ease";

  popup.innerHTML = `<div>${message}</div><span style="float:right; cursor:pointer; margin-left:8px;">✖</span>`;
  
  // Close on X click
  popup.querySelector("span").addEventListener("click", ()=> popup.remove());

  container.appendChild(popup);

  // Animate in
  requestAnimationFrame(()=> {
    popup.style.opacity = "1";
    popup.style.transform = "translateY(0)";
  });

  // Auto remove after duration
  setTimeout(()=> {
    popup.style.opacity = "0";
    popup.style.transform = "translateY(20px)";
    setTimeout(()=> popup.remove(), 400);
  }, duration);
}
