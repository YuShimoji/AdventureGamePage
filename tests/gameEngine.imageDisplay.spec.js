/**
 * GameEngine 画像表示機能のテストスイート
 * Issue #37: 画像表示機能実装
 */

describe('GameEngine - Image Display', () => {
  let engine;
  let container;

  const testGameDataWithImages = {
    title: 'Image Display Test Game',
    start: 'start',
    nodes: {
      start: {
        text: 'Start node with no image',
        image: null,
        choices: [
          {
            text: 'Go to node with image',
            to: 'node_with_image'
          },
          {
            text: 'Go to node with invalid image',
            to: 'node_invalid_image'
          }
        ]
      },
      node_with_image: {
        text: 'Node with valid image',
        image: 'https://via.placeholder.com/600x400',
        choices: [
          {
            text: 'Go to another image node',
            to: 'node_another_image'
          },
          {
            text: 'Back to start',
            to: 'start'
          }
        ]
      },
      node_another_image: {
        text: 'Node with another image',
        image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="blue" width="100" height="100"/%3E%3C/svg%3E',
        choices: []
      },
      node_invalid_image: {
        text: 'Node with invalid image URL',
        image: 'invalid-url-format',
        choices: []
      }
    }
  };

  beforeEach(() => {
    container = document.createElement('div');
    container.innerHTML = `
      <div id="game-title"></div>
      <div id="scene-image" hidden></div>
      <div id="text"></div>
      <div id="choices"></div>
    `;
    document.body.appendChild(container);

    const elements = {
      titleEl: container.querySelector('#game-title'),
      imageEl: container.querySelector('#scene-image'),
      textEl: container.querySelector('#text'),
      choicesEl: container.querySelector('#choices')
    };

    engine = window.GameEngine.createEngine(testGameDataWithImages, elements);
  });

  afterEach(() => {
    document.body.removeChild(container);
    localStorage.clear();
  });

  describe('Image Rendering', () => {
    it('should hide image element when no image is provided', () => {
      const imageEl = container.querySelector('#scene-image');
      expect(imageEl.hidden).to.be.true;
    });

    it('should show image element when valid image URL is provided', (done) => {
      const imageEl = container.querySelector('#scene-image');
      
      // Move to node with image
      engine.setNode('node_with_image');

      // Wait for image load
      setTimeout(() => {
        expect(imageEl.hidden).to.be.false;
        const img = imageEl.querySelector('img');
        expect(img).to.exist;
        expect(img.src).to.include('placeholder.com');
        done();
      }, 100);
    });

    it('should create img element with correct attributes', (done) => {
      engine.setNode('node_with_image');

      setTimeout(() => {
        const img = container.querySelector('.scene-image__img');
        expect(img).to.exist;
        expect(img.tagName).to.equal('IMG');
        expect(img.className).to.equal('scene-image__img');
        expect(img.alt).to.equal('Scene image');
        done();
      }, 100);
    });

    it('should handle data URLs', (done) => {
      engine.setNode('node_another_image');

      setTimeout(() => {
        const imageEl = container.querySelector('#scene-image');
        expect(imageEl.hidden).to.be.false;
        const img = imageEl.querySelector('img');
        expect(img).to.exist;
        expect(img.src).to.include('data:image/svg+xml');
        done();
      }, 100);
    });

    it('should clear previous image when transitioning to node without image', (done) => {
      // First, show an image
      engine.setNode('node_with_image');

      setTimeout(() => {
        const imageEl = container.querySelector('#scene-image');
        expect(imageEl.hidden).to.be.false;

        // Then transition to node without image
        engine.setNode('start');

        setTimeout(() => {
          expect(imageEl.hidden).to.be.true;
          expect(imageEl.innerHTML).to.equal('');
          done();
        }, 50);
      }, 100);
    });
  });

  describe('Image URL Validation', () => {
    it('should reject invalid URL formats', () => {
      engine.setNode('node_invalid_image');

      const imageEl = container.querySelector('#scene-image');
      expect(imageEl.hidden).to.be.true;
    });

    it('should accept http:// URLs', (done) => {
      const game = {
        title: 'Test',
        start: 'start',
        nodes: {
          start: {
            text: 'Test',
            image: 'http://example.com/image.jpg',
            choices: []
          }
        }
      };

      const newEngine = window.GameEngine.createEngine(game, {
        titleEl: container.querySelector('#game-title'),
        imageEl: container.querySelector('#scene-image'),
        textEl: container.querySelector('#text'),
        choicesEl: container.querySelector('#choices')
      });

      setTimeout(() => {
        const img = container.querySelector('.scene-image__img');
        expect(img).to.exist;
        done();
      }, 100);
    });

    it('should accept https:// URLs', (done) => {
      engine.setNode('node_with_image');

      setTimeout(() => {
        const img = container.querySelector('.scene-image__img');
        expect(img).to.exist;
        expect(img.src).to.include('https://');
        done();
      }, 100);
    });

    it('should accept relative URLs', (done) => {
      const game = {
        title: 'Test',
        start: 'start',
        nodes: {
          start: {
            text: 'Test',
            image: './images/test.jpg',
            choices: []
          }
        }
      };

      const newEngine = window.GameEngine.createEngine(game, {
        titleEl: container.querySelector('#game-title'),
        imageEl: container.querySelector('#scene-image'),
        textEl: container.querySelector('#text'),
        choicesEl: container.querySelector('#choices')
      });

      setTimeout(() => {
        const img = container.querySelector('.scene-image__img');
        expect(img).to.exist;
        done();
      }, 100);
    });

    it('should accept absolute URLs', (done) => {
      const game = {
        title: 'Test',
        start: 'start',
        nodes: {
          start: {
            text: 'Test',
            image: '/images/test.jpg',
            choices: []
          }
        }
      };

      const newEngine = window.GameEngine.createEngine(game, {
        titleEl: container.querySelector('#game-title'),
        imageEl: container.querySelector('#scene-image'),
        textEl: container.querySelector('#text'),
        choicesEl: container.querySelector('#choices')
      });

      setTimeout(() => {
        const img = container.querySelector('.scene-image__img');
        expect(img).to.exist;
        done();
      }, 100);
    });
  });

  describe('Error Handling', () => {
    it('should hide image on load error', (done) => {
      const game = {
        title: 'Test',
        start: 'start',
        nodes: {
          start: {
            text: 'Test',
            image: 'https://invalid-domain-that-does-not-exist-12345.com/image.jpg',
            choices: []
          }
        }
      };

      const imageEl = container.querySelector('#scene-image');
      const newEngine = window.GameEngine.createEngine(game, {
        titleEl: container.querySelector('#game-title'),
        imageEl: imageEl,
        textEl: container.querySelector('#text'),
        choicesEl: container.querySelector('#choices')
      });

      // Wait for error event
      setTimeout(() => {
        expect(imageEl.hidden).to.be.true;
        expect(imageEl.innerHTML).to.equal('');
        done();
      }, 1000);
    });

    it('should log warning for invalid URLs', () => {
      const warnings = [];
      const originalWarn = console.warn;
      console.warn = function(...args) {
        warnings.push(args.join(' '));
        originalWarn.apply(console, args);
      };

      engine.setNode('node_invalid_image');

      console.warn = originalWarn;

      const imageWarnings = warnings.filter(w => w.includes('[ImageDisplay]'));
      expect(imageWarnings.length).to.be.at.least(1);
    });
  });

  describe('Integration with Game Flow', () => {
    it('should update image when navigating between nodes', (done) => {
      // Start at node without image
      const imageEl = container.querySelector('#scene-image');
      expect(imageEl.hidden).to.be.true;

      // Move to node with image
      engine.setNode('node_with_image');

      setTimeout(() => {
        expect(imageEl.hidden).to.be.false;
        
        // Move to another node with different image
        engine.setNode('node_another_image');

        setTimeout(() => {
          expect(imageEl.hidden).to.be.false;
          const img = imageEl.querySelector('img');
          expect(img.src).to.include('data:image/svg');
          done();
        }, 100);
      }, 100);
    });

    it('should preserve image state across save/load', (done) => {
      // Move to node with image
      engine.setNode('node_with_image');

      setTimeout(() => {
        // Save game
        engine.saveGame();

        // Create new engine
        const newEngine = window.GameEngine.createEngine(testGameDataWithImages, {
          titleEl: container.querySelector('#game-title'),
          imageEl: container.querySelector('#scene-image'),
          textEl: container.querySelector('#text'),
          choicesEl: container.querySelector('#choices')
        });

        // Load progress
        newEngine.loadProgress();

        setTimeout(() => {
          const imageEl = container.querySelector('#scene-image');
          expect(imageEl.hidden).to.be.false;
          done();
        }, 100);
      }, 100);
    });
  });

  describe('Responsive Behavior', () => {
    it('should apply correct CSS class to image', (done) => {
      engine.setNode('node_with_image');

      setTimeout(() => {
        const img = container.querySelector('.scene-image__img');
        expect(img).to.exist;
        expect(img.classList.contains('scene-image__img')).to.be.true;
        done();
      }, 100);
    });
  });
});
