// Binary-safe Run-Length Encoding implementation
// Operates on Uint8Array with efficient encoding for runs

/**
 * Run-Length Encoding with escape-based format
 * Format: [byte][count-1] for runs >= 2, [byte] for single bytes
 * Uses 0xFF as escape byte for runs
 * @param {Uint8Array} bytes - Input bytes to encode
 * @returns {Uint8Array} - RLE encoded bytes
 */
export function rleEncode(bytes) {
  if (!bytes || bytes.length === 0) {
    return new Uint8Array(0);
  }
  
  const result = [];
  let i = 0;
  
  while (i < bytes.length) {
    const currentByte = bytes[i];
    let runLength = 1;
    
    // Count consecutive identical bytes
    while (i + runLength < bytes.length && 
           bytes[i + runLength] === currentByte && 
           runLength < 255) {
      runLength++;
    }
    
    if (runLength === 1) {
      // Single byte - check if it's the escape byte
      if (currentByte === 0xFF) {
        result.push(0xFF, 0xFF, 0); // Escape sequence for literal 0xFF
      } else {
        result.push(currentByte);
      }
    } else {
      // Run of bytes - use escape sequence
      result.push(0xFF, currentByte, runLength - 1);
    }
    
    i += runLength;
  }
  
  return new Uint8Array(result);
}

/**
 * Run-Length Decoding
 * @param {Uint8Array} encoded - RLE encoded bytes
 * @returns {Uint8Array} - Original bytes
 */
export function rleDecode(encoded) {
  if (!encoded || encoded.length === 0) {
    return new Uint8Array(0);
  }
  
  const result = [];
  let i = 0;
  
  while (i < encoded.length) {
    if (encoded[i] === 0xFF && i + 2 < encoded.length) {
      // Potential escape sequence
      const nextByte = encoded[i + 1];
      const count = encoded[i + 2];
      
      if (nextByte === 0xFF && count === 0) {
        // Literal 0xFF byte
        result.push(0xFF);
        i += 3;
      } else {
        // Run of bytes
        for (let j = 0; j <= count; j++) {
          result.push(nextByte);
        }
        i += 3;
      }
    } else {
      // Single literal byte
      result.push(encoded[i]);
      i++;
    }
  }
  
  return new Uint8Array(result);
}

/**
 * Alternative simpler RLE implementation for comparison/fallback
 * Uses alternating byte-count pairs
 * @param {Uint8Array} bytes - Input bytes
 * @returns {Uint8Array} - Simple RLE encoded bytes
 */
export function rleEncodeSimple(bytes) {
  if (!bytes || bytes.length === 0) {
    return new Uint8Array(0);
  }
  
  const result = [];
  let i = 0;
  
  while (i < bytes.length) {
    const currentByte = bytes[i];
    let runLength = 1;
    
    // Count consecutive identical bytes (max 255)
    while (i + runLength < bytes.length && 
           bytes[i + runLength] === currentByte && 
           runLength < 255) {
      runLength++;
    }
    
    result.push(currentByte, runLength);
    i += runLength;
  }
  
  return new Uint8Array(result);
}

/**
 * Simple RLE decoding
 * @param {Uint8Array} encoded - Simple RLE encoded bytes
 * @returns {Uint8Array} - Original bytes
 */
export function rleDecodeSimple(encoded) {
  if (!encoded || encoded.length === 0 || encoded.length % 2 !== 0) {
    return new Uint8Array(0);
  }
  
  const result = [];
  
  for (let i = 0; i < encoded.length; i += 2) {
    const byte = encoded[i];
    const count = encoded[i + 1];
    
    for (let j = 0; j < count; j++) {
      result.push(byte);
    }
  }
  
  return new Uint8Array(result);
}

/**
 * Validate RLE implementation with roundtrip test
 * @param {Uint8Array} bytes - Input bytes to test
 * @returns {boolean} - True if roundtrip is successful
 */
export function validateRLE(bytes) {
  try {
    const encoded = rleEncode(bytes);
    const decoded = rleDecode(encoded);
    
    if (bytes.length !== decoded.length) return false;
    
    for (let i = 0; i < bytes.length; i++) {
      if (bytes[i] !== decoded[i]) return false;
    }
    
    return true;
  } catch (error) {
    console.error('RLE validation failed:', error);
    return false;
  }
}