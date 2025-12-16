(function () {
  // GameEngineUIManager - UIレンダリングとイベント管理
  // DOM操作、イベントリスナー設定、アクセシビリティ対応

  class GameEngineUIManager {
    constructor(elements) {
      this.elements = elements;
      this.listenersAttached = false;
    }

    // ノードレンダリング
    render(gameData, state, getNode, canGoBack, canGoForward, checkConditions) {
      if (this.elements.titleEl) this.elements.titleEl.textContent = gameData.title || 'Adventure';

      const node = getNode();
      if (this.elements.textEl) this.elements.textEl.textContent = node.text || '';

      if (this.elements.imageEl) {
        const url = node.image;
        const resolved = window.MediaResolver?.resolveImageRef
          ? window.MediaResolver.resolveImageRef(url)
          : { ok: typeof url === 'string' && url.trim(), src: url };

        if (resolved && resolved.ok && typeof resolved.src === 'string' && resolved.src.trim()) {
          this.elements.imageEl.hidden = false;
          this.elements.imageEl.innerHTML = '';
          const img = document.createElement('img');
          img.src = resolved.src;
          img.alt = node.title ? `${node.title} の画像` : 'シーン画像';
          img.loading = 'lazy';
          img.decoding = 'async';
          img.style.maxWidth = '100%';
          img.style.height = 'auto';
          img.onerror = () => {
            try {
              this.elements.imageEl.innerHTML = '';
              this.elements.imageEl.hidden = true;
            } catch {}
          };
          this.elements.imageEl.appendChild(img);
        } else {
          if (resolved && resolved.ok === false && window.APP_CONFIG?.debug?.showConsoleLogs) {
            console.warn('[MediaResolver] Image blocked:', resolved);
          }
          this.elements.imageEl.innerHTML = '';
          this.elements.imageEl.hidden = true;
        }
      }

      if (this.elements.choicesEl) {
        this.elements.choicesEl.innerHTML = '';

        const rawChoices = Array.isArray(node.choices) ? node.choices : [];
        const visibleChoices = rawChoices.filter(c => {
          const condArr = Array.isArray(c.conditions) ? c.conditions : null;
          if (!condArr) return true;
          if (typeof checkConditions === 'function') return checkConditions(condArr);
          return true;
        });

        visibleChoices.forEach((c, index) => {
          const b = document.createElement('button');
          b.className = 'btn';
          const text = c.text ?? c.label ?? '';
          const to = c.to ?? c.target ?? '';
          b.textContent = text;
          b.tabIndex = 0;
          b.setAttribute('data-choice-index', index + 1);
          b.setAttribute('aria-label', `${index + 1}. ${text}`);
          b.onclick = () => this.onChoiceClick(to);
          this.elements.choicesEl.appendChild(b);
        });

        this.setupChoiceNavigation();
      }

      // Update back/forward button state if provided
      if (this.elements.backBtn) {
        this.elements.backBtn.disabled = !canGoBack();
      }
      if (this.elements.forwardBtn) {
        this.elements.forwardBtn.disabled = !canGoForward();
      }

      // Dispatch render event for accessibility updates
      document.dispatchEvent(
        new CustomEvent('agp-scene-rendered', {
          detail: {
            nodeText: node.text || '',
            choiceCount: this.elements.choicesEl
              ? this.elements.choicesEl.querySelectorAll('button').length
              : 0,
            nodeId: state.nodeId,
          },
        })
      );

      return node;
    }

    // 選択肢クリックハンドラー（外部から設定）
    setChoiceClickHandler(handler) {
      this.onChoiceClick = handler;
    }

    // キーボードナビゲーション設定
    setupChoiceNavigation() {
      if (
        !this.elements.choicesEl ||
        !window.APP_CONFIG?.gameplay?.keyboardShortcuts?.choiceNavigation
      )
        return;

      try {
        const buttons = this.elements.choicesEl.querySelectorAll('button');
        if (buttons.length > 0) {
          // Focus the first choice button
          buttons[0].focus();

          buttons.forEach(button => {
            button.addEventListener('keydown', e => {
              const currentIndex = Array.from(buttons).indexOf(button);
              switch (e.key) {
                case 'ArrowDown':
                case 'ArrowRight': {
                  e.preventDefault();
                  const nextIndex = (currentIndex + 1) % buttons.length;
                  buttons[nextIndex].focus();
                  break;
                }
                case 'ArrowUp':
                case 'ArrowLeft': {
                  e.preventDefault();
                  const prevIndex = currentIndex === 0 ? buttons.length - 1 : currentIndex - 1;
                  buttons[prevIndex].focus();
                  break;
                }
                case 'Enter':
                case ' ':
                  e.preventDefault();
                  button.click();
                  break;
                default: {
                  // Number keys (1-9) for direct selection
                  const num = parseInt(e.key);
                  if (num >= 1 && num <= 9 && buttons[num - 1]) {
                    e.preventDefault();
                    buttons[num - 1].focus();
                    buttons[num - 1].click();
                  }
                  break;
                }
              }
            });
          });
        }
      } catch (e) {
        // Ignore accessibility setup errors
      }
    }

    // バック/フォワードボタンイベントリスナー設定
    attachListeners(goBack, goForward) {
      if (this.listenersAttached) return;

      if (this.elements.backBtn) {
        this.elements.backBtn.addEventListener('click', () => goBack());
      }
      if (this.elements.forwardBtn) {
        this.elements.forwardBtn.addEventListener('click', () => goForward());
      }

      this.listenersAttached = true;
    }

    // イベントリスナー解除
    detachListeners() {
      if (!this.listenersAttached) return;

      if (this.elements.backBtn) {
        this.elements.backBtn.removeEventListener('click', this.goBack);
      }
      if (this.elements.forwardBtn) {
        this.elements.forwardBtn.removeEventListener('click', this.goForward);
      }

      this.listenersAttached = false;
    }
  }

  window.GameEngineUIManager = GameEngineUIManager;
})();
