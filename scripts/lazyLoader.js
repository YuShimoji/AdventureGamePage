// Lazy loading utilities for performance optimization
(function () {
  const loadedScripts = new Set();

  // Lazy load a script
  function lazyLoadScript(src) {
    return new Promise((resolve, reject) => {
      if (loadedScripts.has(src)) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.onload = () => {
        loadedScripts.add(src);
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Lazy load multiple scripts
  async function lazyLoadScripts(sources) {
    const promises = sources.map((src) => lazyLoadScript(src));
    await Promise.all(promises);
  }

  // Intersection Observer for viewport-based loading
  function createLazyLoader(callback, options = {}) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: options.rootMargin || "50px" }
    );

    return {
      observe: (element) => observer.observe(element),
      disconnect: () => observer.disconnect(),
    };
  }

  // Cache utilities
  const cache = new Map();
  function getCached(key) {
    return cache.get(key);
  }
  function setCached(key, value) {
    cache.set(key, value);
  }

  // Expose API
  window.LazyLoader = {
    loadScript: lazyLoadScript,
    loadScripts: lazyLoadScripts,
    createLazyLoader,
    getCached,
    setCached,
  };
})();
