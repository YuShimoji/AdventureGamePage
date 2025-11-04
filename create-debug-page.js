const fs = require('fs');

function createDebugPage() {
  const html = fs.readFileSync('admin.html', 'utf8');

  // デバッグスクリプトを追加
  const debugScript = `
  <script>
    // デバッグ用のコンソールログ
    console.log('[DEBUG] Page loaded, checking preview-panel...');

    // DOMContentLoadedでパネルの状態を確認
    document.addEventListener('DOMContentLoaded', () => {
      const panel = document.getElementById('preview-panel');
      console.log('[DEBUG] DOMContentLoaded - panel:', panel);
      console.log('[DEBUG] DOMContentLoaded - panel.hidden:', panel?.hidden);
      console.log('[DEBUG] DOMContentLoaded - panel.dataset.state:', panel?.dataset.state);
      console.log('[DEBUG] DOMContentLoaded - panel.classList:', panel?.classList);
      console.log('[DEBUG] DOMContentLoaded - panel.style.display:', panel?.style.display);
    });

    // admin-boot-completeイベントを監視
    document.addEventListener('admin-boot-complete', (e) => {
      console.log('[DEBUG] admin-boot-complete fired:', e.detail);
      const panel = document.getElementById('preview-panel');
      console.log('[DEBUG] admin-boot-complete - panel.hidden:', panel?.hidden);
      console.log('[DEBUG] admin-boot-complete - panel.dataset.state:', panel?.dataset.state);
      console.log('[DEBUG] admin-boot-complete - SavePreviewPanelManager:', window.SavePreviewPanelManager);
      console.log('[DEBUG] admin-boot-complete - SavePreview:', window.SavePreview);
    });

    // 手動確認用の関数
    window.debugPanel = () => {
      const panel = document.getElementById('preview-panel');
      console.log('=== PANEL DEBUG ===');
      console.log('Element:', panel);
      console.log('hidden:', panel.hidden);
      console.log('dataset.state:', panel.dataset.state);
      console.log('classList:', panel.classList);
      console.log('aria-hidden:', panel.getAttribute('aria-hidden'));
      console.log('style.display:', panel.style.display);
      console.log('computedStyle.display:', window.getComputedStyle(panel).display);
      console.log('===================');
      return panel;
    };

    // 定期的にパネル状態を監視
    setInterval(() => {
      const panel = document.getElementById('preview-panel');
      if (panel && !panel.hidden) {
        console.warn('[DEBUG] Panel became visible unexpectedly!', {
          hidden: panel.hidden,
          dataset: panel.dataset.state,
          classList: panel.classList.toString()
        });
      }
    }, 1000);
  </script>
  `;

  // </body>の前にデバッグスクリプトを挿入
  const debugHtml = html.replace('</body>', debugScript + '</body>');

  fs.writeFileSync('admin-debug.html', debugHtml);
  console.log('Created admin-debug.html for debugging');
}

createDebugPage();
