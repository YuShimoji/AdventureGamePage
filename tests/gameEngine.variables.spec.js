/**
 * GameEngine 変数システムのテストスイート
 * Issue #38: 変数システム実装
 */

describe('GameEngine - Variable System', () => {
  let engine;
  let container;

  const testGameData = {
    title: 'Variable Test Game',
    start: 'start',
    nodes: {
      start: {
        text: 'Start node with variable actions',
        choices: [
          {
            text: 'Set score to 100',
            to: 'node_score',
            actions: [
              { type: 'set_variable', key: 'score', value: 100, operation: 'set' }
            ]
          },
          {
            text: 'Set player name',
            to: 'node_name',
            actions: [
              { type: 'set_variable', key: 'player_name', value: 'Hero', operation: 'set' }
            ]
          },
          {
            text: 'Set visited flag',
            to: 'node_flag',
            actions: [
              { type: 'set_variable', key: 'visited_forest', value: true, operation: 'set' }
            ]
          }
        ]
      },
      node_score: {
        text: 'Score is set to 100',
        choices: [
          {
            text: 'Add 50 to score',
            to: 'node_score_add',
            actions: [
              { type: 'set_variable', key: 'score', value: 50, operation: 'add' }
            ]
          },
          {
            text: 'Subtract 30 from score',
            to: 'node_score_subtract',
            actions: [
              { type: 'set_variable', key: 'score', value: 30, operation: 'subtract' }
            ]
          },
          {
            text: 'Multiply score by 2',
            to: 'node_score_multiply',
            actions: [
              { type: 'set_variable', key: 'score', value: 2, operation: 'multiply' }
            ]
          },
          {
            text: 'Divide score by 2',
            to: 'node_score_divide',
            actions: [
              { type: 'set_variable', key: 'score', value: 2, operation: 'divide' }
            ]
          }
        ]
      },
      node_score_add: {
        text: 'Score increased to 150',
        choices: []
      },
      node_score_subtract: {
        text: 'Score decreased to 70',
        choices: []
      },
      node_score_multiply: {
        text: 'Score multiplied to 200',
        choices: []
      },
      node_score_divide: {
        text: 'Score divided to 50',
        choices: []
      },
      node_name: {
        text: 'Player name is set',
        choices: []
      },
      node_flag: {
        text: 'Forest visited flag is set',
        choices: []
      },
      node_conditional: {
        text: 'Conditional node',
        choices: [
          {
            text: 'This requires score >= 100',
            to: 'node_high_score',
            conditions: [
              { type: 'variable_greater_equal', key: 'score', value: 100 }
            ]
          },
          {
            text: 'This requires score < 50',
            to: 'node_low_score',
            conditions: [
              { type: 'variable_less_than', key: 'score', value: 50 }
            ]
          },
          {
            text: 'This requires score === 100',
            to: 'node_exact_score',
            conditions: [
              { type: 'variable_equals', key: 'score', value: 100 }
            ]
          },
          {
            text: 'This requires score !== 0',
            to: 'node_nonzero_score',
            conditions: [
              { type: 'variable_not_equals', key: 'score', value: 0 }
            ]
          },
          {
            text: 'This requires player_name exists',
            to: 'node_has_name',
            conditions: [
              { type: 'variable_exists', key: 'player_name' }
            ]
          }
        ]
      },
      node_high_score: {
        text: 'You have high score!',
        choices: []
      },
      node_low_score: {
        text: 'You have low score',
        choices: []
      },
      node_exact_score: {
        text: 'You have exactly 100 score',
        choices: []
      },
      node_nonzero_score: {
        text: 'You have non-zero score',
        choices: []
      },
      node_has_name: {
        text: 'You have a player name',
        choices: []
      }
    }
  };

  beforeEach(() => {
    container = document.createElement('div');
    container.innerHTML = `
      <div id="text"></div>
      <div id="choices"></div>
    `;
    document.body.appendChild(container);

    const elements = {
      text: container.querySelector('#text'),
      choices: container.querySelector('#choices')
    };

    engine = window.GameEngine.createEngine(testGameData, elements);
  });

  afterEach(() => {
    document.body.removeChild(container);
    localStorage.clear();
  });

  describe('Variable Setting and Operations', () => {
    it('should set a numeric variable', () => {
      const playerState = engine.getPlayerState();
      expect(playerState.variables.score).to.be.undefined;

      // Click to set score
      const choices = container.querySelectorAll('#choices button');
      choices[0].click();

      const updatedState = engine.getPlayerState();
      expect(updatedState.variables.score).to.equal(100);
    });

    it('should set a string variable', () => {
      // Click to set player name
      const choices = container.querySelectorAll('#choices button');
      choices[1].click();

      const playerState = engine.getPlayerState();
      expect(playerState.variables.player_name).to.equal('Hero');
    });

    it('should set a boolean variable', () => {
      // Click to set visited flag
      const choices = container.querySelectorAll('#choices button');
      choices[2].click();

      const playerState = engine.getPlayerState();
      expect(playerState.variables.visited_forest).to.be.true;
    });

    it('should add to a variable', () => {
      // Set score to 100
      const choices1 = container.querySelectorAll('#choices button');
      choices1[0].click();

      // Add 50 to score
      const choices2 = container.querySelectorAll('#choices button');
      choices2[0].click();

      const playerState = engine.getPlayerState();
      expect(playerState.variables.score).to.equal(150);
    });

    it('should subtract from a variable', () => {
      // Set score to 100
      const choices1 = container.querySelectorAll('#choices button');
      choices1[0].click();

      // Subtract 30 from score
      const choices2 = container.querySelectorAll('#choices button');
      choices2[1].click();

      const playerState = engine.getPlayerState();
      expect(playerState.variables.score).to.equal(70);
    });

    it('should multiply a variable', () => {
      // Set score to 100
      const choices1 = container.querySelectorAll('#choices button');
      choices1[0].click();

      // Multiply score by 2
      const choices2 = container.querySelectorAll('#choices button');
      choices2[2].click();

      const playerState = engine.getPlayerState();
      expect(playerState.variables.score).to.equal(200);
    });

    it('should divide a variable', () => {
      // Set score to 100
      const choices1 = container.querySelectorAll('#choices button');
      choices1[0].click();

      // Divide score by 2
      const choices2 = container.querySelectorAll('#choices button');
      choices2[3].click();

      const playerState = engine.getPlayerState();
      expect(playerState.variables.score).to.equal(50);
    });

    it('should handle division by zero gracefully', () => {
      // Set score to 100
      engine.setNode('node_score');
      
      // Manually execute divide by zero action
      const state = engine.getPlayerState();
      GameEngineUtils.executeAction(
        { type: 'set_variable', key: 'score', value: 0, operation: 'divide' },
        { playerState: state },
        [],
        () => {}
      );

      // Score should remain 100 (no division by zero)
      expect(state.variables.score).to.equal(100);
    });
  });

  describe('Variable Conditions', () => {
    it('should check variable_exists condition', () => {
      const state = { playerState: { variables: { score: 100 } } };
      
      const result1 = GameEngineUtils.checkConditions([
        { type: 'variable_exists', key: 'score' }
      ], state);
      expect(result1).to.be.true;

      const result2 = GameEngineUtils.checkConditions([
        { type: 'variable_exists', key: 'nonexistent' }
      ], state);
      expect(result2).to.be.false;
    });

    it('should check variable_equals condition', () => {
      const state = { playerState: { variables: { score: 100, name: 'Hero' } } };
      
      const result1 = GameEngineUtils.checkConditions([
        { type: 'variable_equals', key: 'score', value: 100 }
      ], state);
      expect(result1).to.be.true;

      const result2 = GameEngineUtils.checkConditions([
        { type: 'variable_equals', key: 'score', value: 50 }
      ], state);
      expect(result2).to.be.false;

      const result3 = GameEngineUtils.checkConditions([
        { type: 'variable_equals', key: 'name', value: 'Hero' }
      ], state);
      expect(result3).to.be.true;
    });

    it('should check variable_not_equals condition', () => {
      const state = { playerState: { variables: { score: 100 } } };
      
      const result1 = GameEngineUtils.checkConditions([
        { type: 'variable_not_equals', key: 'score', value: 50 }
      ], state);
      expect(result1).to.be.true;

      const result2 = GameEngineUtils.checkConditions([
        { type: 'variable_not_equals', key: 'score', value: 100 }
      ], state);
      expect(result2).to.be.false;
    });

    it('should check variable_greater_than condition', () => {
      const state = { playerState: { variables: { score: 100 } } };
      
      const result1 = GameEngineUtils.checkConditions([
        { type: 'variable_greater_than', key: 'score', value: 50 }
      ], state);
      expect(result1).to.be.true;

      const result2 = GameEngineUtils.checkConditions([
        { type: 'variable_greater_than', key: 'score', value: 100 }
      ], state);
      expect(result2).to.be.false;

      const result3 = GameEngineUtils.checkConditions([
        { type: 'variable_greater_than', key: 'score', value: 150 }
      ], state);
      expect(result3).to.be.false;
    });

    it('should check variable_less_than condition', () => {
      const state = { playerState: { variables: { score: 100 } } };
      
      const result1 = GameEngineUtils.checkConditions([
        { type: 'variable_less_than', key: 'score', value: 150 }
      ], state);
      expect(result1).to.be.true;

      const result2 = GameEngineUtils.checkConditions([
        { type: 'variable_less_than', key: 'score', value: 100 }
      ], state);
      expect(result2).to.be.false;

      const result3 = GameEngineUtils.checkConditions([
        { type: 'variable_less_than', key: 'score', value: 50 }
      ], state);
      expect(result3).to.be.false;
    });

    it('should check variable_greater_equal condition', () => {
      const state = { playerState: { variables: { score: 100 } } };
      
      const result1 = GameEngineUtils.checkConditions([
        { type: 'variable_greater_equal', key: 'score', value: 100 }
      ], state);
      expect(result1).to.be.true;

      const result2 = GameEngineUtils.checkConditions([
        { type: 'variable_greater_equal', key: 'score', value: 50 }
      ], state);
      expect(result2).to.be.true;

      const result3 = GameEngineUtils.checkConditions([
        { type: 'variable_greater_equal', key: 'score', value: 150 }
      ], state);
      expect(result3).to.be.false;
    });

    it('should check variable_less_equal condition', () => {
      const state = { playerState: { variables: { score: 100 } } };
      
      const result1 = GameEngineUtils.checkConditions([
        { type: 'variable_less_equal', key: 'score', value: 100 }
      ], state);
      expect(result1).to.be.true;

      const result2 = GameEngineUtils.checkConditions([
        { type: 'variable_less_equal', key: 'score', value: 150 }
      ], state);
      expect(result2).to.be.true;

      const result3 = GameEngineUtils.checkConditions([
        { type: 'variable_less_equal', key: 'score', value: 50 }
      ], state);
      expect(result3).to.be.false;
    });

    it('should handle multiple conditions (AND logic)', () => {
      const state = { playerState: { variables: { score: 100, level: 5 } } };
      
      const result1 = GameEngineUtils.checkConditions([
        { type: 'variable_greater_equal', key: 'score', value: 100 },
        { type: 'variable_greater_equal', key: 'level', value: 5 }
      ], state);
      expect(result1).to.be.true;

      const result2 = GameEngineUtils.checkConditions([
        { type: 'variable_greater_equal', key: 'score', value: 100 },
        { type: 'variable_greater_equal', key: 'level', value: 10 }
      ], state);
      expect(result2).to.be.false;
    });
  });

  describe('Variable Persistence', () => {
    it('should persist variables across game state save/load', () => {
      // Set variables
      const choices = container.querySelectorAll('#choices button');
      choices[0].click(); // Set score to 100

      // Save game
      engine.saveGame();

      // Create new engine instance
      const newEngine = window.GameEngine.createEngine(testGameData, {
        text: container.querySelector('#text'),
        choices: container.querySelector('#choices')
      });

      // Load game
      newEngine.loadProgress();

      // Check if variables persisted
      const playerState = newEngine.getPlayerState();
      expect(playerState.variables.score).to.equal(100);
    });

    it('should persist variables in save slots', async () => {
      // Set variables
      const choices = container.querySelectorAll('#choices button');
      choices[0].click(); // Set score to 100

      // Save to slot
      await engine.createSlot('test-slot');
      await engine.saveToSlot('test-slot');

      // Reset state
      engine.reset();
      let playerState = engine.getPlayerState();
      expect(playerState.variables.score).to.be.undefined;

      // Load from slot
      await engine.loadFromSlot('test-slot');

      // Check if variables restored
      playerState = engine.getPlayerState();
      expect(playerState.variables.score).to.equal(100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined variable in operations', () => {
      const state = { playerState: { variables: {} } };
      
      // Add to undefined variable (should treat as 0)
      GameEngineUtils.executeAction(
        { type: 'set_variable', key: 'score', value: 50, operation: 'add' },
        state,
        [],
        () => {}
      );

      expect(state.playerState.variables.score).to.equal(50);
    });

    it('should handle string variables in conditions', () => {
      const state = { playerState: { variables: { status: 'active' } } };
      
      const result = GameEngineUtils.checkConditions([
        { type: 'variable_equals', key: 'status', value: 'active' }
      ], state);
      expect(result).to.be.true;
    });

    it('should handle boolean variables in conditions', () => {
      const state = { playerState: { variables: { completed: true } } };
      
      const result = GameEngineUtils.checkConditions([
        { type: 'variable_equals', key: 'completed', value: true }
      ], state);
      expect(result).to.be.true;
    });
  });
});
