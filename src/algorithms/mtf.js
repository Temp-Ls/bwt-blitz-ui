// Binary-safe Move-to-Front Transform implementation
// Operates on Uint8Array with byte alphabet (0-255)

/**
 * Move-to-Front encoding
 * @param {Uint8Array} bytes - Input bytes to encode
 * @returns {Uint8Array} - MTF encoded bytes
 */
export function mtfEncode(bytes) {
  if (!bytes || bytes.length === 0) {
    return new Uint8Array(0);
  }
  
  // Initialize alphabet with all possible byte values (0-255)
  const alphabet = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    alphabet[i] = i;
  }
  
  const result = new Uint8Array(bytes.length);
  
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    
    // Find position of byte in current alphabet
    let position = 0;
    for (let j = 0; j < 256; j++) {
      if (alphabet[j] === byte) {
        position = j;
        break;
      }
    }
    
    result[i] = position;
    
    // Move byte to front of alphabet
    // Shift elements right and place byte at position 0
    for (let j = position; j > 0; j--) {
      alphabet[j] = alphabet[j - 1];
    }
    alphabet[0] = byte;
  }
  
  return result;
}

/**
 * Move-to-Front decoding
 * @param {Uint8Array} encoded - MTF encoded bytes
 * @returns {Uint8Array} - Original bytes
 */
export function mtfDecode(encoded) {
  if (!encoded || encoded.length === 0) {
    return new Uint8Array(0);
  }
  
  // Initialize alphabet with all possible byte values (0-255)
  const alphabet = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    alphabet[i] = i;
  }
  
  const result = new Uint8Array(encoded.length);
  
  for (let i = 0; i < encoded.length; i++) {
    const position = encoded[i];
    
    // Get byte at position in alphabet
    const byte = alphabet[position];
    result[i] = byte;
    
    // Move byte to front of alphabet
    // Shift elements right and place byte at position 0
    for (let j = position; j > 0; j--) {
      alphabet[j] = alphabet[j - 1];
    }
    alphabet[0] = byte;
  }
  
  return result;
}

/**
 * Validate MTF implementation with roundtrip test
 * @param {Uint8Array} bytes - Input bytes to test
 * @returns {boolean} - True if roundtrip is successful
 */
export function validateMTF(bytes) {
  try {
    const encoded = mtfEncode(bytes);
    const decoded = mtfDecode(encoded);
    
    if (bytes.length !== decoded.length) return false;
    
    for (let i = 0; i < bytes.length; i++) {
      if (bytes[i] !== decoded[i]) return false;
    }
    
    return true;
  } catch (error) {
    console.error('MTF validation failed:', error);
    return false;
  }
}