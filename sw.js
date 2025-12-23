// Service Worker for Rhondda Noticeboard
const CACHE_NAME = 'rhondda-v1';

// We tell the browser to install the worker
self.addEventListener('install', (event) => {
  console.log('SW: Installed');
  self.skipWaiting();
});

// We tell the browser to activate the worker
self.addEventListener('activate', (event) => {
  console.log('SW: Active');
});

// This handles the "Fetch" events to stop the 404 error
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
