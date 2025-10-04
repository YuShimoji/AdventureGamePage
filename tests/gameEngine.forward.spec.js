describe('GameEngine forward navigation', function(){
  beforeEach(() => { TestHelpers.clearTestStorage(); });

  it('supports goForward after goBack', function(){
    const game = {
      title: 'Fwd', start: 's',
      nodes: {
        s: { text:'S', choices:[{ text:'to E', to:'e' }] },
        e: { text:'E', choices:[{ text:'to F', to:'f' }] },
        f: { text:'F', choices:[] }
      }
    };
    const els = TestHelpers.makeEls();
    const engine = GameEngine.createEngine(game, els);
    engine.render();

    engine.setNode('e');
    engine.setNode('f');
    expect(els.textEl.textContent).to.equal('F');

    // back -> forward
    expect(engine.canGoBack()).to.equal(true);
    engine.goBack();
    expect(els.textEl.textContent).to.equal('E');
    expect(engine.canGoForward()).to.equal(true);
    engine.goForward();
    expect(els.textEl.textContent).to.equal('F');
  });

  it('clears forward stack on normal navigation', function(){
    const game = {
      title: 'ClearFwd', start: 'a',
      nodes: {
        a: { text:'A', choices:[{ text:'to B', to:'b' }] },
        b: { text:'B', choices:[{ text:'to C', to:'c' }] },
        c: { text:'C', choices:[{ text:'to A', to:'a' }] }
      }
    };
    const els = TestHelpers.makeEls();
    const engine = GameEngine.createEngine(game, els);
    engine.setNode('b');
    engine.setNode('c');
    engine.goBack(); // now at B, forward -> [C]
    expect(engine.canGoForward()).to.equal(true);

    // normal navigation to A should clear forward
    engine.setNode('a');
    expect(engine.canGoForward()).to.equal(false);
  });

  it('persists forward stack and restores on load', function(){
    const game = {
      title: 'PersistFwd', start: 's',
      nodes: {
        s: { text:'S', choices:[{ text:'to E', to:'e' }] },
        e: { text:'E', choices:[{ text:'to F', to:'f' }] },
        f: { text:'F', choices:[] }
      }
    };
    const els1 = TestHelpers.makeEls();
    const engine1 = GameEngine.createEngine(game, els1);
    engine1.setNode('e');
    engine1.setNode('f');
    engine1.goBack(); // at E, forward has [f]

    // emulate reload
    const els2 = TestHelpers.makeEls();
    const engine2 = GameEngine.createEngine(game, els2);
    engine2.loadProgress();
    engine2.render();
    expect(els2.textEl.textContent).to.equal('E');
    expect(engine2.canGoForward()).to.equal(true);
    engine2.goForward();
    expect(els2.textEl.textContent).to.equal('F');
  });
});
