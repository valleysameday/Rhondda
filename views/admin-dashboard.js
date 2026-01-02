import * as Overview from "/index/js/admin/overview.js";
import * as Traffic from "/index/js/admin/traffic.js";
import * as Businesses from "/index/js/admin/businesses.js";
import * as Posts from "/index/js/admin/posts.js";
import * as Subscriptions from "/index/js/admin/subscriptions.js";
import * as Settings from "/index/js/admin/settings.js";
import * as Users from "/index/js/admin/users.js";

let auth, db, storage;

/**
 * Initialize Admin Dashboard SPA view
 */
export async function initAdminDashboard({ auth: a, db: d, storage: s }) {
  auth = a;
  db = d;
  storage = s;

  if (!window.currentUserData?.isAdmin) {
    console.warn("⚠️ Current user is not admin");
    return;
  }

  // Initialize nav after DOM is ready
  initNav();

  // Show a live status div for feedback
  const statusEl = document.getElementById("adminStatus") || createStatusDiv();

  // Initialize each module with live feedback
  const modules = [
    { name: "Overview", fn: Overview.init },
    { name: "Traffic", fn: Traffic.init },
    { name: "Businesses", fn: Businesses.init },
    { name: "Posts", fn: Posts.init },
    { name: "Subscriptions", fn: Subscriptions.init },
    { name: "Settings", fn: Settings.init },
    { name: "Users", fn: Users.init }
  ];

  for (const mod of modules) {
    try {
      await mod.fn({ db, auth, storage });
      appendStatus(`✅ ${mod.name} loaded successfully`, statusEl);
    } catch (err) {
      console.error(`❌ ${mod.name} failed to load`, err);
      appendStatus(`❌ ${mod.name} failed to load`, statusEl, false);
    }
  }
}

/* ============================================================
   NAVIGATION
============================================================ */
function initNav() {
  const buttons = document.querySelectorAll(".admin-nav-btn");
  const sections = document.querySelectorAll(".admin-section");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const target = btn.dataset.section;
      sections.forEach(sec => {
        sec.style.display = sec.id === `admin-section-${target}` ? "block" : "none";
      });
    });
  });
}

/* ============================================================
   LIVE FEEDBACK
============================================================ */
function createStatusDiv() {
  const div = document.createElement("div");
  div.id = "adminStatus";
  div.style.cssText = "position:fixed;bottom:10px;right:10px;width:300px;background:#1f2937;color:white;padding:10px;border-radius:8px;max-height:400px;overflow:auto;font-size:12px;z-index:9999";
  document.body.appendChild(div);
  return div;
}

function appendStatus(msg, container, success = true) {
  const p = document.createElement("p");
  p.textContent = msg;
  p.style.color = success ? "#10b981" : "#ef4444";
  container.appendChild(p);
  container.scrollTop = container.scrollHeight;
}
