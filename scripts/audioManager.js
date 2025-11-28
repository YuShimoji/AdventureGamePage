(function() {
  'use strict';

  // Audio Manager - Web Audio APIベースのサウンドシステム
  // BGM・効果音の再生制御、ボリューム管理、クロスフェード対応

  const AUDIO_SETTINGS_KEY = window.APP_CONFIG?.storage?.keys?.audioSettings || 'agp_audio_settings';

  const AudioManager = {
    // 設定
    config: {
      masterVolume: 0.7,
      bgmVolume: 0.5,
      sfxVolume: 0.8,
      fadeDuration: 1000, // クロスフェード時間（ms）
      maxConcurrentSFX: 5, // 同時再生可能な効果音数
      preloadEnabled: true
    },

    // 内部状態
    _audioContext: null,
    _bgmSource: null,
    _bgmGain: null,
    _masterGain: null,
    _currentBGM: null,
    _playingSFX: new Set(),
    _audioBuffers: new Map(), // URL -> AudioBuffer
    _fadeTimeouts: new Set(),

    // 初期化
    init() {
      try {
        // AudioContextの作成（ブラウザ互換性考慮）
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) {
          console.warn('[AudioManager] Web Audio API not supported');
          return false;
        }

        this._audioContext = new AudioContext();

        // マスターゲイン作成
        this._masterGain = this._audioContext.createGain();
        this._masterGain.connect(this._audioContext.destination);
        this._masterGain.gain.value = this.config.masterVolume;

        // BGM用ゲイン作成
        this._bgmGain = this._audioContext.createGain();
        this._bgmGain.connect(this._masterGain);
        this._bgmGain.gain.value = this.config.bgmVolume;

        // 設定の読み込み
        this.loadSettings();

        // ユーザーインタラクションでAudioContextを有効化
        this._enableAudioContext();

        log('info', 'AudioManager initialized');
        return true;

      } catch (error) {
        log('error', 'AudioManager initialization failed', { error: error.message });
        return false;
      }
    },

    // AudioContextの有効化（ブラウザ制限対応）
    _enableAudioContext() {
      if (this._audioContext.state === 'suspended') {
        const resumeContext = () => {
          this._audioContext.resume().then(() => {
            log('info', 'AudioContext resumed');
            document.removeEventListener('click', resumeContext);
            document.removeEventListener('touchstart', resumeContext);
            document.removeEventListener('keydown', resumeContext);
          });
        };

        document.addEventListener('click', resumeContext, { once: true });
        document.addEventListener('touchstart', resumeContext, { once: true });
        document.addEventListener('keydown', resumeContext, { once: true });

        log('info', 'AudioContext suspended, waiting for user interaction');
      }
    },

    // 設定の読み込み・保存
    loadSettings() {
      try {
        const saved = StorageUtil?.loadJSON?.(AUDIO_SETTINGS_KEY);
        if (saved) {
          Object.assign(this.config, saved);
          this.updateVolumes();
        }
      } catch (e) {
        log('warn', 'Failed to load audio settings', { error: e.message });
      }
    },

    saveSettings() {
      try {
        StorageUtil?.saveJSON?.(AUDIO_SETTINGS_KEY, this.config);
      } catch (e) {
        log('warn', 'Failed to save audio settings', { error: e.message });
      }
    },

    // ボリューム更新
    updateVolumes() {
      if (this._masterGain) {
        this._masterGain.gain.value = this.config.masterVolume;
      }
      if (this._bgmGain) {
        this._bgmGain.gain.value = this.config.bgmVolume;
      }
    },

    // BGM再生
    async playBGM(url, options = {}) {
      if (!this._audioContext || !url) return;

      try {
        const {
          volume = 1.0,
          loop = true,
          fadeIn = true,
          crossfade = true
        } = options;

        // 同じBGMの場合はスキップ
        if (this._currentBGM === url) return;

        // バッファ取得
        const buffer = await this._loadAudioBuffer(url);
        if (!buffer) {
          log('warn', 'Failed to load BGM buffer', { url });
          return;
        }

        // 現在のBGMをフェードアウト
        if (crossfade && this._bgmSource) {
          this._fadeOutBGM();
        } else {
          this._stopBGM();
        }

        // 新しいBGMソース作成
        const source = this._audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = loop;

        // ゲイン接続
        const gainNode = this._audioContext.createGain();
        gainNode.gain.value = fadeIn ? 0 : volume;
        source.connect(gainNode);
        gainNode.connect(this._bgmGain);

        // 再生開始
        source.start(0);
        this._bgmSource = source;
        this._currentBGM = url;

        // フェードイン
        if (fadeIn) {
          const fadeTime = this.config.fadeDuration / 1000;
          gainNode.gain.linearRampToValueAtTime(volume, this._audioContext.currentTime + fadeTime);
        }

        // 終了時のクリーンアップ
        source.onended = () => {
          if (this._bgmSource === source) {
            this._bgmSource = null;
            this._currentBGM = null;
          }
        };

        log('info', 'BGM started', { url, loop, volume });

      } catch (error) {
        log('error', 'Failed to play BGM', { url, error: error.message });
      }
    },

    // BGM停止
    stopBGM(fadeOut = true) {
      if (fadeOut) {
        this._fadeOutBGM();
      } else {
        this._stopBGM();
      }
    },

    _fadeOutBGM() {
      if (!this._bgmSource) return;

      const fadeTime = this.config.fadeDuration / 1000;
      const gainNode = this._bgmSource.gain || this._bgmGain;

      if (gainNode) {
        gainNode.gain.linearRampToValueAtTime(0, this._audioContext.currentTime + fadeTime);

        const timeoutId = setTimeout(() => {
          this._stopBGM();
          this._fadeTimeouts.delete(timeoutId);
        }, fadeTime * 1000);

        this._fadeTimeouts.add(timeoutId);
      }
    },

    _stopBGM() {
      if (this._bgmSource) {
        try {
          this._bgmSource.stop();
        } catch (e) {
          // 既に停止済みの場合は無視
        }
        this._bgmSource = null;
        this._currentBGM = null;
      }
    },

    // 効果音再生
    async playSFX(url, options = {}) {
      if (!this._audioContext || !url) return;

      try {
        const {
          volume = 1.0,
          loop = false,
          maxInstances = this.config.maxConcurrentSFX
        } = options;

        // 同時再生数制限チェック
        if (this._playingSFX.size >= maxInstances) {
          log('warn', 'Max concurrent SFX reached, skipping', { url, current: this._playingSFX.size });
          return;
        }

        // バッファ取得
        const buffer = await this._loadAudioBuffer(url);
        if (!buffer) {
          log('warn', 'Failed to load SFX buffer', { url });
          return;
        }

        // ソース作成
        const source = this._audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = loop;

        // ゲイン接続
        const gainNode = this._audioContext.createGain();
        gainNode.gain.value = volume * this.config.sfxVolume;
        source.connect(gainNode);
        gainNode.connect(this._masterGain);

        // 再生開始
        source.start(0);

        // 再生管理
        const sfxId = Symbol('sfx');
        this._playingSFX.add(sfxId);

        // 終了時のクリーンアップ
        source.onended = () => {
          this._playingSFX.delete(sfxId);
        };

        // ループでない場合は自動停止タイマー
        if (!loop) {
          const duration = buffer.duration * 1000;
          setTimeout(() => {
            this._playingSFX.delete(sfxId);
          }, duration + 100);
        }

        log('debug', 'SFX started', { url, volume, loop });

      } catch (error) {
        log('error', 'Failed to play SFX', { url, error: error.message });
      }
    },

    // 効果音停止（全停止）
    stopAllSFX() {
      // Web Audio APIでは個別のソース停止が難しいため、
      // ゲインを0にして事実上停止
      if (this._masterGain) {
        this._masterGain.gain.value = 0;
        setTimeout(() => {
          if (this._masterGain) {
            this._masterGain.gain.value = this.config.masterVolume;
          }
        }, 100);
      }
      this._playingSFX.clear();
    },

    // オーディオバッファ読み込み（キャッシュ対応）
    async _loadAudioBuffer(url) {
      // キャッシュチェック
      if (this._audioBuffers.has(url)) {
        return this._audioBuffers.get(url);
      }

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = await this._audioContext.decodeAudioData(arrayBuffer);

        // キャッシュ保存
        if (this.config.preloadEnabled) {
          this._audioBuffers.set(url, buffer);
        }

        return buffer;

      } catch (error) {
        log('error', 'Failed to load audio buffer', { url, error: error.message });
        return null;
      }
    },

    // プリロード
    async preloadAudio(urls) {
      if (!Array.isArray(urls) || !this.config.preloadEnabled) return;

      const promises = urls.map(url => this._loadAudioBuffer(url));
      await Promise.allSettled(promises);

      log('info', 'Audio preload completed', { count: urls.length });
    },

    // 設定変更
    setMasterVolume(volume) {
      this.config.masterVolume = Math.max(0, Math.min(1, volume));
      this.updateVolumes();
      this.saveSettings();
    },

    setBGMVolume(volume) {
      this.config.bgmVolume = Math.max(0, Math.min(1, volume));
      this.updateVolumes();
      this.saveSettings();
    },

    setSFXVolume(volume) {
      this.config.sfxVolume = Math.max(0, Math.min(1, volume));
      this.saveSettings();
    },

    // ミュート制御
    mute() {
      if (this._masterGain) {
        this._masterGain.gain.value = 0;
      }
    },

    unmute() {
      if (this._masterGain) {
        this._masterGain.gain.value = this.config.masterVolume;
      }
    },

    // クリーンアップ
    destroy() {
      // フェードタイムアウトクリア
      this._fadeTimeouts.forEach(id => clearTimeout(id));
      this._fadeTimeouts.clear();

      // BGM停止
      this._stopBGM();

      // 効果音停止
      this.stopAllSFX();

      // AudioContextクローズ
      if (this._audioContext && this._audioContext.state !== 'closed') {
        this._audioContext.close().catch(e => log('warn', 'Failed to close AudioContext', { error: e.message }));
      }

      // キャッシュクリア
      this._audioBuffers.clear();
      this._playingSFX.clear();

      log('info', 'AudioManager destroyed');
    },

    // 状態取得
    getState() {
      return {
        initialized: !!this._audioContext,
        audioContextState: this._audioContext?.state || 'none',
        currentBGM: this._currentBGM,
        playingSFX: this._playingSFX.size,
        masterVolume: this.config.masterVolume,
        bgmVolume: this.config.bgmVolume,
        sfxVolume: this.config.sfxVolume
      };
    }
  };

  // ロガー関数
  function log(level, message, context = {}) {
    const prefix = '[AudioManager]';
    const msg = `${prefix} ${level.toUpperCase()}: ${message}`;
    if (context && Object.keys(context).length > 0) {
      console[level](msg, context);
    } else {
      console[level](msg);
    }
  }

  // グローバル公開
  window.AudioManager = AudioManager;

  // DOMContentLoadedで自動初期化
  document.addEventListener('DOMContentLoaded', () => {
    if (!AudioManager.init()) {
      log('warn', 'AudioManager failed to initialize');
    }
  });

})();
