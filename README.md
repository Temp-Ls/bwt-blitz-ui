# Binary-Safe BWT Compression Tool

A complete React application implementing the Burrows-Wheeler Transform (BWT) compression pipeline with binary-safe processing for text, files, and images.

## Features

- **Binary-Safe Processing**: All algorithms operate on Uint8Array internally
- **Complete BWT Pipeline**: BWT → Move-to-Front → Run-Length Encoding  
- **Universal Input Support**: Text, documents, and images
- **Serialization Format**: Custom BWTJS1 format with metadata
- **Browser Storage**: Save/load compressed files from localStorage
- **Real-time Stats**: Compression ratios, processing times, file info

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Architecture

### Algorithms (src/algorithms/)
- `bwt.js` - Binary-safe Burrows-Wheeler Transform
- `mtf.js` - Move-to-Front with 256-byte alphabet  
- `rle.js` - Run-Length Encoding with escape sequences
- `pipeline.js` - Complete compression pipeline
- `serialization.js` - BWTJS1 binary format

### File Format
```
Magic Header: "BWTJS1\0" (7 bytes)
Metadata Length: 4-byte big-endian uint32  
JSON Metadata: UTF-8 encoded metadata
Binary Payload: Compressed data
```

### Testing
Comprehensive test suite covering:
- Unit tests for each algorithm
- Binary safety validation  
- Roundtrip integrity tests
- UI integration tests
- Serialization format compliance

## Usage

1. **Input**: Choose text, file, or image input
2. **Compress**: Process through BWT pipeline
3. **Download**: Save as .bwt file
4. **Upload**: Load .bwt files for decompression
5. **Verify**: Test roundtrip integrity

## Technical Details

- **Binary Safety**: Preserves exact byte sequences
- **UTF-8 Support**: Proper text encoding/decoding
- **Error Handling**: Graceful failure recovery
- **Performance**: Optimized for browser environment
- **Compatibility**: Modern browsers with ES6+ support