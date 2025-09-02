// Unit tests for Move-to-Front Transform
import { mtfEncode, mtfDecode, validateMTF } from '../algorithms/mtf.js';

describe('Move-to-Front Transform', () => {
  describe('mtfEncode', () => {
    test('handles empty input', () => {
      const result = mtfEncode(new Uint8Array(0));
      expect(result).toEqual(new Uint8Array(0));
    });

    test('handles single byte', () => {
      const input = new Uint8Array([65]); // 'A'
      const result = mtfEncode(input);
      expect(result).toEqual(new Uint8Array([65])); // First occurrence is at position 65
    });

    test('encodes repeated characters efficiently', () => {
      const input = new Uint8Array([65, 65, 65]); // 'AAA'
      const result = mtfEncode(input);
      expect(result[0]).toBe(65); // First 'A' at position 65
      expect(result[1]).toBe(0);  // Second 'A' now at front (position 0)
      expect(result[2]).toBe(0);  // Third 'A' still at front (position 0)
    });

    test('handles sequential bytes', () => {
      const input = new Uint8Array([65, 66, 67]); // 'ABC'
      const result = mtfEncode(input);
      expect(result[0]).toBe(65); // A at position 65
      expect(result[1]).toBe(66); // B at position 66 (A moved to front)
      expect(result[2]).toBe(67); // C at position 67 (B moved to front, A at 1)
    });

    test('handles all byte values', () => {
      const input = new Uint8Array([0, 128, 255]);
      const result = mtfEncode(input);
      expect(result.length).toBe(3);
      expect(result[0]).toBe(0);   // 0 at position 0
      expect(result[1]).toBe(128); // 128 at position 128
      expect(result[2]).toBe(255); // 255 at position 255
    });
  });

  describe('mtfDecode', () => {
    test('handles empty input', () => {
      const result = mtfDecode(new Uint8Array(0));
      expect(result).toEqual(new Uint8Array(0));
    });

    test('handles single byte', () => {
      const result = mtfDecode(new Uint8Array([65]));
      expect(result).toEqual(new Uint8Array([65]));
    });

    test('decodes repeated pattern correctly', () => {
      const encoded = new Uint8Array([65, 0, 0]); // Encoded 'AAA'
      const result = mtfDecode(encoded);
      expect(result).toEqual(new Uint8Array([65, 65, 65]));
    });
  });

  describe('Roundtrip tests', () => {
    test('roundtrip with various patterns', () => {
      const testCases = [
        new TextEncoder().encode('BANANA'),
        new TextEncoder().encode('MISSISSIPPI'),
        new TextEncoder().encode('abcdefghijklmnopqrstuvwxyz'),
        new TextEncoder().encode('AAAAAAAAAA'),
        new TextEncoder().encode('ABCABCABC'),
        new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
        new Uint8Array([255, 254, 253, 252, 251]),
        new Uint8Array([0, 255, 0, 255, 0, 255]),
        new Uint8Array([128, 128, 128, 64, 64, 64, 32, 32, 32])
      ];

      testCases.forEach((input, index) => {
        const encoded = mtfEncode(input);
        const decoded = mtfDecode(encoded);
        expect(decoded).toEqual(input);
      });
    });

    test('roundtrip with all possible byte values', () => {
      const input = new Uint8Array(256);
      for (let i = 0; i < 256; i++) {
        input[i] = i;
      }
      
      const encoded = mtfEncode(input);
      const decoded = mtfDecode(encoded);
      expect(decoded).toEqual(input);
    });

    test('roundtrip with random binary data', () => {
      for (let length = 1; length <= 100; length += 10) {
        const input = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
          input[i] = Math.floor(Math.random() * 256);
        }
        
        const encoded = mtfEncode(input);
        const decoded = mtfDecode(encoded);
        expect(decoded).toEqual(input);
      }
    });
  });

  describe('validateMTF', () => {
    test('validates various inputs', () => {
      const testCases = [
        new Uint8Array([]),
        new Uint8Array([42]),
        new TextEncoder().encode('hello world'),
        new TextEncoder().encode('The quick brown fox'),
        new Uint8Array(Array.from({length: 100}, (_, i) => i % 256)),
        new Uint8Array(Array.from({length: 50}, () => Math.floor(Math.random() * 256)))
      ];

      testCases.forEach(input => {
        expect(validateMTF(input)).toBe(true);
      });
    });
  });

  describe('Binary safety tests', () => {
    test('preserves null bytes', () => {
      const input = new Uint8Array([0, 0, 0, 1, 2, 3]);
      expect(validateMTF(input)).toBe(true);
    });

    test('preserves high byte values', () => {
      const input = new Uint8Array([255, 254, 253, 128, 129, 130]);
      expect(validateMTF(input)).toBe(true);
    });

    test('handles mixed byte patterns', () => {
      const input = new Uint8Array([0, 255, 128, 0, 255, 128, 64, 192]);
      expect(validateMTF(input)).toBe(true);
    });

    test('efficiency check - repeated bytes become small indices', () => {
      const input = new Uint8Array([200, 200, 200, 200, 200]); // High byte value repeated
      const encoded = mtfEncode(input);
      
      expect(encoded[0]).toBe(200); // First occurrence at original position
      expect(encoded[1]).toBe(0);   // Subsequent occurrences at position 0
      expect(encoded[2]).toBe(0);
      expect(encoded[3]).toBe(0);
      expect(encoded[4]).toBe(0);
    });

    test('detects corruption in encoded data', () => {
      const input = new TextEncoder().encode('BANANA');
      const encoded = mtfEncode(input);
      
      // Corrupt the encoded data
      if (encoded.length > 0) {
        const corrupted = new Uint8Array(encoded);
        corrupted[0] = (corrupted[0] + 100) % 256; // Change position dramatically
        
        const decoded = mtfDecode(corrupted);
        expect(decoded).not.toEqual(input);
      }
    });
  });

  describe('Performance characteristics', () => {
    test('MTF improves locality for structured data', () => {
      // Create data with local patterns (like BWT output)
      const input = new TextEncoder().encode('NNAABBAANN'); // Typical BWT-like output
      const encoded = mtfEncode(input);
      
      // Check that we get some small indices (indicating effectiveness)
      const smallIndices = encoded.filter(x => x < 10).length;
      expect(smallIndices).toBeGreaterThan(2); // Should have some improvement
    });

    test('handles worst-case input gracefully', () => {
      // Worst case: each byte appears only once in reverse order
      const input = new Uint8Array([255, 254, 253, 252, 251, 250]);
      const encoded = mtfEncode(input);
      const decoded = mtfDecode(encoded);
      
      expect(decoded).toEqual(input); // Still works correctly
    });
  });
});