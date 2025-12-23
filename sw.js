// Service Worker for Rhondda Noticeboard
const CACHE_NAME = 'rhondda-v2';

// Install
self.addEventListener('install', (event) => {
  console.log('SW: Installed');
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', (event) => {
  console.log('SW: Active');
});

// Fetch handler
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // 🔥 IMPORTANT: Do NOT intercept Firebase or Google API requests
  if (
    url.includes('firestore.googleapis.com') ||
    url.includes('googleapis.com') ||
    url.includes('gstatic.com') ||
    url.includes('google.com')
  ) {
    return; // Let the browser handle these normally
  }

  // Default behaviour: just fetch normally
  event.respondWith(fetch(event.request));
});
