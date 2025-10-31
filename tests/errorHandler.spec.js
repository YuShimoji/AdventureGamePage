// Error Handler Tests
describe('ErrorHandler', function() {
  let originalStorage;

  beforeEach(function() {
    // Mock localStorage for testing
    originalStorage = window.localStorage;
    const mockStorage = {
      getItem: sinon.stub(),
      setItem: sinon.stub(),
      removeItem: sinon.stub(),
      clear: sinon.stub()
    };
    Object.defineProperty(window, 'localStorage', { value: mockStorage, writable: true });

    // Reset error handler state
    if (window.ErrorHandler) {
      // Reset any global state if needed
    }
  });

  afterEach(function() {
    // Restore original localStorage
    Object.defineProperty(window, 'localStorage', { value: originalStorage, writable: true });
  });

  describe('classifyError', function() {
    it('should classify storage quota errors', function() {
      const error = new Error('QuotaExceededError');
      const type = window.ErrorHandler.classifyError(error);
      expect(type).to.equal(window.ErrorHandler.ErrorType.STORAGE_FULL);
    });

    it('should classify security errors', function() {
      const error = new Error('SecurityError');
      const type = window.ErrorHandler.classifyError(error);
      expect(type).to.equal(window.ErrorHandler.ErrorType.STORAGE_UNAVAILABLE);
    });

    it('should classify network errors', function() {
      const error = new Error('Network error occurred');
      const type = window.ErrorHandler.classifyError(error);
      expect(type).to.equal(window.ErrorHandler.ErrorType.NETWORK_ERROR);
    });

    it('should classify unknown errors', function() {
      const error = new Error('Some unknown error');
      const type = window.ErrorHandler.classifyError(error);
      expect(type).to.equal(window.ErrorHandler.ErrorType.UNKNOWN);
    });
  });

  describe('getUserMessage', function() {
    it('should return appropriate message for storage full error', function() {
      const message = window.ErrorHandler.getUserMessage(window.ErrorHandler.ErrorType.STORAGE_FULL);
      expect(message.title).to.equal('ストレージ容量不足');
      expect(message.message).to.include('ブラウザのストレージ容量');
      expect(message.actions).to.deep.equal(['古いデータを削除', 'データをエクスポート', 'キャンセル']);
    });

    it('should return appropriate message for unknown error', function() {
      const message = window.ErrorHandler.getUserMessage(window.ErrorHandler.ErrorType.UNKNOWN);
      expect(message.title).to.equal('エラーが発生しました');
      expect(message.actions).to.deep.equal(['OK']);
    });
  });

  describe('withRetry', function() {
    it('should retry on failure and succeed', async function() {
      let attempts = 0;
      const operation = function() {
        attempts++;
        if (attempts < 2) {
          throw new Error('Temporary failure');
        }
        return Promise.resolve('success');
      };

      const result = await window.ErrorHandler.withRetry(operation, 3, 10);
      expect(result).to.equal('success');
      expect(attempts).to.equal(2);
    });

    it('should fail after max retries', async function() {
      const operation = function() {
        throw new Error('Persistent failure');
      };

      try {
        await window.ErrorHandler.withRetry(operation, 2, 10);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error.message).to.equal('Persistent failure');
      }
    });
  });
});
