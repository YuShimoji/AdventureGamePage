(function(){
  function sanitizeId(id){ return String(id||'').replace(/[^A-Za-z0-9_]/g, '_'); }
  function escapeText(t){ return String(t||'').replace(/[\n\r]+/g,' ').replace(/[|<>`]/g, ''); }

  function getBaseSpec(){ return (window.NodeEditorAPI?.getSpec ? window.NodeEditorAPI.getSpec() : { nodes:[], meta:{} }); }

  function getScopedSpec(scope, seedIds){
    const base = getBaseSpec();
    if(scope === 'all') return base;
    try {
      const util = window.NodeEditorUtils;
      if(scope === 'from_start' && base?.meta?.start){
        if(util?.collectSubgraph) return util.collectSubgraph(base, [base.meta.start]);
        // fallback: simple BFS
      }
      if(scope === 'from_selected' && Array.isArray(seedIds) && seedIds.length>0){
        if(util?.collectSubgraph) return util.collectSubgraph(base, seedIds);
      }
    } catch{}
    return base;
  }

  function buildMermaidWithOptions(opts){
    const { scope='all', seeds=[], showLabels=true } = opts||{};
    const spec = getScopedSpec(scope, seeds) || { nodes:[], meta:{} };
    const nodes = Array.isArray(spec.nodes) ? spec.nodes : [];
    const idSet = new Set(nodes.map(n=>n&&n.id).filter(Boolean));

    const lines = ['flowchart TD'];
    const unresolvedTargets = [];
    const deadEnds = new Set();
    const startId = spec?.meta?.start;

    // Nodes
    nodes.forEach(n => {
      if(!n||!n.id) return;
      const sid = sanitizeId(n.id);
      const title = escapeText(n.title||'');
      const label = title ? `${n.id}\\n${title}` : n.id;
      lines.push(`  ${sid}["${label}"]`);
      const outs = Array.isArray(n.choices) ? n.choices : [];
      if(outs.length===0) deadEnds.add(n.id);
    });

    // Edges and unresolved placeholders
    nodes.forEach(n => {
      if(!n||!n.id) return;
      const sid = sanitizeId(n.id);
      const outs = Array.isArray(n.choices) ? n.choices : [];
      outs.forEach(c => {
        const tgt = c?.target ?? c?.to; if(!tgt) return;
        const tid = sanitizeId(tgt);
        const elabel = showLabels ? escapeText(c?.label ?? c?.text ?? '') : '';
        if(idSet.has(tgt)){
          if(elabel){ lines.push(`  ${sid} -->|${elabel}| ${tid}`); }
          else { lines.push(`  ${sid} --> ${tid}`); }
        } else {
          const phantom = `unresolved__${tid}`;
          lines.push(`  ${phantom}("? ${escapeText(tgt)}")`);
          if(elabel){ lines.push(`  ${sid} -. ${elabel} .-> ${phantom}`); }
          else { lines.push(`  ${sid} -.-> ${phantom}`); }
          unresolvedTargets.push(tgt);
        }
      });
    });

    // Classes
    const classes = [];
    if(startId){ classes.push(`  class ${sanitizeId(startId)} start;`); }
    if(deadEnds.size>0){ classes.push(`  class ${Array.from(deadEnds).map(sanitizeId).join(',')} deadEnd;`); }
    if(unresolvedTargets.length>0){
      const ph = Array.from(new Set(unresolvedTargets.map(t => `unresolved__${sanitizeId(t)}`)));
      classes.push(`  class ${ph.join(',')} unresolved;`);
    }
    if(classes.length){ lines.push('', ...classes); }

    // Class definitions (dark theme friendly)
    lines.push(
      '  classDef start fill:#1b3a2b,stroke:#43a047,color:#e8f5e9;',
      '  classDef unresolved fill:#3b2525,stroke:#ef9a9a,color:#ffebee,stroke-dasharray: 5 3;',
      '  classDef deadEnd fill:#2f2f2f,stroke:#9e9e9e,color:#eeeeee;'
    );

    return lines.join('\n');
  }

  function ensureMermaid(){
    if(!window.mermaid) return false;
    if(!ensureMermaid._inited){ try { window.mermaid.initialize({ startOnLoad:false }); } catch{}; ensureMermaid._inited = true; }
    return true;
  }

  function bind(){
    const genBtn = document.getElementById('ne-mermaid-gen');
    const renderBtn = document.getElementById('ne-mermaid-render');
    const src = document.getElementById('ne-mermaid-src');
    const view = document.getElementById('ne-mermaid-view');
    const openBtn = document.getElementById('ne-mermaid-open');
    const scopeSel = document.getElementById('ne-mermaid-scope');
    const seedSel = document.getElementById('ne-mermaid-seed');
    const showLbl = document.getElementById('ne-mermaid-show-labels');
    if(!genBtn || !renderBtn || !src || !view) return;

    function refreshSeedOptions(){
      if(!seedSel) return;
      seedSel.innerHTML = '';
      try {
        const spec = getBaseSpec();
        (spec.nodes||[]).forEach(n => { const opt = document.createElement('option'); opt.value = n.id; opt.textContent = n.id; seedSel.appendChild(opt); });
        // preselect current node if available
        const cur = document.getElementById('ne-node-select');
        if(cur && cur.value){
          for(const o of seedSel.options){ if(o.value === cur.value){ o.selected = true; break; } }
        }
      } catch{}
    }

    function getSelectedSeeds(){ return seedSel ? Array.from(seedSel.selectedOptions).map(o=>o.value) : []; }
    function getScope(){ return scopeSel ? scopeSel.value : 'all'; }
    function isLabelOn(){ return showLbl ? !!showLbl.checked : true; }

    if(scopeSel && seedSel){
      const applySeedEnabled = ()=>{ const v = getScope(); seedSel.disabled = (v !== 'from_selected'); };
      scopeSel.addEventListener('change', ()=>{ applySeedEnabled(); if(getScope()==='from_selected') refreshSeedOptions(); });
      applySeedEnabled();
    }
    if(seedSel){ seedSel.addEventListener('focus', refreshSeedOptions); }

    genBtn.addEventListener('click', () => {
      const code = buildMermaidWithOptions({ scope: getScope(), seeds: getSelectedSeeds(), showLabels: isLabelOn() });
      src.value = code;
    });

    renderBtn.addEventListener('click', async () => {
      try {
        const code = src.value && src.value.trim() ? src.value : buildMermaidWithOptions({ scope: getScope(), seeds: getSelectedSeeds(), showLabels: isLabelOn() });
        src.value = code; // keep latest
        if(!ensureMermaid()){ view.innerHTML = '<div class="muted">Mermaidが未ロードです。ソースをコピーして外部でレンダリングしてください。</div>'; return; }
        const out = await window.mermaid.render(`mmd-${Date.now()}`, code);
        view.innerHTML = out.svg || '';
      } catch(e){ console.error('Mermaid render error', e); view.textContent = 'Mermaidの描画に失敗しました'; }
    });

    if(openBtn){
      openBtn.addEventListener('click', () => {
        const code = (src.value && src.value.trim()) ? src.value : buildMermaidWithOptions({ scope: getScope(), seeds: getSelectedSeeds(), showLabels: isLabelOn() });
        const w = window.open('', '_blank');
        if(!w) return;
        const html = `<!doctype html>
<html lang="ja"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Mermaid Preview</title>
<style>html,body{height:100%;margin:0;background:#111;color:#eee;} .wrap{min-height:100%;padding:12px;} .wrap .src{width:100%;height:120px;}
.view{background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:8px;overflow:auto;max-height:calc(100vh - 220px);} .bar{display:flex;gap:8px;margin:8px 0;}
button{padding:6px 10px;border-radius:8px;border:1px solid #444;background:#222;color:#eee;cursor:pointer;}
</style>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
</head><body><div class="wrap">
<h3>Mermaid Preview</h3>
<div class="bar"><button id="btn-render">描画</button><button id="btn-copy">ソースをコピー</button></div>
<textarea class="src" id="mmd-src"></textarea>
<div class="view" id="mmd-view"></div>
<script>mermaid.initialize({ startOnLoad:false });
const src = document.getElementById('mmd-src'); const view = document.getElementById('mmd-view'); src.value = ${JSON.stringify(code)};
async function render(){ try{ const out = await mermaid.render('mmd-'+Date.now(), src.value); view.innerHTML = out.svg || ''; }catch(e){ console.error(e); view.textContent='Mermaidの描画に失敗しました'; } }
document.getElementById('btn-render').onclick = render; document.getElementById('btn-copy').onclick = ()=>{ src.select(); document.execCommand('copy'); };
render();</script>
</div></body></html>`;
        w.document.open(); w.document.write(html); w.document.close();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('mermaid-panel')) bind();
  });

  // export for tests if needed
  window.MermaidPreview = { buildMermaid: (spec)=>buildMermaidWithOptions({}), buildMermaidWithOptions };
})();
