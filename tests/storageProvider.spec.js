describe('StorageProvider / StorageBridge', function(){
  beforeEach(() => TestHelpers.clearTestStorage());

  it('set/get simple and full via StorageBridge', async function(){
    await StorageBridge.saveSimple('hello');
    const t = await StorageBridge.loadSimple();
    expect(t).to.equal('hello');

    const full = { title:'T', html:'<b>x</b>', text:'x', meta:{ savedAt: new Date().toISOString() } };
    await StorageBridge.saveFull(full);
    const got = await StorageBridge.loadFull();
    expect(got).to.be.an('object');
    expect(got.title).to.equal('T');
  });

  it('snapshots list includes created snapshot', async function(){
    const now = new Date().toISOString();
    const id = APP_CONFIG.storage.snapshots.prefix + 'unit_' + Date.now();
    await StorageBridge.set(id, { title:'Snap', html:'', text:'memo', meta:{ savedAt: now, label:'L' } });
    const list = await StorageBridge.list();
    const hit = list.find(x => x.id === id);
    expect(hit).to.exist;
    expect(hit.type).to.equal('snapshot');
  });
});
