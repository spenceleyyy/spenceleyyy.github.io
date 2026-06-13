// Registers service worker (if not already) and shows a simple install button when available.
(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  let deferredPrompt = null;

  function createInstallButton() {
    if (document.getElementById('pwa-install-btn')) return null;
    const btn = document.createElement('button');
    btn.id = 'pwa-install-btn';
    btn.textContent = 'Install App';
    Object.assign(btn.style, {
      position: 'fixed',
      right: '18px',
      bottom: '18px',
      zIndex: 2001,
      padding: '10px 14px',
      background: '#e890be',
      border: 'none',
      color: '#071216',
      borderRadius: '10px',
      fontWeight: '700',
      cursor: 'pointer',
      boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
    });
    btn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        btn.remove();
      }
      deferredPrompt = null;
    });
    document.body.appendChild(btn);
    return btn;
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // show button
    createInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    const btn = document.getElementById('pwa-install-btn');
    if (btn) btn.remove();
  });
})();
