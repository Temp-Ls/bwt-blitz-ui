// Run-Length Encoding implementation

export interface RLEPair {
  char: string;
  count: number;
}

/**
 * Run-Length Encoding
 * @param text Input text to encode
 * @returns Array of character-count pairs
 */
export function rleEncode(text: string): RLEPair[] {
  if (!text) return [];
  
  const result: RLEPair[] = [];
  let currentChar = text[0];
  let count = 1;
  
  for (let i = 1; i < text.length; i++) {
    if (text[i] === currentChar) {
      count++;
    } else {
      result.push({ char: currentChar, count });
      currentChar = text[i];
      count = 1;
    }
  }
  
  // Add the last run
  result.push({ char: currentChar, count });
  
  return result;
}

/**
 * Run-Length Decoding
 * @param pairs Array of character-count pairs
 * @returns Decoded text
 */
export function rleDecode(pairs: RLEPair[]): string {
  if (!pairs.length) return '';
  
  return pairs
    .map(pair => pair.char.repeat(pair.count))
    .join('');
}

/**
 * Convert RLE pairs to a compact string format
 * Format: char + count (using special encoding for counts > 255)
 */
export function rleToString(pairs: RLEPair[]): string {
  let result = '';
  
  for (const pair of pairs) {
    result += pair.char;
    
    // Encode count efficiently
    if (pair.count <= 255) {
      result += String.fromCharCode(pair.count);
    } else {
      // For larger counts, use a special encoding
      result += String.fromCharCode(0) + String.fromCharCode(pair.count & 0xFF) + String.fromCharCode((pair.count >> 8) & 0xFF);
    }
  }
  
  return result;
}

/**
 * Convert string back to RLE pairs
 */
export function stringToRLE(str: string): RLEPair[] {
  const pairs: RLEPair[] = [];
  
  for (let i = 0; i < str.length; i += 2) {
    if (i + 1 >= str.length) break;
    
    const char = str[i];
    let count = str.charCodeAt(i + 1);
    
    // Handle special encoding for large counts
    if (count === 0 && i + 3 < str.length) {
      count = str.charCodeAt(i + 2) + (str.charCodeAt(i + 3) << 8);
      i += 2; // Skip extra bytes
    }
    
    pairs.push({ char, count });
  }
  
  return pairs;
}

/**
 * Get RLE compression statistics
 */
export function getRLEStats(original: string, encoded: RLEPair[]): {
  originalLength: number;
  encodedLength: number;
  compressionRatio: number;
} {
  const originalLength = original.length;
  const encodedLength = encoded.length * 2; // Each pair takes 2 characters minimum
  
  return {
    originalLength,
    encodedLength,
    compressionRatio: originalLength > 0 ? encodedLength / originalLength : 1
  };
}