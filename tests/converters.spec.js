describe('Converters', function () {
  beforeEach(() => TestHelpers.clearTestStorage());

  it('normalizeSpecToEngine converts draft spec to engine format', function () {
    const spec = {
      version: '1.0',
      meta: { title: 'T', start: 'scene:start' },
      nodes: [
        {
          id: 'scene:start',
          title: 'S',
          text: 'Hello',
          image: 'images/start.png',
          actions: [{ type: 'set_variable', key: 'visited_start', value: true }],
          choices: [
            {
              id: 'c1',
              label: 'Next',
              target: 'scene:end',
              conditions: [{ type: 'has_item', itemId: 'key' }],
            },
          ],
        },
        { id: 'scene:end', title: 'E', text: 'End', choices: [] },
      ],
    };
    const e = Converters.normalizeSpecToEngine(spec);
    expect(e).to.be.an('object');
    expect(e.title).to.equal('T');
    expect(e.start).to.equal('scene:start');
    expect(e.nodes['scene:start'].text).to.equal('Hello');
    expect(e.nodes['scene:start'].choices[0]).to.deep.include({ text: 'Next', to: 'scene:end' });
    expect(e.nodes['scene:start'].title).to.equal('S');
    // image / actions / conditions が保持されていること
    expect(e.nodes['scene:start'].image).to.equal('images/start.png');
    expect(e.nodes['scene:start'].actions[0]).to.deep.include({
      type: 'set_variable',
      key: 'visited_start',
      value: true,
    });
    expect(e.nodes['scene:start'].choices[0].conditions[0]).to.deep.include({
      type: 'has_item',
      itemId: 'key',
    });
  });

  it('engineToSpec converts engine to draft spec', function () {
    const engine = {
      title: 'Demo',
      start: 'start',
      nodes: {
        start: {
          title: 'Start',
          text: 'Hi',
          image: 'images/start.png',
          actions: [{ type: 'set_variable', key: 'x', value: 1 }],
          choices: [
            {
              text: 'Go',
              to: 'end',
              conditions: [{ type: 'has_item', itemId: 'key' }],
            },
          ],
        },
        end: { title: 'End', text: 'Bye', choices: [] },
      },
    };
    const spec = Converters.engineToSpec(engine);
    expect(spec).to.be.an('object');
    expect(spec.meta.title).to.equal('Demo');
    const ids = spec.nodes.map(n => n.id);
    expect(ids).to.include.members(['start', 'end']);
    const start = spec.nodes.find(n => n.id === 'start');
    expect(start.title).to.equal('Start');
    expect(start.choices[0]).to.deep.include({ label: 'Go', target: 'end' });
    // image / actions / conditions が保持されていること
    expect(start.image).to.equal('images/start.png');
    expect(start.actions[0]).to.deep.include({ type: 'set_variable', key: 'x', value: 1 });
    expect(start.choices[0].conditions[0]).to.deep.include({ type: 'has_item', itemId: 'key' });
  });
});
