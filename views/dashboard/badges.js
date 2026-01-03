// badges.js
import { AI } from "/index/js/ai/assistant.js";

export function initBadges(userData) {
  const badge = document.getElementById("planBadge");
  const plan = userData.plan;

  badge.textContent =
    plan === "sellerplus" ? "Seller+ Member" :
    plan === "business" ? "Business Member" :
    "Free Member";

  badge.className = `plan-badge ${plan}`;

  // AI feedback for first plan recognition
  if (plan === "free") AI.speak("FIRST_DASHBOARD_BADGE", { name: userData.name });
}

export function updateTrialBadges(userData) {
  const trial = userData.businessTrial;
  const trialBadge = document.getElementById("trialBadge");
  const sidebarTrialLabel = document.getElementById("sidebarTrialLabel");

  if (!trial || !trial.active) {
    trialBadge.style.display = "none";
    sidebarTrialLabel.textContent = "";
    return;
  }

  const daysLeft = Math.max(0, Math.ceil((trial.expiresAt - Date.now()) / (1000*60*60*24)));

  trialBadge.style.display = "inline-block";
  trialBadge.textContent = `${daysLeft} days left (Business Trial)`;
  sidebarTrialLabel.textContent = `Business trial: ${daysLeft} days left`;

  AI.speak("TRIAL_ACTIVE", { daysLeft, name: userData.name });
}
