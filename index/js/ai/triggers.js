// index/js/ai/triggers.js
export const TRIGGERS = {
  FIRST_AD_POSTED: {
    ui: "toast",
    once: true
  },

  AD_LIMIT_WARNING: {
    ui: "banner",
    once: false
  },

  AD_LIMIT_REACHED: {
    ui: "modal",
    once: false,
    actions: [
      { label: "Upgrade", action: "upgrade" },
      { label: "Not now", action: "close" }
    ]
  },

  FEATURE_LOCKED_CLICK: {
    ui: "toast",
    once: false
  }
};
