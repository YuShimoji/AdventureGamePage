(function () {
  function createEngine(gameData, elements) {
    // Load items data if available
    let itemsData = [];
    if (gameData && gameData.items) {
      itemsData = Array.isArray(gameData.items) ? gameData.items : [];
    }

    const state = {
      nodeId: gameData.start || 'start',
      history: [],
      forward: [],
      // Player state management
      playerState: {
        inventory: {
          items: [], // Array of item objects: {id, name, description, quantity, type, usable, ...}
          maxSlots: 20
        },
        flags: {}, // Object of boolean/string flags
        variables: {}, // Object of numeric/string variables
        history: [] // Array of visited node IDs for wiki unlock etc.
      }
    };

    // Initialize managers
    const logicManager = new GameEngineLogicManager(gameData, state, itemsData);
    const uiManager = new GameEngineUIManager(elements);

    // Bind UI events
    uiManager.setChoiceClickHandler((to) => logicManager.setNode(to, executeAction, render, logicManager.saveProgress.bind(logicManager)));
    uiManager.attachListeners(
      () => logicManager.goBack(render, logicManager.saveProgress.bind(logicManager)),
      () => logicManager.goForward(render, logicManager.saveProgress.bind(logicManager))
    );

    function render() {
      return uiManager.render(gameData, state, logicManager.getNode.bind(logicManager), logicManager.canGoBack.bind(logicManager), logicManager.canGoForward.bind(logicManager));
    }

    function executeAction(action) {
      return GameEngineUtils.executeAction(action, state, itemsData, logicManager.saveProgress.bind(logicManager));
    }

    // Load initial progress
    logicManager.loadProgress();
    render();

    // Return API
    return {
      render,
      setNode: (id) => logicManager.setNode(id, executeAction, render, logicManager.saveProgress.bind(logicManager)),
      loadProgress: logicManager.loadProgress.bind(logicManager),
      reset: () => logicManager.reset(logicManager.saveProgress.bind(logicManager), render),
      canGoBack: logicManager.canGoBack.bind(logicManager),
      goBack: () => logicManager.goBack(render, logicManager.saveProgress.bind(logicManager)),
      canGoForward: logicManager.canGoForward.bind(logicManager),
      goForward: () => logicManager.goForward(render, logicManager.saveProgress.bind(logicManager)),
      // Player state management API
      getPlayerState: logicManager.getPlayerState.bind(logicManager),
      setPlayerState: logicManager.setPlayerState.bind(logicManager),
      // Explicit save/load for save slots
      saveGame: logicManager.saveGame.bind(logicManager),
      loadGame: logicManager.loadGame.bind(logicManager),
      // Inventory management API
      addItem: logicManager.addItem.bind(logicManager),
      removeItem: logicManager.removeItem.bind(logicManager),
      useItem: logicManager.useItem.bind(logicManager),
      hasItem: logicManager.hasItem.bind(logicManager),
      getItemCount: logicManager.getItemCount.bind(logicManager),
      getInventory: logicManager.getInventory.bind(logicManager),
      getInventoryItems: logicManager.getInventoryItems.bind(logicManager),
      getState: logicManager.getStateSnapshot.bind(logicManager),
      getVariables: logicManager.getVariables.bind(logicManager),
      setVariable: logicManager.setVariable.bind(logicManager),
      getVariable: logicManager.getVariable.bind(logicManager),
      getItemsData: () => itemsData,
      checkConditions: (conditions) => GameEngineUtils.checkConditions(conditions, logicManager.state),
      // Multi-session save slot management
      createSlot: logicManager.createSlot.bind(logicManager),
      deleteSlot: logicManager.deleteSlot.bind(logicManager),
      listSlots: logicManager.listSlots.bind(logicManager),
      saveToSlot: logicManager.saveToSlot.bind(logicManager),
      loadFromSlot: logicManager.loadFromSlot.bind(logicManager),
      renameSlot: logicManager.renameSlot.bind(logicManager),
      getSlotInfo: logicManager.getSlotInfo.bind(logicManager),
      copySlot: logicManager.copySlot.bind(logicManager)
    };
  }

  window.GameEngine = { createEngine };
})();
