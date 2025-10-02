describe('Validator', function(){
  it('accepts a valid spec and yields no errors', function(){
    const spec = {
      version: '1.0',
      meta: { title: 'T', start: 's' },
      nodes: [
        { id: 's', title: 'S', text: 'Hello', choices: [{ label:'Next', target:'e' }] },
        { id: 'e', title: 'E', text: 'End', choices: [] }
      ]
    };
    const r = Validator.validateGameSpec(spec);
    expect(r.ok).to.equal(true);
    expect(r.errors).to.have.length(0);
  });

  it('warns unresolved target', function(){
    const spec = {
      meta: { title: 'T', start: 's' },
      nodes: [ { id: 's', text: 'A', choices:[{ label:'x', target:'missing' }] } ]
    };
    const r = Validator.validateGameSpec(spec);
    expect(r.ok).to.equal(true);
    expect(r.warnings.some(w => w.includes('未解決'))).to.equal(true);
  });

  it('errors when start node missing', function(){
    const spec = {
      meta: { title:'T', start:'start' },
      nodes: [ { id: 'other', text:'X', choices:[] } ]
    };
    const r = Validator.validateGameSpec(spec);
    expect(r.ok).to.equal(false);
    expect(r.errors.some(e => e.includes('開始ノード'))).to.equal(true);
  });

  it('errors duplicate node ids', function(){
    const spec = {
      meta: { start:'a' },
      nodes: [ { id: 'a', text:'' }, { id: 'a', text:'' } ]
    };
    const r = Validator.validateGameSpec(spec);
    expect(r.ok).to.equal(false);
    expect(r.errors.some(e => e.includes('重複'))).to.equal(true);
  });

  it('warns unreachable nodes from start', function(){
    const spec = {
      meta: { title:'T', start:'a' },
      nodes: [
        { id:'a', text:'', choices:[{ label:'x', target:'b' }] },
        { id:'b', text:'', choices:[] },
        { id:'isolated', text:'', choices:[] }
      ]
    };
    const r = Validator.validateGameSpec(spec);
    expect(r.ok).to.equal(true);
    expect(r.warningDetails.some(w => w.code==='WARN_UNREACHABLE_NODE')).to.equal(true);
  });

  it('warns dead-end nodes', function(){
    const spec = {
      meta: { title:'T', start:'a' },
      nodes: [
        { id:'a', text:'', choices:[{ label:'x', target:'b' }] },
        { id:'b', text:'', choices:[] }
      ]
    };
    const r = Validator.validateGameSpec(spec);
    expect(r.ok).to.equal(true);
    expect(r.warningDetails.some(w => w.code==='WARN_DEAD_END')).to.equal(true);
  });
});
