(function () {
  // Admin Core Module - Main initialization coordinator for admin interface (Refactored for modularity)

  window.AdminCore = {
    init: function () {
      this.setupCore();
      console.debug('AdminCore initialized');
    },

    setupCore: function () {
      // Play test button
      this.setupPlayTestButton();

      // Node editor empty state
      this.setupNodeEditorEmptyState();

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

  // --- Play Test Button ---
  window.AdminCore.setupPlayTestButton = function () {
    var btn = document.getElementById('btn-play-test');
    if (!btn) return;

    btn.addEventListener('click', function () {
      // Save current node editor data to agp_game_data before navigating
      var GAME_DATA_KEY = window.APP_CONFIG?.storage?.keys?.gameData || 'agp_game_data';

      try {
        // Try to save via NodeEditor if available
        if (window.NodeEditorUIManager && window.Converters) {
          var specData = window.NodeEditorUIManager.getSpecData();
          if (specData && specData.nodes && Object.keys(specData.nodes).length > 0) {
            var engine = window.Converters.normalizeSpecToEngine(specData);
            window.StorageUtil.saveJSON(GAME_DATA_KEY, engine);
          } else {
            var existing = window.StorageUtil.loadJSON(GAME_DATA_KEY);
            if (!existing) {
              if (window.ToastManager) {
                window.ToastManager.info('ノードを作成してからプレイしてください');
              }
              return;
            }
          }
        }
      } catch (e) {
        console.error('[AdminCore] Play test save failed:', e);
      }

      window.open('play.html', '_blank');
    });
  };

  // --- Node Editor Empty State ---
  window.AdminCore.setupNodeEditorEmptyState = function () {
    var emptyState = document.getElementById('ne-empty-state');
    var emptyAddBtn = document.getElementById('ne-empty-add-node');
    if (!emptyState) return;

    // Show/hide empty state based on node count
    function updateEmptyState() {
      if (!window.NodeEditorUIManager) return;
      var specData = window.NodeEditorUIManager.getSpecData();
      var nodeCount = specData && specData.nodes ? Object.keys(specData.nodes).length : 0;
      emptyState.hidden = nodeCount > 0;
    }

    // Wire up the "create first node" button
    if (emptyAddBtn) {
      emptyAddBtn.addEventListener('click', function () {
        var addBtn = document.getElementById('ne-add-node');
        if (addBtn) addBtn.click();
        setTimeout(updateEmptyState, 100);
      });
    }

    // Check on init and when nodes change
    setTimeout(updateEmptyState, 500);

    // Listen for node changes
    document.addEventListener('agp-node-editor-changed', updateEmptyState);
    // Also poll periodically for changes not caught by events
    var lastCount = -1;
    setInterval(function () {
      if (!window.NodeEditorUIManager) return;
      var specData = window.NodeEditorUIManager.getSpecData();
      var count = specData && specData.nodes ? Object.keys(specData.nodes).length : 0;
      if (count !== lastCount) {
        lastCount = count;
        updateEmptyState();
      }
    }, 2000);
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
