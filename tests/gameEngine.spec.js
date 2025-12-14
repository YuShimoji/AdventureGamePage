describe('GameEngine', function () {
  beforeEach(() => {
    TestHelpers.clearTestStorage();
  });

  it('renders start node and navigates via setNode()', function () {
    const game = {
      title: 'Unit',
      start: 's',
      nodes: {
        s: { title: 'S', text: 'Start', choices: [{ text: 'Go', to: 'e' }] },
        e: { title: 'E', text: 'End', choices: [] },
      },
    };
    const els = TestHelpers.makeEls();
    const engine = GameEngine.createEngine(game, els);
    engine.render();
    expect(els.textEl.textContent).to.equal('Start');
    engine.setNode('e');
    expect(els.textEl.textContent).to.equal('End');
  });

  it('saves and loads progress', function () {
    const game = {
      title: 'Progress',
      start: 's',
      nodes: {
        s: { text: 'S', choices: [{ text: 'Go', to: 'e' }] },
        e: { text: 'E', choices: [] },
      },
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

  it('filters choices by conditions', function () {
    const game = {
      title: 'Cond',
      start: 's',
      nodes: {
        s: {
          text: 'S',
          choices: [
            {
              text: 'Locked',
              to: 'a',
              conditions: [{ type: 'variable_equals', key: 'bravery', operator: '>=', value: 3 }],
            },
            { text: 'Free', to: 'b' },
          ],
        },
        a: { text: 'A', choices: [] },
        b: { text: 'B', choices: [] },
      },
    };
    const els = TestHelpers.makeEls();
    const engine = GameEngine.createEngine(game, els);

    engine.setPlayerState({ variables: { bravery: 0 } });
    engine.render();
    expect(els.choicesEl.querySelectorAll('button').length).to.equal(1);

    engine.setPlayerState({ variables: { bravery: 3 } });
    engine.render();
    expect(els.choicesEl.querySelectorAll('button').length).to.equal(2);
  });

  it('renders node image when imageEl is provided', function () {
    const game = {
      title: 'Img',
      start: 's',
      nodes: {
        s: { title: 'Scene', text: 'S', image: 'images/test.jpg', choices: [] },
      },
    };
    const els = TestHelpers.makeEls();
    const imageEl = document.createElement('div');
    document.body.appendChild(imageEl);
    const engine = GameEngine.createEngine(game, { ...els, imageEl });
    engine.render();

    expect(imageEl.hidden).to.equal(false);
    const img = imageEl.querySelector('img');
    expect(img).to.exist;
    expect(img.getAttribute('src')).to.equal('images/test.jpg');
  });

  it('executes use_item effect and consumes item by default', function () {
    const game = {
      title: 'UseItem',
      start: 's',
      items: [{ id: 'potion', name: 'Potion', type: 'consumable', description: '', usable: true }],
      nodes: {
        s: { text: 'S', choices: [{ text: 'Use', to: 'u' }] },
        u: {
          text: 'U',
          choices: [],
          actions: [
            { type: 'add_item', itemId: 'potion', quantity: 1 },
            {
              type: 'use_item',
              itemId: 'potion',
              effect: { type: 'set_variable', key: 'hp', operation: 'add', value: 10 },
            },
          ],
        },
      },
    };

    const els = TestHelpers.makeEls();
    const engine = GameEngine.createEngine(game, els);
    engine.render();
    engine.setNode('u');

    const state = engine.getPlayerState();
    expect(state.variables.hp).to.equal(10);
    expect(engine.hasItem('potion')).to.equal(false);
  });

  it('does not consume item when consume is false', function () {
    const game = {
      title: 'UseItemNoConsume',
      start: 's',
      items: [{ id: 'potion', name: 'Potion', type: 'consumable', description: '', usable: true }],
      nodes: {
        s: { text: 'S', choices: [{ text: 'Use', to: 'u' }] },
        u: {
          text: 'U',
          choices: [],
          actions: [
            { type: 'add_item', itemId: 'potion', quantity: 2 },
            {
              type: 'use_item',
              itemId: 'potion',
              consume: false,
              effect: { type: 'set_variable', key: 'used', value: true },
            },
          ],
        },
      },
    };

    const els = TestHelpers.makeEls();
    const engine = GameEngine.createEngine(game, els);
    engine.render();
    engine.setNode('u');

    expect(engine.getItemCount('potion')).to.equal(2);
    const state = engine.getPlayerState();
    expect(state.variables.used).to.equal(true);
  });

  it('does not throw when using a missing item', function () {
    const game = {
      title: 'UseMissingItem',
      start: 's',
      items: [{ id: 'potion', name: 'Potion', type: 'consumable', description: '', usable: true }],
      nodes: {
        s: { text: 'S', choices: [{ text: 'Try', to: 'u' }] },
        u: {
          text: 'U',
          choices: [],
          actions: [
            {
              type: 'use_item',
              itemId: 'potion',
              effect: { type: 'set_variable', key: 'hp', value: 999 },
            },
          ],
        },
      },
    };

    const els = TestHelpers.makeEls();
    const engine = GameEngine.createEngine(game, els);
    engine.render();
    expect(() => engine.setNode('u')).to.not.throw();

    const state = engine.getPlayerState();
    expect(state.variables.hp).to.equal(undefined);
    expect(engine.getInventory().items.length).to.equal(0);
  });
});
