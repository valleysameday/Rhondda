// index/js/admin/settings.js
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast } from "./utils.js";

export async function init({ db }) {
  await loadSettings(db);
}

export async function loadSettings(db) {
  const settingsRef = doc(db, "settings", "global");
  let snap = await getDoc(settingsRef);

  if (!snap.exists()) {
    await updateDoc(settingsRef, {
      businessPremiumEnabled: false,
      generalDashboardEnabled: false,
      postingEnabled: true,
      newSignupsEnabled: true,
      homepageBanner: "",
      homepageFeaturedBusinessId: null
    }).catch(() => {});
    snap = await getDoc(settingsRef);
  }

  const data = snap.data() || {};

  const toggles = [
    { id: "toggleBusinessPremium", field: "businessPremiumEnabled" },
    { id: "toggleGeneralUpgrades", field: "generalDashboardEnabled" },
    { id: "togglePostingEnabled", field: "postingEnabled" },
    { id: "toggleSignupsEnabled", field: "newSignupsEnabled" }
  ];

  toggles.forEach(t => {
    const el = document.getElementById(t.id);
    if (!el) return;
    el.checked = !!data[t.field];
    el.addEventListener("change", async () => {
      try {
        await updateDoc(settingsRef, { [t.field]: el.checked });
        showToast(`✅ ${t.id} updated`);
      } catch {
        showToast(`❌ Failed to update ${t.id}`, false);
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
    } catch {
      showToast("❌ Failed to save banner", false);
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
    } catch {
      showToast("❌ Failed to set featured business", false);
    }
  };
}
