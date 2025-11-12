/**
 * SecurityUtils のテストスイート
 * Issue #46: セキュリティ強化（XSS対策・データ検証厳格化）
 */

describe('SecurityUtils', () => {
  describe('escapeHTML', () => {
    it('should escape HTML special characters', () => {
      const input = '<script>alert("XSS")</script>';
      const expected = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;';
      expect(SecurityUtils.escapeHTML(input)).to.equal(expected);
    });

    it('should escape ampersands', () => {
      expect(SecurityUtils.escapeHTML('A & B')).to.equal('A &amp; B');
    });

    it('should escape quotes', () => {
      expect(SecurityUtils.escapeHTML('She said "Hello"')).to.equal('She said &quot;Hello&quot;');
      expect(SecurityUtils.escapeHTML("It's fine")).to.equal('It&#x27;s fine');
    });

    it('should handle empty strings', () => {
      expect(SecurityUtils.escapeHTML('')).to.equal('');
    });

    it('should handle non-string inputs', () => {
      expect(SecurityUtils.escapeHTML(null)).to.equal('');
      expect(SecurityUtils.escapeHTML(undefined)).to.equal('');
      expect(SecurityUtils.escapeHTML(123)).to.equal('');
    });

    it('should not modify safe text', () => {
      const safeText = 'This is safe text with no special chars';
      expect(SecurityUtils.escapeHTML(safeText)).to.equal(safeText);
    });
  });

  describe('sanitizeText', () => {
    it('should remove HTML tags', () => {
      const input = '<div>Hello <strong>World</strong></div>';
      const output = SecurityUtils.sanitizeText(input);
      expect(output).to.not.include('<div>');
      expect(output).to.not.include('<strong>');
    });

    it('should escape remaining special characters', () => {
      const input = 'A & B';
      expect(SecurityUtils.sanitizeText(input)).to.equal('A &amp; B');
    });

    it('should respect maxLength option', () => {
      const longText = 'a'.repeat(200);
      const result = SecurityUtils.sanitizeText(longText, { maxLength: 100 });
      expect(result.length).to.equal(100);
    });

    it('should allow newlines by default', () => {
      const input = 'Line 1\nLine 2';
      const result = SecurityUtils.sanitizeText(input);
      expect(result).to.include('\n');
    });

    it('should remove newlines when allowNewlines=false', () => {
      const input = 'Line 1\nLine 2';
      const result = SecurityUtils.sanitizeText(input, { allowNewlines: false });
      expect(result).to.not.include('\n');
    });

    it('should trim whitespace by default', () => {
      const input = '  Hello World  ';
      expect(SecurityUtils.sanitizeText(input)).to.equal('Hello World');
    });

    it('should handle non-string inputs', () => {
      expect(SecurityUtils.sanitizeText(null)).to.equal('');
      expect(SecurityUtils.sanitizeText(123)).to.equal('');
    });
  });

  describe('validateURL', () => {
    it('should accept valid HTTPS URLs', () => {
      expect(SecurityUtils.validateURL('https://example.com/image.jpg')).to.be.true;
    });

    it('should accept valid HTTP URLs by default', () => {
      expect(SecurityUtils.validateURL('http://example.com/image.jpg')).to.be.true;
    });

    it('should reject HTTP when allowHttp=false', () => {
      expect(SecurityUtils.validateURL('http://example.com/', { allowHttp: false })).to.be.false;
    });

    it('should accept relative URLs', () => {
      expect(SecurityUtils.validateURL('./images/test.jpg')).to.be.true;
      expect(SecurityUtils.validateURL('../images/test.jpg')).to.be.true;
      expect(SecurityUtils.validateURL('/images/test.jpg')).to.be.true;
    });

    it('should reject relative URLs when allowRelative=false', () => {
      expect(SecurityUtils.validateURL('./test.jpg', { allowRelative: false })).to.be.false;
    });

    it('should accept valid data URLs', () => {
      const dataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      expect(SecurityUtils.validateURL(dataURL)).to.be.true;
    });

    it('should reject invalid data URLs', () => {
      expect(SecurityUtils.validateURL('data:text/html,<script>alert(1)</script>')).to.be.false;
    });

    it('should reject javascript: URLs', () => {
      expect(SecurityUtils.validateURL('javascript:alert(1)')).to.be.false;
    });

    it('should respect domain whitelist', () => {
      const options = { allowedDomains: ['example.com', 'trusted.org'] };
      expect(SecurityUtils.validateURL('https://example.com/test', options)).to.be.true;
      expect(SecurityUtils.validateURL('https://www.example.com/test', options)).to.be.true;
      expect(SecurityUtils.validateURL('https://evil.com/test', options)).to.be.false;
    });

    it('should reject empty or invalid strings', () => {
      expect(SecurityUtils.validateURL('')).to.be.false;
      expect(SecurityUtils.validateURL('not a url')).to.be.false;
      expect(SecurityUtils.validateURL(null)).to.be.false;
    });
  });

  describe('safeJSONParse', () => {
    it('should parse valid JSON', () => {
      const json = '{"key": "value"}';
      const result = SecurityUtils.safeJSONParse(json);
      expect(result).to.deep.equal({ key: 'value' });
    });

    it('should return default value on invalid JSON', () => {
      const result = SecurityUtils.safeJSONParse('invalid json', { default: true });
      expect(result).to.deep.equal({ default: true });
    });

    it('should remove __proto__ from parsed objects', () => {
      const json = '{"__proto__": {"admin": true}, "key": "value"}';
      const result = SecurityUtils.safeJSONParse(json);
      expect(result.__proto__).to.be.undefined;
      expect(result.key).to.equal('value');
    });

    it('should handle non-string inputs', () => {
      expect(SecurityUtils.safeJSONParse(null, 'default')).to.equal('default');
      expect(SecurityUtils.safeJSONParse(123, 'default')).to.equal('default');
    });
  });

  describe('isSafeObjectKey', () => {
    it('should accept safe keys', () => {
      expect(SecurityUtils.isSafeObjectKey('name')).to.be.true;
      expect(SecurityUtils.isSafeObjectKey('user_id')).to.be.true;
      expect(SecurityUtils.isSafeObjectKey('score')).to.be.true;
    });

    it('should reject dangerous keys', () => {
      expect(SecurityUtils.isSafeObjectKey('__proto__')).to.be.false;
      expect(SecurityUtils.isSafeObjectKey('constructor')).to.be.false;
      expect(SecurityUtils.isSafeObjectKey('prototype')).to.be.false;
    });

    it('should reject non-string keys', () => {
      expect(SecurityUtils.isSafeObjectKey(null)).to.be.false;
      expect(SecurityUtils.isSafeObjectKey(123)).to.be.false;
    });
  });

  describe('validateVariableName', () => {
    it('should accept valid variable names', () => {
      expect(SecurityUtils.validateVariableName('score')).to.be.true;
      expect(SecurityUtils.validateVariableName('player_name')).to.be.true;
      expect(SecurityUtils.validateVariableName('level-1')).to.be.true;
      expect(SecurityUtils.validateVariableName('HP123')).to.be.true;
    });

    it('should reject invalid variable names', () => {
      expect(SecurityUtils.validateVariableName('')).to.be.false;
      expect(SecurityUtils.validateVariableName('var name')).to.be.false; // space
      expect(SecurityUtils.validateVariableName('var@name')).to.be.false; // special char
      expect(SecurityUtils.validateVariableName('var.name')).to.be.false; // dot
    });

    it('should reject too long names', () => {
      const longName = 'a'.repeat(101);
      expect(SecurityUtils.validateVariableName(longName)).to.be.false;
    });

    it('should reject non-string names', () => {
      expect(SecurityUtils.validateVariableName(null)).to.be.false;
      expect(SecurityUtils.validateVariableName(123)).to.be.false;
    });
  });

  describe('validateVariableValue', () => {
    it('should accept valid values', () => {
      expect(SecurityUtils.validateVariableValue('string')).to.be.true;
      expect(SecurityUtils.validateVariableValue(123)).to.be.true;
      expect(SecurityUtils.validateVariableValue(true)).to.be.true;
      expect(SecurityUtils.validateVariableValue(false)).to.be.true;
    });

    it('should reject disallowed types', () => {
      expect(SecurityUtils.validateVariableValue({ obj: true }, { allowedTypes: ['string', 'number'] })).to.be.false;
      expect(SecurityUtils.validateVariableValue([1, 2, 3], { allowedTypes: ['string', 'number'] })).to.be.false;
    });

    it('should respect maxStringLength', () => {
      const longString = 'a'.repeat(100);
      expect(SecurityUtils.validateVariableValue(longString, { maxStringLength: 50 })).to.be.false;
      expect(SecurityUtils.validateVariableValue(longString, { maxStringLength: 200 })).to.be.true;
    });

    it('should reject infinite numbers', () => {
      expect(SecurityUtils.validateVariableValue(Infinity)).to.be.false;
      expect(SecurityUtils.validateVariableValue(-Infinity)).to.be.false;
      expect(SecurityUtils.validateVariableValue(NaN)).to.be.false;
    });

    it('should respect number range', () => {
      expect(SecurityUtils.validateVariableValue(50, { minNumber: 0, maxNumber: 100 })).to.be.true;
      expect(SecurityUtils.validateVariableValue(150, { minNumber: 0, maxNumber: 100 })).to.be.false;
      expect(SecurityUtils.validateVariableValue(-10, { minNumber: 0, maxNumber: 100 })).to.be.false;
    });
  });

  describe('validateSaveData', () => {
    it('should accept valid save data', () => {
      const saveData = {
        nodeId: 'start',
        playerState: {
          variables: { score: 100 },
          inventory: []
        }
      };
      const result = SecurityUtils.validateSaveData(saveData);
      expect(result.valid).to.be.true;
      expect(result.errors).to.be.empty;
    });

    it('should reject non-object save data', () => {
      const result = SecurityUtils.validateSaveData(null);
      expect(result.valid).to.be.false;
      expect(result.errors.length).to.be.at.least(1);
    });

    it('should require nodeId to be a string', () => {
      const saveData = { nodeId: 123 };
      const result = SecurityUtils.validateSaveData(saveData);
      expect(result.valid).to.be.false;
      expect(result.errors.some(e => e.includes('nodeId'))).to.be.true;
    });

    it('should reject unsafe variable keys', () => {
      const saveData = {
        nodeId: 'start',
        playerState: {
          variables: { '__proto__': 'evil' }
        }
      };
      const result = SecurityUtils.validateSaveData(saveData);
      expect(result.valid).to.be.false;
      expect(result.errors.some(e => e.includes('Unsafe variable key'))).to.be.true;
    });

    it('should reject invalid variable values', () => {
      const saveData = {
        nodeId: 'start',
        playerState: {
          variables: { 
            score: 100,
            invalidValue: { nested: 'object' }
          }
        }
      };
      const result = SecurityUtils.validateSaveData(saveData);
      expect(result.valid).to.be.false;
      expect(result.errors.some(e => e.includes('Invalid variable value'))).to.be.true;
    });

    it('should reject oversized inventory', () => {
      const saveData = {
        nodeId: 'start',
        playerState: {
          inventory: new Array(1001).fill({ id: 'item' })
        }
      };
      const result = SecurityUtils.validateSaveData(saveData);
      expect(result.valid).to.be.false;
      expect(result.errors.some(e => e.includes('inventory exceeds'))).to.be.true;
    });

    it('should require inventory to be an array', () => {
      const saveData = {
        nodeId: 'start',
        playerState: {
          inventory: 'not an array'
        }
      };
      const result = SecurityUtils.validateSaveData(saveData);
      expect(result.valid).to.be.false;
      expect(result.errors.some(e => e.includes('inventory must be an array'))).to.be.true;
    });
  });

  describe('XSS Attack Prevention', () => {
    it('should prevent script injection via escapeHTML', () => {
      const attacks = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        '<svg onload=alert("XSS")>',
        'javascript:alert("XSS")',
        '<iframe src="javascript:alert(1)"></iframe>'
      ];

      attacks.forEach(attack => {
        const escaped = SecurityUtils.escapeHTML(attack);
        expect(escaped).to.not.include('<script');
        expect(escaped).to.not.include('<img');
        expect(escaped).to.not.include('<svg');
        expect(escaped).to.not.include('<iframe');
      });
    });

    it('should prevent script injection via sanitizeText', () => {
      const attack = '<script>alert("XSS")</script>Hello';
      const sanitized = SecurityUtils.sanitizeText(attack);
      expect(sanitized).to.not.include('<script');
      expect(sanitized).to.not.include('alert');
    });
  });
});
