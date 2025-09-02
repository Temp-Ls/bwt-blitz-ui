// Burrows-Wheeler Transform implementation

export interface BWTResult {
  transformedText: string;
  originalIndex: number;
}

/**
 * Forward Burrows-Wheeler Transform
 * @param text Input text to transform
 * @returns Object containing transformed text and original index
 */
export function bwtEncode(text: string): BWTResult {
  if (!text) {
    return { transformedText: '', originalIndex: 0 };
  }

  // Add end-of-string marker
  const textWithEOS = text + '\0';
  const n = textWithEOS.length;
  
  // Create all rotations
  const rotations: string[] = [];
  for (let i = 0; i < n; i++) {
    rotations.push(textWithEOS.slice(i) + textWithEOS.slice(0, i));
  }
  
  // Sort rotations lexicographically
  const sortedRotations = rotations
    .map((rotation, index) => ({ rotation, originalIndex: index }))
    .sort((a, b) => a.rotation.localeCompare(b.rotation));
  
  // Find the original string position
  const originalIndex = sortedRotations.findIndex(item => item.originalIndex === 0);
  
  // Extract last column (BWT result)
  const transformedText = sortedRotations
    .map(item => item.rotation[item.rotation.length - 1])
    .join('')
    .slice(0, -1); // Remove the EOS marker
  
  return { transformedText, originalIndex };
}

/**
 * Inverse Burrows-Wheeler Transform
 * @param transformedText BWT transformed text
 * @param originalIndex Original position index
 * @returns Original text
 */
export function bwtDecode(transformedText: string, originalIndex: number): string {
  if (!transformedText) {
    return '';
  }

  const bwt = transformedText + '\0';
  const n = bwt.length;
  
  // Create character-index pairs and sort them
  const charIndexPairs = Array.from(bwt, (char, index) => ({ char, index }))
    .sort((a, b) => a.char.localeCompare(b.char));
  
  // Create the next array (mapping from sorted positions to original positions)
  const next = new Array(n);
  charIndexPairs.forEach((pair, sortedIndex) => {
    next[pair.index] = sortedIndex;
  });
  
  // Reconstruct the original string
  let result = '';
  let currentIndex = originalIndex;
  
  for (let i = 0; i < n - 1; i++) {
    currentIndex = next[currentIndex];
    result += charIndexPairs[currentIndex].char;
  }
  
  return result;
}

/**
 * Get compression statistics
 */
export function getBWTStats(original: string, transformed: string): {
  originalSize: number;
  transformedSize: number;
  compressionRatio: number;
} {
  const originalSize = new Blob([original]).size;
  const transformedSize = new Blob([transformed]).size;
  const compressionRatio = originalSize > 0 ? transformedSize / originalSize : 1;
  
  return {
    originalSize,
    transformedSize,
    compressionRatio
  };
}