// index/js/ai/messages.js
const MESSAGES = {
  FIRST_AD_POSTED: [
    name => `Nice one ${name} 🎉 Your first ad is live.`,
    () => "That’s your first ad up — good start."
  ],

  AD_LIMIT_WARNING: [
    () => "Just a heads-up — one more ad and you’ll hit the free limit.",
    () => "Free accounts allow up to 4 live ads."
  ],

  AD_LIMIT_REACHED: [
    () => "You’ve hit the free ad limit.",
    () => "Upgrade to keep posting without limits."
  ],

  FEATURE_LOCKED_CLICK: [
    () => "That feature’s part of Seller+.",
    () => "You can upgrade anytime if you want access."
  ]
};

export function getMessage(trigger, context = {}) {
  const pool = MESSAGES[trigger];
  if (!pool) return null;

  const pick = pool[Math.floor(Math.random() * pool.length)];
  return pick(context.name);
}
