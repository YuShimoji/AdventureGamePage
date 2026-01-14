/**
 * Async Test Helpers - 非同期テストヘルパーライブラリ
 * ブラウザとNode.js環境の両方で動作する共通の非同期処理ヘルパー
 */

/**
 * Async Test Helpers - 非同期テストヘルパーライブラリ
 * ブラウザとNode.js環境の両方で動作する共通の非同期処理ヘルパー
 */

(function (globalScope) {
  // すでに定義されている場合は、インスタンスの再エクスポートのみ行う
  if (typeof globalScope.AsyncTestHelpers !== 'undefined' && globalScope.createCleanup) {
    return;
  }

  class AsyncTestHelpers {
    constructor() {
      this.defaultTimeout = 5000;
      this.pollingInterval = 50;
    }

    /**
     * DOM要素が出現するまで待機
     */
    async waitForElement(selector, timeout = this.defaultTimeout, parent = document) {
      return new Promise((resolve, reject) => {
        const element = parent.querySelector(selector);
        if (element) {
          resolve(element);
          return;
        }

        const observer = new MutationObserver(() => {
          const targetElement = parent.querySelector(selector);
          if (targetElement) {
            observer.disconnect();
            clearTimeout(timeoutId);
            resolve(targetElement);
          }
        });

        observer.observe(parent, {
          childList: true,
          subtree: true,
          attributes: true,
        });

        const timeoutId = setTimeout(() => {
          observer.disconnect();
          reject(new Error(`Element "${selector}" not found within ${timeout}ms`));
        }, timeout);
      });
    }

    /**
     * DOMが準備完了するまで待機
     */
    async waitForDOM(timeout = this.defaultTimeout) {
      if (typeof window === 'undefined' || window.document?.readyState === 'complete') {
        return Promise.resolve();
      }

      return new Promise((resolve, reject) => {
        if (document.readyState === 'complete') {
          resolve();
          return;
        }

        const handleReadyStateChange = () => {
          if (document.readyState === 'complete') {
            document.removeEventListener('readystatechange', handleReadyStateChange);
            clearTimeout(timeoutId);
            resolve();
          }
        };

        document.addEventListener('readystatechange', handleReadyStateChange);

        const timeoutId = setTimeout(() => {
          document.removeEventListener('readystatechange', handleReadyStateChange);
          reject(new Error(`DOM not ready within ${timeout}ms`));
        }, timeout);
      });
    }

    /**
     * 要素が特定の状態になるまで待機
     */
    async waitForCondition(element, conditionFn, timeout = this.defaultTimeout) {
      const startTime = Date.now();

      return new Promise((resolve, reject) => {
        const checkCondition = () => {
          try {
            if (conditionFn(element)) {
              resolve(element);
              return;
            }
          } catch (error) {
            reject(new Error(`Condition check failed: ${error.message}`));
            return;
          }

          if (Date.now() - startTime > timeout) {
            reject(new Error(`Condition not met within ${timeout}ms`));
            return;
          }

          setTimeout(checkCondition, this.pollingInterval);
        };

        checkCondition();
      });
    }

    async waitForFocus(element, timeout = this.defaultTimeout) {
      return this.waitForCondition(element, () => document.activeElement === element, timeout);
    }

    async waitForVisible(element, timeout = this.defaultTimeout) {
      return this.waitForCondition(
        element,
        el => {
          if (typeof window === 'undefined') return true;
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
        },
        timeout
      );
    }

    async withTimeout(
      promise,
      timeout = this.defaultTimeout,
      errorMessage = 'Operation timed out'
    ) {
      return Promise.race([
        promise,
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`${errorMessage} (${timeout}ms)`)), timeout);
        }),
      ]);
    }

    async retry(asyncFn, maxRetries = 3, delay = 100) {
      let lastError;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await asyncFn();
        } catch (error) {
          lastError = error;
          if (attempt === maxRetries) {
            throw new Error(
              `Operation failed after ${maxRetries} attempts. Last error: ${error.message}`
            );
          }
          const backoffDelay = delay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
      }
    }

    async delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    async waitForEvent(target, eventType, timeout = this.defaultTimeout) {
      return new Promise((resolve, reject) => {
        const handleEvent = event => {
          target.removeEventListener(eventType, handleEvent);
          clearTimeout(timeoutId);
          resolve(event);
        };
        target.addEventListener(eventType, handleEvent);
        const timeoutId = setTimeout(() => {
          target.removeEventListener(eventType, handleEvent);
          reject(new Error(`Event "${eventType}" not fired within ${timeout}ms`));
        }, timeout);
      });
    }

    async waitForAll(asyncFns, timeout = this.defaultTimeout) {
      return this.withTimeout(
        Promise.all(asyncFns.map(fn => fn())),
        timeout,
        'Not all operations completed in time'
      );
    }

    async waitForStorageChange(key, conditionFn, timeout = this.defaultTimeout) {
      return new Promise((resolve, reject) => {
        const currentValue = localStorage.getItem(key);
        if (conditionFn(currentValue)) {
          resolve(currentValue);
          return;
        }

        let pollingId;
        const handleStorageChange = e => {
          if (e.key === key) {
            const newValue = e.newValue;
            if (conditionFn(newValue)) {
              window.removeEventListener('storage', handleStorageChange);
              if (pollingId) clearTimeout(pollingId);
              clearTimeout(timeoutId);
              resolve(newValue);
            }
          }
        };

        window.addEventListener('storage', handleStorageChange);

        const pollStorage = () => {
          const newValue = localStorage.getItem(key);
          if (conditionFn(newValue)) {
            window.removeEventListener('storage', handleStorageChange);
            if (pollingId) clearTimeout(pollingId);
            clearTimeout(timeoutId);
            resolve(newValue);
            return;
          }
          pollingId = setTimeout(pollStorage, this.pollingInterval);
        };

        pollingId = setTimeout(pollStorage, this.pollingInterval);

        const timeoutId = setTimeout(() => {
          window.removeEventListener('storage', handleStorageChange);
          if (pollingId) clearTimeout(pollingId);
          reject(new Error(`Storage "${key}" condition not met within ${timeout}ms`));
        }, timeout);
      });
    }

    createCleanup(cleanupFns = []) {
      return async () => {
        for (const cleanupFn of cleanupFns) {
          try {
            if (typeof cleanupFn === 'function') {
              await cleanupFn();
            }
          } catch (error) {
            console.warn('Cleanup function failed:', error);
          }
        }
      };
    }
  }

  // インスタンス化
  const instance = new AsyncTestHelpers();

  // グローバルスコープへの公開
  globalScope.AsyncTestHelpers = instance;

  // 個別関数をグローバルに展開
  const prototype = AsyncTestHelpers.prototype;
  Object.getOwnPropertyNames(prototype).forEach(prop => {
    if (prop !== 'constructor' && typeof instance[prop] === 'function') {
      globalScope[prop] = instance[prop].bind(instance);
    }
  });

  // 特殊なエイリアス
  globalScope.asyncRetry = instance.retry.bind(instance);
  globalScope.asyncDelay = instance.delay.bind(instance);

  // Node.js 用
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AsyncTestHelpers;
  }
})(typeof window !== 'undefined' ? window : global);
