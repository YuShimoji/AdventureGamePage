(function () {
  'use strict';

  // UI Elements Test Suite
  describe('UI Elements', function() {

    it('should have theme panel element', function() {
      const panel = document.getElementById('theme-panel');
      assert(panel !== null, 'Theme panel should exist');
      assert(panel.hidden === true, 'Theme panel should be initially hidden');
    });

    it('should have theme button', function() {
      const btn = document.getElementById('btn-theme');
      assert(btn !== null, 'Theme button should exist');
      assert(btn.classList.contains('btn'), 'Should have btn class');
    });

    it('should have sidebar toggle button', function() {
      const btn = document.getElementById('btn-toggle-sidebar');
      assert(btn !== null, 'Sidebar toggle button should exist');
    });

    it('should have floating controls', function() {
      const controls = document.querySelector('.floating-controls');
      assert(controls !== null, 'Floating controls should exist');
    });

    it('should have compact view toggle button', function() {
      const btn = document.getElementById('btn-quick-zen');
      assert(btn !== null, 'Compact view toggle button should exist');
      assert(btn.textContent.includes('表示切替'), 'Button should have correct label');
    });

    it('should have editor container', function() {
      const editor = document.querySelector('.editor');
      assert(editor !== null, 'Editor should exist');
      assert(editor.contentEditable === 'true', 'Editor should be editable');
    });

  });

  console.log('UI Elements test suite loaded');
})();
