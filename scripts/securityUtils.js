/**
 * Security Utilities
 * XSS防止、HTMLエスケープ、URL検証などのセキュリティ関連ユーティリティ
 */
(function () {
  'use strict';

  const SecurityUtils = {
    /**
     * HTMLエスケープ - XSS攻撃を防ぐためにHTMLタグをエスケープ
     * @param {string} str - エスケープする文字列
     * @returns {string} エスケープされた文字列
     */
    escapeHTML(str) {
      if (typeof str !== 'string') {
        return '';
      }

      const escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;'
      };

      return str.replace(/[&<>"'\/]/g, (char) => escapeMap[char]);
    },

    /**
     * テキストサニタイズ - HTMLタグを除去し、安全なテキストのみを残す
     * @param {string} text - サニタイズするテキスト
     * @param {object} options - オプション
     * @returns {string} サニタイズされたテキスト
     */
    sanitizeText(text, options = {}) {
      if (typeof text !== 'string') {
        return '';
      }

      const {
        allowNewlines = true,
        maxLength = 10000,
        trimWhitespace = true
      } = options;

      // HTMLタグを除去
      let sanitized = text.replace(/<[^>]*>/g, '');

      // 特殊文字をエスケープ
      sanitized = this.escapeHTML(sanitized);

      // 改行を許可しない場合は除去
      if (!allowNewlines) {
        sanitized = sanitized.replace(/[\r\n]/g, ' ');
      }

      // 長さ制限
      if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
      }

      // 前後の空白を除去
      if (trimWhitespace) {
        sanitized = sanitized.trim();
      }

      return sanitized;
    },

    /**
     * URL検証 - URLの形式とプロトコルを検証
     * @param {string} url - 検証するURL
     * @param {object} options - オプション
     * @returns {boolean} URLが有効かどうか
     */
    validateURL(url, options = {}) {
      if (typeof url !== 'string' || url.length === 0) {
        return false;
      }

      const {
        allowHttp = true,
        allowHttps = true,
        allowRelative = true,
        allowDataURL = true,
        allowedDomains = null // null = すべて許可, 配列 = ホワイトリスト
      } = options;

      // Data URL
      if (url.startsWith('data:')) {
        return allowDataURL && /^data:image\/(png|jpeg|jpg|gif|svg\+xml|webp);base64,/.test(url);
      }

      // 相対パス
      if (url.startsWith('./') || url.startsWith('../') || url.startsWith('/')) {
        return allowRelative;
      }

      // 絶対URL
      try {
        const urlObj = new URL(url);
        
        // プロトコルチェック
        if (urlObj.protocol === 'http:' && !allowHttp) {
          return false;
        }
        if (urlObj.protocol === 'https:' && !allowHttps) {
          return false;
        }
        if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
          return false;
        }

        // ドメインホワイトリスト
        if (allowedDomains && Array.isArray(allowedDomains)) {
          const domain = urlObj.hostname;
          return allowedDomains.some(allowed => 
            domain === allowed || domain.endsWith(`.${allowed}`)
          );
        }

        return true;
      } catch (e) {
        // URL解析エラー
        return false;
      }
    },

    /**
     * JSONの安全なパース - 不正なJSONをキャッチ
     * @param {string} jsonString - パースするJSON文字列
     * @param {any} defaultValue - パース失敗時のデフォルト値
     * @returns {any} パースされたオブジェクト、または defaultValue
     */
    safeJSONParse(jsonString, defaultValue = null) {
      if (typeof jsonString !== 'string') {
        return defaultValue;
      }

      try {
        const parsed = JSON.parse(jsonString);
        
        // プロトタイプ汚染を防ぐ
        if (parsed && typeof parsed === 'object') {
          delete parsed.__proto__;
          delete parsed.constructor;
        }

        return parsed;
      } catch (e) {
        console.warn('[SecurityUtils] JSON parse error:', e.message);
        return defaultValue;
      }
    },

    /**
     * オブジェクトキーのサニタイズ - プロトタイプ汚染を防ぐ
     * @param {string} key - サニタイズするキー
     * @returns {boolean} キーが安全かどうか
     */
    isSafeObjectKey(key) {
      if (typeof key !== 'string') {
        return false;
      }

      const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
      return !dangerousKeys.includes(key);
    },

    /**
     * 変数名の検証 - 安全な変数名かチェック
     * @param {string} name - 検証する変数名
     * @returns {boolean} 変数名が有効かどうか
     */
    validateVariableName(name) {
      if (typeof name !== 'string' || name.length === 0) {
        return false;
      }

      // 英数字、アンダースコア、ハイフンのみ許可
      const validPattern = /^[a-zA-Z0-9_-]+$/;
      return validPattern.test(name) && name.length <= 100;
    },

    /**
     * 変数値の検証 - 安全な変数値かチェック
     * @param {any} value - 検証する値
     * @param {object} options - オプション
     * @returns {boolean} 値が有効かどうか
     */
    validateVariableValue(value, options = {}) {
      const {
        allowedTypes = ['string', 'number', 'boolean'],
        maxStringLength = 1000,
        maxNumber = Number.MAX_SAFE_INTEGER,
        minNumber = Number.MIN_SAFE_INTEGER
      } = options;

      const valueType = typeof value;

      // 型チェック
      if (!allowedTypes.includes(valueType)) {
        return false;
      }

      // 文字列長チェック
      if (valueType === 'string' && value.length > maxStringLength) {
        return false;
      }

      // 数値範囲チェック
      if (valueType === 'number') {
        if (!Number.isFinite(value)) {
          return false;
        }
        if (value > maxNumber || value < minNumber) {
          return false;
        }
      }

      return true;
    },

    /**
     * セーブデータの検証 - セーブデータが安全かチェック
     * @param {object} saveData - 検証するセーブデータ
     * @returns {object} { valid: boolean, errors: string[] }
     */
    validateSaveData(saveData) {
      const errors = [];

      if (!saveData || typeof saveData !== 'object') {
        errors.push('Save data must be an object');
        return { valid: false, errors };
      }

      // 必須フィールド
      if (typeof saveData.nodeId !== 'string') {
        errors.push('nodeId must be a string');
      }

      // プレイヤー状態
      if (saveData.playerState && typeof saveData.playerState !== 'object') {
        errors.push('playerState must be an object');
      }

      // 変数検証
      if (saveData.playerState?.variables) {
        const variables = saveData.playerState.variables;
        if (typeof variables !== 'object') {
          errors.push('variables must be an object');
        } else {
          for (const [key, value] of Object.entries(variables)) {
            if (!this.isSafeObjectKey(key)) {
              errors.push(`Unsafe variable key: ${key}`);
            }
            if (!this.validateVariableValue(value)) {
              errors.push(`Invalid variable value for key: ${key}`);
            }
          }
        }
      }

      // インベントリ検証
      if (saveData.playerState?.inventory) {
        const inventory = saveData.playerState.inventory;
        if (!Array.isArray(inventory)) {
          errors.push('inventory must be an array');
        } else if (inventory.length > 1000) {
          errors.push('inventory exceeds maximum size');
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    }
  };

  // グローバルエクスポート
  window.SecurityUtils = SecurityUtils;
})();
