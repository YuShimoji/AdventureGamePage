describe('GameEngine - Persistence', () => {
  let engine;
  const testGameData = {
    title: 'Test Game',
    start: 'start',
    nodes: {
      start: {
        title: 'Start',
        text: 'Welcome to the game!',
        choices: [
          { text: 'Go to room', to: 'room1' }
        ]
      },
      room1: {
        title: 'Room 1',
        text: 'You are in room 1',
        choices: []
      }
    }
  };

  const mockElements = {
    titleEl: document.createElement('div'),
    textEl: document.createElement('div'),
    choicesEl: document.createElement('div')
  };

  beforeEach(() => {
    // Clear storage
    localStorage.clear();
    engine = window.GameEngine.createEngine(testGameData, mockElements);
  });

  describe('saveGame', () => {
    it('should return save data with current state', () => {
      engine.setNode('room1');
      const saveData = engine.saveGame('Test Save');
      
      chai.assert.equal(saveData.title, 'Test Game');
      chai.assert.equal(saveData.nodeId, 'room1');
      chai.assert.equal(saveData.slotName, 'Test Save');
      chai.assert.isArray(saveData.history);
      chai.assert.isObject(saveData.playerState);
      chai.assert.isObject(saveData.metadata);
    });

    it('should include metadata in save data', () => {
      const saveData = engine.saveGame();
      
      chai.assert.isObject(saveData.metadata);
      chai.assert.equal(saveData.metadata.nodesVisited, 1);
      chai.assert.equal(saveData.metadata.choicesMade, 0);
      chai.assert.equal(saveData.metadata.version, '1.0');
    });
  });

  describe('loadGame', () => {
    it('should load saved game state', () => {
      // Create save data
      engine.setNode('room1');
      const saveData = engine.saveGame('Test Save');
      
      // Create new engine and load
      const newEngine = window.GameEngine.createEngine(testGameData, mockElements);
      const result = newEngine.loadGame(saveData);
      
      chai.assert.isTrue(result);
      chai.assert.equal(newEngine.getNode().title, 'Room 1');
    });

    it('should return false for mismatched game title', () => {
      const saveData = {
        title: 'Different Game',
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
      
      const result = engine.loadGame(saveData);
      chai.assert.isFalse(result);
    });

    it('should handle invalid save data gracefully', () => {
      const result = engine.loadGame(null);
      chai.assert.isFalse(result);
    });
  });

  describe('setPlayerState and getPlayerState', () => {
    it('should set and get player state', () => {
      const newState = {
        inventory: {
          items: [{ id: 'sword', name: 'Sword', quantity: 1, type: 'weapon' }],
          maxSlots: 20
        },
        flags: { 'met_mentor': true },
        variables: { 'hp': 100 },
        history: ['start']
      };
      
      engine.setPlayerState(newState);
      const retrieved = engine.getPlayerState();
      
      chai.assert.deepEqual(retrieved, newState);
    });

    it('should return a copy, not the original reference', () => {
      const state1 = engine.getPlayerState();
      const state2 = engine.getPlayerState();
      
      chai.assert.notStrictEqual(state1, state2);
      chai.assert.notStrictEqual(state1.inventory, state2.inventory);
    });
  });

  describe('Persistence Integration', () => {
    it('should persist state across engine instances', () => {
      // Set up state
      engine.setPlayerState({
        inventory: {
          items: [{ id: 'potion', name: 'Potion', quantity: 3, type: 'consumable' }],
          maxSlots: 20
        },
        flags: { 'found_key': true },
        variables: { 'score': 150 },
        history: ['start', 'room1']
      });
      engine.setNode('room1');
      
      // Create new engine and load progress
      const newEngine = window.GameEngine.createEngine(testGameData, mockElements);
      newEngine.loadProgress();
      
      const loadedState = newEngine.getPlayerState();
      chai.assert.equal(loadedState.variables.score, 150);
      chai.assert.isTrue(loadedState.flags.found_key);
      chai.assert.equal(loadedState.inventory.items[0].id, 'potion');
      chai.assert.equal(newEngine.getNode().title, 'Room 1');
    });

    it('should handle corrupted save data gracefully', () => {
      // Save corrupted data
      window.StorageUtil.saveJSON('agp_progress', {
        title: testGameData.title,
        nodeId: 'nonexistent_node',
        history: [],
        forward: [],
        playerState: null
      });
      
      // Create new engine and try to load
      const newEngine = window.GameEngine.createEngine(testGameData, mockElements);
      newEngine.loadProgress();
      
      // Should not crash and should be at start
      chai.assert.equal(newEngine.getNode().title, 'Start');
    });
  });

  describe('reset', () => {
    it('should clear all state including player state', () => {
      // Set up state
      engine.setPlayerState({
        inventory: {
          items: [{ id: 'item', name: 'Item', quantity: 1 }],
          maxSlots: 20
        },
        flags: { 'flag': true },
        variables: { 'var': 123 },
        history: ['start']
      });
      engine.setNode('room1');
      
      engine.reset();
      
      const resetState = engine.getPlayerState();
      chai.assert.lengthOf(resetState.inventory.items, 0);
      chai.assert.isEmpty(resetState.flags);
      chai.assert.isEmpty(resetState.variables);
      chai.assert.equal(engine.getNode().title, 'Start');
    });
  });
});
