/**
 * EventBus - Application-wide event system for decoupling modules
 * Provides pub/sub pattern for cross-module communication
 */
(function() {
  'use strict';

  class EventBus {
    constructor() {
      this.listeners = new Map();
      this.eventLog = [];
      this.maxLogSize = 100;
      this.debugMode = false;
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Handler function
     * @param {Object} options - Options (once, priority)
     * @returns {Function} Unsubscribe function
     */
    on(event, callback, options = {}) {
      if (typeof callback !== 'function') {
        throw new TypeError('Callback must be a function');
      }

      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }

      const listener = {
        callback,
        once: options.once || false,
        priority: options.priority || 0,
        id: Symbol('listener')
      };

      const listeners = this.listeners.get(event);
      listeners.push(listener);
      
      // Sort by priority (higher priority first)
      listeners.sort((a, b) => b.priority - a.priority);

      if (this.debugMode) {
        console.log(`[EventBus] Subscribed to "${event}"`, { options });
      }

      // Return unsubscribe function
      return () => this.off(event, listener.id);
    }

    /**
     * Subscribe to an event (one-time)
     * @param {string} event - Event name
     * @param {Function} callback - Handler function
     * @returns {Function} Unsubscribe function
     */
    once(event, callback) {
      return this.on(event, callback, { once: true });
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Symbol|Function} listenerIdOrCallback - Listener ID or callback
     */
    off(event, listenerIdOrCallback) {
      if (!this.listeners.has(event)) return;

      const listeners = this.listeners.get(event);
      const index = listeners.findIndex(l => 
        l.id === listenerIdOrCallback || l.callback === listenerIdOrCallback
      );

      if (index !== -1) {
        listeners.splice(index, 1);
        if (this.debugMode) {
          console.log(`[EventBus] Unsubscribed from "${event}"`);
        }
      }

      // Clean up empty listener arrays
      if (listeners.length === 0) {
        this.listeners.delete(event);
      }
    }

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {*} data - Event data
     * @returns {Promise<void>}
     */
    async emit(event, data) {
      if (!this.listeners.has(event)) {
        if (this.debugMode) {
          console.log(`[EventBus] No listeners for "${event}"`);
        }
        return;
      }

      const listeners = [...this.listeners.get(event)];
      const eventInfo = {
        event,
        data,
        timestamp: Date.now()
      };

      // Log event
      this.logEvent(eventInfo);

      if (this.debugMode) {
        console.log(`[EventBus] Emitting "${event}"`, data);
      }

      // Execute listeners
      for (const listener of listeners) {
        try {
          await listener.callback(data);
          
          // Remove one-time listeners
          if (listener.once) {
            this.off(event, listener.id);
          }
        } catch (error) {
          console.error(`[EventBus] Error in listener for "${event}":`, error);
          // Continue executing other listeners
        }
      }
    }

    /**
     * Emit an event synchronously
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emitSync(event, data) {
      if (!this.listeners.has(event)) {
        if (this.debugMode) {
          console.log(`[EventBus] No listeners for "${event}"`);
        }
        return;
      }

      const listeners = [...this.listeners.get(event)];
      const eventInfo = {
        event,
        data,
        timestamp: Date.now()
      };

      // Log event
      this.logEvent(eventInfo);

      if (this.debugMode) {
        console.log(`[EventBus] Emitting (sync) "${event}"`, data);
      }

      // Execute listeners synchronously
      for (const listener of listeners) {
        try {
          listener.callback(data);
          
          // Remove one-time listeners
          if (listener.once) {
            this.off(event, listener.id);
          }
        } catch (error) {
          console.error(`[EventBus] Error in listener for "${event}":`, error);
        }
      }
    }

    /**
     * Remove all listeners for an event (or all events)
     * @param {string} [event] - Event name (optional)
     */
    clear(event) {
      if (event) {
        this.listeners.delete(event);
        if (this.debugMode) {
          console.log(`[EventBus] Cleared listeners for "${event}"`);
        }
      } else {
        this.listeners.clear();
        if (this.debugMode) {
          console.log('[EventBus] Cleared all listeners');
        }
      }
    }

    /**
     * Get all registered events
     * @returns {string[]} Event names
     */
    getEvents() {
      return Array.from(this.listeners.keys());
    }

    /**
     * Get listener count for an event
     * @param {string} event - Event name
     * @returns {number} Listener count
     */
    getListenerCount(event) {
      return this.listeners.has(event) ? this.listeners.get(event).length : 0;
    }

    /**
     * Log an event
     * @private
     */
    logEvent(eventInfo) {
      this.eventLog.push(eventInfo);
      
      // Limit log size
      if (this.eventLog.length > this.maxLogSize) {
        this.eventLog.shift();
      }
    }

    /**
     * Get event log
     * @param {number} [limit] - Max number of events to return
     * @returns {Object[]} Event log
     */
    getLog(limit) {
      return limit ? this.eventLog.slice(-limit) : [...this.eventLog];
    }

    /**
     * Enable/disable debug mode
     * @param {boolean} enabled - Debug mode enabled
     */
    setDebugMode(enabled) {
      this.debugMode = !!enabled;
      console.log(`[EventBus] Debug mode ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  // Create singleton instance
  const eventBus = new EventBus();

  // Global export
  window.EventBus = eventBus;

  // Common event names (for documentation and IDE support)
  window.EventBus.Events = {
    // Panel events
    PANEL_OPEN: 'panel:open',
    PANEL_CLOSE: 'panel:close',
    PANEL_TOGGLE: 'panel:toggle',
    
    // Save/Load events
    SAVE_SUCCESS: 'save:success',
    SAVE_ERROR: 'save:error',
    LOAD_SUCCESS: 'load:success',
    LOAD_ERROR: 'load:error',
    
    // Editor events
    EDITOR_CHANGE: 'editor:change',
    EDITOR_FOCUS: 'editor:focus',
    EDITOR_BLUR: 'editor:blur',
    
    // Theme events
    THEME_CHANGE: 'theme:change',
    
    // Admin events
    ADMIN_BOOT_COMPLETE: 'admin:boot:complete',
    ADMIN_INIT_COMPLETE: 'admin:init:complete',
    
    // UI events
    SIDEBAR_TOGGLE: 'ui:sidebar:toggle',
    ZEN_MODE_TOGGLE: 'ui:zen:toggle', // deprecated, use COMPACT_VIEW_TOGGLE
    COMPACT_VIEW_TOGGLE: 'ui:compact:toggle'
  };

  console.log('[EventBus] Initialized');
})();
