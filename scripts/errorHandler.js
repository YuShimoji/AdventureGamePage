// Error Handler and User Notification System
// Provides centralized error handling with user-friendly messages

(function () {
  const ErrorHandler = {
    // Error types
    ErrorType: {
      STORAGE_FULL: "STORAGE_FULL",
      STORAGE_UNAVAILABLE: "STORAGE_UNAVAILABLE",
      NETWORK_ERROR: "NETWORK_ERROR",
      DATA_CORRUPTION: "DATA_CORRUPTION",
      VALIDATION_ERROR: "VALIDATION_ERROR",
      UNKNOWN: "UNKNOWN",
    },

    // Classify error
    classifyError(error) {
      const message = error.message || error.toString();

      if (message.includes("quota") || message.includes("QuotaExceededError")) {
        return this.ErrorType.STORAGE_FULL;
      }
      if (message.includes("SecurityError") || message.includes("not available")) {
        return this.ErrorType.STORAGE_UNAVAILABLE;
      }
      if (message.includes("Network") || message.includes("fetch")) {
        return this.ErrorType.NETWORK_ERROR;
      }
      if (message.includes("JSON") || message.includes("parse")) {
        return this.ErrorType.DATA_CORRUPTION;
      }
      if (message.includes("validation") || message.includes("invalid")) {
        return this.ErrorType.VALIDATION_ERROR;
      }

      return this.ErrorType.UNKNOWN;
    },

    // Get user-friendly message
    getUserMessage(errorType, context = {}) {
      const messages = {
        [this.ErrorType.STORAGE_FULL]: {
          title: "ストレージ容量不足",
          message:
            "ブラウザのストレージ容量が不足しています。古いデータを削除するか、データをエクスポートして空き容量を確保してください。",
          actions: ["古いデータを削除", "データをエクスポート", "キャンセル"],
        },
        [this.ErrorType.STORAGE_UNAVAILABLE]: {
          title: "ストレージ利用不可",
          message:
            "ブラウザのストレージ機能が利用できません。プライベートブラウジングモードを無効にするか、ブラウザの設定を確認してください。",
          actions: ["再試行", "キャンセル"],
        },
        [this.ErrorType.NETWORK_ERROR]: {
          title: "ネットワークエラー",
          message:
            "ネットワーク接続に問題があります。インターネット接続を確認して再試行してください。",
          actions: ["再試行", "キャンセル"],
        },
        [this.ErrorType.DATA_CORRUPTION]: {
          title: "データ破損",
          message: "データが破損している可能性があります。データ修復を試みますか？",
          actions: ["修復を試みる", "キャンセル"],
        },
        [this.ErrorType.VALIDATION_ERROR]: {
          title: "入力エラー",
          message: context.details || "データの検証に失敗しました。入力内容を確認してください。",
          actions: ["OK"],
        },
        [this.ErrorType.UNKNOWN]: {
          title: "エラーが発生しました",
          message: context.details || "予期しないエラーが発生しました。",
          actions: ["OK"],
        },
      };

      return messages[errorType] || messages[this.ErrorType.UNKNOWN];
    },

    // Show error notification
    showError(error, context = {}) {
      const errorType = this.classifyError(error);
      const userMessage = this.getUserMessage(errorType, context);

      // Log technical details
      console.error("ErrorHandler:", {
        type: errorType,
        original: error,
        context,
      });

      // Show user-friendly modal
      this.showErrorModal(userMessage, errorType, error);
    },

    // Show error modal
    showErrorModal(userMessage, errorType, originalError) {
      const modal = document.createElement("div");
      modal.id = "error-modal";
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.8); z-index: 10002;
        display: flex; align-items: center; justify-content: center;
        padding: 20px;
      `;

      const content = document.createElement("div");
      content.style.cssText = `
        background: var(--surface, #fff); color: var(--text-color, #000);
        padding: 24px; border-radius: 12px; max-width: 500px; width: 100%;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      `;

      const icon = this.getErrorIcon(errorType);

      content.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="font-size: 32px;">${icon}</div>
          <h2 style="margin: 0;">${userMessage.title}</h2>
        </div>
        <p style="margin: 16px 0; line-height: 1.6;">${userMessage.message}</p>
        <details style="margin: 16px 0; font-size: 12px; color: var(--muted, #666);">
          <summary style="cursor: pointer;">技術詳細</summary>
          <pre style="margin-top: 8px; padding: 8px; background: rgba(0,0,0,0.05); border-radius: 4px; overflow: auto;">${originalError.stack || originalError.message || originalError}</pre>
        </details>
        <div id="error-actions" style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px;">
        </div>
      `;

      modal.appendChild(content);
      document.body.appendChild(modal);

      // Add action buttons
      const actionsContainer = content.querySelector("#error-actions");
      userMessage.actions.forEach((action, index) => {
        const btn = document.createElement("button");
        btn.className = index === 0 ? "btn btn-accent" : "btn";
        btn.textContent = action;
        btn.addEventListener("click", () => {
          this.handleErrorAction(action, errorType, modal);
        });
        actionsContainer.appendChild(btn);
      });
    },

    getErrorIcon(errorType) {
      const icons = {
        [this.ErrorType.STORAGE_FULL]: "💾",
        [this.ErrorType.STORAGE_UNAVAILABLE]: "🚫",
        [this.ErrorType.NETWORK_ERROR]: "📡",
        [this.ErrorType.DATA_CORRUPTION]: "⚠️",
        [this.ErrorType.VALIDATION_ERROR]: "❗",
        [this.ErrorType.UNKNOWN]: "❌",
      };
      return icons[errorType] || "❌";
    },

    handleErrorAction(action, errorType, modal) {
      switch (action) {
        case "古いデータを削除":
          modal.remove();
          // Navigate to save preview for cleanup
          if (document.getElementById("btn-quick-preview")) {
            document.getElementById("btn-quick-preview").click();
          }
          break;

        case "データをエクスポート":
          modal.remove();
          // Trigger export
          if (document.getElementById("btn-export")) {
            document.getElementById("btn-export").click();
          }
          break;

        case "修復を試みる":
          modal.remove();
          this.attemptDataRepair();
          break;

        case "再試行":
          modal.remove();
          // Emit retry event
          window.dispatchEvent(new CustomEvent("error-retry", { detail: { errorType } }));
          break;

        default:
          modal.remove();
      }
    },

    async attemptDataRepair() {
      if (!window.DataValidator) {
        alert("データ修復機能が利用できません");
        return;
      }

      try {
        // Show progress
        const progress = this.showProgress("データ修復中...");

        // Attempt to repair game data
        const gameData = window.StorageUtil?.loadJSON("agp_game_data");
        if (gameData) {
          const result = window.DataValidator.repairData(gameData, "game");
          if (result.success) {
            window.StorageUtil?.saveJSON("agp_game_data", result.data);
            progress.remove();
            alert(`データ修復が完了しました。\n\n修復内容:\n- ${result.repairs.join("\n- ")}`);
          } else {
            progress.remove();
            alert("修復可能な問題が見つかりませんでした");
          }
        }
      } catch (e) {
        console.error("Repair failed:", e);
        alert("データ修復に失敗しました: " + e.message);
      }
    },

    showProgress(message) {
      const progress = document.createElement("div");
      progress.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: var(--surface, #fff); color: var(--text-color, #000);
        padding: 20px 40px; border-radius: 8px; z-index: 10003;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      `;
      progress.innerHTML = `<p style="margin: 0;">${message}</p>`;
      document.body.appendChild(progress);
      return progress;
    },

    // Retry wrapper for operations
    async withRetry(operation, maxRetries = 3, delayMs = 1000) {
      let lastError;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          return await operation();
        } catch (error) {
          lastError = error;
          const errorType = this.classifyError(error);

          // Don't retry certain errors
          if (
            errorType === this.ErrorType.VALIDATION_ERROR ||
            errorType === this.ErrorType.STORAGE_UNAVAILABLE
          ) {
            throw error;
          }

          // Wait before retry
          if (attempt < maxRetries - 1) {
            await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
          }
        }
      }

      throw lastError;
    },
  };

  // Expose globally
  window.ErrorHandler = ErrorHandler;

  // Global error listener
  window.addEventListener("unhandledrejection", (event) => {
    console.error("Unhandled promise rejection:", event.reason);
    // Don't show modal for all unhandled rejections, but log them
  });
})();
