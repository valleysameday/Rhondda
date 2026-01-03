// assistant.js
import { showAIPopup } from "./assistant-ui.js";

export const AI = {
  // All triggers mapped to possible messages
  triggers: {
    FIRST_AD_POSTED: [
      "Nice one 👏 Your first ad is live!",
      "First ad up! 🚀 Momentum starts here."
    ],
    AD_LIMIT_NEAR: [
      "You're hitting the free ad limit. Want to unlock more?",
      "Four ads live already! Upgrade to post unlimited ads."
    ],
    DASHBOARD_OPENED: [
      "Welcome back, {{name}}! Let's check your stats today.",
      "Hi {{name}}, ready to grow your ads?"
    ],
    TRIAL_STARTED: [
      "Your 30-day Business trial is live! 🌟",
      "Enjoy your Business trial, {{name}}. Try all features now."
    ],
    TRIAL_ACTIVE: [
      "Your Business trial has {{daysLeft}} days left — keep growing!",
      "You're in trial mode with {{daysLeft}} days to go!"
    ],
    DASHBOARD_RENDERED: [
      "Widgets updated — everything is live and ready.",
      "Dashboard refreshed, {{plan}} plan active."
    ],
    FIRST_BUNDLE_UNLOCK: [
      "Your first bundle enquiry! Nice work 🎉",
      "Bundle feature is active — track your multi-item enquiries."
    ],
    ANALYTICS_VIEW: [
      "Here's your insights. 📊 Keep an eye on trends.",
      "Analytics loaded — smart moves, {{name}}!"
    ],
    // Add more triggers here...
  },

  speak(triggerKey, data = {}) {
    const messages = this.triggers[triggerKey];
    if (!messages) return;

    // Check if this trigger has been shown (avoid spamming)
    const storageKey = `seen_ai_${triggerKey}`;
    if (localStorage.getItem(storageKey)) return;
    localStorage.setItem(storageKey, true);

    // Pick random message
    let message = messages[Math.floor(Math.random() * messages.length)];

    // Replace placeholders with data
    message = message.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || "");

    // Show popup
    showAIPopup(message);
  }
};
