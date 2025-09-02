// Binary serialization format for compressed files
// Format: Magic header + metadata length + JSON metadata + payload

// Magic header: "BWTJS1\0" (7 bytes)
const MAGIC_HEADER = new Uint8Array([0x42, 0x57, 0x54, 0x4A, 0x53, 0x31, 0x00]); // "BWTJS1\0"

/**
 * Serialize compressed data into a binary blob
 * @param {Object} meta - Metadata object
 * @param {Uint8Array} payloadBytes - Compressed payload
 * @returns {Blob} - Serialized binary blob
 */
export function serializeCompressed(meta, payloadBytes) {
  try {
    // Ensure required metadata fields
    const fullMeta = {
      originalFilename: meta.originalFilename || 'untitled',
      mimeType: meta.mimeType || 'application/octet-stream',
      originalSize: meta.originalSize || 0,
      pipeline: meta.pipeline || ['bwt', 'mtf', 'rle'],
      encoding: meta.encoding || 'binary',
      createdAt: meta.createdAt || new Date().toISOString(),
      ...meta // Include all other metadata
    };
    
    // Convert metadata to UTF-8 JSON bytes
    const metadataJson = JSON.stringify(fullMeta);
    const metadataBytes = new TextEncoder().encode(metadataJson);
    
    // Create metadata length as 4-byte big-endian uint32
    const metadataLength = new Uint32Array([metadataBytes.length]);
    const metadataLengthBytes = new Uint8Array(metadataLength.buffer);
    
    // Convert to big-endian (network byte order)
    if (isLittleEndian()) {
      metadataLengthBytes.reverse();
    }
    
    // Combine all parts: header + length + metadata + payload
    const totalLength = MAGIC_HEADER.length + 4 + metadataBytes.length + payloadBytes.length;
    const serialized = new Uint8Array(totalLength);
    
    let offset = 0;
    
    // Copy magic header
    serialized.set(MAGIC_HEADER, offset);
    offset += MAGIC_HEADER.length;
    
    // Copy metadata length
    serialized.set(metadataLengthBytes, offset);
    offset += 4;
    
    // Copy metadata
    serialized.set(metadataBytes, offset);
    offset += metadataBytes.length;
    
    // Copy payload
    serialized.set(payloadBytes, offset);
    
    return new Blob([serialized], { type: 'application/octet-stream' });
  } catch (error) {
    throw new Error(`Serialization failed: ${error.message}`);
  }
}

/**
 * Parse a compressed file blob
 * @param {File|Blob} fileOrBlob - Compressed file to parse
 * @returns {Promise<{meta: Object, payloadUint8Array: Uint8Array}>} - Parsed metadata and payload
 */
export async function parseCompressedFile(fileOrBlob) {
  try {
    const arrayBuffer = await fileOrBlob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // Verify magic header
    if (bytes.length < MAGIC_HEADER.length) {
      throw new Error('File too short to be a valid compressed file');
    }
    
    for (let i = 0; i < MAGIC_HEADER.length; i++) {
      if (bytes[i] !== MAGIC_HEADER[i]) {
        throw new Error('Invalid file format: magic header mismatch');
      }
    }
    
    let offset = MAGIC_HEADER.length;
    
    // Read metadata length (4-byte big-endian uint32)
    if (bytes.length < offset + 4) {
      throw new Error('File truncated: missing metadata length');
    }
    
    const metadataLengthBytes = bytes.slice(offset, offset + 4);
    
    // Convert from big-endian
    if (isLittleEndian()) {
      metadataLengthBytes.reverse();
    }
    
    const metadataLength = new Uint32Array(metadataLengthBytes.buffer)[0];
    offset += 4;
    
    // Read metadata
    if (bytes.length < offset + metadataLength) {
      throw new Error('File truncated: missing metadata');
    }
    
    const metadataBytes = bytes.slice(offset, offset + metadataLength);
    const metadataJson = new TextDecoder().decode(metadataBytes);
    const meta = JSON.parse(metadataJson);
    offset += metadataLength;
    
    // Read payload
    const payloadUint8Array = bytes.slice(offset);
    
    return { meta, payloadUint8Array };
  } catch (error) {
    throw new Error(`File parsing failed: ${error.message}`);
  }
}

/**
 * Check if system is little-endian
 * @returns {boolean} - True if little-endian
 */
function isLittleEndian() {
  const buffer = new ArrayBuffer(2);
  new DataView(buffer).setInt16(0, 256, true /* littleEndian */);
  return new Int16Array(buffer)[0] === 256;
}

/**
 * Validate serialization format with roundtrip test
 * @param {Object} meta - Test metadata
 * @param {Uint8Array} payload - Test payload
 * @returns {Promise<boolean>} - True if roundtrip is successful
 */
export async function validateSerialization(meta, payload) {
  try {
    const blob = serializeCompressed(meta, payload);
    const { meta: parsedMeta, payloadUint8Array: parsedPayload } = await parseCompressedFile(blob);
    
    // Check payload equality
    if (payload.length !== parsedPayload.length) return false;
    for (let i = 0; i < payload.length; i++) {
      if (payload[i] !== parsedPayload[i]) return false;
    }
    
    // Check essential metadata fields
    const essentialFields = ['originalFilename', 'mimeType', 'originalSize', 'pipeline', 'encoding'];
    for (const field of essentialFields) {
      if (JSON.stringify(meta[field]) !== JSON.stringify(parsedMeta[field])) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Serialization validation failed:', error);
    return false;
  }
}