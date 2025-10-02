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

  it('saves and loads progress', function(){
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
});
