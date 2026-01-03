// index/js/ai/assistant.js
import { TRIGGERS } from "/index/js/ai/triggers.js";
import { getMessage } from "/index/js/ai/messages.js";
import { showToast } from "/index/js/ai/ui-toast.js";
import { showBanner } from "/index/js/ai/ui-banner.js";
import { showModal } from "/index/js/ai/ui-modal.js";
import { canSpeak, remember } from "/index/js/ai/memory.js";

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
