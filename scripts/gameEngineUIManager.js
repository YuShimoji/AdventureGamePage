(function () {
  // GameEngineUIManager - UIレンダリングとイベント管理
  // DOM操作、イベントリスナー設定、アクセシビリティ対応

  class GameEngineUIManager {
    constructor(elements) {
      this.elements = elements;
      this.listenersAttached = false;
    }

    // ノードレンダリング
    render(gameData, state, getNode, canGoBack, canGoForward) {
      if (this.elements.titleEl) this.elements.titleEl.textContent = gameData.title || "Adventure";

      const node = getNode();
      if (this.elements.textEl) this.elements.textEl.textContent = node.text || "";

      // Render scene image if available
      if (this.elements.imageEl) {
        this.renderImage(node.image);
      }

      if (this.elements.choicesEl) {
        this.elements.choicesEl.innerHTML = "";
        (node.choices || []).forEach((c, index) => {
          const b = document.createElement("button");
          b.className = "btn";
          b.textContent = c.text;
          b.tabIndex = 0;
          b.setAttribute('data-choice-index', index + 1);
          b.setAttribute('aria-label', `${index + 1}. ${c.text}`);
          b.onclick = () => this.onChoiceClick(c.to);
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
      document.dispatchEvent(new CustomEvent('agp-scene-rendered', {
        detail: {
          nodeText: node.text || '',
          choiceCount: node.choices?.length || 0,
          nodeId: state.nodeId
        }
      }));

      return node;
    }

    // 選択肢クリックハンドラー（外部から設定）
    setChoiceClickHandler(handler) {
      this.onChoiceClick = handler;
    }

    // キーボードナビゲーション設定
    setupChoiceNavigation() {
      if (!this.elements.choicesEl || !window.APP_CONFIG?.gameplay?.keyboardShortcuts?.choiceNavigation) return;

      try {
        const buttons = this.elements.choicesEl.querySelectorAll("button");
        if (buttons.length > 0) {
          // Focus the first choice button
          buttons[0].focus();

          buttons.forEach((button, index) => {
            button.addEventListener('keydown', (e) => {
              const currentIndex = Array.from(buttons).indexOf(button);
              switch (e.key) {
                case 'ArrowDown':
                case 'ArrowRight':
                  e.preventDefault();
                  const nextIndex = (currentIndex + 1) % buttons.length;
                  buttons[nextIndex].focus();
                  break;
                case 'ArrowUp':
                case 'ArrowLeft':
                  e.preventDefault();
                  const prevIndex = currentIndex === 0 ? buttons.length - 1 : currentIndex - 1;
                  buttons[prevIndex].focus();
                  break;
                case 'Enter':
                case ' ':
                  e.preventDefault();
                  button.click();
                  break;
                default:
                  // Number keys (1-9) for direct selection
                  const num = parseInt(e.key);
                  if (num >= 1 && num <= 9 && buttons[num - 1]) {
                    e.preventDefault();
                    buttons[num - 1].focus();
                    buttons[num - 1].click();
                  }
                  break;
              }
            });
          });
        }
      } catch (e) {
        // Ignore accessibility setup errors
      }
    }

    // 画像レンダリング
    renderImage(imageUrl) {
      const imageEl = this.elements.imageEl;
      if (!imageEl) return;

      // Clear existing content
      imageEl.innerHTML = '';

      // No image URL provided
      if (!imageUrl || typeof imageUrl !== 'string') {
        imageEl.hidden = true;
        return;
      }

      // Validate URL (basic check)
      const isValidUrl = imageUrl.startsWith('http://') || 
                        imageUrl.startsWith('https://') || 
                        imageUrl.startsWith('/') || 
                        imageUrl.startsWith('./') || 
                        imageUrl.startsWith('../') ||
                        imageUrl.startsWith('data:');

      if (!isValidUrl) {
        console.warn(`[ImageDisplay] Invalid image URL: ${imageUrl}`);
        imageEl.hidden = true;
        return;
      }

      // Create image element
      const img = document.createElement('img');
      img.src = imageUrl;
      img.alt = 'Scene image';
      img.className = 'scene-image__img';

      // Handle load success
      img.addEventListener('load', () => {
        imageEl.hidden = false;
        if (window.APP_CONFIG?.debug?.showConsoleLogs) {
          console.log(`[ImageDisplay] Image loaded: ${imageUrl}`);
        }
      });

      // Handle load error
      img.addEventListener('error', () => {
        console.warn(`[ImageDisplay] Failed to load image: ${imageUrl}`);
        imageEl.hidden = true;
        imageEl.innerHTML = '';
      });

      // Append image to container
      imageEl.appendChild(img);
    }

    // バック/フォワードボタンイベントリスナー設定
    attachListeners(goBack, goForward) {
      if (this.listenersAttached) return;

      if (this.elements.backBtn) {
        this.elements.backBtn.addEventListener("click", () => goBack());
      }
      if (this.elements.forwardBtn) {
        this.elements.forwardBtn.addEventListener("click", () => goForward());
      }

      this.listenersAttached = true;
    }

    // イベントリスナー解除
    detachListeners() {
      if (!this.listenersAttached) return;

      if (this.elements.backBtn) {
        this.elements.backBtn.removeEventListener("click", this.goBack);
      }
      if (this.elements.forwardBtn) {
        this.elements.forwardBtn.removeEventListener("click", this.goForward);
      }

      this.listenersAttached = false;
    }
  }

  window.GameEngineUIManager = GameEngineUIManager;
})();
