import React from 'react'
import ReactDOM from 'react-dom/client'
import KivoApp from './KivoApp.jsx'
import { registerSW } from 'virtual:pwa-register'

// Detect PWA standalone mode and add class to body
// This lets CSS skip the "floating phone" desktop styling in PWA mode
const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;
if (isStandalone) {
  document.body.classList.add('pwa-standalone');
}

// Also listen for changes (user installs mid-session)
window.matchMedia('(display-mode: standalone)').addEventListener('change', e => {
  document.body.classList.toggle('pwa-standalone', e.matches);
});

// Auto-update service worker silently
registerSW({
  onNeedRefresh() {},
  onOfflineReady() {
    console.log('[Kivo] Ready for offline use');
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <KivoApp />
  </React.StrictMode>,
)
