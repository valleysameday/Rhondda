// badges.js — RCT‑X Clean Version
import { AI } from "/index/js/ai/assistant.js";

/* =====================================================
   PLAN BADGE
===================================================== */
export function initBadges(userData) {
  const badge = document.getElementById("planBadge");
  if (!badge) return;

  const plan = userData.plan;

  // Set text
  badge.textContent =
    plan === "sellerplus" ? "Seller+ Member" :
    plan === "business" ? "Business Member" :
    "Free Member";

  // Set colour class
  badge.className = `plan-badge ${plan}`;
}

/* =====================================================
   TRIAL BADGE
===================================================== */
export function updateTrialBadges(userData) {
  const trial = userData.businessTrial;
  const trialBadge = document.getElementById("trialBadge");

  // If no trial or inactive → hide badge
  if (!trial || !trial.active) {
    if (trialBadge) trialBadge.style.display = "none";
    return;
  }

  // Calculate days left
  const daysLeft = Math.max(
    0,
    Math.ceil((trial.expiresAt - Date.now()) / (1000 * 60 * 60 * 24))
  );

  // Update visible badge
  if (trialBadge) {
    trialBadge.style.display = "inline-block";
    trialBadge.textContent = `${daysLeft} days left (Business Trial)`;
  }

  // AI feedback
  AI.speak("TRIAL_ACTIVE", { daysLeft, name: userData.name });
}
