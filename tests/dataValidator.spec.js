// Data Validator Tests
describe('DataValidator', function() {
  describe('validateGameData', function() {
    it('should validate correct game data', function() {
      const validData = {
        title: 'Test Game',
        start: 'start',
        nodes: {
          start: {
            title: 'Start',
            text: 'Welcome to the game',
            choices: [{ text: 'Begin', to: 'scene1' }]
          },
          scene1: {
            title: 'Scene 1',
            text: 'You are in scene 1',
            choices: []
          }
        }
      };

      const result = window.DataValidator.validateGameData(validData);
      expect(result.valid).to.be.true;
      expect(result.errors).to.be.empty;
    });

    it('should detect missing title', function() {
      const invalidData = {
        nodes: {},
        start: 'start'
      };

      const result = window.DataValidator.validateGameData(invalidData);
      expect(result.valid).to.be.false;
      expect(result.errors).to.include('タイトルが不正です');
    });

    it('should detect broken choice links', function() {
      const invalidData = {
        title: 'Test Game',
        start: 'start',
        nodes: {
          start: {
            title: 'Start',
            text: 'Welcome',
            choices: [{ text: 'Go', to: 'nonexistent' }]
          }
        }
      };

      const result = window.DataValidator.validateGameData(invalidData);
      expect(result.valid).to.be.false;
      expect(result.errors.some(e => String(e).includes('移動先 nonexistent が存在しません'))).to.be.true;
    });
  });

  describe('validateExtendedData', function() {
    it('should validate correct items data', function() {
      const validItems = {
        items: [
          { id: 'sword', name: 'Sword', type: 'weapon' },
          { id: 'potion', name: 'Health Potion', type: 'consumable' }
        ]
      };

      const result = window.DataValidator.validateExtendedData('items', validItems);
      expect(result.valid).to.be.true;
    });

    it('should detect missing item ID', function() {
      const invalidItems = {
        items: [
          { name: 'Sword', type: 'weapon' } // missing id
        ]
      };

      const result = window.DataValidator.validateExtendedData('items', invalidItems);
      expect(result.valid).to.be.false;
      expect(result.errors).to.include('アイテム 0 にIDがありません');
    });
  });

  describe('repairData', function() {
    it('should repair missing title', function() {
      const brokenData = {
        nodes: {},
        start: 'start'
      };

      const result = window.DataValidator.repairData(brokenData, 'game');
      expect(result.success).to.be.true;
      expect(result.data.title).to.equal('Untitled Game');
      expect(result.repairs).to.include('タイトルを補完しました');
    });

    it('should repair broken choice links', function() {
      const brokenData = {
        title: 'Test Game',
        start: 'start',
        nodes: {
          start: {
            title: 'Start',
            text: 'Welcome',
            choices: [{ text: 'Go', to: 'nonexistent' }]
          }
        }
      };

      const result = window.DataValidator.repairData(brokenData, 'game');
      expect(result.success).to.be.true;
      expect(result.data.nodes.start.choices).to.be.empty;
      expect(result.repairs.some(r => String(r).includes('無効な選択肢を削除しました'))).to.be.true;
    });
  });

  describe('checkStorageHealth', function() {
    it('should check storage availability', function() {
      const health = window.DataValidator.checkStorageHealth();
      expect(health).to.have.property('available');
      expect(health).to.have.property('errors');
      expect(health).to.have.property('warnings');
    });
  });
});
