(function () {
  // Floating Panel Manager - Handles floating panel drag, minimize, close functionality
  const FLOATING_PANEL_KEY =
    window.APP_CONFIG?.storage?.keys?.floatingPanel || 'agp_floating_panel';
  window.FloatingPanelManager = {
    init: function () {
      this.initFloatingPanel();
      console.log('FloatingPanelManager initialized');
    },

    // Floating panel management
    initFloatingPanel: function () {
      const panel = document.getElementById('floating-panel');
      const header = panel?.querySelector('.floating-panel-header');
      const minimizeBtn = document.getElementById('floating-panel-minimize');
      const closeBtn = document.getElementById('floating-panel-close');

      if (!panel || !header) return;

      let isDragging = false;
      let startX, startY, startLeft, startTop;

      // Load saved position and state
      const saved = localStorage.getItem(FLOATING_PANEL_KEY);
      if (saved) {
        try {
          const state = JSON.parse(saved);
          if (state.position) {
            panel.style.left = state.position.left + 'px';
            panel.style.top = state.position.top + 'px';
            panel.style.right = 'auto'; // Override default right positioning
          }
          if (state.minimized) {
            panel.classList.add('minimized');
          }
          if (state.hidden) {
            panel.classList.add('hidden');
            const panelHandle = document.getElementById('floating-panel-handle');
            if (panelHandle) panelHandle.hidden = false;
          } else {
            const panelHandle = document.getElementById('floating-panel-handle');
            if (panelHandle) panelHandle.hidden = true;
          }
        } catch (e) {
          console.warn('Failed to load floating panel state', e);
        }
      }

      // Drag functionality
      header.addEventListener('mousedown', e => {
        if (e.target.closest('.floating-panel-controls')) return; // Don't drag when clicking controls

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = panel.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;

        panel.classList.add('dragging');
        document.body.style.userSelect = 'none';
      });

      document.addEventListener('mousemove', e => {
        if (!isDragging) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        const newLeft = startLeft + deltaX;
        const newTop = startTop + deltaY;

        // Keep panel within viewport bounds
        const maxLeft = window.innerWidth - panel.offsetWidth - 10;
        const maxTop =
          window.innerHeight -
          (panel.classList.contains('minimized') ? header.offsetHeight : panel.offsetHeight) -
          10;

        panel.style.left = Math.max(10, Math.min(newLeft, maxLeft)) + 'px';
        panel.style.top = Math.max(10, Math.min(newTop, maxTop)) + 'px';
        panel.style.right = 'auto';
      });

      document.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          panel.classList.remove('dragging');
          document.body.style.userSelect = '';

          // Save position
          savePanelState();
        }
      });

      // Minimize/Maximize
      if (minimizeBtn) {
        minimizeBtn.addEventListener('click', () => {
          panel.classList.toggle('minimized');
          closeDropdown();
          savePanelState();
        });
      }

      // Close/Open
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          panel.classList.add('hidden');
          const panelHandle = document.getElementById('floating-panel-handle');
          if (panelHandle) panelHandle.hidden = false;
          closeDropdown();
          savePanelState();
        });
      }

      const panelHandle = document.getElementById('floating-panel-handle');
      if (panelHandle) {
        panelHandle.addEventListener('click', () => {
          panel.classList.remove('hidden');
          panelHandle.hidden = true;
          closeDropdown();
          savePanelState();
        });
      }

      // Save panel state
      function savePanelState() {
        const rect = panel.getBoundingClientRect();
        const state = {
          position: {
            left: rect.left,
            top: rect.top,
          },
          minimized: panel.classList.contains('minimized'),
          hidden: panel.classList.contains('hidden'),
        };
        localStorage.setItem(FLOATING_PANEL_KEY, JSON.stringify(state));
      }

      // Handle window resize to keep panel in bounds
      window.addEventListener('resize', () => {
        const rect = panel.getBoundingClientRect();
        const maxLeft = window.innerWidth - panel.offsetWidth - 10;
        const maxTop = window.innerHeight - panel.offsetHeight - 10;

        if (rect.left > maxLeft) {
          panel.style.left = maxLeft + 'px';
        }
        if (rect.top > maxTop) {
          panel.style.top = maxTop + 'px';
        }

        savePanelState();
      });

      function closeDropdown() {
        const dropdown = document.getElementById('floating-controls-dropdown');
        if (dropdown && !dropdown.hidden) dropdown.hidden = true;
      }
    },
  };
})();
