// counts.js
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { AI } from "/index/js/ai/assistant.js";

export async function loadCounts(auth, db) {
  const user = auth.currentUser;
  if (!user) return;

  const adsSnap = await getDocs(query(collection(db,"posts"), where("userId","==",user.uid), where("status","==","active")));
  const adCountEl = document.getElementById("widgetAdCount");
  if(adCountEl) {
    adCountEl.textContent = adsSnap.size;

    // AI triggers for ad count
    if(adsSnap.size === 1) AI.speak("FIRST_AD_POSTED", { name: user.displayName || "User" });
    if(adsSnap.size === 4) AI.speak("AD_LIMIT_NEAR", { name: user.displayName || "User" });
  }

  const msgCountEl = document.getElementById("widgetMsgCount"); if(msgCountEl) msgCountEl.textContent = 0;

  const unlockCountEl = document.getElementById("widgetUnlockCount"); if(unlockCountEl) unlockCountEl.textContent = 0;
  const unlockSavingsEl = document.getElementById("widgetUnlockSavings"); if(unlockSavingsEl) unlockSavingsEl.textContent = "£0";

  const bundleCountEl = document.getElementById("widgetBundleCount"); if(bundleCountEl) bundleCountEl.textContent = 0;
}
