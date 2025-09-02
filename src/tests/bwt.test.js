// Unit tests for Burrows-Wheeler Transform
import { bwtEncode, bwtDecode, validateBWT } from '../algorithms/bwt.js';

describe('Burrows-Wheeler Transform', () => {
  describe('bwtEncode', () => {
    test('handles empty input', () => {
      const result = bwtEncode(new Uint8Array(0));
      expect(result.transformed).toEqual(new Uint8Array(0));
      expect(result.primaryIndex).toBe(0);
    });

    test('handles single byte', () => {
      const input = new Uint8Array([65]); // 'A'
      const result = bwtEncode(input);
      expect(result.transformed).toEqual(new Uint8Array([65]));
      expect(result.primaryIndex).toBe(0);
    });

    test('handles known string "BANANA"', () => {
      const input = new TextEncoder().encode('BANANA');
      const result = bwtEncode(input);
      
      // Verify basic properties
      expect(result.transformed.length).toBe(input.length);
      expect(result.primaryIndex).toBeGreaterThanOrEqual(0);
      expect(result.primaryIndex).toBeLessThan(input.length);
      
      // Count character frequencies (should be preserved)
      const originalCounts = {};
      const transformedCounts = {};
      
      for (let i = 0; i < input.length; i++) {
        originalCounts[input[i]] = (originalCounts[input[i]] || 0) + 1;
        transformedCounts[result.transformed[i]] = (transformedCounts[result.transformed[i]] || 0) + 1;
      }
      
      expect(transformedCounts).toEqual(originalCounts);
    });

    test('handles binary data with null bytes', () => {
      const input = new Uint8Array([0, 1, 2, 0, 1, 2, 255, 128]);
      const result = bwtEncode(input);
      
      expect(result.transformed.length).toBe(input.length);
      expect(result.primaryIndex).toBeGreaterThanOrEqual(0);
      expect(result.primaryIndex).toBeLessThan(input.length);
    });

    test('handles repeated patterns', () => {
      const input = new Uint8Array([65, 65, 65, 65, 66, 66, 66, 66]); // "AAAABBBB"
      const result = bwtEncode(input);
      
      expect(result.transformed.length).toBe(input.length);
    });
  });

  describe('bwtDecode', () => {
    test('handles empty input', () => {
      const result = bwtDecode(new Uint8Array(0), 0);
      expect(result).toEqual(new Uint8Array(0));
    });

    test('handles single byte', () => {
      const result = bwtDecode(new Uint8Array([65]), 0);
      expect(result).toEqual(new Uint8Array([65]));
    });

    test('roundtrip test with various inputs', () => {
      const testCases = [
        new TextEncoder().encode('BANANA'),
        new TextEncoder().encode('MISSISSIPPI'),
        new TextEncoder().encode('abracadabra'),
        new Uint8Array([0, 1, 2, 3, 4, 5]),
        new Uint8Array([255, 254, 253, 252, 251]),
        new Uint8Array([0, 0, 0, 1, 1, 1, 2, 2, 2]),
        new Uint8Array([128, 64, 32, 16, 8, 4, 2, 1])
      ];

      testCases.forEach(input => {
        const encoded = bwtEncode(input);
        const decoded = bwtDecode(encoded.transformed, encoded.primaryIndex);
        expect(decoded).toEqual(input);
      });
    });
  });

  describe('validateBWT', () => {
    test('validates various inputs', () => {
      const testCases = [
        new Uint8Array([]),
        new Uint8Array([42]),
        new TextEncoder().encode('hello world'),
        new TextEncoder().encode('The quick brown fox jumps over the lazy dog'),
        new Uint8Array(Array.from({length: 100}, (_, i) => i % 256)),
        new Uint8Array(Array.from({length: 50}, () => Math.floor(Math.random() * 256)))
      ];

      testCases.forEach(input => {
        expect(validateBWT(input)).toBe(true);
      });
    });

    test('validates large binary data', () => {
      // Create a larger test with mixed patterns
      const patterns = [
        new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
        new Uint8Array([255, 254, 253, 252, 251, 250]),
        new Uint8Array([128, 128, 128, 128]),
        new TextEncoder().encode('AAAAAABBBBBBCCCCCC')
      ];
      
      for (const pattern of patterns) {
        const largeInput = new Uint8Array(pattern.length * 10);
        for (let i = 0; i < 10; i++) {
          largeInput.set(pattern, i * pattern.length);
        }
        
        expect(validateBWT(largeInput)).toBe(true);
      }
    });
  });

  describe('Binary safety tests', () => {
    test('preserves all byte values 0-255', () => {
      const input = new Uint8Array(256);
      for (let i = 0; i < 256; i++) {
        input[i] = i;
      }
      
      expect(validateBWT(input)).toBe(true);
    });

    test('handles random binary data', () => {
      for (let length = 1; length <= 100; length += 10) {
        const input = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
          input[i] = Math.floor(Math.random() * 256);
        }
        
        expect(validateBWT(input)).toBe(true);
      }
    });

    test('detects corruption in transformed data', () => {
      const input = new TextEncoder().encode('BANANA');
      const { transformed, primaryIndex } = bwtEncode(input);
      
      // Corrupt the transformed data
      const corrupted = new Uint8Array(transformed);
      if (corrupted.length > 0) {
        corrupted[0] = (corrupted[0] + 1) % 256;
        
        const decoded = bwtDecode(corrupted, primaryIndex);
        expect(decoded).not.toEqual(input);
      }
    });

    test('detects corruption in primary index', () => {
      const input = new TextEncoder().encode('BANANA');
      const { transformed, primaryIndex } = bwtEncode(input);
      
      // Use wrong primary index
      const wrongIndex = (primaryIndex + 1) % input.length;
      if (wrongIndex !== primaryIndex) {
        const decoded = bwtDecode(transformed, wrongIndex);
        expect(decoded).not.toEqual(input);
      }
    });
  });
});