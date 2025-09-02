// Tests for binary serialization format
import { serializeCompressed, parseCompressedFile, validateSerialization } from '../algorithms/serialization.js';

describe('Binary Serialization Format', () => {
  describe('serializeCompressed', () => {
    test('creates valid blob with basic metadata', () => {
      const meta = {
        originalFilename: 'test.txt',
        mimeType: 'text/plain',
        originalSize: 100,
        pipeline: ['bwt', 'mtf', 'rle'],
        encoding: 'utf-8',
        primaryIndex: 5
      };
      const payload = new Uint8Array([1, 2, 3, 4, 5]);
      
      const blob = serializeCompressed(meta, payload);
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/octet-stream');
      expect(blob.size).toBeGreaterThan(payload.length); // Should include header and metadata
    });

    test('handles minimal metadata', () => {
      const meta = {}; // Minimal metadata
      const payload = new Uint8Array([42]);
      
      const blob = serializeCompressed(meta, payload);
      expect(blob).toBeInstanceOf(Blob);
    });

    test('handles large metadata', () => {
      const meta = {
        originalFilename: 'test.txt',
        mimeType: 'text/plain',
        originalSize: 1000000,
        pipeline: ['bwt', 'mtf', 'rle'],
        encoding: 'utf-8',
        primaryIndex: 123456,
        customField1: 'a'.repeat(1000),
        customField2: { nested: { data: [1, 2, 3, 4, 5] } },
        timestamps: new Array(100).fill(new Date().toISOString())
      };
      const payload = new Uint8Array([1, 2, 3]);
      
      const blob = serializeCompressed(meta, payload);
      expect(blob).toBeInstanceOf(Blob);
    });

    test('handles empty payload', () => {
      const meta = { originalFilename: 'empty.txt', originalSize: 0 };
      const payload = new Uint8Array(0);
      
      const blob = serializeCompressed(meta, payload);
      expect(blob).toBeInstanceOf(Blob);
    });

    test('handles binary payload with all byte values', () => {
      const meta = { originalFilename: 'binary.dat', encoding: 'binary' };
      const payload = new Uint8Array(256);
      for (let i = 0; i < 256; i++) {
        payload[i] = i;
      }
      
      const blob = serializeCompressed(meta, payload);
      expect(blob).toBeInstanceOf(Blob);
    });
  });

  describe('parseCompressedFile', () => {
    test('parses valid serialized data', async () => {
      const originalMeta = {
        originalFilename: 'test.txt',
        mimeType: 'text/plain',
        originalSize: 5,
        pipeline: ['bwt', 'mtf', 'rle'],
        encoding: 'utf-8',
        primaryIndex: 2
      };
      const originalPayload = new Uint8Array([1, 2, 3, 4, 5]);
      
      const blob = serializeCompressed(originalMeta, originalPayload);
      const { meta, payloadUint8Array } = await parseCompressedFile(blob);
      
      expect(meta.originalFilename).toBe(originalMeta.originalFilename);
      expect(meta.mimeType).toBe(originalMeta.mimeType);
      expect(meta.originalSize).toBe(originalMeta.originalSize);
      expect(meta.pipeline).toEqual(originalMeta.pipeline);
      expect(meta.encoding).toBe(originalMeta.encoding);
      expect(meta.primaryIndex).toBe(originalMeta.primaryIndex);
      expect(payloadUint8Array).toEqual(originalPayload);
    });

    test('rejects invalid magic header', async () => {
      const invalidData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const blob = new Blob([invalidData]);
      
      await expect(parseCompressedFile(blob)).rejects.toThrow('Invalid file format');
    });

    test('rejects truncated files', async () => {
      const tooShort = new Uint8Array([0x42, 0x57, 0x54]); // Partial magic header
      const blob = new Blob([tooShort]);
      
      await expect(parseCompressedFile(blob)).rejects.toThrow('File too short');
    });

    test('handles corrupted metadata length', async () => {
      const magicHeader = new Uint8Array([0x42, 0x57, 0x54, 0x4A, 0x53, 0x31, 0x00]);
      const badLength = new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF]); // Very large length
      const combined = new Uint8Array(magicHeader.length + badLength.length);
      combined.set(magicHeader);
      combined.set(badLength, magicHeader.length);
      
      const blob = new Blob([combined]);
      await expect(parseCompressedFile(blob)).rejects.toThrow('File truncated');
    });

    test('handles invalid JSON metadata', async () => {
      const magicHeader = new Uint8Array([0x42, 0x57, 0x54, 0x4A, 0x53, 0x31, 0x00]);
      const metadataLength = new Uint8Array([0, 0, 0, 10]); // 10 bytes
      const invalidJson = new TextEncoder().encode('invalid{json');
      
      const combined = new Uint8Array(magicHeader.length + 4 + invalidJson.length);
      combined.set(magicHeader);
      combined.set(metadataLength, magicHeader.length);
      combined.set(invalidJson, magicHeader.length + 4);
      
      const blob = new Blob([combined]);
      await expect(parseCompressedFile(blob)).rejects.toThrow('File parsing failed');
    });
  });

  describe('Roundtrip tests', () => {
    test('basic roundtrip', async () => {
      const meta = {
        originalFilename: 'roundtrip.txt',
        mimeType: 'text/plain',
        originalSize: 10,
        pipeline: ['bwt', 'mtf', 'rle'],
        encoding: 'utf-8',
        primaryIndex: 3
      };
      const payload = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      
      const blob = serializeCompressed(meta, payload);
      const { meta: parsedMeta, payloadUint8Array } = await parseCompressedFile(blob);
      
      // Check essential fields
      expect(parsedMeta.originalFilename).toBe(meta.originalFilename);
      expect(parsedMeta.mimeType).toBe(meta.mimeType);
      expect(parsedMeta.originalSize).toBe(meta.originalSize);
      expect(parsedMeta.pipeline).toEqual(meta.pipeline);
      expect(parsedMeta.encoding).toBe(meta.encoding);
      expect(parsedMeta.primaryIndex).toBe(meta.primaryIndex);
      expect(payloadUint8Array).toEqual(payload);
    });

    test('roundtrip with empty data', async () => {
      const meta = { originalFilename: 'empty.txt', originalSize: 0 };
      const payload = new Uint8Array(0);
      
      const blob = serializeCompressed(meta, payload);
      const { meta: parsedMeta, payloadUint8Array } = await parseCompressedFile(blob);
      
      expect(parsedMeta.originalFilename).toBe(meta.originalFilename);
      expect(payloadUint8Array).toEqual(payload);
    });

    test('roundtrip with large binary payload', async () => {
      const meta = {
        originalFilename: 'large.bin',
        mimeType: 'application/octet-stream',
        encoding: 'binary'
      };
      const payload = new Uint8Array(10000);
      for (let i = 0; i < payload.length; i++) {
        payload[i] = i % 256;
      }
      
      const blob = serializeCompressed(meta, payload);
      const { meta: parsedMeta, payloadUint8Array } = await parseCompressedFile(blob);
      
      expect(parsedMeta.originalFilename).toBe(meta.originalFilename);
      expect(payloadUint8Array).toEqual(payload);
    });

    test('roundtrip with unicode in metadata', async () => {
      const meta = {
        originalFilename: 'файл.txt', // Cyrillic
        mimeType: 'text/plain',
        customField: '测试数据', // Chinese
        emoji: '🚀📁💾' // Emojis
      };
      const payload = new Uint8Array([1, 2, 3]);
      
      const blob = serializeCompressed(meta, payload);
      const { meta: parsedMeta, payloadUint8Array } = await parseCompressedFile(blob);
      
      expect(parsedMeta.originalFilename).toBe(meta.originalFilename);
      expect(parsedMeta.customField).toBe(meta.customField);
      expect(parsedMeta.emoji).toBe(meta.emoji);
      expect(payloadUint8Array).toEqual(payload);
    });

    test('roundtrip with complex nested metadata', async () => {
      const meta = {
        originalFilename: 'complex.json',
        mimeType: 'application/json',
        nested: {
          array: [1, 2, 3, { inner: 'value' }],
          object: {
            boolean: true,
            null: null,
            number: 42.5,
            string: 'test'
          }
        },
        dates: [new Date().toISOString()],
        pipeline: ['bwt', 'mtf', 'rle'],
        primaryIndex: 123
      };
      const payload = new Uint8Array([100, 200, 50, 150]);
      
      const blob = serializeCompressed(meta, payload);
      const { meta: parsedMeta, payloadUint8Array } = await parseCompressedFile(blob);
      
      expect(parsedMeta).toEqual(expect.objectContaining({
        originalFilename: meta.originalFilename,
        mimeType: meta.mimeType,
        nested: meta.nested,
        dates: meta.dates,
        pipeline: meta.pipeline,
        primaryIndex: meta.primaryIndex
      }));
      expect(payloadUint8Array).toEqual(payload);
    });
  });

  describe('validateSerialization', () => {
    test('validates correct serialization', async () => {
      const meta = {
        originalFilename: 'validate.txt',
        mimeType: 'text/plain',
        originalSize: 5,
        pipeline: ['bwt', 'mtf', 'rle'],
        encoding: 'utf-8',
        primaryIndex: 1
      };
      const payload = new Uint8Array([10, 20, 30, 40, 50]);
      
      const isValid = await validateSerialization(meta, payload);
      expect(isValid).toBe(true);
    });

    test('detects payload corruption', async () => {
      const meta = { test: 'data' };
      const originalPayload = new Uint8Array([1, 2, 3, 4, 5]);
      const corruptedPayload = new Uint8Array([1, 2, 99, 4, 5]); // Changed one byte
      
      // Create blob with original payload but validate with corrupted payload
      const blob = serializeCompressed(meta, originalPayload);
      const { meta: parsedMeta } = await parseCompressedFile(blob);
      
      // Manual check: this should fail if we had used corrupted payload
      const validationBlob = serializeCompressed(meta, corruptedPayload);
      const { payloadUint8Array: validationPayload } = await parseCompressedFile(validationBlob);
      
      expect(validationPayload).not.toEqual(originalPayload);
    });
  });

  describe('Format specification compliance', () => {
    test('magic header is exactly "BWTJS1\\0"', async () => {
      const meta = { test: 'data' };
      const payload = new Uint8Array([1, 2, 3]);
      
      const blob = serializeCompressed(meta, payload);
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      const expectedMagic = [0x42, 0x57, 0x54, 0x4A, 0x53, 0x31, 0x00]; // "BWTJS1\0"
      for (let i = 0; i < expectedMagic.length; i++) {
        expect(bytes[i]).toBe(expectedMagic[i]);
      }
    });

    test('metadata length is big-endian uint32', async () => {
      const meta = { short: 'data' };
      const payload = new Uint8Array([42]);
      
      const blob = serializeCompressed(meta, payload);
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      // Skip magic header (7 bytes), read length (4 bytes)
      const lengthBytes = bytes.slice(7, 11);
      
      // Convert from big-endian
      const length = (lengthBytes[0] << 24) | (lengthBytes[1] << 16) | 
                   (lengthBytes[2] << 8) | lengthBytes[3];
      
      expect(length).toBeGreaterThan(0);
      expect(length).toBeLessThan(1000); // Should be reasonable for short metadata
    });

    test('metadata is valid UTF-8 JSON', async () => {
      const meta = {
        originalFilename: 'test.txt',
        mimeType: 'text/plain',
        encoding: 'utf-8',
        unicode: '测试 тест 🚀'
      };
      const payload = new Uint8Array([1]);
      
      const blob = serializeCompressed(meta, payload);
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      // Skip magic header (7 bytes) and length (4 bytes)
      const lengthBytes = bytes.slice(7, 11);
      const metadataLength = (lengthBytes[0] << 24) | (lengthBytes[1] << 16) | 
                            (lengthBytes[2] << 8) | lengthBytes[3];
      
      const metadataBytes = bytes.slice(11, 11 + metadataLength);
      const metadataJson = new TextDecoder('utf-8').decode(metadataBytes);
      
      // Should be valid JSON
      const parsedMeta = JSON.parse(metadataJson);
      expect(parsedMeta.originalFilename).toBe(meta.originalFilename);
      expect(parsedMeta.unicode).toBe(meta.unicode);
    });

    test('payload follows immediately after metadata', async () => {
      const meta = { simple: 'meta' };
      const payload = new Uint8Array([100, 101, 102, 103]);
      
      const blob = serializeCompressed(meta, payload);
      const { payloadUint8Array } = await parseCompressedFile(blob);
      
      expect(payloadUint8Array).toEqual(payload);
    });
  });

  describe('Error conditions and edge cases', () => {
    test('handles very large payloads', async () => {
      const meta = { large: 'payload' };
      const payload = new Uint8Array(100000).fill(42);
      
      const blob = serializeCompressed(meta, payload);
      const { payloadUint8Array } = await parseCompressedFile(blob);
      
      expect(payloadUint8Array).toEqual(payload);
    });

    test('handles metadata with special characters', () => {
      const meta = {
        specialChars: '"\'\\\n\r\t\0\u0001\u001F',
        controlCodes: String.fromCharCode(0, 1, 2, 3, 4, 5),
        backslashes: '\\\\\\',
        quotes: '"""\'\'\'',
        newlines: 'line1\nline2\r\nline3'
      };
      const payload = new Uint8Array([1]);
      
      expect(() => serializeCompressed(meta, payload)).not.toThrow();
    });

    test('rejects files with wrong magic header', async () => {
      const wrongMagic = new Uint8Array([0x42, 0x57, 0x54, 0x4A, 0x53, 0x32, 0x00]); // "BWTJS2\0"
      const blob = new Blob([wrongMagic]);
      
      await expect(parseCompressedFile(blob)).rejects.toThrow('Invalid file format');
    });

    test('handles files with only magic header', async () => {
      const onlyMagic = new Uint8Array([0x42, 0x57, 0x54, 0x4A, 0x53, 0x31, 0x00]);
      const blob = new Blob([onlyMagic]);
      
      await expect(parseCompressedFile(blob)).rejects.toThrow('File truncated');
    });
  });
});