// index/js/admin/settings.js
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast } from "/index/js/admin/utils.js";

export async function init({ db }) {
  console.log("🔹 Settings module init");
  await loadSettings(db);
}

export async function loadSettings(db) {
  const settingsRef = doc(db, "settings", "global");
  let snap = await getDoc(settingsRef);

  if (!snap.exists()) {
    console.warn("⚠️ Global settings not found, creating defaults");
    try {
      await updateDoc(settingsRef, {
        businessPremiumEnabled: false,
        generalDashboardEnabled: false,
        postingEnabled: true,
        newSignupsEnabled: true,
        homepageBanner: "",
        homepageFeaturedBusinessId: null
      });
      snap = await getDoc(settingsRef);
    } catch (err) {
      console.error("❌ Failed to create default settings", err);
      showToast("❌ Failed to initialize settings", false);
      return;
    }
  }

  const data = snap.data() || {};
  const statusEl = document.getElementById("adminStatus");

  const toggles = [
    { id: "toggleBusinessPremium", field: "businessPremiumEnabled", label: "Business Premium" },
    { id: "toggleGeneralUpgrades", field: "generalDashboardEnabled", label: "General Dashboard Upgrades" },
    { id: "togglePostingEnabled", field: "postingEnabled", label: "New Posts" },
    { id: "toggleSignupsEnabled", field: "newSignupsEnabled", label: "New Signups" }
  ];

  toggles.forEach(t => {
    const el = document.getElementById(t.id);
    if (!el) return;

    el.checked = !!data[t.field];

    el.addEventListener("change", async () => {
      try {
        await updateDoc(settingsRef, { [t.field]: el.checked });
        showToast(`✅ ${t.label} ${el.checked ? "enabled" : "disabled"}`);
        console.log(`🔹 Toggle ${t.id} -> ${el.checked}`);

        if (t.field === "generalDashboardEnabled") {
          appendStatus(`🔹 General dashboard upgrades ${el.checked ? "LIVE" : "OFF"}`, statusEl, el.checked);
        }
      } catch (err) {
        console.error(`❌ Failed to update ${t.id}`, err);
        showToast(`❌ Failed to update ${t.label}`, false);
        appendStatus(`❌ ${t.label} failed to update`, statusEl, false);
      }
    });
  });

  // Banner
  const bannerInput = document.getElementById("adminBannerInput");
  const bannerBtn = document.getElementById("adminSaveBannerBtn");
  bannerInput.value = data.homepageBanner || "";
  bannerBtn.onclick = async () => {
    try {
      await updateDoc(settingsRef, { homepageBanner: bannerInput.value });
      showToast("✅ Banner saved");
      console.log("🔹 Homepage banner updated");
      appendStatus("🔹 Banner updated", statusEl);
    } catch (err) {
      console.error("❌ Failed to save banner", err);
      showToast("❌ Failed to save banner", false);
      appendStatus("❌ Banner save failed", statusEl, false);
    }
  };

  // Featured Business
  const featuredInput = document.getElementById("adminFeaturedBusinessId");
  const featuredBtn = document.getElementById("adminSaveFeaturedBusinessBtn");
  featuredInput.value = data.homepageFeaturedBusinessId || "";
  featuredBtn.onclick = async () => {
    try {
      await updateDoc(settingsRef, { homepageFeaturedBusinessId: featuredInput.value || null });
      showToast("✅ Featured business set");
      console.log("🔹 Featured business updated:", featuredInput.value);
      appendStatus(`🔹 Featured business set to ${featuredInput.value || "None"}`, statusEl);
    } catch (err) {
      console.error("❌ Failed to set featured business", err);
      showToast("❌ Failed to set featured business", false);
      appendStatus("❌ Failed to set featured business", statusEl, false);
    }
  };
}

/* ============================================================
   SPA LIVE STATUS
============================================================ */
function appendStatus(msg, container, success = true) {
  if (!container) return;
  const p = document.createElement("p");
  p.textContent = msg;
  p.style.color = success ? "#10b981" : "#ef4444";
  container.appendChild(p);
  container.scrollTop = container.scrollHeight;
}
