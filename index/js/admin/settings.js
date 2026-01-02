// index/js/admin/settings.js
import { doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast } from "./utils.js";

let db;

export async function init({ db: d }) {
  db = d;
  console.log("🔹 Settings module init");
  await loadSettings();
}

export async function loadSettings() {
  const settingsRef = doc(db, "settings", "global");
  let snap;

  try {
    snap = await getDoc(settingsRef);
    if (!snap.exists()) {
      console.log("⚠️ Global settings doc missing, creating default...");
      await setDoc(settingsRef, {
        businessPremiumEnabled: false,
        generalDashboardEnabled: false,
        postingEnabled: true,
        newSignupsEnabled: true,
        homepageBanner: "",
        homepageFeaturedBusinessId: null
      });
      snap = await getDoc(settingsRef);
      console.log("✅ Default global settings created");
    }
  } catch (err) {
    console.error("❌ Failed to load/create global settings", err);
    showToast("❌ Failed to load global settings", false);
    return;
  }

  const data = snap.data() || {};
  console.log("🔹 Current global settings:", data);

  // Toggle settings
  const toggles = [
    { id: "toggleBusinessPremium", field: "businessPremiumEnabled", label: "Business Premium" },
    { id: "toggleGeneralUpgrades", field: "generalDashboardEnabled", label: "General Dashboard Upgrades" },
    { id: "togglePostingEnabled", field: "postingEnabled", label: "Allow New Posts" },
    { id: "toggleSignupsEnabled", field: "newSignupsEnabled", label: "Allow New Signups" }
  ];

  toggles.forEach(t => {
    const el = document.getElementById(t.id);
    if (!el) {
      console.warn(`⚠️ Toggle element ${t.id} not found`);
      return;
    }
    el.checked = !!data[t.field];
    el.addEventListener("change", async () => {
      try {
        await updateDoc(settingsRef, { [t.field]: el.checked });
        console.log(`✅ ${t.label} (${t.field}) updated to ${el.checked}`);
        showToast(`✅ ${t.label} ${el.checked ? "enabled" : "disabled"}`);
      } catch (err) {
        console.error(`❌ Failed to update ${t.label} (${t.field})`, err);
        showToast(`❌ Failed to update ${t.label}`, false);
      }
    });
  });

  // Homepage Banner
  const bannerInput = document.getElementById("adminBannerInput");
  const bannerBtn = document.getElementById("adminSaveBannerBtn");
  if (bannerInput && bannerBtn) {
    bannerInput.value = data.homepageBanner || "";
    bannerBtn.onclick = async () => {
      try {
        await updateDoc(settingsRef, { homepageBanner: bannerInput.value });
        console.log(`✅ Homepage banner updated: "${bannerInput.value}"`);
        showToast("✅ Banner saved");
      } catch (err) {
        console.error("❌ Failed to save homepage banner", err);
        showToast("❌ Failed to save banner", false);
      }
    };
  }

  // Featured Business
  const featuredInput = document.getElementById("adminFeaturedBusinessId");
  const featuredBtn = document.getElementById("adminSaveFeaturedBusinessBtn");
  if (featuredInput && featuredBtn) {
    featuredInput.value = data.homepageFeaturedBusinessId || "";
    featuredBtn.onclick = async () => {
      try {
        await updateDoc(settingsRef, { homepageFeaturedBusinessId: featuredInput.value || null });
        console.log(`✅ Featured business set: ${featuredInput.value || "(none)"}`);
        showToast("✅ Featured business set");
      } catch (err) {
        console.error("❌ Failed to set featured business", err);
        showToast("❌ Failed to set featured business", false);
      }
    };
  }

  console.log("🔹 Settings module loaded successfully");
}
