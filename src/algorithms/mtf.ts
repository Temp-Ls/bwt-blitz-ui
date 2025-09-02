// Move-to-Front Transform implementation

/**
 * Move-to-Front encoding
 * @param text Input text to encode
 * @returns Array of indices
 */
export function mtfEncode(text: string): number[] {
  if (!text) return [];
  
  // Initialize alphabet with all possible characters (0-255 for bytes)
  const alphabet: number[] = Array.from({ length: 256 }, (_, i) => i);
  const result: number[] = [];
  
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const index = alphabet.indexOf(charCode);
    
    result.push(index);
    
    // Move the character to front
    alphabet.splice(index, 1);
    alphabet.unshift(charCode);
  }
  
  return result;
}

/**
 * Move-to-Front decoding
 * @param indices Array of indices from MTF encoding
 * @returns Decoded text
 */
export function mtfDecode(indices: number[]): string {
  if (!indices.length) return '';
  
  // Initialize alphabet
  const alphabet: number[] = Array.from({ length: 256 }, (_, i) => i);
  let result = '';
  
  for (const index of indices) {
    const charCode = alphabet[index];
    result += String.fromCharCode(charCode);
    
    // Move the character to front
    alphabet.splice(index, 1);
    alphabet.unshift(charCode);
  }
  
  return result;
}

/**
 * Convert MTF indices to a compact string representation
 */
export function indicesToString(indices: number[]): string {
  return indices.map(i => String.fromCharCode(i)).join('');
}

/**
 * Convert string back to MTF indices
 */
export function stringToIndices(str: string): number[] {
  return Array.from(str, char => char.charCodeAt(0));
}