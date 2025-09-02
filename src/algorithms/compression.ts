// Complete BWT compression pipeline

import { bwtEncode, bwtDecode, BWTResult } from './bwt';
import { mtfEncode, mtfDecode, indicesToString, stringToIndices } from './mtf';
import { rleEncode, rleDecode, rleToString, stringToRLE } from './rle';

export interface CompressionResult {
  compressedData: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  steps: {
    bwt: string;
    mtf: string;
    rle: string;
  };
  metadata: {
    originalIndex: number;
  };
  processingTime: number;
}

export interface DecompressionResult {
  originalData: string;
  processingTime: number;
  success: boolean;
  error?: string;
}

/**
 * Complete compression pipeline: BWT -> MTF -> RLE
 */
export function compress(input: string): CompressionResult {
  const startTime = performance.now();
  
  try {
    // Step 1: Burrows-Wheeler Transform
    const bwtResult = bwtEncode(input);
    
    // Step 2: Move-to-Front Transform
    const mtfIndices = mtfEncode(bwtResult.transformedText);
    const mtfString = indicesToString(mtfIndices);
    
    // Step 3: Run-Length Encoding
    const rleEncoded = rleEncode(mtfString);
    const finalCompressed = rleToString(rleEncoded);
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    const originalSize = new Blob([input]).size;
    const compressedSize = new Blob([finalCompressed]).size;
    const compressionRatio = originalSize > 0 ? compressedSize / originalSize : 1;
    
    return {
      compressedData: finalCompressed,
      originalSize,
      compressedSize,
      compressionRatio,
      steps: {
        bwt: bwtResult.transformedText,
        mtf: mtfString,
        rle: finalCompressed
      },
      metadata: {
        originalIndex: bwtResult.originalIndex
      },
      processingTime
    };
  } catch (error) {
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    // Return minimal result on error
    return {
      compressedData: input, // Fallback to original
      originalSize: new Blob([input]).size,
      compressedSize: new Blob([input]).size,
      compressionRatio: 1,
      steps: {
        bwt: input,
        mtf: input,
        rle: input
      },
      metadata: {
        originalIndex: 0
      },
      processingTime
    };
  }
}

/**
 * Complete decompression pipeline: RLE -> MTF -> BWT
 */
export function decompress(compressedData: string, originalIndex: number): DecompressionResult {
  const startTime = performance.now();
  
  try {
    // Step 1: Run-Length Decoding
    const rleDecoded = stringToRLE(compressedData);
    const mtfString = rleDecode(rleDecoded);
    
    // Step 2: Move-to-Front Decoding
    const mtfIndices = stringToIndices(mtfString);
    const bwtString = mtfDecode(mtfIndices);
    
    // Step 3: Burrows-Wheeler Inverse Transform
    const originalData = bwtDecode(bwtString, originalIndex);
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    return {
      originalData,
      processingTime,
      success: true
    };
  } catch (error) {
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    return {
      originalData: '',
      processingTime,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown decompression error'
    };
  }
}

/**
 * Validate compression by testing roundtrip
 */
export function validateCompression(input: string): boolean {
  try {
    const compressed = compress(input);
    const decompressed = decompress(compressed.compressedData, compressed.metadata.originalIndex);
    return decompressed.success && decompressed.originalData === input;
  } catch {
    return false;
  }
}