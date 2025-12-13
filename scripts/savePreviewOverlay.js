(function () {
  // SavePreviewOverlay - オーバーレイ制御専用モジュール
  // SavePreviewPanelManagerから分離されたオーバーレイ管理機能

  class SavePreviewOverlay {
    constructor(panel) {
      this.panel = panel;
      this.overlay = null;
      this.listenersAttached = false;
      this.lastFocused = null;
      this.isOpenFlag = false;
    }

    // オーバーレイの初期化
    initialize() {
      if (!this.panel) return;

      if (!this.panel.hasAttribute("role")) this.panel.setAttribute("role", "dialog");
      if (!this.panel.hasAttribute("aria-modal")) this.panel.setAttribute("aria-modal", "true");
      if (!this.panel.hasAttribute("tabindex")) this.panel.setAttribute("tabindex", "-1");

      this.panel.dataset.state = this.panel.hasAttribute("hidden") ? "closed" : "open";
      this.panel.setAttribute("aria-hidden", this.panel.hasAttribute("hidden") ? "true" : "false");

      this.isOpenFlag = !this.panel.hasAttribute("hidden");
    }

    // オーバーレイを開く
    open() {
      if (this.isOpen()) return false;

      // 現在のフォーカス要素を保存
      this.lastFocused = document.activeElement;

      // DOM表示とアクセシビリティ属性を設定
      this.panel.removeAttribute("hidden");
      this.panel.removeAttribute("inert");
      this.panel.setAttribute("aria-hidden", "false");

      // 状態を更新
      this.isOpenFlag = true;
      this.panel.dataset.state = "open";
      this.panel.classList.add("is-open");

      // イベントリスナーを設定
      this.attachListeners();

      // パネル内の最初のフォーカス可能要素にフォーカス
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
            try {
              this.panel.focus({ preventScroll: true });
            } catch (_) {}
          }
        }
      });

      return true;
    }

    // オーバーレイを閉じる
    close(options = {}) {
      if (!this.isOpen()) return false;

      // フォーカスを先に移動してから aria-hidden を設定
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
            document.body.focus();
            return false;
          }
        }
        return false;
      };

      // 状態を更新
      this.isOpenFlag = false;
      this.panel.dataset.state = "closed";
      this.panel.classList.remove("is-open");

      // フォーカスを即座に移動
      restoreFocusTarget();

      // イベントリスナーを解除
      this.detachListeners();

      // アクセシビリティ属性とDOM非表示を設定
      this.panel.setAttribute("aria-hidden", "true");
      this.panel.setAttribute("inert", "");
      this.panel.setAttribute("hidden", "");

      return true;
    }

    // 開いているかどうか
    isOpen() {
      return this.isOpenFlag && this.panel.dataset.state === "open" && !this.panel.hasAttribute("hidden");
    }

    // イベントリスナーの設定
    attachListeners() {
      if (this.listenersAttached) return;
      document.addEventListener("keydown", this.handleKeydown, true);
      this.panel.addEventListener("mousedown", this.handleBackdrop, true);
      this.listenersAttached = true;
    }

    // イベントリスナーの解除
    detachListeners() {
      if (!this.listenersAttached) return;
      document.removeEventListener("keydown", this.handleKeydown, true);
      this.panel.removeEventListener("mousedown", this.handleBackdrop, true);
      this.listenersAttached = false;
    }

    // キーボードイベントハンドラ
    handleKeydown = (e) => {
      if (e.key === "Escape" && this.isOpen()) {
        e.preventDefault();
        this.close();
      }
    };

    // 背景クリックイベントハンドラ
    handleBackdrop = (e) => {
      if (e.target === this.panel) {
        this.close({ restoreFocus: true });
      }
    };
  }

  // グローバル公開
  window.SavePreviewOverlay = SavePreviewOverlay;

})();
