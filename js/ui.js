/* UI LOGIC - js/ui.js */

// 1. Handle the "Post a Notice" Modal
const modal = document.getElementById('post-modal');
const openBtn = document.getElementById('open-post-btn');
const closeBtn = document.getElementById('close-modal');

if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
        modal.showModal(); // Standard 2025 way to open popups
    });
}

if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
        modal.close();
    });
}

// 2. Handle the PWA "Install" Button
// This only shows the button if the user's phone/browser supports installing it
let deferredPrompt;
const installBtn = document.getElementById('pwa-install-btn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) installBtn.style.display = 'block'; 
});

if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                installBtn.style.display = 'none';
            }
            deferredPrompt = null;
        }
    });
}

// 3. Simple Loading Spinner Helper
// Use this to show users something is happening when they click "Post"
export function toggleLoading(buttonId, isLoading) {
    const btn = document.getElementById(buttonId);
    if (btn) {
        btn.disabled = isLoading;
        btn.innerHTML = isLoading ? 'Processing...' : 'Submit';
    }
}
