/**
 * Toast Notification Manager
 * Provides a simple API for showing toast notifications with animations
 */
(function() {
  'use strict';

  const TOAST_DURATION = 4000; // Default duration in ms
  const TOAST_ANIMATION_DURATION = 200; // Animation duration in ms

  let container = null;
  let toastQueue = [];
  let toastIdCounter = 0;

  /**
   * Initialize toast container
   */
  function ensureContainer() {
    if (container && document.body.contains(container)) return container;
    
    container = document.createElement('div');
    container.className = 'toast-container';
    container.setAttribute('role', 'alert');
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(container);
    
    return container;
  }

  /**
   * Create toast element
   * @param {Object} options Toast options
   * @returns {HTMLElement} Toast element
   */
  function createToastElement(options) {
    const { id, message, type, icon, closable } = options;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.dataset.toastId = id;
    toast.setAttribute('role', 'status');
    
    // Icon
    if (icon) {
      const iconEl = document.createElement('span');
      iconEl.className = 'toast-icon';
      iconEl.innerHTML = getIconSvg(type);
      toast.appendChild(iconEl);
    }
    
    // Message
    const messageEl = document.createElement('span');
    messageEl.className = 'toast-message';
    messageEl.textContent = message;
    toast.appendChild(messageEl);
    
    // Close button
    if (closable) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'toast-close';
      closeBtn.setAttribute('aria-label', '閉じる');
      closeBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
      closeBtn.addEventListener('click', () => dismissToast(id));
      toast.appendChild(closeBtn);
    }
    
    return toast;
  }

  /**
   * Get icon SVG based on type
   * @param {string} type Toast type
   * @returns {string} SVG string
   */
  function getIconSvg(type) {
    const icons = {
      success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
      warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };
    return icons[type] || icons.info;
  }

  /**
   * Show a toast notification
   * @param {string} message Message to display
   * @param {Object} options Toast options
   * @returns {number} Toast ID
   */
  function show(message, options = {}) {
    const id = ++toastIdCounter;
    const {
      type = 'info',
      duration = TOAST_DURATION,
      closable = true,
      icon = true
    } = options;

    ensureContainer();

    const toastOptions = { id, message, type, icon, closable };
    const toastEl = createToastElement(toastOptions);
    
    container.appendChild(toastEl);
    
    // Store toast info
    const toastInfo = {
      id,
      element: toastEl,
      timeoutId: null
    };
    toastQueue.push(toastInfo);

    // Auto-dismiss after duration
    if (duration > 0) {
      toastInfo.timeoutId = setTimeout(() => {
        dismissToast(id);
      }, duration);
    }

    return id;
  }

  /**
   * Dismiss a toast by ID
   * @param {number} id Toast ID
   */
  function dismissToast(id) {
    const index = toastQueue.findIndex(t => t.id === id);
    if (index === -1) return;

    const toastInfo = toastQueue[index];
    const { element, timeoutId } = toastInfo;

    // Clear timeout if exists
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Add exit animation
    element.classList.add('toast-exiting');

    // Remove after animation
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      toastQueue.splice(index, 1);
    }, TOAST_ANIMATION_DURATION);
  }

  /**
   * Dismiss all toasts
   */
  function dismissAll() {
    const ids = toastQueue.map(t => t.id);
    ids.forEach(id => dismissToast(id));
  }

  /**
   * Success toast shorthand
   * @param {string} message Message
   * @param {Object} options Options
   * @returns {number} Toast ID
   */
  function success(message, options = {}) {
    return show(message, { ...options, type: 'success' });
  }

  /**
   * Warning toast shorthand
   * @param {string} message Message
   * @param {Object} options Options
   * @returns {number} Toast ID
   */
  function warning(message, options = {}) {
    return show(message, { ...options, type: 'warning' });
  }

  /**
   * Error toast shorthand
   * @param {string} message Message
   * @param {Object} options Options
   * @returns {number} Toast ID
   */
  function error(message, options = {}) {
    return show(message, { ...options, type: 'error' });
  }

  /**
   * Info toast shorthand
   * @param {string} message Message
   * @param {Object} options Options
   * @returns {number} Toast ID
   */
  function info(message, options = {}) {
    return show(message, { ...options, type: 'info' });
  }

  // Expose API
  window.ToastManager = {
    show,
    success,
    warning,
    error,
    info,
    dismiss: dismissToast,
    dismissAll
  };
})();
