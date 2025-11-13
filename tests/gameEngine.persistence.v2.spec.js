describe('GameEnginePersistence v2', () => {
  const { expect } = chai;

  const createSampleGameData = () => ({
    title: 'Persistent Adventure',
    start: 'start',
    nodes: {
      start: { text: 'Start', choices: [{ text: 'Go', to: 'second' }] },
      second: { text: 'Second', choices: [{ text: 'Finish', to: 'end' }] },
      end: { text: 'End', choices: [] }
    }
  });

  const createSampleState = () => ({
    nodeId: 'second',
    history: ['start'],
    forward: [],
    playerState: {
      inventory: {
        items: [{ id: 'rusty_key', name: 'Key', quantity: 1, icon: '🔑', usable: false }],
        maxSlots: 20
      },
      flags: { openedDoor: true },
      variables: { hp: 80 },
      history: ['start', 'second']
    }
  });

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('creates normalized progress payload with metadata', () => {
    const gameData = createSampleGameData();
    const state = createSampleState();

    const payload = GameEngineUtils.createProgressPayload(gameData, state);

    expect(payload).to.exist;
    expect(payload.formatVersion).to.equal(2);
    expect(payload.nodeId).to.equal('second');
    expect(payload.history).to.deep.equal(['start']);
    expect(payload.playerState.inventory.items[0].id).to.equal('rusty_key');
    expect(payload.metadata.nodesVisited).to.equal(2);
    expect(payload.metadata.inventoryCount).to.equal(1);
  });

  it('saves and loads primary progress data', () => {
    const payload = GameEngineUtils.createProgressPayload(createSampleGameData(), createSampleState());

    const saved = GameEnginePersistence.savePrimary(payload);
    expect(saved).to.be.true;

    const key = GameEnginePersistence.getPrimaryKey('Persistent Adventure');
    const stored = StorageUtil.loadJSON(key);
    expect(stored).to.exist;
    expect(stored.nodeId).to.equal('second');

    const loaded = GameEnginePersistence.loadPrimary('Persistent Adventure');
    expect(loaded).to.exist;
    expect(loaded.nodeId).to.equal('second');
    expect(loaded.playerState.flags.openedDoor).to.be.true;
  });

  it('migrates legacy progress data when loading', () => {
    const legacyData = {
      title: 'Legacy Game',
      nodeId: 'legacy_node',
      history: ['legacy_start'],
      forward: [],
      playerState: {
        inventory: { items: [], maxSlots: 20 },
        flags: { legacy: true },
        variables: { score: 999 },
        history: ['legacy_start']
      }
    };

    StorageUtil.saveJSON('agp_progress', legacyData);

    const loaded = GameEnginePersistence.loadPrimary('Legacy Game', { allowLegacy: true });
    expect(loaded).to.exist;
    expect(loaded.playerState.flags.legacy).to.be.true;

    // Ensure migrated data stored under new key
    const key = GameEnginePersistence.getPrimaryKey('Legacy Game');
    const migrated = StorageUtil.loadJSON(key);
    expect(migrated).to.exist;
    expect(migrated.formatVersion).to.equal(2);
  });

  it('restores state from payload while sanitizing invalid data', () => {
    const gameData = {
      title: 'Sanitize Game',
      start: 'start',
      nodes: {
        start: { text: 'Start', choices: [] }
      }
    };
    const itemsData = [{ id: 'rusty_key', name: 'Key', description: '', quantity: 1, icon: '🔑' }];

    const payload = {
      title: 'Sanitize Game',
      nodeId: 'unknown_node',
      history: ['start', 'unknown_node'],
      forward: ['another'],
      playerState: {
        inventory: {
          items: [{ id: 'rusty_key', name: 'Key', quantity: 2 }],
          maxSlots: 20
        },
        flags: { opened: true },
        variables: { hp: 100 },
        history: ['start', 'another']
      }
    };

    const state = {
      nodeId: 'start',
      history: [],
      forward: [],
      playerState: {
        inventory: { items: [], maxSlots: 20 },
        flags: {},
        variables: {},
        history: []
      }
    };

    GameEngineUtils.restoreStateFromPayload(state, payload, gameData, itemsData);

    expect(state.nodeId).to.equal('start');
    expect(state.history).to.deep.equal(['start']);
    expect(state.forward).to.deep.equal([]);
    expect(state.playerState.inventory.items[0].id).to.equal('rusty_key');
    expect(state.playerState.flags.opened).to.be.true;
  });
});
