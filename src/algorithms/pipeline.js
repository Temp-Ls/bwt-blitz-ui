// Complete BWT compression pipeline for binary-safe operation
import { bwtEncode, bwtDecode } from './bwt.js';
import { mtfEncode, mtfDecode } from './mtf.js';
import { rleEncode, rleDecode } from './rle.js';

/**
 * Compress bytes using BWT -> MTF -> RLE pipeline
 * @param {Uint8Array} bytes - Input bytes to compress
 * @param {Object} options - Compression options
 * @returns {{payload: Uint8Array, meta: Object}} - Compressed payload and metadata
 */
export function compressBytes(bytes, options = {}) {
  const startTime = performance.now();
  
  if (!bytes || bytes.length === 0) {
    return {
      payload: new Uint8Array(0),
      meta: {
        originalSize: 0,
        compressedSize: 0,
        compressionRatio: 1,
        pipeline: [],
        processingTime: performance.now() - startTime,
        primaryIndex: 0
      }
    };
  }
  
  const pipeline = ['bwt', 'mtf', 'rle'];
  let currentBytes = new Uint8Array(bytes);
  let primaryIndex = 0;
  
  try {
    // Step 1: Burrows-Wheeler Transform
    const bwtResult = bwtEncode(currentBytes);
    currentBytes = bwtResult.transformed;
    primaryIndex = bwtResult.primaryIndex;
    
    // Step 2: Move-to-Front Transform
    currentBytes = mtfEncode(currentBytes);
    
    // Step 3: Run-Length Encoding
    currentBytes = rleEncode(currentBytes);
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    const originalSize = bytes.length;
    const compressedSize = currentBytes.length;
    const compressionRatio = originalSize > 0 ? compressedSize / originalSize : 1;
    
    return {
      payload: currentBytes,
      meta: {
        originalSize,
        compressedSize,
        compressionRatio,
        pipeline,
        processingTime,
        primaryIndex,
        algorithm: 'BWT+MTF+RLE',
        version: '1.0'
      }
    };
  } catch (error) {
    console.error('Compression failed:', error);
    
    // Return original data as fallback
    return {
      payload: bytes,
      meta: {
        originalSize: bytes.length,
        compressedSize: bytes.length,
        compressionRatio: 1,
        pipeline: ['none'],
        processingTime: performance.now() - startTime,
        primaryIndex: 0,
        error: error.message
      }
    };
  }
}

/**
 * Decompress bytes using RLE -> MTF -> BWT pipeline
 * @param {Uint8Array} payload - Compressed payload
 * @param {Object} meta - Compression metadata
 * @returns {Uint8Array} - Original bytes
 */
export function decompressBytes(payload, meta) {
  if (!payload || payload.length === 0) {
    return new Uint8Array(0);
  }
  
  if (!meta || !meta.pipeline) {
    throw new Error('Invalid metadata for decompression');
  }
  
  let currentBytes = new Uint8Array(payload);
  
  try {
    // Reverse the pipeline
    const pipeline = meta.pipeline;
    
    // Step 1: Run-Length Decoding (if RLE was used)
    if (pipeline.includes('rle')) {
      currentBytes = rleDecode(currentBytes);
    }
    
    // Step 2: Move-to-Front Decoding (if MTF was used)
    if (pipeline.includes('mtf')) {
      currentBytes = mtfDecode(currentBytes);
    }
    
    // Step 3: Burrows-Wheeler Inverse Transform (if BWT was used)
    if (pipeline.includes('bwt')) {
      if (typeof meta.primaryIndex !== 'number') {
        throw new Error('Missing primaryIndex for BWT decompression');
      }
      currentBytes = bwtDecode(currentBytes, meta.primaryIndex);
    }
    
    return currentBytes;
  } catch (error) {
    console.error('Decompression failed:', error);
    throw new Error(`Decompression failed: ${error.message}`);
  }
}

/**
 * Get compression statistics
 * @param {number} originalSize - Original size in bytes
 * @param {number} compressedSize - Compressed size in bytes
 * @returns {Object} - Statistics object
 */
export function getCompressionStats(originalSize, compressedSize) {
  const ratio = originalSize > 0 ? compressedSize / originalSize : 1;
  const reduction = originalSize > 0 ? ((originalSize - compressedSize) / originalSize) * 100 : 0;
  
  return {
    originalSize,
    compressedSize,
    compressionRatio: ratio,
    reductionPercent: reduction,
    spaceSaved: originalSize - compressedSize,
    isEffective: ratio < 1
  };
}

/**
 * Validate compression pipeline with roundtrip test
 * @param {Uint8Array} bytes - Input bytes to test
 * @returns {boolean} - True if roundtrip is successful
 */
export function validatePipeline(bytes) {
  try {
    const { payload, meta } = compressBytes(bytes);
    const decompressed = decompressBytes(payload, meta);
    
    if (bytes.length !== decompressed.length) return false;
    
    for (let i = 0; i < bytes.length; i++) {
      if (bytes[i] !== decompressed[i]) return false;
    }
    
    return true;
  } catch (error) {
    console.error('Pipeline validation failed:', error);
    return false;
  }
}