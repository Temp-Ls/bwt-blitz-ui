// Integration tests for the complete BWT compression pipeline
import { compressBytes, decompressBytes, validatePipeline, getCompressionStats } from '../algorithms/pipeline.js';

describe('BWT Compression Pipeline', () => {
  describe('compressBytes', () => {
    test('handles empty input', () => {
      const result = compressBytes(new Uint8Array(0));
      expect(result.payload).toEqual(new Uint8Array(0));
      expect(result.meta.originalSize).toBe(0);
      expect(result.meta.compressedSize).toBe(0);
      expect(result.meta.pipeline).toEqual(['bwt', 'mtf', 'rle']);
    });

    test('compresses small text successfully', () => {
      const input = new TextEncoder().encode('BANANA');
      const result = compressBytes(input);
      
      expect(result.payload).toBeInstanceOf(Uint8Array);
      expect(result.meta.originalSize).toBe(6);
      expect(result.meta.compressedSize).toBe(result.payload.length);
      expect(result.meta.pipeline).toEqual(['bwt', 'mtf', 'rle']);
      expect(result.meta.primaryIndex).toBeGreaterThanOrEqual(0);
      expect(result.meta.primaryIndex).toBeLessThan(6);
      expect(result.meta.processingTime).toBeGreaterThan(0);
    });

    test('includes proper metadata', () => {
      const input = new TextEncoder().encode('Hello World!');
      const result = compressBytes(input);
      
      expect(result.meta).toHaveProperty('originalSize');
      expect(result.meta).toHaveProperty('compressedSize');
      expect(result.meta).toHaveProperty('compressionRatio');
      expect(result.meta).toHaveProperty('pipeline');
      expect(result.meta).toHaveProperty('processingTime');
      expect(result.meta).toHaveProperty('primaryIndex');
      expect(result.meta).toHaveProperty('algorithm');
      expect(result.meta).toHaveProperty('version');
    });

    test('compresses binary data', () => {
      const input = new Uint8Array([0, 1, 2, 3, 255, 254, 253, 0, 1, 2]);
      const result = compressBytes(input);
      
      expect(result.payload).toBeInstanceOf(Uint8Array);
      expect(result.meta.originalSize).toBe(10);
      expect(result.meta.primaryIndex).toBeGreaterThanOrEqual(0);
      expect(result.meta.primaryIndex).toBeLessThan(10);
    });

    test('handles repetitive data efficiently', () => {
      const input = new Uint8Array(100).fill(65); // 100 'A's
      const result = compressBytes(input);
      
      expect(result.payload.length).toBeLessThan(input.length);
      expect(result.meta.compressionRatio).toBeLessThan(1);
    });
  });

  describe('decompressBytes', () => {
    test('handles empty payload', () => {
      const meta = {
        pipeline: ['bwt', 'mtf', 'rle'],
        primaryIndex: 0,
        originalSize: 0
      };
      const result = decompressBytes(new Uint8Array(0), meta);
      expect(result).toEqual(new Uint8Array(0));
    });

    test('requires valid metadata', () => {
      const payload = new Uint8Array([1, 2, 3]);
      
      expect(() => decompressBytes(payload, null)).toThrow();
      expect(() => decompressBytes(payload, {})).toThrow();
      expect(() => decompressBytes(payload, { pipeline: [] })).toThrow();
    });

    test('requires primaryIndex for BWT', () => {
      const payload = new Uint8Array([1, 2, 3]);
      const meta = { pipeline: ['bwt', 'mtf', 'rle'] };
      
      expect(() => decompressBytes(payload, meta)).toThrow();
    });

    test('works with partial pipelines', () => {
      // Test with only RLE
      const input = new Uint8Array([65, 65, 65, 66, 67, 67]);
      const { payload: rlePayload } = compressBytes(input, { pipeline: ['rle'] });
      
      // Mock RLE-only metadata
      const rleMeta = {
        pipeline: ['rle'],
        originalSize: input.length
      };
      
      // This should work even without BWT
      expect(() => decompressBytes(rlePayload, rleMeta)).not.toThrow();
    });
  });

  describe('Full pipeline roundtrip tests', () => {
    test('roundtrip with text data', () => {
      const testTexts = [
        'BANANA',
        'MISSISSIPPI',
        'The quick brown fox jumps over the lazy dog',
        'AAAAAAAAAAAAAAAAAAAAAA',
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        '1234567890',
        'Hello, World! 🌍',
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        'A'.repeat(1000), // Long repetitive string
        'ABCABC'.repeat(100) // Repetitive pattern
      ];

      testTexts.forEach(text => {
        const input = new TextEncoder().encode(text);
        const { payload, meta } = compressBytes(input);
        const decompressed = decompressBytes(payload, meta);
        expect(decompressed).toEqual(input);
      });
    });

    test('roundtrip with binary data', () => {
      const testArrays = [
        new Uint8Array([0, 1, 2, 3, 4, 5]),
        new Uint8Array([255, 254, 253, 252, 251]),
        new Uint8Array([0, 255, 0, 255, 0, 255]),
        new Uint8Array([128, 64, 32, 16, 8, 4, 2, 1]),
        new Uint8Array(256).map((_, i) => i), // All byte values
        new Uint8Array(100).fill(42), // Repetitive
        new Uint8Array(500).map(() => Math.floor(Math.random() * 256)) // Random
      ];

      testArrays.forEach(input => {
        const { payload, meta } = compressBytes(input);
        const decompressed = decompressBytes(payload, meta);
        expect(decompressed).toEqual(input);
      });
    });

    test('roundtrip with edge cases', () => {
      const edgeCases = [
        new Uint8Array([]), // Empty
        new Uint8Array([42]), // Single byte
        new Uint8Array([0]), // Null byte
        new Uint8Array([255]), // Max byte
        new Uint8Array([0, 0, 0, 0, 0]), // All zeros
        new Uint8Array([255, 255, 255, 255, 255]), // All max
        new Uint8Array(1000).fill(128) // Large repetitive
      ];

      edgeCases.forEach(input => {
        const { payload, meta } = compressBytes(input);
        const decompressed = decompressBytes(payload, meta);
        expect(decompressed).toEqual(input);
      });
    });

    test('massive roundtrip test with random data', () => {
      // Test with various sizes and random patterns
      for (let size = 1; size <= 1000; size *= 10) {
        for (let test = 0; test < 5; test++) {
          const input = new Uint8Array(size);
          for (let i = 0; i < size; i++) {
            input[i] = Math.floor(Math.random() * 256);
          }
          
          const { payload, meta } = compressBytes(input);
          const decompressed = decompressBytes(payload, meta);
          expect(decompressed).toEqual(input);
        }
      }
    });
  });

  describe('validatePipeline', () => {
    test('validates various inputs', () => {
      const testCases = [
        new Uint8Array([]),
        new Uint8Array([42]),
        new TextEncoder().encode('hello world'),
        new TextEncoder().encode('BANANA BANDANA'),
        new Uint8Array(Array.from({length: 100}, (_, i) => i % 256)),
        new Uint8Array(Array.from({length: 50}, () => Math.floor(Math.random() * 256)))
      ];

      testCases.forEach(input => {
        expect(validatePipeline(input)).toBe(true);
      });
    });

    test('detects corruption', () => {
      const input = new TextEncoder().encode('BANANA');
      const { payload, meta } = compressBytes(input);
      
      // Corrupt the payload
      if (payload.length > 0) {
        const corruptedPayload = new Uint8Array(payload);
        corruptedPayload[0] = (corruptedPayload[0] + 1) % 256;
        
        expect(() => decompressBytes(corruptedPayload, meta)).toThrow();
      }
    });
  });

  describe('getCompressionStats', () => {
    test('calculates stats correctly', () => {
      const stats = getCompressionStats(1000, 500);
      
      expect(stats.originalSize).toBe(1000);
      expect(stats.compressedSize).toBe(500);
      expect(stats.compressionRatio).toBe(0.5);
      expect(stats.reductionPercent).toBe(50);
      expect(stats.spaceSaved).toBe(500);
      expect(stats.isEffective).toBe(true);
    });

    test('handles expansion correctly', () => {
      const stats = getCompressionStats(100, 150);
      
      expect(stats.compressionRatio).toBe(1.5);
      expect(stats.reductionPercent).toBe(-50);
      expect(stats.spaceSaved).toBe(-50);
      expect(stats.isEffective).toBe(false);
    });

    test('handles zero sizes', () => {
      const stats = getCompressionStats(0, 0);
      
      expect(stats.compressionRatio).toBe(1);
      expect(stats.reductionPercent).toBe(0);
      expect(stats.spaceSaved).toBe(0);
    });
  });

  describe('Performance and compression quality tests', () => {
    test('compresses highly repetitive data well', () => {
      const input = new TextEncoder().encode('A'.repeat(1000));
      const { payload, meta } = compressBytes(input);
      
      expect(meta.compressionRatio).toBeLessThan(0.1); // Should achieve >90% compression
    });

    test('handles random data gracefully', () => {
      const input = new Uint8Array(1000);
      for (let i = 0; i < 1000; i++) {
        input[i] = Math.floor(Math.random() * 256);
      }
      
      const { payload, meta } = compressBytes(input);
      const decompressed = decompressBytes(payload, meta);
      
      expect(decompressed).toEqual(input);
      // Random data might expand, but not too much
      expect(meta.compressionRatio).toBeLessThan(2.0);
    });

    test('processing time is reasonable', () => {
      const input = new TextEncoder().encode('Hello World!'.repeat(100));
      const { meta } = compressBytes(input);
      
      // Should complete within reasonable time (less than 1 second for small data)
      expect(meta.processingTime).toBeLessThan(1000);
    });

    test('works with typical file-like data', () => {
      // Simulate various file types
      const testData = [
        // Text file (repetitive)
        new TextEncoder().encode('The quick brown fox jumps over the lazy dog.\n'.repeat(50)),
        
        // Log file (structured)
        new TextEncoder().encode('[INFO] Application started\n[INFO] Loading configuration\n[ERROR] File not found\n'.repeat(20)),
        
        // CSV-like data
        new TextEncoder().encode('Name,Age,City\nJohn,25,New York\nJane,30,Boston\n'.repeat(30)),
        
        // Binary-like data with patterns
        new Uint8Array(500).map((_, i) => i % 10),
        
        // Mixed patterns
        new Uint8Array([
          ...new Array(100).fill(0),
          ...Array.from({length: 100}, (_, i) => i % 256),
          ...new Array(100).fill(255)
        ])
      ];

      testData.forEach(input => {
        const { payload, meta } = compressBytes(input);
        const decompressed = decompressBytes(payload, meta);
        expect(decompressed).toEqual(input);
      });
    });
  });

  describe('Error handling', () => {
    test('handles corrupted metadata gracefully', () => {
      const input = new TextEncoder().encode('BANANA');
      const { payload } = compressBytes(input);
      
      const badMeta = {
        pipeline: ['bwt', 'mtf', 'rle'],
        primaryIndex: -1 // Invalid index
      };
      
      expect(() => decompressBytes(payload, badMeta)).toThrow();
    });

    test('handles missing pipeline steps', () => {
      const payload = new Uint8Array([1, 2, 3]);
      const incompleteMeta = {
        pipeline: ['unknown_algorithm'],
        primaryIndex: 0
      };
      
      // Should handle unknown algorithms gracefully
      expect(() => decompressBytes(payload, incompleteMeta)).not.toThrow();
    });

    test('handles buffer overflow scenarios', () => {
      // Test with very large theoretical sizes to ensure no buffer overflows
      const input = new Uint8Array(10000).fill(65);
      expect(() => validatePipeline(input)).not.toThrow();
    });
  });
});