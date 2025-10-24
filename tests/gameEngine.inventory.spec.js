describe('GameEngine - Inventory System', () => {
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

  describe('addItem', () => {
    it('should add a new item to inventory', () => {
      const result = engine.addItem('sword', 1);
      chai.assert.isTrue(result);
      
      const inventory = engine.getInventory();
      chai.assert.lengthOf(inventory.items, 1);
      chai.assert.equal(inventory.items[0].id, 'sword');
      chai.assert.equal(inventory.items[0].quantity, 1);
    });

    it('should increase quantity when adding existing item', () => {
      engine.addItem('potion', 1);
      engine.addItem('potion', 2);
      
      const inventory = engine.getInventory();
      chai.assert.lengthOf(inventory.items, 1);
      chai.assert.equal(inventory.items[0].quantity, 3);
    });

    it('should return false when adding invalid item ID', () => {
      const result = engine.addItem(null);
      chai.assert.isFalse(result);
    });

    it('should return false when inventory is full', () => {
      // Fill inventory to max
      for (let i = 0; i < 20; i++) {
        engine.addItem(`item_${i}`, 1);
      }
      
      const result = engine.addItem('extra_item', 1);
      chai.assert.isFalse(result);
    });
  });

  describe('removeItem', () => {
    beforeEach(() => {
      engine.addItem('sword', 1);
      engine.addItem('potion', 5);
    });

    it('should decrease item quantity', () => {
      const result = engine.removeItem('potion', 2);
      chai.assert.isTrue(result);
      chai.assert.equal(engine.getItemCount('potion'), 3);
    });

    it('should remove item completely when quantity reaches 0', () => {
      engine.removeItem('sword', 1);
      chai.assert.isFalse(engine.hasItem('sword'));
    });

    it('should remove item completely when quantity goes below 0', () => {
      engine.removeItem('sword', 5);
      chai.assert.isFalse(engine.hasItem('sword'));
    });

    it('should return false when removing non-existent item', () => {
      const result = engine.removeItem('non_existent', 1);
      chai.assert.isFalse(result);
    });

    it('should return false when removing invalid item ID', () => {
      const result = engine.removeItem(null, 1);
      chai.assert.isFalse(result);
    });
  });

  describe('hasItem', () => {
    it('should return true for existing item', () => {
      engine.addItem('key', 1);
      chai.assert.isTrue(engine.hasItem('key'));
    });

    it('should return false for non-existent item', () => {
      chai.assert.isFalse(engine.hasItem('non_existent'));
    });

    it('should return false after item is removed', () => {
      engine.addItem('key', 1);
      engine.removeItem('key', 1);
      chai.assert.isFalse(engine.hasItem('key'));
    });
  });

  describe('getItemCount', () => {
    it('should return correct item count', () => {
      engine.addItem('potion', 5);
      chai.assert.equal(engine.getItemCount('potion'), 5);
    });

    it('should return 0 for non-existent item', () => {
      chai.assert.equal(engine.getItemCount('non_existent'), 0);
    });

    it('should return updated count after adding more', () => {
      engine.addItem('potion', 3);
      engine.addItem('potion', 2);
      chai.assert.equal(engine.getItemCount('potion'), 5);
    });
  });

  describe('getInventory', () => {
    it('should return inventory with items', () => {
      engine.addItem('sword', 1);
      engine.addItem('potion', 3);
      
      const inventory = engine.getInventory();
      chai.assert.lengthOf(inventory.items, 2);
      chai.assert.equal(inventory.currentSlots, 2);
      chai.assert.equal(inventory.maxSlots, 20);
    });

    it('should return a copy, not the original', () => {
      engine.addItem('sword', 1);
      const inv1 = engine.getInventory();
      const inv2 = engine.getInventory();
      
      chai.assert.notStrictEqual(inv1.items, inv2.items);
    });
  });

  describe('clearInventory', () => {
    it('should remove all items', () => {
      engine.addItem('sword', 1);
      engine.addItem('potion', 5);
      
      engine.clearInventory();
      
      const inventory = engine.getInventory();
      chai.assert.lengthOf(inventory.items, 0);
    });
  });

  describe('Persistence', () => {
    it('should save inventory when adding item', () => {
      engine.addItem('sword', 1);
      
      // Create new engine and load
      const newEngine = window.GameEngine.createEngine(testGameData, mockElements);
      newEngine.loadProgress();
      
      chai.assert.isTrue(newEngine.hasItem('sword'));
    });

    it('should save inventory when removing item', () => {
      engine.addItem('potion', 5);
      engine.removeItem('potion', 2);
      
      // Create new engine and load
      const newEngine = window.GameEngine.createEngine(testGameData, mockElements);
      newEngine.loadProgress();
      
      chai.assert.equal(newEngine.getItemCount('potion'), 3);
    });

    it('should load inventory from storage', () => {
      engine.addItem('key', 1);
      engine.addItem('potion', 3);
      
      // Create new engine and load
      const newEngine = window.GameEngine.createEngine(testGameData, mockElements);
      newEngine.loadProgress();
      
      const inventory = newEngine.getInventory();
      chai.assert.lengthOf(inventory.items, 2);
      chai.assert.isTrue(newEngine.hasItem('key'));
      chai.assert.isTrue(newEngine.hasItem('potion'));
    });

    it('should handle missing inventory in saved data', () => {
      // Save progress without inventory
      window.StorageUtil.saveJSON('agp_progress', {
        title: testGameData.title,
        nodeId: 'start',
        history: [],
        forward: []
      });
      
      engine.loadProgress();
      const inventory = engine.getInventory();
      chai.assert.lengthOf(inventory.items, 0);
    });
  });

  describe('reset', () => {
    it('should clear inventory on reset', () => {
      engine.addItem('sword', 1);
      engine.addItem('potion', 5);
      
      engine.reset();
      
      const inventory = engine.getInventory();
      chai.assert.lengthOf(inventory.items, 0);
    });
  });

  describe('Integration', () => {
    it('should maintain inventory across node transitions', () => {
      engine.addItem('key', 1);
      engine.setNode('room1');
      
      chai.assert.isTrue(engine.hasItem('key'));
    });

    it('should persist inventory with navigation history', () => {
      engine.addItem('sword', 1);
      engine.setNode('room1');
      engine.goBack();
      
      chai.assert.isTrue(engine.hasItem('sword'));
    });
  });
});
