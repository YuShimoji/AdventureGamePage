describe('GameEngine', function(){
  beforeEach(() => { TestHelpers.clearTestStorage(); });

  it('renders start node and navigates via setNode()', function(){
    const game = {
      title: 'Unit', start: 's',
      nodes: {
        s: { title:'S', text:'Start', choices:[{ text:'Go', to:'e' }] },
        e: { title:'E', text:'End', choices:[] }
      }
    };
    const els = TestHelpers.makeEls();
    const engine = GameEngine.createEngine(game, els);
    engine.render();
    expect(els.textEl.textContent).to.equal('Start');
    engine.setNode('e');
    expect(els.textEl.textContent).to.equal('End');
  });

  it('auto-saves and loads progress', function(){
    const game = {
      title: 'Progress', start: 's',
      nodes: {
        s: { text:'S', choices:[{ text:'Go', to:'e' }] },
        e: { text:'E', choices:[] }
      }
    };
    const els = TestHelpers.makeEls();
    const engine = GameEngine.createEngine(game, els);
    engine.setNode('e');
    // emulate reload
    const els2 = TestHelpers.makeEls();
    const engine2 = GameEngine.createEngine(game, els2);
    engine2.loadProgress();
    engine2.render();
    expect(els2.textEl.textContent).to.equal('E');
  });

  it('auto-saves on node transition when enabled', function(done){
    // Mock APP_CONFIG for auto-save enabled
    const originalConfig = window.APP_CONFIG;
    window.APP_CONFIG = {
      game: {
        autoSave: {
          enabled: true,
          delayMs: 10
        }
      },
      debug: { showConsoleLogs: false }
    };

    const game = {
      title: 'AutoSave', start: 's',
      nodes: {
        s: { text:'Start', choices:[{ text:'Go', to:'e' }] },
        e: { text:'End', choices:[] }
      }
    };
    const els = TestHelpers.makeEls();
    const engine = GameEngine.createEngine(game, els);

    engine.setNode('e');

    setTimeout(() => {
      // Check if progress was saved to localStorage
      const saved = localStorage.getItem('agp_manuscript_simple');
      expect(saved).to.not.be.null;
      const progress = JSON.parse(saved);
      expect(progress.nodeId).to.equal('e');
      window.APP_CONFIG = originalConfig;
      done();
    }, 20);
  });

  it('does not auto-save when disabled', function(done){
    // Mock APP_CONFIG for auto-save disabled
    const originalConfig = window.APP_CONFIG;
    window.APP_CONFIG = {
      game: {
        autoSave: {
          enabled: false
        }
      }
    };

    const game = {
      title: 'NoAutoSave', start: 's',
      nodes: {
        s: { text:'Start', choices:[{ text:'Go', to:'e' }] },
        e: { text:'End', choices:[] }
      }
    };
    const els = TestHelpers.makeEls();
    const engine = GameEngine.createEngine(game, els);

    engine.setNode('e');

    setTimeout(() => {
      // Check that no progress was saved (localStorage remains unchanged)
      const saved = localStorage.getItem('agp_manuscript_simple');
      expect(saved).to.be.null;
      window.APP_CONFIG = originalConfig;
      done();
    }, 50);
  });
});
