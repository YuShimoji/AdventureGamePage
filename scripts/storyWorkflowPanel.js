(function () {
  function scrollIntoViewSafe(el) {
    if (!el) return;
    try {
      if (typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (e) {}
  }

  function openSidebarSection(id) {
    var details = document.getElementById(id);
    if (details && details.tagName === 'DETAILS') {
      details.open = true;
    }
  }

  function applyI18n() {
    var hasT = window.AGStrings && typeof window.AGStrings.t === 'function';
    if (!hasT) return;
    var t = window.AGStrings.t;

    var summary = document.querySelector('#acc-story-workflow summary');
    if (summary) {
      var label = summary.querySelector('.summary-label');
      if (label) {
        label.textContent = t('workflow.title');
      }
      var hintBtn = summary.querySelector('[data-accordion-hint="story-workflow"]');
      if (hintBtn) {
        hintBtn.setAttribute('aria-label', t('workflow.hintLabel'));
      }
    }

    var panel = document.getElementById('story-workflow-panel');
    if (panel) {
      var heading = panel.querySelector('h3');
      if (heading) {
        heading.textContent = t('workflow.heading');
      }
    }

    var btnWrite = document.getElementById('story-step-write');
    if (btnWrite) {
      btnWrite.textContent = t('workflow.steps.writeText');
    }
    var btnNodes = document.getElementById('story-step-nodes');
    if (btnNodes) {
      btnNodes.textContent = t('workflow.steps.editNodes');
    }
    var btnBranches = document.getElementById('story-step-branches');
    if (btnBranches) {
      btnBranches.textContent = t('workflow.steps.previewBranches');
    }
    var btnPlaytest = document.getElementById('story-step-playtest');
    if (btnPlaytest) {
      btnPlaytest.textContent = t('workflow.steps.playtest');
    }
    var btnAI = document.getElementById('story-step-ai');
    if (btnAI) {
      btnAI.textContent = t('workflow.steps.aiImprove');
    }
    var btnSample = document.getElementById('story-step-sample');
    if (btnSample) {
      btnSample.textContent = t('workflow.steps.fromSample');
    }
  }

  function init() {
    applyI18n();

    var btnWrite = document.getElementById('story-step-write');
    var btnNodes = document.getElementById('story-step-nodes');
    var btnBranches = document.getElementById('story-step-branches');
    var btnPlaytest = document.getElementById('story-step-playtest');
    var btnAI = document.getElementById('story-step-ai');
    var btnSample = document.getElementById('story-step-sample');

    if (!btnWrite && !btnNodes && !btnBranches && !btnPlaytest && !btnAI && !btnSample) {
      return;
    }

    if (btnWrite) {
      btnWrite.addEventListener('click', function () {
        var editor = document.getElementById('editor');
        var container = document.getElementById('editor-container');
        if (container) scrollIntoViewSafe(container);
        if (editor && typeof editor.focus === 'function') {
          editor.focus();
        }
      });
    }

    if (btnNodes) {
      btnNodes.addEventListener('click', function () {
        openSidebarSection('acc-node-editor');
        var nodeSection = document.getElementById('node-editor');
        if (nodeSection) {
          scrollIntoViewSafe(nodeSection);
        }
      });
    }

    if (btnBranches) {
      btnBranches.addEventListener('click', function () {
        openSidebarSection('acc-mermaid');
        var mermaidPanel = document.getElementById('mermaid-panel');
        if (mermaidPanel) {
          scrollIntoViewSafe(mermaidPanel);
        }
      });
    }

    if (btnPlaytest) {
      btnPlaytest.addEventListener('click', function () {
        try {
          window.open('play.html', '_blank');
        } catch (e) {}
      });
    }

    if (btnAI) {
      btnAI.addEventListener('click', function () {
        openSidebarSection('acc-playtest');
        var panel = document.getElementById('ai-improvement-panel');
        if (panel) {
          scrollIntoViewSafe(panel);
        }
        var analyzeBtn = document.getElementById('ai-analyze');
        if (analyzeBtn && typeof analyzeBtn.click === 'function') {
          analyzeBtn.click();
        }
      });
    }

    if (btnSample) {
      btnSample.addEventListener('click', function () {
        try {
          window.open('learn.html', '_blank');
        } catch (e) {}
      });
    }
  }

  window.StoryWorkflowPanel = {
    init: init,
  };
})();
