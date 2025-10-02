(function(){
  function filterItems(items, type){
    if(!Array.isArray(items)) return [];
    if(!type || type==='all') return items.slice();
    return items.filter(i => (i.type||'').toLowerCase() === type);
  }
  function sortItems(items, key){
    const arr = items.slice();
    switch(key){
      case 'date_asc':
        return arr.sort((a,b)=>{
          const ad = a.savedAt ? new Date(a.savedAt).getTime() : 0;
          const bd = b.savedAt ? new Date(b.savedAt).getTime() : 0;
          return ad - bd;
        });
      case 'size_desc':
        return arr.sort((a,b)=> (b.size||0) - (a.size||0));
      case 'size_asc':
        return arr.sort((a,b)=> (a.size||0) - (b.size||0));
      case 'date_desc':
      default:
        return arr.sort((a,b)=>{
          const ad = a.savedAt ? new Date(a.savedAt).getTime() : 0;
          const bd = b.savedAt ? new Date(b.savedAt).getTime() : 0;
          return bd - ad;
        });
    }
  }
  function readControls(){
    const typeSel = document.getElementById('preview-filter-type');
    const sortSel = document.getElementById('preview-sort');
    return { type: typeSel?.value || 'all', sort: sortSel?.value || 'date_desc' };
  }
  window.PreviewUtils = { filterItems, sortItems, readControls };
})();
