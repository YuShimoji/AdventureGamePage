(function () {
  function filterItems(items, type) {
    if (!Array.isArray(items)) return [];
    if (!type || type === "all") return items.slice();
    return items.filter((i) => (i.type || "").toLowerCase() === type);
  }

  function searchItems(items, query) {
    if (!Array.isArray(items)) return [];
    if (!query || query.trim() === "") return items.slice();

    const q = query.toLowerCase().trim();
    return items.filter((item) => {
      const title = (item.title || "").toLowerCase();
      const textPreview = (item.textPreview || item.excerpt || "").toLowerCase();
      const label = (item.meta?.label || "").toLowerCase();
      const kind = (item.kind || item.type || "").toLowerCase();

      return title.includes(q) || textPreview.includes(q) || label.includes(q) || kind.includes(q);
    });
  }

  function filterByTag(items, tag) {
    if (!Array.isArray(items)) return [];
    if (!tag || tag === "all") return items.slice();

    return items.filter((item) => {
      if ((item.kind || item.type) !== "snapshot") return true; // only filter snapshots
      const itemTags = item.meta?.tags || [];
      return Array.isArray(itemTags) && itemTags.includes(tag);
    });
  }

  function sortItems(items, key) {
    const arr = items.slice();
    switch (key) {
      case "date_asc":
        return arr.sort((a, b) => {
          const ad = a.savedAt ? new Date(a.savedAt).getTime() : 0;
          const bd = b.savedAt ? new Date(b.savedAt).getTime() : 0;
          return ad - bd;
        });
      case "size_desc":
        return arr.sort((a, b) => (b.size || 0) - (a.size || 0));
      case "size_asc":
        return arr.sort((a, b) => (a.size || 0) - (b.size || 0));
      case "title_asc":
        return arr.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      case "title_desc":
        return arr.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
      case "date_desc":
      default:
        return arr.sort((a, b) => {
          const ad = a.savedAt ? new Date(a.savedAt).getTime() : 0;
          const bd = b.savedAt ? new Date(b.savedAt).getTime() : 0;
          return bd - ad;
        });
    }
  }

  function filterByDateRange(items, dateFrom, dateTo) {
    if (!Array.isArray(items)) return [];
    if (!dateFrom && !dateTo) return items.slice();

    return items.filter((item) => {
      const itemDate = item.savedAt ? new Date(item.savedAt) : null;
      if (!itemDate) return false;

      const from = dateFrom ? new Date(dateFrom) : null;
      const to = dateTo ? new Date(dateTo) : null;

      if (from && itemDate < from) return false;
      if (to) {
        // Set to end of day for 'to' date
        const toEndOfDay = new Date(to);
        toEndOfDay.setHours(23, 59, 59, 999);
        if (itemDate > toEndOfDay) return false;
      }

      return true;
    });
  }

  function readControls() {
    const typeSel = document.getElementById("preview-filter-type");
    const sortSel = document.getElementById("preview-sort");
    const searchInput = document.getElementById("preview-search");
    const tagSel = document.getElementById("preview-filter-tag");
    const dateFromInput = document.getElementById("preview-date-from");
    const dateToInput = document.getElementById("preview-date-to");

    return {
      type: typeSel?.value || "all",
      sort: sortSel?.value || "date_desc",
      search: searchInput?.value || "",
      tag: tagSel?.value || "all",
      dateFrom: dateFromInput?.value || "",
      dateTo: dateToInput?.value || "",
    };
  }

  window.PreviewUtils = {
    filterItems,
    searchItems,
    filterByTag,
    filterByDateRange,
    sortItems,
    readControls,
  };
})();
