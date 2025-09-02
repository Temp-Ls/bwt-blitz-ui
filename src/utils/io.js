// I/O utilities for file handling, text encoding, and localStorage

import { compressBytes, decompressBytes } from '../algorithms/pipeline.js';
import { serializeCompressed, parseCompressedFile } from '../algorithms/serialization.js';

/**
 * Read file as Uint8Array
 * @param {File} file - File to read
 * @returns {Promise<Uint8Array>} - File contents as bytes
 */
export async function readFileAsBytes(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const arrayBuffer = event.target.result;
      resolve(new Uint8Array(arrayBuffer));
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Convert text to UTF-8 bytes
 * @param {string} text - Text to convert
 * @returns {Uint8Array} - UTF-8 encoded bytes
 */
export function textToBytes(text) {
  return new TextEncoder().encode(text);
}

/**
 * Convert UTF-8 bytes to text
 * @param {Uint8Array} bytes - UTF-8 bytes to convert
 * @returns {string} - Decoded text
 */
export function bytesToText(bytes) {
  return new TextDecoder().decode(bytes);
}

/**
 * Compress text and return serialized blob
 * @param {string} text - Text to compress
 * @param {string} filename - Optional filename
 * @returns {Blob} - Serialized compressed blob
 */
export function compressFromText(text, filename = 'text.txt') {
  const bytes = textToBytes(text);
  const { payload, meta } = compressBytes(bytes);
  
  const fullMeta = {
    ...meta,
    originalFilename: filename,
    mimeType: 'text/plain',
    encoding: 'utf-8'
  };
  
  return serializeCompressed(fullMeta, payload);
}

/**
 * Decompress blob and return text
 * @param {Blob} blob - Compressed blob
 * @returns {Promise<{text: string, meta: Object}>} - Decompressed text and metadata
 */
export async function decompressToText(blob) {
  const { meta, payloadUint8Array } = await parseCompressedFile(blob);
  const decompressedBytes = decompressBytes(payloadUint8Array, meta);
  const text = bytesToText(decompressedBytes);
  
  return { text, meta };
}

/**
 * Compress file and return serialized blob
 * @param {File} file - File to compress
 * @returns {Promise<{blob: Blob, meta: Object}>} - Compressed blob and metadata
 */
export async function compressFromFile(file) {
  const bytes = await readFileAsBytes(file);
  const { payload, meta } = compressBytes(bytes);
  
  const fullMeta = {
    ...meta,
    originalFilename: file.name,
    mimeType: file.type || 'application/octet-stream',
    encoding: 'binary'
  };
  
  const blob = serializeCompressed(fullMeta, payload);
  
  return { blob, meta: fullMeta };
}

/**
 * Decompress file blob and return original bytes
 * @param {Blob} blob - Compressed file blob
 * @returns {Promise<{fileBytes: Uint8Array, meta: Object}>} - Original file bytes and metadata
 */
export async function decompressFileBlob(blob) {
  const { meta, payloadUint8Array } = await parseCompressedFile(blob);
  const fileBytes = decompressBytes(payloadUint8Array, meta);
  
  return { fileBytes, meta };
}

/**
 * Create download link for bytes
 * @param {Uint8Array} bytes - Bytes to download
 * @param {string} filename - Download filename
 * @param {string} mimeType - MIME type
 * @returns {string} - Object URL for download
 */
export function createDownloadUrl(bytes, filename, mimeType = 'application/octet-stream') {
  const blob = new Blob([bytes], { type: mimeType });
  return URL.createObjectURL(blob);
}

/**
 * Trigger download of bytes
 * @param {Uint8Array} bytes - Bytes to download
 * @param {string} filename - Download filename
 * @param {string} mimeType - MIME type
 */
export function downloadBytes(bytes, filename, mimeType = 'application/octet-stream') {
  const url = createDownloadUrl(bytes, filename, mimeType);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Convert Uint8Array to base64 string
 * @param {Uint8Array} bytes - Bytes to encode
 * @returns {string} - Base64 encoded string
 */
export function bytesToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to Uint8Array
 * @param {string} base64 - Base64 string to decode
 * @returns {Uint8Array} - Decoded bytes
 */
export function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Save compressed data to localStorage
 * @param {string} key - Storage key
 * @param {Blob} blob - Compressed blob to save
 * @param {Object} meta - Metadata
 */
export async function saveToLocalStorage(key, blob, meta) {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const base64Data = bytesToBase64(bytes);
    
    const storageItem = {
      data: base64Data,
      meta: meta,
      savedAt: new Date().toISOString(),
      size: bytes.length
    };
    
    localStorage.setItem(`bwt_compressed_${key}`, JSON.stringify(storageItem));
  } catch (error) {
    throw new Error(`Failed to save to localStorage: ${error.message}`);
  }
}

/**
 * Load compressed data from localStorage
 * @param {string} key - Storage key
 * @returns {Promise<{blob: Blob, meta: Object}>} - Loaded blob and metadata
 */
export async function loadFromLocalStorage(key) {
  try {
    const stored = localStorage.getItem(`bwt_compressed_${key}`);
    if (!stored) {
      throw new Error('Item not found in localStorage');
    }
    
    const storageItem = JSON.parse(stored);
    const bytes = base64ToBytes(storageItem.data);
    const blob = new Blob([bytes], { type: 'application/octet-stream' });
    
    return { blob, meta: storageItem.meta };
  } catch (error) {
    throw new Error(`Failed to load from localStorage: ${error.message}`);
  }
}

/**
 * List all saved compressed items in localStorage
 * @returns {Array<{key: string, meta: Object, savedAt: string, size: number}>} - List of saved items
 */
export function listSavedItems() {
  const items = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('bwt_compressed_')) {
      try {
        const stored = localStorage.getItem(key);
        const storageItem = JSON.parse(stored);
        const shortKey = key.replace('bwt_compressed_', '');
        
        items.push({
          key: shortKey,
          meta: storageItem.meta,
          savedAt: storageItem.savedAt,
          size: storageItem.size
        });
      } catch (error) {
        console.warn(`Failed to parse stored item ${key}:`, error);
      }
    }
  }
  
  return items.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
}

/**
 * Delete saved item from localStorage
 * @param {string} key - Storage key
 */
export function deleteSavedItem(key) {
  localStorage.removeItem(`bwt_compressed_${key}`);
}