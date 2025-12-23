/* UI LOGIC - js/js/ui.js */
import { loadNotices } from './notices.js';

// --- 1. MODAL CONTROL CENTER ---
function setupModal(modalId, openBtnId) {
    const modal = document.getElementById(modalId);
    const openBtn = document.getElementById(openBtnId);
    if (!modal) return;

    // Open Modal
    if (openBtn) {
        openBtn.addEventListener('click', () => modal.showModal());
    }

    // Close Modal (Finds any button with class "close-btn" or the ID "close-modal")
    const closeButtons = modal.querySelectorAll('.close-btn, #close-modal');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => modal.close());
    });

    // Close if clicking the dark background
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.close();
    });
}

// Initialize all your modals
setupModal('post-modal', 'open-post-btn');
setupModal('login-modal', 'open-login-btn');
setupModal('signup-modal', 'switch-to-signup'); // Opens signup from the login link

// --- 2. START THE ENGINE ---
// This stops the "Loading the valley's notices..." message
document.addEventListener('DOMContentLoaded', () => {
    console.log("UI Ready - Starting Notice Feed...");
    loadNotices(); 
});

// --- 3. PWA INSTALL LOGIC ---
let deferredPrompt;
const installBtn = document.getElementById('pwa-install-btn');
const installBanner = document.getElementById('pwa-install-banner');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBanner) installBanner.style.display = 'block'; 
});

if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') installBanner.style.display = 'none';
            deferredPrompt = null;
        }
    });
}

// --- 4. HELPERS ---
export function toggleLoading(buttonId, isLoading, originalText = 'Submit') {
    const btn = document.getElementById(buttonId);
    if (btn) {
        btn.disabled = isLoading;
        btn.innerHTML = isLoading ? '<span class="spinner"></span> Processing...' : originalText;
    }
}
