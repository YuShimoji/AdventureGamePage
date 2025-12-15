(function () {
  // SavePreview Overlay Module - Handles overlay functionality
  class SavePreviewOverlay {
    constructor(panel, state) {
      this.panel = panel;
      this.state = state;
      this.lastFocused = null;
      this.listenersAttached = false;
    }

    open() {
      if (this.isOpen()) return false;

      // 現在のフォーカス要素を保存
      this.lastFocused = document.activeElement;

      // 1. DOM表示とアクセシビリティ属性を設定
      this.panel.removeAttribute("hidden");
      this.panel.removeAttribute("inert"); // inertを解除
      this.panel.setAttribute("aria-hidden", "false");

      // 2. 状態を更新
      this.state.isOpen = true;
      this.panel.dataset.state = "open";
      this.panel.classList.add("is-open");

      // 3. イベントリスナーを設定
      this.attachListeners();

      // 4. パネル内の最初のフォーカス可能要素にフォーカス
      // requestAnimationFrameで遅延して、DOM更新後にフォーカス
      requestAnimationFrame(() => {
        const focusable = this.panel.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = Array.from(focusable).find(
          (el) => el.offsetParent !== null
        );
        if (firstFocusable) {
          try {
            firstFocusable.focus({ preventScroll: true });
          } catch (_) {
            // フォーカス失敗時はパネル自体にフォーカス
            try {
              this.panel.focus({ preventScroll: true });
            } catch (_) {}
          }
        }
      });

      return true;
    }

    close(options = {}) {
      if (!this.isOpen()) return false;

      // CRITICAL: フォーカスを先に移動してから aria-hidden を設定
      // ブラウザが aria-hidden のブロックエラーを出さないようにする
      const restoreFocusTarget = () => {
        if (options.restoreFocus !== false && this.lastFocused && typeof this.lastFocused.focus === "function") {
          try {
            this.lastFocused.focus({ preventScroll: true });
            return true;
          } catch (_) {
            // fallthrough
          }
        }
        // フォールバック: openボタンにフォーカス
        const openBtn = document.getElementById("btn-quick-preview");
        if (openBtn && typeof openBtn.focus === "function") {
          try {
            openBtn.focus({ preventScroll: true });
            return true;
          } catch (_) {
            // フォーカス移動失敗時は body にフォーカス
            document.body.focus();
            return false;
          }
        }
        return false;
      };

      // 1. 状態を更新（再呼び出し防止）
      this.state.isOpen = false;
      this.panel.dataset.state = "closed";
      this.panel.classList.remove("is-open");

      // 2. フォーカスを即座に移動（aria-hiddenの前に実行）
      restoreFocusTarget();

      // 3. イベントリスナーを解除
      this.detachListeners();

      // 4. アクセシビリティ属性とDOM非表示を設定
      // フォーカスが既に移動しているため、ブロックされない
      this.panel.setAttribute("aria-hidden", "true");
      this.panel.setAttribute("inert", ""); // 最新標準: 要素を完全に非対話化
      this.panel.setAttribute("hidden", "");

      return true;
    }

    isOpen() {
      return this.state.isOpen && this.panel.dataset.state === "open" && !this.panel.hasAttribute("hidden");
    }

    attachListeners() {
      if (this.listenersAttached) return;
      document.addEventListener("keydown", this.handleKeydown.bind(this), true);
      this.panel.addEventListener("mousedown", this.handleBackdrop.bind(this), true);
      this.listenersAttached = true;
    }

    detachListeners() {
      if (!this.listenersAttached) return;
      document.removeEventListener("keydown", this.handleKeydown.bind(this), true);
      this.panel.removeEventListener("mousedown", this.handleBackdrop.bind(this), true);
      this.listenersAttached = false;
    }

    handleKeydown(e) {
      if (e.key === "Escape" && this.isOpen()) {
        e.preventDefault();
        this.close();
      }
    }

    handleBackdrop(e) {
      if (e.target === this.panel) {
        this.close({ restoreFocus: true });
      }
    }
  }

  // Export
  window.SavePreviewOverlay = SavePreviewOverlay;
})();
