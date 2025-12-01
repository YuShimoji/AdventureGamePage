(function () {
  // Play Input Module - Keyboard and touch input handling
  window.PlayInput = {
    init: function (engine) {
      this.engine = engine;
      this.setupKeyboardShortcuts();
      this.setupMobileMenu();
      this.setupSwipeGestures();
      this.setupAccessibility();
    },

    setupKeyboardShortcuts: function () {
      // Keyboard shortcuts: ← 戻る / → 進む / R リスタート
      function shouldHandleShortcut(target) {
        if (!window.APP_CONFIG?.gameplay?.keyboardShortcuts?.enabled) return false;
        const el = target;
        if (!el) return true;
        const tag = (el.tagName || '').toUpperCase();
        if (tag === 'INPUT' || tag === 'TEXTAREA') return false;
        if (el.isContentEditable) return false;
        return true;
      }

      window.addEventListener('keydown', e => {
        if (!shouldHandleShortcut(e.target)) return;
        // Back
        if (e.key === 'ArrowLeft') {
          const ok = typeof this.engine.goBack === 'function' && this.engine.goBack();
          if (ok) {
            e.preventDefault();
          }
          return;
        }
        // Forward
        if (e.key === 'ArrowRight') {
          const ok = typeof this.engine.goForward === 'function' && this.engine.goForward();
          if (ok) {
            e.preventDefault();
          }
          return;
        }
        // Header button shortcuts (if enabled)
        if (window.APP_CONFIG?.gameplay?.keyboardShortcuts?.headerShortcuts) {
          if (e.key === 's' || e.key === 'S') {
            // Save shortcut
            e.preventDefault();
            const btnSave = document.getElementById('btn-save');
            if (btnSave) btnSave.click();
            return;
          }
          if (e.key === 'l' || e.key === 'L') {
            // Load shortcut
            e.preventDefault();
            const btnLoad = document.getElementById('btn-load');
            if (btnLoad) btnLoad.click();
            return;
          }
          if (e.key === 'i' || e.key === 'I') {
            // Inventory shortcut
            e.preventDefault();
            const btnInventory = document.getElementById('btn-inventory');
            if (btnInventory) btnInventory.click();
            return;
          }
        }
        // Restart
        if (e.key === 'r' || e.key === 'R') {
          if (typeof this.engine.reset === 'function') {
            this.engine.reset();
            e.preventDefault();
          }
        }
      });
    },

    setupMobileMenu: function () {
      const mobileMenuBtn = document.getElementById('mobile-menu-btn');
      const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
      const mobileMenuClose = document.getElementById('mobile-menu-close');
      const mobileBtnSave = document.getElementById('mobile-btn-save');
      const mobileBtnLoad = document.getElementById('mobile-btn-load');
      const mobileBtnInventory = document.getElementById('mobile-btn-inventory');
      const mobileBtnBack = document.getElementById('mobile-btn-back');
      const mobileBtnForward = document.getElementById('mobile-btn-forward');
      const mobileBtnRestart = document.getElementById('mobile-btn-restart');
      const mobileBtnTheme = document.getElementById('mobile-btn-theme');
      const mobileFileImport = document.getElementById('mobile-play-file-import');

      const openMobileMenu = () => {
        if (mobileMenuOverlay) {
          mobileMenuOverlay.hidden = false;
          mobileMenuOverlay.style.display = 'flex';
          document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
      };

      const closeMobileMenu = () => {
        if (mobileMenuOverlay) {
          mobileMenuOverlay.hidden = true;
          mobileMenuOverlay.style.display = 'none';
          document.body.style.overflow = ''; // Restore scrolling
        }
      };

      if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', openMobileMenu);
      }

      if (mobileMenuClose) {
        mobileMenuClose.addEventListener('click', closeMobileMenu);
      }

      if (mobileMenuOverlay) {
        mobileMenuOverlay.addEventListener('click', e => {
          if (e.target === mobileMenuOverlay) closeMobileMenu();
        });
      }

      // Mobile menu button handlers - delegate to desktop buttons
      if (mobileBtnSave)
        mobileBtnSave.addEventListener('click', () => {
          const btnSave = document.getElementById('btn-save');
          if (btnSave) btnSave.click();
          closeMobileMenu();
        });
      if (mobileBtnLoad)
        mobileBtnLoad.addEventListener('click', () => {
          const btnLoad = document.getElementById('btn-load');
          if (btnLoad) btnLoad.click();
          closeMobileMenu();
        });
      if (mobileBtnInventory)
        mobileBtnInventory.addEventListener('click', () => {
          const btnInventory = document.getElementById('btn-inventory');
          if (btnInventory) btnInventory.click();
          closeMobileMenu();
        });
      if (mobileBtnBack)
        mobileBtnBack.addEventListener('click', () => {
          if (this.engine.goBack()) {
            // announce action if needed
          }
          closeMobileMenu();
        });
      if (mobileBtnForward)
        mobileBtnForward.addEventListener('click', () => {
          if (this.engine.goForward()) {
            // announce action if needed
          }
          closeMobileMenu();
        });
      if (mobileBtnRestart)
        mobileBtnRestart.addEventListener('click', () => {
          if (confirm('ゲームを最初から開始しますか？')) {
            this.engine.restartGame();
            // announce action if needed
          }
          closeMobileMenu();
        });
      if (mobileBtnTheme)
        mobileBtnTheme.addEventListener('click', () => {
          const themePanel = document.getElementById('theme-panel');
          if (themePanel) {
            themePanel.hidden = !themePanel.hidden;
          }
          closeMobileMenu();
        });

      // Mobile file import handler
      if (mobileFileImport) {
        mobileFileImport.addEventListener('change', e => {
          if (e.target.files.length > 0) {
            const fileInput = document.getElementById('play-file-import');
            if (fileInput) {
              // Copy the file to the desktop file input to trigger existing logic
              fileInput.files = e.target.files;
              fileInput.dispatchEvent(new Event('change'));
            }
          }
          closeMobileMenu();
        });
      }
    },

    setupSwipeGestures: function () {
      if (!('ontouchstart' in window)) return;

      let touchStartX = 0;
      let touchStartY = 0;
      let touchEndX = 0;
      let touchEndY = 0;

      const minSwipeDistance = 50;
      const maxVerticalDistance = 100;

      const handleSwipe = () => {
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        // Check if swipe is more horizontal than vertical
        if (
          Math.abs(deltaX) > Math.abs(deltaY) &&
          Math.abs(deltaX) > minSwipeDistance &&
          Math.abs(deltaY) < maxVerticalDistance
        ) {
          if (deltaX > 0) {
            // Swipe right - go back
            const ok = typeof this.engine.goBack === 'function' && this.engine.goBack();
            if (ok) {
              // Visual feedback
              const feedback = document.createElement('div');
              feedback.textContent = '← 戻る';
              feedback.style.cssText = `
                position: fixed;
                top: 50%;
                left: 20px;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                z-index: 1000;
                pointer-events: none;
                animation: fadeOut 1s forwards;
              `;
              document.body.appendChild(feedback);
              setTimeout(() => feedback.remove(), 1000);
            }
          } else {
            // Swipe left - go forward
            const ok = typeof this.engine.goForward === 'function' && this.engine.goForward();
            if (ok) {
              // Visual feedback
              const feedback = document.createElement('div');
              feedback.textContent = '進む →';
              feedback.style.cssText = `
                position: fixed;
                top: 50%;
                right: 20px;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                z-index: 1000;
                pointer-events: none;
                animation: fadeOut 1s forwards;
              `;
              document.body.appendChild(feedback);
              setTimeout(() => feedback.remove(), 1000);
            }
          }
        }
      };

      document.addEventListener(
        'touchstart',
        e => {
          touchStartX = e.changedTouches[0].screenX;
          touchStartY = e.changedTouches[0].screenY;
        },
        { passive: true }
      );

      document.addEventListener(
        'touchend',
        e => {
          touchEndX = e.changedTouches[0].screenX;
          touchEndY = e.changedTouches[0].screenY;
          handleSwipe();
        },
        { passive: true }
      );
    },

    setupAccessibility: function () {
      // Screen reader support functions
      const sceneStatus = document.getElementById('scene-status');
      const gameStatus = document.getElementById('game-status');

      const announceToScreenReader = (message, priority = 'polite') => {
        const target = priority === 'assertive' ? gameStatus : sceneStatus;
        if (target) {
          target.textContent = message;
          // Clear the message after a delay to allow re-announcement
          setTimeout(() => {
            target.textContent = '';
          }, 1000);
        }
      };

      const updateSceneStatus = (sceneText, choiceCount) => {
        if (sceneStatus) {
          const statusText = `シーン: ${sceneText.substring(0, 100)}${sceneText.length > 100 ? '...' : ''}. ${choiceCount}個の選択肢があります。`;
          sceneStatus.textContent = statusText;
        }
      };

      const announceGameAction = action => {
        const messages = {
          saved: 'ゲームデータを保存しました',
          loaded: 'ゲームデータを読み込みました',
          restarted: 'ゲームを最初から開始しました',
          back: '前の選択に戻りました',
          forward: '次の選択に進みました',
          themeChanged: 'テーマを変更しました',
          inventoryOpened: 'インベントリを開きました',
          inventoryClosed: 'インベントリを閉じました',
        };
        announceToScreenReader(messages[action] || action, 'assertive');
      };

      // Advanced keyboard navigation and accessibility
      let currentFocusIndex = -1;
      let focusableElements = [];

      const updateFocusableElements = () => {
        focusableElements = Array.from(
          document.querySelectorAll(
            'button:not([disabled]), [tabindex]:not([tabindex="-1"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
          )
        ).filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && el.offsetParent !== null;
        });
      };

      const navigateChoices = direction => {
        const choiceButtons = document.querySelectorAll('.choices .btn');
        if (choiceButtons.length === 0) return;

        if (direction === 'next') {
          currentFocusIndex = (currentFocusIndex + 1) % choiceButtons.length;
        } else if (direction === 'prev') {
          currentFocusIndex =
            currentFocusIndex <= 0 ? choiceButtons.length - 1 : currentFocusIndex - 1;
        }

        if (choiceButtons[currentFocusIndex]) {
          choiceButtons[currentFocusIndex].focus();
        }
      };

      // シーンレンダリング完了イベントをフックし、ステータスを更新
      document.addEventListener('agp-scene-rendered', e => {
        try {
          const detail = e.detail || {};
          const sceneText = typeof detail.nodeText === 'string' ? detail.nodeText : '';
          const choiceCount = typeof detail.choiceCount === 'number' ? detail.choiceCount : 0;
          updateSceneStatus(sceneText, choiceCount);
        } catch (err) {
          // アクセシビリティ用ステータス更新の失敗は致命的ではないため、ログのみ
          if (window.APP_CONFIG?.debug?.showConsoleLogs) {
            console.warn('[PLAY] Failed to update scene status from agp-scene-rendered:', err);
          }
        }
      });

      // Export functions for external use
      this.announceToScreenReader = announceToScreenReader;
      this.updateSceneStatus = updateSceneStatus;
      this.announceGameAction = announceGameAction;
      this.updateFocusableElements = updateFocusableElements;
      this.navigateChoices = navigateChoices;
    },
  };
})();
