// index/js/ai/memory.js
const seen = new Set();

export function canSpeak(trigger) {
  return !seen.has(trigger);
}

export function remember(trigger) {
  seen.add(trigger);
}
