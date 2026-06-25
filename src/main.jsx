import React from 'react'
import ReactDOM from 'react-dom/client'
import KivoApp from './KivoApp.jsx'
import { registerSW } from 'virtual:pwa-register'

// Auto-update service worker silently in background
registerSW({
  onNeedRefresh() {
    // New content available — update silently
    // Could show a toast here if you want users to know
  },
  onOfflineReady() {
    console.log('[Kivo] App ready for offline use')
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <KivoApp />
  </React.StrictMode>,
)
