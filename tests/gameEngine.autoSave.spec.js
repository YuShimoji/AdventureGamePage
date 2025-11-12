/**
 * GameEngine オートセーブ機能のテストスイート
 * Issue #35: オートセーブ機能実装
 */

describe('GameEngine - Auto Save', () => {
  let engine;
  let container;
  let originalConfig;

  const testGameData = {
    title: 'Auto Save Test Game',
    start: 'start',
    nodes: {
      start: {
        text: 'Start node',
        choices: [
          {
            text: 'Go to Node A',
            to: 'node_a'
          }
        ]
      },
      node_a: {
        text: 'Node A',
        choices: [
          {
            text: 'Go to Node B',
            to: 'node_b'
          }
        ]
      },
      node_b: {
        text: 'Node B',
        choices: []
      }
    }
  };

  beforeEach(() => {
    // Save original config
    originalConfig = JSON.parse(JSON.stringify(window.APP_CONFIG));

    container = document.createElement('div');
    container.innerHTML = `
      <div id="text"></div>
      <div id="choices"></div>
    `;
    document.body.appendChild(container);

    const elements = {
      text: container.querySelector('#text'),
      choices: container.querySelector('#choices')
    };

    engine = window.GameEngine.createEngine(testGameData, elements);
  });

  afterEach(() => {
    document.body.removeChild(container);
    localStorage.clear();
    // Restore original config
    window.APP_CONFIG = originalConfig;
  });

  describe('Auto Save Configuration', () => {
    it('should have autoSave config with enabled and delayMs', () => {
      expect(window.APP_CONFIG.game.autoSave).to.exist;
      expect(window.APP_CONFIG.game.autoSave.enabled).to.be.a('boolean');
      expect(window.APP_CONFIG.game.autoSave.delayMs).to.be.a('number');
    });

    it('should default to enabled=true', () => {
      expect(window.APP_CONFIG.game.autoSave.enabled).to.be.true;
    });

    it('should have reasonable delay (e.g., 100ms)', () => {
      expect(window.APP_CONFIG.game.autoSave.delayMs).to.be.at.least(0);
      expect(window.APP_CONFIG.game.autoSave.delayMs).to.be.at.most(1000);
    });
  });

  describe('Auto Save on Node Transition', () => {
    it('should auto-save when transitioning to a new node', (done) => {
      // Clear localStorage
      localStorage.removeItem('agp_progress');

      // Enable auto-save with minimal delay
      window.APP_CONFIG.game.autoSave.enabled = true;
      window.APP_CONFIG.game.autoSave.delayMs = 50;

      // Move to node_a
      engine.setNode('node_a');

      // Wait for auto-save to complete
      setTimeout(() => {
        const savedProgress = localStorage.getItem('agp_progress');
        expect(savedProgress).to.exist;

        const progressData = JSON.parse(savedProgress);
        expect(progressData.nodeId).to.equal('node_a');
        done();
      }, 100);
    });

    it('should debounce rapid node transitions', (done) => {
      window.APP_CONFIG.game.autoSave.enabled = true;
      window.APP_CONFIG.game.autoSave.delayMs = 100;

      let saveCount = 0;
      const originalSetItem = localStorage.setItem.bind(localStorage);
      localStorage.setItem = function(key, value) {
        if (key === 'agp_progress') {
          saveCount++;
        }
        return originalSetItem(key, value);
      };

      // Rapid transitions
      engine.setNode('node_a');
      engine.setNode('node_b');
      engine.setNode('start');

      // Wait for debounce delay
      setTimeout(() => {
        // Restore original setItem
        localStorage.setItem = originalSetItem;

        // Should have saved only once (last transition)
        expect(saveCount).to.equal(1);

        const savedProgress = localStorage.getItem('agp_progress');
        const progressData = JSON.parse(savedProgress);
        expect(progressData.nodeId).to.equal('start');
        done();
      }, 200);
    });

    it('should not save when autoSave is disabled', (done) => {
      window.APP_CONFIG.game.autoSave.enabled = false;

      // Clear localStorage
      localStorage.removeItem('agp_progress');

      // Move to node_a
      engine.setNode('node_a');

      // Wait a bit
      setTimeout(() => {
        const savedProgress = localStorage.getItem('agp_progress');
        expect(savedProgress).to.not.exist;
        done();
      }, 100);
    });
  });

  describe('Auto Save Error Handling', () => {
    it('should handle save errors gracefully without crashing', (done) => {
      window.APP_CONFIG.game.autoSave.enabled = true;
      window.APP_CONFIG.game.autoSave.delayMs = 50;

      // Mock localStorage to throw error
      const originalSetItem = localStorage.setItem.bind(localStorage);
      localStorage.setItem = function() {
        throw new Error('Storage quota exceeded');
      };

      // Should not throw
      expect(() => {
        engine.setNode('node_a');
      }).to.not.throw();

      setTimeout(() => {
        // Restore original setItem
        localStorage.setItem = originalSetItem;
        done();
      }, 100);
    });

    it('should log warning when save fails', (done) => {
      window.APP_CONFIG.game.autoSave.enabled = true;
      window.APP_CONFIG.game.autoSave.delayMs = 50;

      const warnings = [];
      const originalWarn = console.warn;
      console.warn = function(...args) {
        warnings.push(args.join(' '));
        originalWarn.apply(console, args);
      };

      // Mock localStorage to throw error
      const originalSetItem = localStorage.setItem.bind(localStorage);
      localStorage.setItem = function() {
        throw new Error('Storage quota exceeded');
      };

      engine.setNode('node_a');

      setTimeout(() => {
        // Restore
        localStorage.setItem = originalSetItem;
        console.warn = originalWarn;

        // Should have logged warning
        const autoSaveWarnings = warnings.filter(w => w.includes('[AutoSave]'));
        expect(autoSaveWarnings.length).to.be.at.least(1);
        done();
      }, 100);
    });
  });

  describe('Auto Save with Manual Save', () => {
    it('should not conflict with manual saveProgress calls', (done) => {
      window.APP_CONFIG.game.autoSave.enabled = true;
      window.APP_CONFIG.game.autoSave.delayMs = 100;

      // Manually save at start
      const initialSave = localStorage.getItem('agp_progress');
      const initialData = JSON.parse(initialSave);
      expect(initialData.nodeId).to.equal('start');

      // Transition with auto-save
      engine.setNode('node_a');

      // Wait for auto-save
      setTimeout(() => {
        const savedProgress = localStorage.getItem('agp_progress');
        const progressData = JSON.parse(savedProgress);
        expect(progressData.nodeId).to.equal('node_a');
        done();
      }, 150);
    });
  });

  describe('Auto Save with Different Delay Settings', () => {
    it('should respect delayMs=0 (immediate save)', (done) => {
      window.APP_CONFIG.game.autoSave.enabled = true;
      window.APP_CONFIG.game.autoSave.delayMs = 0;

      engine.setNode('node_a');

      // Check almost immediately
      setTimeout(() => {
        const savedProgress = localStorage.getItem('agp_progress');
        expect(savedProgress).to.exist;

        const progressData = JSON.parse(savedProgress);
        expect(progressData.nodeId).to.equal('node_a');
        done();
      }, 10);
    });

    it('should respect custom delayMs', (done) => {
      window.APP_CONFIG.game.autoSave.enabled = true;
      window.APP_CONFIG.game.autoSave.delayMs = 200;

      localStorage.removeItem('agp_progress');

      engine.setNode('node_a');

      // Check before delay completes
      setTimeout(() => {
        const savedProgress = localStorage.getItem('agp_progress');
        expect(savedProgress).to.not.exist;
      }, 100);

      // Check after delay completes
      setTimeout(() => {
        const savedProgress = localStorage.getItem('agp_progress');
        expect(savedProgress).to.exist;

        const progressData = JSON.parse(savedProgress);
        expect(progressData.nodeId).to.equal('node_a');
        done();
      }, 250);
    });
  });

  describe('Auto Save with Player State', () => {
    it('should save player state changes (variables, inventory)', (done) => {
      window.APP_CONFIG.game.autoSave.enabled = true;
      window.APP_CONFIG.game.autoSave.delayMs = 50;

      // Add item to inventory
      engine.addItem('test_item', 1);

      // Set variable
      const state = engine.getPlayerState();
      GameEngineUtils.executeAction(
        { type: 'set_variable', key: 'score', value: 100, operation: 'set' },
        { playerState: state },
        [],
        () => {}
      );

      // Transition to trigger auto-save
      engine.setNode('node_a');

      setTimeout(() => {
        const savedProgress = localStorage.getItem('agp_progress');
        const progressData = JSON.parse(savedProgress);

        // Variables should be saved
        expect(progressData.playerState.variables.score).to.equal(100);
        done();
      }, 100);
    });
  });
});
