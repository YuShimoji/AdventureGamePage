(function(){
  'use strict';

  // Common header HTML generator
  window.HeaderUtils = {
    // Generate common head elements
    generateHead: function(title, extraLinks = []) {
      const head = document.head;

      // Meta tags
      const metaCharset = document.createElement('meta');
      metaCharset.setAttribute('charset', 'utf-8');
      head.appendChild(metaCharset);

      const metaViewport = document.createElement('meta');
      metaViewport.setAttribute('name', 'viewport');
      metaViewport.setAttribute('content', 'width=device-width, initial-scale=1');
      head.appendChild(metaViewport);

      // Title
      document.title = title;

      // Icon
      const linkIcon = document.createElement('link');
      linkIcon.setAttribute('rel', 'icon');
      linkIcon.setAttribute('type', 'image/x-icon');
      linkIcon.setAttribute('href', 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ctext y=\'.9em\' font-size=\'90\'%3E📚%3C/text%3E%3C/svg%3E');
      head.appendChild(linkIcon);

      // Common CSS
      const linkCommon = document.createElement('link');
      linkCommon.setAttribute('rel', 'stylesheet');
      linkCommon.setAttribute('href', 'styles/common.css?v=4');
      head.appendChild(linkCommon);

      // Extra links (page-specific CSS, etc.)
      extraLinks.forEach(link => {
        const linkEl = document.createElement('link');
        linkEl.setAttribute('rel', link.rel);
        linkEl.setAttribute('href', link.href);
        if (link.type) linkEl.setAttribute('type', link.type);
        head.appendChild(linkEl);
      });
    },

    // Generate common header
    generateHeader: function(title, navItems = [], actions = []) {
      const header = document.createElement('header');
      header.className = 'app-header';

      if (navItems.length > 0) {
        const nav = document.createElement('nav');
        nav.className = 'nav';
        navItems.forEach(item => {
          const a = document.createElement('a');
          a.className = item.class || 'btn';
          a.href = item.href;
          a.textContent = item.text;
          nav.appendChild(a);
        });
        header.appendChild(nav);
      }

      const h1 = document.createElement('h1');
      if (title) {
        h1.textContent = title;
        header.appendChild(h1);
      }

      if (actions.length > 0) {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'header-actions';
        actions.forEach(action => {
          if (action.type === 'link') {
            const a = document.createElement('a');
            a.className = action.class || 'btn';
            a.href = action.href;
            a.textContent = action.text;
            actionsDiv.appendChild(a);
          } else if (action.type === 'icon-button') {
            const btn = document.createElement('button');
            btn.id = action.id;
            btn.className = action.class || 'btn';
            btn.title = action.title;
            btn.setAttribute('aria-label', action.title);
            // Add icon if specified
            if (action.icon) {
              const emojiMap = {
                'home': '🏠',
                'book-open': '📖',
                'edit': '✏️',
                'play': '▶️',
                'settings': '🎨',
                'sidebar': '☰',
                'sun': '☀️',
                'moon': '🌙'
              };
              const span = document.createElement('span');
              span.textContent = emojiMap[action.icon] || '•';
              span.style.display = 'inline-block';
              span.style.fontSize = action.iconSize || '18px';
              btn.appendChild(span);
            }
            actionsDiv.appendChild(btn);
          } else if (action.type === 'span') {
            const span = document.createElement('span');
            span.id = action.id;
            span.className = action.class || '';
            span.textContent = action.text;
            actionsDiv.appendChild(span);
          }
        });
        header.appendChild(actionsDiv);
      }

      return header;
    }
  };
})();
