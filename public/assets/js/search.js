(function () {
  function applyCardFilter(cards, activeFilter, query, forcedModule) {
    let visible = 0;

    cards.forEach((card) => {
      const moduleMatch = forcedModule === 'all' || !forcedModule || card.dataset.module === forcedModule;
      const activityMatch =
        activeFilter === 'all' ||
        activeFilter === 'sys' ||
        activeFilter === 'lld'
          ? card.dataset.module === activeFilter
          : card.dataset.types.includes(activeFilter);
      const matchSearch = !query || card.dataset.search.includes(query);

      if (moduleMatch && activityMatch && matchSearch) {
        card.classList.remove('hidden');
        visible += 1;
      } else {
        card.classList.add('hidden');
      }
    });

    return visible;
  }

  window.SearchUtils = {
    applyCardFilter
  };
})();
