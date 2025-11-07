(function () {
  // Auto-Scroll and Animations Manager - Handles caret tracking, auto-scroll, and input animations
  window.AutoScrollAnimationsManager = {
    init: function() {
      this.initAutoScrollAndAnimations();
      console.log('AutoScrollAnimationsManager initialized');
    },

    // Auto-scroll and input animations
    initAutoScrollAndAnimations: function() {
      function debounce(fn, ms){ let t; return (...args)=>{ clearTimeout(t); t = setTimeout(()=>fn(...args), ms); }; }
      function getCaretRect(){
        try {
          const sel = window.getSelection(); if(!sel || sel.rangeCount===0) return null;
          const range = sel.getRangeAt(0);
          let rect = range.getBoundingClientRect();
          if(rect && (rect.width>0 || rect.height>0)) return rect;
          // fallback: zero-width marker
          const temp = document.createElement('span'); temp.textContent = '\u200b';
          const clone = range.cloneRange(); clone.collapse(true); clone.insertNode(temp);
          rect = temp.getBoundingClientRect(); temp.parentNode && temp.parentNode.removeChild(temp);
          return rect;
        } catch { return null; }
      }
      // prepare overlay for Anime.js pulse
      const inkOverlay = document.createElement('div');
      inkOverlay.className = 'ink-overlay';
      inkOverlay.setAttribute('aria-hidden','true');
      inkOverlay.setAttribute('contenteditable','false');
      const editor = document.getElementById('editor');
      if (editor) {
        editor.appendChild(inkOverlay);
      }
      function ensureCaretVisible(){
        if(!window.APP_CONFIG?.editor?.autoScroll?.enabled) return;
        const rect = getCaretRect(); if(!rect) return;
        const scroller = document.scrollingElement || document.documentElement;
        const viewTop = scroller.scrollTop;
        const viewH = scroller.clientHeight || window.innerHeight;
        const caretY = rect.top + (window.scrollY || viewTop);
        const topBound = viewTop + viewH * (window.APP_CONFIG.editor.autoScroll.safeTopRatio ?? 0.25);
        const bottomBound = viewTop + viewH * (window.APP_CONFIG.editor.autoScroll.safeBottomRatio ?? 0.75);
        let target = null;
        if(caretY < topBound){ target = Math.max(0, caretY - viewH * 0.35); }
        else if(caretY > bottomBound){ target = Math.max(0, caretY - viewH * 0.65); }
        if(target!=null){ window.scrollTo({ top: target, behavior: window.APP_CONFIG.editor.autoScroll.behavior || 'auto' }); }
      }
      const debouncedEnsure = debounce(ensureCaretVisible, 80);
      document.addEventListener('selectionchange', debouncedEnsure);
      if (editor) {
        editor.addEventListener('keydown', (e)=>{
          if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','PageDown','PageUp','Home','End','Enter','Backspace','Delete'].includes(e.key)){
            setTimeout(debouncedEnsure, 0);
          }
        });
        function applyInk(kind){
          if(!window.APP_CONFIG?.editor?.inputFx?.enabled) return;
          const dur = Math.max(60, window.APP_CONFIG.editor.inputFx.durationMs ?? 160);
          // Prefer Anime.js pulse overlay (stable)
          if(window.anime && inkOverlay){
            // compute caret position relative to editor for gradient focus
            const crect = getCaretRect();
            const ed = editor.getBoundingClientRect();
            let x = ed.width * 0.5, y = ed.height * 0.5;
            if(crect){ x = (crect.left + crect.width/2) - ed.left; y = (crect.top + crect.height/2) - ed.top; }
            const px = Math.max(0, Math.min(1, x / Math.max(1, ed.width)));
            const py = Math.max(0, Math.min(1, y / Math.max(1, ed.height)));
            inkOverlay.style.setProperty('--ink-x', `${(px*100).toFixed(2)}%`);
            inkOverlay.style.setProperty('--ink-y', `${(py*100).toFixed(2)}%`);
            try { window.anime.remove(inkOverlay); } catch{}
            inkOverlay.style.opacity = 0;
            const peak = kind==='out' ? 0.08 : 0.16;
            window.anime({
              targets: inkOverlay,
              opacity: [0, peak, 0],
              duration: Math.round(dur*1.6),
              easing: 'easeInOutSine'
            });
            return;
          }
          // Fallback: simple CSS class toggle
          const cls = kind==='out' ? 'ink-out' : 'ink-in';
          editor.style.setProperty('--ink-dur', `${dur}ms`);
          editor.classList.remove('ink-in','ink-out');
          void editor.offsetWidth; // restart
          editor.classList.add(cls);
          setTimeout(()=> editor.classList.remove(cls), dur+20);
        }
        editor.addEventListener('input', (e)=>{
          debouncedEnsure();
          const t = e.inputType || '';
          if(t.startsWith('delete')) applyInk('out'); else applyInk('in');
        });
      }
    }
  };
})();
