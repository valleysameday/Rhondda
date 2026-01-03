// index/js/limits/ad-limits.js
import { AI } from "index/js/ai/ai/assistant.js";

export function checkAdLimit(adCount, user) {
  if (adCount === 3) {
    AI.speak("AD_LIMIT_WARNING", { name: user.name });
  }

  if (adCount >= 4) {
    AI.speak("AD_LIMIT_REACHED", { name: user.name });
    return false;
  }

  return true;
}
