(function () {
  // Play Modal Focus Manager - Modal focus trapping and accessibility

  let previousActiveElement = null;

  const PlayModalFocus = {
    announce(message, priority) {
      const fn = window.PlayInput && window.PlayInput.announceToScreenReader;
      if (typeof fn === 'function') {
        fn(message, priority);
      }
    },

    trapFocusInModal(modal) {
      if (!modal) return function () {};

      const focusableElements = modal.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return function () {};

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      previousActiveElement = document.activeElement;

      function handleTabKey(e) {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }

      function handleEscapeKey(e) {
        if (e.key === 'Escape') {
          e.preventDefault();
          PlayModalFocus.closeModalWithFocus(modal);
        }
      }

      setTimeout(function () {
        if (firstElement && typeof firstElement.focus === 'function') {
          firstElement.focus();
        }
      }, 100);

      modal.addEventListener('keydown', handleTabKey);
      modal.addEventListener('keydown', handleEscapeKey);

      return function () {
        modal.removeEventListener('keydown', handleTabKey);
        modal.removeEventListener('keydown', handleEscapeKey);

        if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
          previousActiveElement.focus();
        }
      };
    },

    openModalWithFocus(modal) {
      if (!modal) return;

      modal.hidden = false;
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';

      const cleanup = this.trapFocusInModal(modal);
      modal._focusCleanup = cleanup;

      const title = modal.querySelector('h2, h3');
      if (title) {
        this.announce(title.textContent + 'を開きました', 'assertive');
      }
    },

    closeModalWithFocus(modal) {
      if (!modal) return;

      modal.hidden = true;
      modal.style.display = 'none';
      document.body.style.overflow = '';

      if (modal._focusCleanup) {
        modal._focusCleanup();
        modal._focusCleanup = null;
      }

      this.announce('モーダルを閉じました', 'assertive');
    }
  };

  // Global exposure
  window.PlayModalFocus = PlayModalFocus;
})();
