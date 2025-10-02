describe('Converters', function(){
  beforeEach(() => TestHelpers.clearTestStorage());

  it('normalizeSpecToEngine converts draft spec to engine format', function(){
    const spec = {
      version: '1.0',
      meta: { title: 'T', start: 'scene:start' },
      nodes: [
        { id: 'scene:start', title: 'S', text: 'Hello', choices: [ { id:'c1', label:'Next', target:'scene:end' } ] },
        { id: 'scene:end', title: 'E', text: 'End', choices: [] }
      ]
    };
    const e = Converters.normalizeSpecToEngine(spec);
    expect(e).to.be.an('object');
    expect(e.title).to.equal('T');
    expect(e.start).to.equal('scene:start');
    expect(e.nodes['scene:start'].text).to.equal('Hello');
    expect(e.nodes['scene:start'].choices[0]).to.deep.equal({ text:'Next', to:'scene:end' });
    expect(e.nodes['scene:start'].title).to.equal('S');
  });

  it('engineToSpec converts engine to draft spec', function(){
    const engine = {
      title: 'Demo', start: 'start',
      nodes: {
        start: { title:'Start', text:'Hi', choices:[{ text:'Go', to:'end' }] },
        end: { title:'End', text:'Bye', choices:[] }
      }
    };
    const spec = Converters.engineToSpec(engine);
    expect(spec).to.be.an('object');
    expect(spec.meta.title).to.equal('Demo');
    const ids = spec.nodes.map(n => n.id);
    expect(ids).to.include.members(['start','end']);
    const start = spec.nodes.find(n => n.id==='start');
    expect(start.title).to.equal('Start');
    expect(start.choices[0]).to.deep.include({ label:'Go', target:'end' });
  });
});
