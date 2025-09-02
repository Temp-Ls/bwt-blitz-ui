// Binary-safe Burrows-Wheeler Transform implementation
// Operates on Uint8Array for proper binary handling

/**
 * Forward Burrows-Wheeler Transform
 * @param {Uint8Array} bytes - Input bytes to transform
 * @returns {{transformed: Uint8Array, primaryIndex: number}} - Transformed bytes and original index
 */
export function bwtEncode(bytes) {
  if (!bytes || bytes.length === 0) {
    return { transformed: new Uint8Array(0), primaryIndex: 0 };
  }

  const n = bytes.length;
  
  // Create suffix array - indices of all rotations sorted lexicographically
  const suffixArray = new Array(n);
  for (let i = 0; i < n; i++) {
    suffixArray[i] = i;
  }
  
  // Sort suffixes using comparison function that handles cyclic rotations
  suffixArray.sort((a, b) => {
    for (let i = 0; i < n; i++) {
      const byteA = bytes[(a + i) % n];
      const byteB = bytes[(b + i) % n];
      if (byteA !== byteB) {
        return byteA - byteB;
      }
    }
    return 0; // Equal rotations
  });
  
  // Find primary index (where original string appears in sorted array)
  let primaryIndex = 0;
  for (let i = 0; i < n; i++) {
    if (suffixArray[i] === 0) {
      primaryIndex = i;
      break;
    }
  }
  
  // Extract last column (L column) from sorted rotations matrix
  const transformed = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const rotationStart = suffixArray[i];
    // Last character of rotation starting at rotationStart
    transformed[i] = bytes[(rotationStart + n - 1) % n];
  }
  
  return { transformed, primaryIndex };
}

/**
 * Inverse Burrows-Wheeler Transform
 * @param {Uint8Array} transformed - BWT transformed bytes
 * @param {number} primaryIndex - Original string position in sorted array
 * @returns {Uint8Array} - Original bytes
 */
export function bwtDecode(transformed, primaryIndex) {
  if (!transformed || transformed.length === 0) {
    return new Uint8Array(0);
  }

  const n = transformed.length;
  
  // Create F column (first column) by sorting L column (transformed)
  const indexedBytes = Array.from(transformed, (byte, index) => ({ byte, index }));
  indexedBytes.sort((a, b) => a.byte - b.byte);
  
  // Create next array: for each position in L, find corresponding position in F
  const next = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    next[indexedBytes[i].index] = i;
  }
  
  // Reconstruct original string by following the next pointers
  const original = new Uint8Array(n);
  let currentIndex = primaryIndex;
  
  for (let i = 0; i < n; i++) {
    original[i] = indexedBytes[currentIndex].byte;
    currentIndex = next[currentIndex];
  }
  
  return original;
}

/**
 * Validate BWT implementation with roundtrip test
 * @param {Uint8Array} bytes - Input bytes to test
 * @returns {boolean} - True if roundtrip is successful
 */
export function validateBWT(bytes) {
  try {
    const { transformed, primaryIndex } = bwtEncode(bytes);
    const decoded = bwtDecode(transformed, primaryIndex);
    
    if (bytes.length !== decoded.length) return false;
    
    for (let i = 0; i < bytes.length; i++) {
      if (bytes[i] !== decoded[i]) return false;
    }
    
    return true;
  } catch (error) {
    console.error('BWT validation failed:', error);
    return false;
  }
}