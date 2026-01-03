// assistant.js
import { showAIPopup } from "/views/dashboard/assistant-ui.js";

export const AI = {
  triggers: {
    // ---------- DASHBOARD / LOGIN ----------
    DASHBOARD_OPENED: [
      "Welcome back, {{name}}! Let's see how your ads are doing today.",
      "Hi {{name}} 👋 Your dashboard is up-to-date."
    ],
    FIRST_LOGIN: [
      "Hey {{name}}! Your account is ready — post your first ad.",
      "Welcome aboard, {{name}}! Let's get your first ad live."
    ],

    // ---------- ADS ----------
    FIRST_AD_POSTED: [
      "Nice one 👏 Your first ad is live!",
      "First ad up! 🚀 Momentum starts here."
    ],
    SECOND_AD_POSTED: [
      "Great work! Your second ad is live. Keep going!",
      "Two ads posted! You're on a roll, {{name}}."
    ],
    THIRD_AD_POSTED: [
      "Three ads now — you’re building a strong presence!",
      "Your ads are stacking nicely. Keep it up!"
    ],
    FOURTH_AD_POSTED: [
      "Wow, 4 live ads! You’ve reached the Free limit.",
      "Four ads is the max for Free accounts. Upgrade to post more."
    ],
    AD_LIMIT_REACHED: [
      "You’ve maxed out Free — unlimited ads unlocks more reach!",
      "Your Free plan allows 4 ads. Upgrade for unlimited posting."
    ],
AD_LIMIT_NEAR: [
  "You're close to the Free plan limit — 4 ads max!",
  "Almost at your ad limit. Upgrade for unlimited posting, {{name}}."
],
    // ---------- BUNDLES ----------
    FIRST_BUNDLE_UNLOCK: [
      "Your first bundle enquiry! 🎉 Great start.",
      "Bundle feature activated — multi-item enquiries unlocked."
    ],
    BUNDLE_VIEWED_FREE: [
      "Bundles are for Seller+ and Business plans. Unlock to enable!",
      "See bundle enquiries? Upgrade your plan to start using this."
    ],

    // ---------- ANALYTICS ----------
    ANALYTICS_VIEWED_FREE: [
      "Analytics are locked for Free accounts. Unlock insights to grow faster.",
      "Performance charts are available on upgraded plans."
    ],
    ANALYTICS_VIEWED: [
      "Here are your insights! 📊 Track clicks and views over the week.",
      "Dashboard analytics loaded — smart moves, {{name}}!"
    ],

    // ---------- TRIAL ----------
    TRIAL_STARTED: [
      "Your 30-day Business trial is live! 🌟 Try all features now.",
      "Business trial activated — enjoy full access, {{name}}!"
    ],
    TRIAL_ACTIVE: [
      "Your Business trial has {{daysLeft}} days left — keep growing!",
      "You're in trial mode with {{daysLeft}} days to go!"
    ],
    TRIAL_EXPIRED: [
      "Your Business trial has ended. Upgrade to keep full access.",
      "Trial over! Return to Free, or upgrade to maintain features."
    ],

    // ---------- UNLOCKS / CONTACT ----------
    FIRST_UNLOCK: [
      "Your first customer unlocked your number! 🤑 Nice work.",
      "Someone just unlocked your contact — good momentum!"
    ],
    UNLOCK_VIEW_FREE: [
      "Unlock stats are only available for Seller+ & Business plans.",
      "Want to see how much customers are saving? Upgrade now."
    ],

    // ---------- MESSAGES ----------
    FIRST_MESSAGE: [
      "You’ve got your first message! Respond quickly to win customers.",
      "New message received — first communication from a buyer!"
    ],
    MESSAGES_EMPTY: [
      "No messages yet. Encourage buyers by keeping your ads active.",
      "Your inbox is empty — time to post your next ad!"
    ],

    // ---------- WIDGETS ----------
    WIDGET_REFRESHED: [
      "Widgets updated — everything is live.",
      "Dashboard refreshed. Keep an eye on your stats!"
    ],
    WIDGET_ANALYTICS_LOCKED: [
      "Analytics are locked. Unlock for full insights.",
      "Insights widget shows your performance — upgrade to access."
    ],

    // ---------- SIDEBAR ----------
    SIDEBAR_TRIAL_ACTIVE: [
      "Business trial active — explore advanced features!",
      "Trial in progress: {{daysLeft}} days left to try everything."
    ],
    SIDEBAR_PLAN_CHANGED: [
      "Plan updated to {{plan}} successfully!",
      "You are now on {{plan}} — enjoy your features."
    ],

    // ---------- RECENT ADS ----------
    FIRST_RECENT_AD: [
      "Your first recent ad is live — check your dashboard!",
      "First ad appears in recent posts — looking good!"
    ],
    MULTIPLE_RECENT_ADS: [
      "{{count}} recent ads displayed — nice growth!",
      "Ads loaded in your recent section. Keep posting!"
    ],

    // ---------- SUBSCRIPTION ----------
    SUBSCRIPTION_STARTED: [
      "Subscription active — full features unlocked.",
      "Enjoy your upgraded {{plan}} account!"
    ],
    SUBSCRIPTION_FREE: [
      "You’re now on Free plan. Some features are limited.",
      "Free account active — upgrade anytime to unlock more."
    ],

    // ---------- MISC / MOTIVATION ----------
    FIRST_ACHIEVEMENT: [
      "🎉 First milestone reached! Keep going, {{name}}.",
      "You’ve unlocked your first achievement. Well done!"
    ],
    SECOND_ACHIEVEMENT: [
      "Another milestone! Momentum is building.",
      "Two achievements unlocked — nice progress!"
    ],
    HIGH_ACTIVITY: [
      "You’re really active this week! 🚀",
      "Keep up the activity — your ads are thriving."
    ],
    LOW_ACTIVITY: [
      "Not much activity lately — time to post another ad.",
      "Get noticed! Consider updating your ads."
    ],
    TIP_UPLOAD_IMAGE: [
      "Adding images increases engagement on your ads.",
      "Photos make your ads stand out — try uploading one!"
    ],
    TIP_COMPLETE_PROFILE: [
      "Complete your profile to boost trust with buyers.",
      "Profiles with full info get more engagement!"
    ],
    TIP_RESPOND_MESSAGES: [
      "Respond quickly — buyers prefer fast replies.",
      "Quick replies increase chance of successful sale."
    ],
    TIP_USE_BUNDLES: [
      "Bundle ads help buyers find multiple items easily.",
      "Bundles increase chances of multi-item enquiries."
    ],
    TIP_CHECK_ANALYTICS: [
      "Check your insights weekly to track performance.",
      "Use analytics to see what’s working and optimize!"
    ],

    // ---------- RANDOM ENCOURAGEMENT ----------
    RANDOM_ENCOURAGEMENT_1: [
      "Keep up the great work, {{name}}!",
      "Nice progress today! 👏"
    ],
    RANDOM_ENCOURAGEMENT_2: [
      "Momentum is building 🚀",
      "You’re doing awesome, {{name}}!"
    ],
    RANDOM_ENCOURAGEMENT_3: [
      "Every ad counts — keep going!",
      "Small steps lead to big wins!"
    ],

    // ---------- LIMIT ALERTS ----------
    LIMIT_BUNDLES: [
      "Bundles not available on Free — upgrade to unlock.",
      "You’ve reached the limit for this feature."
    ],
    LIMIT_ANALYTICS: [
      "Analytics locked — upgrade for full performance charts.",
      "Insight access is limited on Free plan."
    ],
    LIMIT_CONTACT_VIEW: [
      "Free accounts can't see contact details — upgrade to unlock.",
      "Want to view contacts? This is a premium feature."
    ]
  },

  speak(triggerKey, data = {}) {
    const messages = this.triggers[triggerKey];
    if (!messages) return;

    const storageKey = `seen_ai_${triggerKey}`;
    if (localStorage.getItem(storageKey)) return;
    localStorage.setItem(storageKey, true);

    let message = messages[Math.floor(Math.random() * messages.length)];
    message = message.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || "");

    showAIPopup(message);
  }
};
