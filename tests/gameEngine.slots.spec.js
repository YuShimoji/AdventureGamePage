describe('GameEngine - Multi-Session Save Slots', () => {
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

  describe('createSlot', () => {
    it('should create a new save slot', () => {
      const result = engine.createSlot('slot1', 'Test Save');
      chai.assert.isTrue(result);

      const slots = engine.listSlots();
      chai.assert.lengthOf(slots, 1);
      chai.assert.equal(slots[0].id, 'slot1');
      chai.assert.equal(slots[0].name, 'Test Save');
    });

    it('should not create duplicate slots', () => {
      engine.createSlot('slot1');
      const result = engine.createSlot('slot1');
      chai.assert.isFalse(result);
    });
  });

  describe('saveToSlot and loadFromSlot', () => {
    it('should save and load game state to/from slot', () => {
      // Set up state
      engine.setNode('room1');
      engine.createSlot('slot1', 'Test Save');
      
      // Load from slot
      const newEngine = window.GameEngine.createEngine(testGameData, mockElements);
      const loadResult = newEngine.loadFromSlot('slot1');
      
      chai.assert.isTrue(loadResult);
      chai.assert.equal(newEngine.getNode().title, 'Room 1');
    });

    it('should update existing slot', () => {
      engine.createSlot('slot1', 'Original');
      engine.setNode('room1');
      engine.saveToSlot('slot1');
      
      const newEngine = window.GameEngine.createEngine(testGameData, mockElements);
      newEngine.loadFromSlot('slot1');
      chai.assert.equal(newEngine.getNode().title, 'Room 1');
    });
  });

  describe('deleteSlot', () => {
    it('should delete an existing slot', () => {
      engine.createSlot('slot1');
      const deleteResult = engine.deleteSlot('slot1');
      chai.assert.isTrue(deleteResult);
      
      const slots = engine.listSlots();
      chai.assert.lengthOf(slots, 0);
    });

    it('should return false for non-existent slot', () => {
      const result = engine.deleteSlot('nonexistent');
      chai.assert.isFalse(result);
    });
  });

  describe('listSlots', () => {
    it('should return array of all slots', () => {
      engine.createSlot('slot1', 'Save 1');
      engine.createSlot('slot2', 'Save 2');
      
      const slots = engine.listSlots();
      chai.assert.lengthOf(slots, 2);
      const ids = slots.map(s => s.id).sort();
      chai.assert.deepEqual(ids, ['slot1', 'slot2']);
    });
  });

  describe('renameSlot', () => {
    it('should rename an existing slot', () => {
      engine.createSlot('slot1', 'Original');
      const result = engine.renameSlot('slot1', 'Renamed');
      chai.assert.isTrue(result);
      
      const slot = engine.getSlotInfo('slot1');
      chai.assert.equal(slot.name, 'Renamed');
    });
  });

  describe('copySlot', () => {
    it('should copy an existing slot to new id', () => {
      engine.createSlot('slot1', 'Original');
      const result = engine.copySlot('slot1', 'slot2', 'Copy');
      chai.assert.isTrue(result);
      
      const slots = engine.listSlots();
      chai.assert.lengthOf(slots, 2);
      const copySlot = slots.find(s => s.id === 'slot2');
      chai.assert.equal(copySlot.name, 'Copy');
    });
  });

  describe('getSlotInfo', () => {
    it('should return slot information', () => {
      engine.createSlot('slot1', 'Test');
      const info = engine.getSlotInfo('slot1');
      chai.assert.isObject(info);
      chai.assert.equal(info.id, 'slot1');
      chai.assert.equal(info.name, 'Test');
      chai.assert.isObject(info.meta);
      chai.assert.isString(info.meta.created);
      chai.assert.isString(info.meta.modified);
    });

    it('should return null for non-existent slot', () => {
      const info = engine.getSlotInfo('nonexistent');
      chai.assert.isNull(info);
    });
  });

  describe('Slot Metadata', () => {
    it('should generate proper metadata', () => {
      engine.createSlot('slot1', 'Test Save');
      const slot = engine.getSlotInfo('slot1');
      
      chai.assert.isObject(slot.meta);
      chai.assert.isString(slot.meta.created);
      chai.assert.isString(slot.meta.modified);
      chai.assert.isNumber(slot.meta.playTime);
      chai.assert.isString(slot.meta.currentLocation);
      chai.assert.isNumber(slot.meta.progress);
      chai.assert.equal(slot.meta.version, '1.0');
    });
  });

  describe('Integration with Game State', () => {
    it('should preserve inventory across slot operations', () => {
      engine.addItem('sword', 1);
      engine.createSlot('slot1');
      
      const newEngine = window.GameEngine.createEngine(testGameData, mockElements);
      newEngine.loadFromSlot('slot1');
      
      chai.assert.isTrue(newEngine.hasItem('sword'));
    });

    it('should handle multiple slots independently', () => {
      // Create first slot at start
      engine.createSlot('slot1', 'At Start');
      
      // Move to room1 and create second slot
      engine.setNode('room1');
      engine.createSlot('slot2', 'At Room');
      
      // Load first slot
      const newEngine1 = window.GameEngine.createEngine(testGameData, mockElements);
      newEngine1.loadFromSlot('slot1');
      chai.assert.equal(newEngine1.getNode().title, 'Start');
      
      // Load second slot
      const newEngine2 = window.GameEngine.createEngine(testGameData, mockElements);
      newEngine2.loadFromSlot('slot2');
      chai.assert.equal(newEngine2.getNode().title, 'Room 1');
    });
  });
});
