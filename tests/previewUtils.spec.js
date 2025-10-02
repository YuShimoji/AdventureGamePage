describe('PreviewUtils', function(){
  it('filters by type', function(){
    const items = [
      { id:'1', type:'simple' },
      { id:'2', type:'full' },
      { id:'3', type:'snapshot' }
    ];
    expect(PreviewUtils.filterItems(items, 'all').length).to.equal(3);
    expect(PreviewUtils.filterItems(items, 'simple').length).to.equal(1);
    expect(PreviewUtils.filterItems(items, 'full').length).to.equal(1);
    expect(PreviewUtils.filterItems(items, 'snapshot').length).to.equal(1);
  });

  it('sorts by date asc/desc', function(){
    const items = [
      { id:'a', savedAt:'2025-01-02T00:00:00.000Z' },
      { id:'b', savedAt:'2025-01-01T00:00:00.000Z' },
      { id:'c', savedAt:'2025-01-03T00:00:00.000Z' }
    ];
    const asc = PreviewUtils.sortItems(items, 'date_asc').map(x=>x.id);
    const desc = PreviewUtils.sortItems(items, 'date_desc').map(x=>x.id);
    expect(asc).to.deep.equal(['b','a','c']);
    expect(desc).to.deep.equal(['c','a','b']);
  });

  it('sorts by size asc/desc', function(){
    const items = [
      { id:'a', size: 10 }, { id:'b', size: 5 }, { id:'c', size: 20 }
    ];
    const asc = PreviewUtils.sortItems(items, 'size_asc').map(x=>x.id);
    const desc = PreviewUtils.sortItems(items, 'size_desc').map(x=>x.id);
    expect(asc).to.deep.equal(['b','a','c']);
    expect(desc).to.deep.equal(['c','a','b']);
  });
});
