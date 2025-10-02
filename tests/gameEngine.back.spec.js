describe('GameEngine back navigation', function(){
  beforeEach(() => { TestHelpers.clearTestStorage(); });

  it('goes back to previous nodes using history stack', function(){
    const game = {
      title: 'BackNav', start: 's',
      nodes: {
        s: { title:'S', text:'Start', choices:[{ text:'to E', to:'e' }] },
        e: { title:'E', text:'E', choices:[{ text:'to F', to:'f' }] },
        f: { title:'F', text:'F', choices:[] }
      }
    };
    const els = TestHelpers.makeEls();
    const engine = GameEngine.createEngine(game, els);
    engine.render();
    expect(els.textEl.textContent).to.equal('Start');

    engine.setNode('e');
    expect(els.textEl.textContent).to.equal('E');
    engine.setNode('f');
    expect(els.textEl.textContent).to.equal('F');

    expect(engine.canGoBack()).to.equal(true);
    engine.goBack();
    expect(els.textEl.textContent).to.equal('E');
    engine.goBack();
    expect(els.textEl.textContent).to.equal('Start');
    // cannot go back from start
    expect(engine.canGoBack()).to.equal(false);
    expect(engine.goBack()).to.equal(false);
  });

  it('persists and restores history via progress save/load', function(){
    const game = {
      title: 'Persist', start: 's',
      nodes: {
        s: { text:'S', choices:[{ text:'to E', to:'e' }] },
        e: { text:'E', choices:[] }
      }
    };
    const els1 = TestHelpers.makeEls();
    const engine1 = GameEngine.createEngine(game, els1);
    engine1.setNode('e');

    // emulate reload
    const els2 = TestHelpers.makeEls();
    const engine2 = GameEngine.createEngine(game, els2);
    engine2.loadProgress();
    engine2.render();
    // should be at 'e' and can go back to 's'
    expect(els2.textEl.textContent).to.equal('E');
    expect(engine2.canGoBack()).to.equal(true);
    engine2.goBack();
    expect(els2.textEl.textContent).to.equal('S');
  });
});
