(function () {
  // Admin Core Module - Main initialization coordinator for admin interface (Refactored for modularity)

  window.AdminCore = {
    init: function () {
      this.setupCore();
      console.log('AdminCore initialized');
    },

    setupCore: function () {
      // Initialize all admin modules
      if (window.AdminEditor) {
        window.AdminEditor.init();
      }

      // Initialize modular managers
      if (window.SidebarAccordionManager) {
        window.SidebarAccordionManager.init();
      }
      if (window.SaveLoadManager) {
        window.SaveLoadManager.init();
      }
      if (window.ThemePanelManager) {
        window.ThemePanelManager.init();
      }
      if (window.FloatingPanelManager) {
        window.FloatingPanelManager.init();
      }
      if (window.EditorSettingsManager) {
        window.EditorSettingsManager.init();
      }
      if (window.AutoScrollAnimationsManager) {
        window.AutoScrollAnimationsManager.init();
      }
      if (window.StorageOperationsManager) {
        window.StorageOperationsManager.init();
      }
      if (window.ImportManager) {
        window.ImportManager.init();
      }
      if (window.AdminAPIManager) {
        window.AdminAPIManager.init();
      }
      if (window.UIAdjuster) {
        window.UIAdjuster.init();
      }
      if (window.UtilsManager) {
        window.UtilsManager.init();
      }
      if (window.StoryWorkflowPanel) {
        window.StoryWorkflowPanel.init();
      }
    },
  };

  // Initialize AdminCore when boot completes
  // Support both EventBus and legacy DOM events
  function initializeAdminCore() {
    try {
      window.AdminCore.init();
    } catch (error) {
      console.error('[AdminCore] Initialization failed:', error);
    }
  }

  // Subscribe to boot complete event
  if (window.EventBus) {
    window.EventBus.on(window.EventBus.Events.ADMIN_BOOT_COMPLETE, initializeAdminCore);
  }

  // Legacy DOM event fallback
  if (document.readyState === 'loading') {
    document.addEventListener('admin-boot-complete', initializeAdminCore);
  } else {
    // DOM already loaded, check if boot already completed
    if (window.AdminBoot && document.getElementById('editor')) {
      setTimeout(initializeAdminCore, 0);
    } else {
      document.addEventListener('admin-boot-complete', initializeAdminCore);
    }
  }
})();
