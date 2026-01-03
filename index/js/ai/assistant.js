// index/js/ai/assistant.js
import { TRIGGERS } from "./triggers.js";
import { getMessage } from "./messages.js";
import { showToast } from "./ui-toast.js";
import { showBanner } from "./ui-banner.js";
import { showModal } from "./ui-modal.js";
import { canSpeak, remember } from "./memory.js";

export const AI = {
  speak(trigger, context = {}) {
    if (!TRIGGERS[trigger]) return;
    if (!canSpeak(trigger)) return;

    const config = TRIGGERS[trigger];
    const message = getMessage(trigger, context);

    if (!message) return;

    if (config.ui === "toast") showToast(message);
    if (config.ui === "banner") showBanner(message);
    if (config.ui === "modal") showModal(message, config.actions);

    remember(trigger);
  }
};
