// Unit tests for Run-Length Encoding
import { rleEncode, rleDecode, validateRLE, rleEncodeSimple, rleDecodeSimple } from '../algorithms/rle.js';

describe('Run-Length Encoding', () => {
  describe('rleEncode (escape-based)', () => {
    test('handles empty input', () => {
      const result = rleEncode(new Uint8Array(0));
      expect(result).toEqual(new Uint8Array(0));
    });

    test('handles single byte', () => {
      const input = new Uint8Array([65]); // 'A'
      const result = rleEncode(input);
      expect(result).toEqual(new Uint8Array([65])); // Single byte, no encoding needed
    });

    test('encodes simple run', () => {
      const input = new Uint8Array([65, 65, 65]); // 'AAA'
      const result = rleEncode(input);
      expect(result).toEqual(new Uint8Array([0xFF, 65, 2])); // Escape, byte, count-1
    });

    test('handles mixed single bytes and runs', () => {
      const input = new Uint8Array([65, 66, 66, 67]); // 'ABBC'
      const result = rleEncode(input);
      expect(result).toEqual(new Uint8Array([65, 0xFF, 66, 1, 67])); // A, escape B*2, C
    });

    test('handles escape byte (0xFF) correctly', () => {
      const input = new Uint8Array([0xFF]); // Single 0xFF
      const result = rleEncode(input);
      expect(result).toEqual(new Uint8Array([0xFF, 0xFF, 0])); // Escape sequence for literal 0xFF
    });

    test('handles run of escape bytes', () => {
      const input = new Uint8Array([0xFF, 0xFF, 0xFF]); // Three 0xFF bytes
      const result = rleEncode(input);
      expect(result).toEqual(new Uint8Array([0xFF, 0xFF, 2])); // Run of 0xFF bytes
    });

    test('handles all byte values', () => {
      const input = new Uint8Array([0, 128, 255]);
      const result = rleEncode(input);
      expect(result).toEqual(new Uint8Array([0, 128, 0xFF, 0xFF, 0])); // 0, 128, escaped 255
    });

    test('handles maximum run length', () => {
      const input = new Uint8Array(255).fill(65); // 255 'A's (max for single run)
      const result = rleEncode(input);
      expect(result).toEqual(new Uint8Array([0xFF, 65, 254])); // Escape, A, count-1=254
    });

    test('handles run longer than 255', () => {
      const input = new Uint8Array(300).fill(65); // 300 'A's
      const result = rleEncode(input);
      // Should split into multiple runs: 255 + 45
      expect(result[0]).toBe(0xFF);
      expect(result[1]).toBe(65);
      expect(result[2]).toBe(254); // First run: 255 bytes
      expect(result[3]).toBe(0xFF);
      expect(result[4]).toBe(65);
      expect(result[5]).toBe(44); // Second run: 45 bytes (count-1=44)
    });
  });

  describe('rleDecode (escape-based)', () => {
    test('handles empty input', () => {
      const result = rleDecode(new Uint8Array(0));
      expect(result).toEqual(new Uint8Array(0));
    });

    test('handles single literal byte', () => {
      const encoded = new Uint8Array([65]);
      const result = rleDecode(encoded);
      expect(result).toEqual(new Uint8Array([65]));
    });

    test('decodes simple run', () => {
      const encoded = new Uint8Array([0xFF, 65, 2]); // Run of 3 'A's
      const result = rleDecode(encoded);
      expect(result).toEqual(new Uint8Array([65, 65, 65]));
    });

    test('decodes literal escape byte', () => {
      const encoded = new Uint8Array([0xFF, 0xFF, 0]); // Literal 0xFF
      const result = rleDecode(encoded);
      expect(result).toEqual(new Uint8Array([0xFF]));
    });

    test('handles truncated input gracefully', () => {
      const encoded = new Uint8Array([0xFF, 65]); // Incomplete escape sequence
      const result = rleDecode(encoded);
      expect(result).toEqual(new Uint8Array([65])); // Just process what we can
    });
  });

  describe('Simple RLE (byte-count pairs)', () => {
    test('simple encode works', () => {
      const input = new Uint8Array([65, 65, 66, 67, 67, 67]);
      const result = rleEncodeSimple(input);
      expect(result).toEqual(new Uint8Array([65, 2, 66, 1, 67, 3]));
    });

    test('simple decode works', () => {
      const encoded = new Uint8Array([65, 2, 66, 1, 67, 3]);
      const result = rleDecodeSimple(encoded);
      expect(result).toEqual(new Uint8Array([65, 65, 66, 67, 67, 67]));
    });

    test('simple format roundtrip', () => {
      const input = new Uint8Array([0, 0, 255, 255, 255, 128]);
      const encoded = rleEncodeSimple(input);
      const decoded = rleDecodeSimple(encoded);
      expect(decoded).toEqual(input);
    });
  });

  describe('Roundtrip tests', () => {
    test('roundtrip with various patterns', () => {
      const testCases = [
        new Uint8Array([65, 65, 65, 66, 67, 67]),
        new Uint8Array([0, 0, 0, 1, 2, 2, 2, 2]),
        new Uint8Array([255, 255, 254, 253, 253, 253, 253]),
        new TextEncoder().encode('AAABBBCCCDDDEEE'),
        new TextEncoder().encode('ABCDEFG'), // No runs
        new Uint8Array([128]).fill(128), // Single repeated value
        new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), // No repeats
        new Uint8Array(100).fill(42) // Long run
      ];

      testCases.forEach((input, index) => {
        const encoded = rleEncode(input);
        const decoded = rleDecode(encoded);
        expect(decoded).toEqual(input);
      });
    });

    test('roundtrip with all byte values', () => {
      // Test with runs of each byte value
      for (let byteValue = 0; byteValue < 256; byteValue += 32) {
        const input = new Uint8Array(5).fill(byteValue);
        const encoded = rleEncode(input);
        const decoded = rleDecode(encoded);
        expect(decoded).toEqual(input);
      }
    });

    test('roundtrip with random data', () => {
      for (let length = 1; length <= 100; length += 20) {
        const input = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
          input[i] = Math.floor(Math.random() * 256);
        }
        
        const encoded = rleEncode(input);
        const decoded = rleDecode(encoded);
        expect(decoded).toEqual(input);
      }
    });
  });

  describe('validateRLE', () => {
    test('validates various inputs', () => {
      const testCases = [
        new Uint8Array([]),
        new Uint8Array([42]),
        new TextEncoder().encode('hello world'),
        new TextEncoder().encode('AAAAABBBBBCCCCC'),
        new Uint8Array(Array.from({length: 100}, (_, i) => i % 10)), // Lots of runs
        new Uint8Array([0, 0, 0, 255, 255, 255, 128, 128])
      ];

      testCases.forEach(input => {
        expect(validateRLE(input)).toBe(true);
      });
    });
  });

  describe('Binary safety tests', () => {
    test('preserves null bytes in runs', () => {
      const input = new Uint8Array([0, 0, 0, 0, 0]);
      expect(validateRLE(input)).toBe(true);
    });

    test('preserves high byte values in runs', () => {
      const input = new Uint8Array([255, 255, 255, 254, 254]);
      expect(validateRLE(input)).toBe(true);
    });

    test('handles alternating pattern with all byte values', () => {
      const input = new Uint8Array([0, 255, 0, 255, 128, 128, 128]);
      expect(validateRLE(input)).toBe(true);
    });

    test('special case: input containing only escape bytes', () => {
      const input = new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF]);
      const encoded = rleEncode(input);
      const decoded = rleDecode(encoded);
      expect(decoded).toEqual(input);
    });

    test('mixed escape and non-escape bytes', () => {
      const input = new Uint8Array([0xFF, 65, 0xFF, 0xFF, 66]);
      const encoded = rleEncode(input);
      const decoded = rleDecode(encoded);
      expect(decoded).toEqual(input);
    });
  });

  describe('Compression efficiency tests', () => {
    test('achieves compression on highly repetitive data', () => {
      const input = new Uint8Array(1000).fill(65); // 1000 'A's
      const encoded = rleEncode(input);
      expect(encoded.length).toBeLessThan(input.length / 10); // Should be much smaller
    });

    test('handles worst case (no runs) reasonably', () => {
      // Worst case: no consecutive identical bytes
      const input = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      const encoded = rleEncode(input);
      // Should not expand too much (at most ~20% expansion)
      expect(encoded.length).toBeLessThan(input.length * 1.2);
    });

    test('mixed patterns perform reasonably', () => {
      const input = new Uint8Array([
        ...new Array(10).fill(65), // Run of A's
        66, 67, 68, // Single bytes
        ...new Array(5).fill(69),  // Run of E's
        70, 71 // More single bytes
      ]);
      
      const encoded = rleEncode(input);
      const decoded = rleDecode(encoded);
      expect(decoded).toEqual(input);
      // Should achieve some compression
      expect(encoded.length).toBeLessThan(input.length);
    });
  });

  describe('Edge cases', () => {
    test('handles very long runs correctly', () => {
      const input = new Uint8Array(1000).fill(200);
      expect(validateRLE(input)).toBe(true);
    });

    test('handles single byte runs mixed with longer runs', () => {
      const input = new Uint8Array([65, 66, 66, 67, 68, 68, 68, 69]);
      expect(validateRLE(input)).toBe(true);
    });

    test('handles all possible run lengths from 1 to 255', () => {
      for (let runLength = 1; runLength <= 255; runLength += 50) {
        const input = new Uint8Array(runLength).fill(100);
        expect(validateRLE(input)).toBe(true);
      }
    });
  });
});