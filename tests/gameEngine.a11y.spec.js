describe('GameEngine accessibility (autofocus first choice)', function(){
  beforeEach(() => { TestHelpers.clearTestStorage(); });

  it('focuses first choice after initial render', function(){
    const game = {
      title: 'A11y', start: 's',
      nodes: {
        s: { text:'S', choices:[{ text:'One', to:'a' }, { text:'Two', to:'b' }] },
        a: { text:'A', choices:[] },
        b: { text:'B', choices:[] }
      }
    };
    const els = TestHelpers.makeEls();
    const engine = GameEngine.createEngine(game, els);
    engine.render();
    const first = els.choicesEl.querySelector('button');
    expect(first).to.exist;
    expect(document.activeElement).to.equal(first);
  });

  it('focuses first choice after navigation', function(){
    const game = {
      title: 'A11yNav', start: 's',
      nodes: {
        s: { text:'S', choices:[{ text:'to A', to:'a' }] },
        a: { text:'A', choices:[{ text:'Next', to:'b' }] },
        b: { text:'B', choices:[] }
      }
    };
    const els = TestHelpers.makeEls();
    const engine = GameEngine.createEngine(game, els);
    engine.render();

    // navigate
    engine.setNode('a');
    const first = els.choicesEl.querySelector('button');
    expect(first).to.exist;
    expect(document.activeElement).to.equal(first);
  });

  it('does not throw when no choices exist', function(){
    const game = { title:'Empty', start:'x', nodes: { x:{ text:'X', choices:[] } } };
    const els = TestHelpers.makeEls();
    const engine = GameEngine.createEngine(game, els);
    expect(() => engine.render()).to.not.throw();
  });
});
