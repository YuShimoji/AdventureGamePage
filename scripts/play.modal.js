(function () {
  // Play Modal Manager - Integrated modal management using modular components

  let engineRef = null;

  function setupSaveModal() {
    const saveLoadModal = window.PlaySave && typeof window.PlaySave.getModalElement === 'function'
      ? window.PlaySave.getModalElement()
      : document.getElementById('save-load-modal');

    const originalShowModal = window.showModal || function () {};
    window.showModal = function (type) {
      const mode = typeof type === 'string' ? type : 'save';
      if (window.PlaySave && typeof window.PlaySave.showModal === 'function') {
        window.PlaySave.showModal(mode);
      } else {
        originalShowModal(mode);
      }
    };

    if (saveLoadModal) {
      saveLoadModal.addEventListener('agp-play-save-shown', function () {
        window.PlayModalFocus.openModalWithFocus(saveLoadModal);
      });
      saveLoadModal.addEventListener('agp-play-save-hidden', function () {
        window.PlayModalFocus.closeModalWithFocus(saveLoadModal);
      });
    }
  }

  function setupThemePanel() {
    const themePanel = document.getElementById('theme-panel');
    const themeCloseBtn = document.querySelector('#theme-panel .modal-close-btn');
    const btnTheme = document.getElementById('btn-theme');

    if (themeCloseBtn && themePanel) {
      themeCloseBtn.addEventListener('click', function () {
        window.PlayModalFocus.closeModalWithFocus(themePanel);
      });
    }

    if (btnTheme && themePanel) {
      btnTheme.addEventListener('click', function () {
        const willOpen = themePanel.hidden || themePanel.style.display === 'none';
        if (willOpen) {
          window.PlayModalFocus.openModalWithFocus(themePanel);
          if (window.PlayInput && typeof window.PlayInput.announceGameAction === 'function') {
            window.PlayInput.announceGameAction('themeChanged');
          }
        } else {
          window.PlayModalFocus.closeModalWithFocus(themePanel);
        }
      });
    }
  }

  window.PlayModal = {
    init: function (options) {
      engineRef = options && options.engine ? options.engine : null;
      
      setupSaveModal();
      setupThemePanel();
      
      // Initialize save slots module
      if (engineRef && window.PlayModalSaveSlots) {
        window.PlayModalSaveSlots.init(engineRef);
      }
    },
    
    // Delegate to focus manager
    openModalWithFocus: function(modal) {
      return window.PlayModalFocus.openModalWithFocus(modal);
    },
    closeModalWithFocus: function(modal) {
      return window.PlayModalFocus.closeModalWithFocus(modal);
    }
  };
})();
