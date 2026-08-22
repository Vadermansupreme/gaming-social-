import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.tsx'
import './index.css'

// Register service worker with auto-update (no confirm dialogs)
registerSW({
  onNeedRefresh() {
    console.log('[SpotMe PWA] New content available, will update on next reload');
  },
  onOfflineReady() {
    console.log('[SpotMe PWA] App ready for offline use');
  },
  onRegistered(registration) {
    console.log('[SpotMe PWA] Service worker registered:', registration);
  },
  onRegisterError(error) {
    console.error('[SpotMe PWA] Service worker registration error:', error);
  },
});

createRoot(document.getElementById("root")!).render(<App />);
