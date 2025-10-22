// Migration Wizard Tests
describe('MigrationWizard', function() {
  let originalStorage;
  let mockLegacyData;

  beforeEach(function() {
    // Mock localStorage
    originalStorage = window.localStorage;
    mockLegacyData = {
      text: 'This is legacy content with a sword and a character named Hero.',
      html: '<p>This is legacy content with a sword and a character named Hero.</p>',
      history: ['start', 'scene1']
    };

    const mockStorage = {
      getItem: sinon.stub().withArgs('agp_manuscript_full').returns(JSON.stringify(mockLegacyData)),
      setItem: sinon.spy(),
      removeItem: sinon.spy()
    };
    Object.defineProperty(window, 'localStorage', { value: mockStorage, writable: true });
  });

  afterEach(function() {
    Object.defineProperty(window, 'localStorage', { value: originalStorage, writable: true });
  });

  describe('showMigrationWizard', function() {
    it('should not show wizard when no legacy data exists', function() {
      localStorage.getItem.withArgs('agp_manuscript_full').returns(null);

      // This function modifies DOM, so we need to mock document methods
      const originalCreateElement = document.createElement;
      document.createElement = sinon.spy();

      // Call function
      showMigrationWizard();

      // Should not create elements if no legacy data
      expect(document.createElement.notCalled).to.be.true;

      document.createElement = originalCreateElement;
    });

    it('should not show wizard when migration already done', function() {
      localStorage.getItem.withArgs('agp_items').returns('{"items": []}');

      const originalCreateElement = document.createElement;
      document.createElement = sinon.spy();

      showMigrationWizard();

      expect(document.createElement.notCalled).to.be.true;

      document.createElement = originalCreateElement;
    });
  });

  describe('previewMigration', function() {
    it('should extract items from legacy text', function() {
      const details = document.createElement('div');
      details.id = 'migration-details';
      document.body.appendChild(details);

      previewMigration();

      expect(details.innerHTML).to.include('アイテム');
      expect(details.innerHTML).to.include('キャラクター');

      document.body.removeChild(details);
    });
  });

  describe('createBackup', function() {
    it('should create backup of legacy data', function() {
      const result = createBackup();
      expect(result).to.be.true;
      expect(localStorage.setItem.calledWith('agp_backup_legacy')).to.be.true;
    });

    it('should return false when no legacy data', function() {
      localStorage.getItem.withArgs('agp_manuscript_full').returns(null);
      const result = createBackup();
      expect(result).to.be.false;
    });
  });

  describe('restoreFromBackup', function() {
    it('should restore from backup', function() {
      // First create backup
      createBackup();

      // Mock backup data
      const backupData = JSON.stringify({
        data: JSON.stringify(mockLegacyData),
        timestamp: new Date().toISOString(),
        version: '1.0'
      });
      localStorage.getItem.withArgs('agp_backup_legacy').returns(backupData);

      const result = restoreFromBackup();
      expect(result).to.be.true;
      expect(localStorage.setItem.calledWith('agp_manuscript_full')).to.be.true;
    });
  });

  describe('performMigrationWithProgress', function() {
    it('should migrate legacy data successfully', async function() {
      const result = await performMigrationWithProgress();

      expect(result.success).to.be.true;
      expect(result.stats).to.have.property('items');
      expect(result.stats).to.have.property('characters');
      expect(result.stats).to.have.property('lore');
      expect(result.error).to.be.null;
    });

    it('should handle migration errors', async function() {
      // Force an error by making localStorage.setItem throw
      localStorage.setItem.restore();
      localStorage.setItem = sinon.stub().throws(new Error('Storage full'));

      const result = await performMigrationWithProgress();

      expect(result.success).to.be.false;
      expect(result.error).to.include('Storage full');
    });
  });
});
