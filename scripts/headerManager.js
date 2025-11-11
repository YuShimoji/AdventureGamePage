(function () {
  // Header Manager - Unified header component across all pages

  const PAGES = [
    { id: 'index', label: 'ホーム', path: 'index.html', icon: 'home' },
    { id: 'learn', label: '学ぶ', path: 'learn.html', icon: 'book-open' },
    { id: 'admin', label: '管理', path: 'admin.html', icon: 'edit' },
    { id: 'play', label: 'プレイ', path: 'play.html', icon: 'play' }
  ];

  function getCurrentPage() {
    const path = window.location.pathname;
    if (path.endsWith('admin.html')) return 'admin';
    if (path.endsWith('play.html')) return 'play';
    if (path.endsWith('learn.html')) return 'learn';
    return 'index';
  }

  function createIcon(iconName, size = 20) {
    // Lucide アイコンのSVGを動的に生成
    // 実際のLucideライブラリが読み込まれている場合はそれを使用
    if (window.lucide && window.lucide.icons[iconName]) {
      const iconData = window.lucide.icons[iconName];
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', size);
      svg.setAttribute('height', size);
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '2');
      svg.setAttribute('stroke-linecap', 'round');
      svg.setAttribute('stroke-linejoin', 'round');
      svg.innerHTML = iconData[0];
      return svg;
    }
    
    // フォールバック: 絵文字
    const emojiMap = {
      'home': '🏠',
      'book-open': '📖',
      'edit': '✏️',
      'play': '▶️',
      'settings': '⚙️',
      'sun': '☀️',
      'moon': '🌙'
    };
    const span = document.createElement('span');
    span.textContent = emojiMap[iconName] || '•';
    span.style.display = 'inline-block';
    span.style.fontSize = `${size}px`;
    return span;
  }

  function renderHeader(pageId, customActions = []) {
    const header = document.createElement('header');
    header.className = 'app-header';

    // Left: Home link (except on index page)
    if (pageId !== 'index') {
      const homeLink = document.createElement('a');
      homeLink.href = 'index.html';
      homeLink.className = 'btn btn-ghost header-home-link';
      homeLink.setAttribute('aria-label', 'ホームに戻る');
      homeLink.appendChild(createIcon('home', 18));
      header.appendChild(homeLink);
    }

    // Center: Title
    const title = document.createElement('h1');
    title.className = 'header-title';
    const currentPage = PAGES.find(p => p.id === pageId);
    title.textContent = currentPage ? currentPage.label : 'Adventure Game Page';
    header.appendChild(title);

    // Right: Navigation + Actions
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'header-actions';

    // Navigation (only on index page)
    if (pageId === 'index') {
      const nav = document.createElement('nav');
      nav.className = 'header-nav';
      PAGES.filter(p => p.id !== 'index').forEach(page => {
        const link = document.createElement('a');
        link.href = page.path;
        link.className = 'btn btn-ghost';
        link.appendChild(createIcon(page.icon, 16));
        const label = document.createElement('span');
        label.textContent = page.label;
        link.appendChild(label);
        nav.appendChild(link);
      });
      actionsContainer.appendChild(nav);
    }

    // Custom actions (buttons, etc.)
    customActions.forEach(action => {
      actionsContainer.appendChild(action);
    });

    // Theme toggle (always present)
    const themeBtn = document.createElement('button');
    themeBtn.id = 'btn-theme';
    themeBtn.className = 'btn btn-ghost icon-btn';
    themeBtn.title = 'テーマ設定';
    themeBtn.setAttribute('aria-label', 'テーマ設定');
    themeBtn.appendChild(createIcon('settings', 18));
    actionsContainer.appendChild(themeBtn);

    header.appendChild(actionsContainer);

    return header;
  }

  // Public API
  window.HeaderManager = {
    render: renderHeader,
    getCurrentPage: getCurrentPage,
    createIcon: createIcon,
    pages: PAGES
  };
})();
