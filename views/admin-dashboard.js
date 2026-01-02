import * as Overview from "../index/js/admin/overview.js";
import * as Traffic from "../index/js/admin/traffic.js";
import * as Businesses from "../index/js/admin/businesses.js";
import * as Posts from "../index/js/admin/posts.js";
import * as Subscriptions from "../index/js/admin/subscriptions.js";
import * as Settings from "../index/js/admin/settings.js";
import * as Users from "../index/js/admin/users.js";

let auth, db, storage;

export async function initAdminDashboard({ auth: a, db: d, storage: s }) {
  auth = a;
  db = d;
  storage = s;

  if (!window.currentUserData?.isAdmin) return;

  initNav();

  await Overview.init({ db });
  await Traffic.init({ db });
  await Businesses.init({ db });
  await Posts.init({ db });
  await Subscriptions.init({ db });
  await Settings.init({ db });
  await Users.init({ db });
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
