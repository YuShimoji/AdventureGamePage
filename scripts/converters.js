(function(){
  function normalizeSpecToEngine(data){
    if(!data) return null;
    if(Array.isArray(data.nodes)){
      const nodes = {};
      data.nodes.forEach(n => {
        if(!n || !n.id) return;
        nodes[n.id] = {
          title: n.title || '',
          text: n.text || '',
          choices: Array.isArray(n.choices) ? n.choices.map(c => ({ text: c.label ?? c.text ?? '', to: c.target ?? c.to ?? '' })) : []
        };
      });
      return {
        title: data?.meta?.title || data.title || 'Adventure',
        start: data?.meta?.start || data.start || 'start',
        nodes
      };
    }
    return data;
  }

  function engineToSpec(engine){
    if(!engine || !engine.nodes) return null;
    const nodes = Object.entries(engine.nodes).map(([id, n]) => ({ id, title: n.title || '', text: n.text || '', choices: (n.choices||[]).map(c => ({ id: '', label: c.text || '', target: c.to || '' })) }));
    return {
      version: '1.0',
      meta: {
        title: engine.title || 'Adventure',
        author: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        start: engine.start || 'start'
      },
      nodes
    };
  }

  window.Converters = { normalizeSpecToEngine, engineToSpec };
})();
