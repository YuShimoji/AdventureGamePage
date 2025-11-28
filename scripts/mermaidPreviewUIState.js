(function(){
  // Mermaid Preview UI State Manager - Manages UI references and state getters

  const STATUS_CLASSES = ["status-info", "status-ok", "status-warn", "status-error"];

  const MermaidPreviewUIState = {
    uiRefs: {},

    setUIRefs(refs) {
      this.uiRefs = refs || {};
    },

    getUIRefs() {
      return this.uiRefs || {};
    },

    setStatus(message, kind = "info") {
      const { statusEl } = this.getUIRefs();
      if (!statusEl) return;
      STATUS_CLASSES.forEach((cls) => statusEl.classList.remove(cls));
      const normalizedKind = STATUS_CLASSES.includes(`status-${kind}`) ? kind : "info";
      statusEl.classList.add(`status-${normalizedKind}`);
      statusEl.textContent = message || "";
    },

    // UI state getters
    getScope() {
      const { scopeSel } = this.getUIRefs();
      return scopeSel ? scopeSel.value : "all";
    },

    getSelectedSeeds() {
      const { seedSel } = this.getUIRefs();
      if (!seedSel) return [];
      return Array.from(seedSel.selectedOptions).map((o) => o.value);
    },

    isLabelOn() {
      const { showLbl } = this.getUIRefs();
      return showLbl ? !!showLbl.checked : true;
    },

    getDir() {
      const { dirSel } = this.getUIRefs();
      return dirSel ? dirSel.value : "TD";
    },

    isMarkUnreachable() {
      const { markUnreach } = this.getUIRefs();
      return markUnreach ? !!markUnreach.checked : true;
    },

    getSearchTerm() {
      const { searchInput } = this.getUIRefs();
      return searchInput ? searchInput.value.trim() : "";
    },

    getPathStart() {
      const { pathStartSel } = this.getUIRefs();
      return pathStartSel ? pathStartSel.value : "";
    },

    getPathGoal() {
      const { pathGoalSel } = this.getUIRefs();
      return pathGoalSel ? pathGoalSel.value : "";
    }
  };

  // Global exposure
  window.MermaidPreviewUIState = MermaidPreviewUIState;
})();
