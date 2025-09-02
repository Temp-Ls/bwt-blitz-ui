import React, { useState } from 'react';
import { InputPanel } from './InputPanel.jsx';
import { ResultPanel } from './ResultPanel.jsx';
import { SavedList } from './SavedList.jsx';
import { 
  compressFromText, 
  compressFromFile, 
  decompressToText, 
  decompressFileBlob,
  saveToLocalStorage,
  downloadBytes 
} from '../utils/io.js';
import { parseCompressedFile } from '../algorithms/serialization.js';
import { Binary, ChevronRight, Github, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function App() {
  const [compressionResult, setCompressionResult] = useState(null);
  const [decompressedResult, setDecompressedResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputType, setInputType] = useState(null);

  const handleInputChange = async (input, type) => {
    setIsProcessing(true);
    setDecompressedResult(null);
    setInputType(type);
    
    try {
      let result;
      
      if (type === 'text') {
        // Text input
        const blob = compressFromText(input, 'text.txt');
        const arrayBuffer = await blob.arrayBuffer();
        const { meta, payloadUint8Array } = await parseCompressedFile(blob);
        
        result = {
          ...meta,
          compressedData: arrayBuffer,
          blob: blob
        };
      } else if (type === 'file') {
        // File input (File object)
        const { blob, meta } = await compressFromFile(input);
        
        result = {
          ...meta,
          compressedData: await blob.arrayBuffer(),
          blob: blob
        };
      }
      
      setCompressionResult(result);
    } catch (error) {
      console.error('Compression failed:', error);
      alert('Compression failed: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecompress = async () => {
    if (!compressionResult) return;
    
    setIsProcessing(true);
    
    try {
      if (inputType === 'text') {
        // Decompress as text
        const { text, meta } = await decompressToText(compressionResult.blob);
        setDecompressedResult({
          success: true,
          text: text,
          meta: meta,
          processingTime: performance.now() // Simplified for demo
        });
      } else {
        // Decompress as binary file
        const { fileBytes, meta } = await decompressFileBlob(compressionResult.blob);
        setDecompressedResult({
          success: true,
          fileBytes: fileBytes,
          meta: meta,
          processingTime: performance.now() // Simplified for demo
        });
      }
    } catch (error) {
      console.error('Decompression failed:', error);
      setDecompressedResult({
        success: false,
        error: error.message,
        processingTime: performance.now()
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!compressionResult?.blob) return;
    
    const url = URL.createObjectURL(compressionResult.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${compressionResult.originalFilename || 'compressed'}.bwt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = async () => {
    if (!compressionResult?.blob) return;
    
    try {
      const key = `${Date.now()}_${compressionResult.originalFilename || 'untitled'}`;
      await saveToLocalStorage(key, compressionResult.blob, compressionResult);
      alert('Compressed file saved to localStorage successfully!');
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save: ' + error.message);
    }
  };

  const handleLoadSaved = async (blob, meta) => {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      setCompressionResult({
        ...meta,
        compressedData: arrayBuffer,
        blob: blob
      });
      setDecompressedResult(null);
      setInputType(meta.encoding === 'utf-8' ? 'text' : 'file');
    } catch (error) {
      console.error('Load failed:', error);
      alert('Failed to load saved item: ' + error.message);
    }
  };

  const handleReset = () => {
    setCompressionResult(null);
    setDecompressedResult(null);
    setInputType(null);
  };

  const handleUploadCompressed = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    handleLoadSaved(file, {});
    event.target.value = ''; // Reset file input
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-tech-dark via-background to-tech-surface">
      {/* Header */}
      <header className="border-b border-tech-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-primary p-2 rounded-lg">
                <Binary className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">Binary-Safe BWT Compression</h1>
                <p className="text-sm text-muted-foreground">Burrows-Wheeler Transform • Move-to-Front • Run-Length Encoding</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              <span>BWT</span>
              <ChevronRight className="h-4 w-4" />
              <span>MTF</span>
              <ChevronRight className="h-4 w-4" />
              <span>RLE</span>
            </div>
          </div>
        </div>
      </header>

      {/* Upload Compressed File */}
      <div className="container mx-auto px-6 py-4">
        <Card className="bg-gradient-surface border-tech-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium">Upload Previously Compressed File:</label>
                <input
                  type="file"
                  accept=".bwt"
                  onChange={handleUploadCompressed}
                  className="hidden"
                  id="compressed-upload"
                  disabled={isProcessing}
                />
                <label htmlFor="compressed-upload">
                  <Button variant="outline" className="ml-3 border-tech-border" disabled={isProcessing}>
                    Choose .bwt File
                  </Button>
                </label>
              </div>
              <div className="text-xs text-muted-foreground">
                Upload .bwt files created by this app to decompress
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="space-y-6">
            <InputPanel 
              onInputChange={handleInputChange}
              isProcessing={isProcessing}
            />
          </div>
          
          <div className="space-y-6">
            <ResultPanel
              result={compressionResult}
              decompressedResult={decompressedResult}
              onDownload={handleDownload}
              onDecompress={handleDecompress}
              onSave={handleSave}
              onReset={handleReset}
              isProcessing={isProcessing}
            />
          </div>
        </div>

        {/* Saved Items */}
        <div className="mb-8">
          <SavedList
            onLoadSaved={handleLoadSaved}
            isProcessing={isProcessing}
          />
        </div>

        {/* Algorithm Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-surface border-tech-border">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Binary className="h-5 w-5 text-primary" />
                Burrows-Wheeler Transform
              </h3>
              <p className="text-sm text-muted-foreground">
                Rearranges bytes to group similar patterns together using suffix arrays. 
                Fully reversible and binary-safe.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-surface border-tech-border">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Binary className="h-5 w-5 text-primary" />
                Move-to-Front Transform
              </h3>
              <p className="text-sm text-muted-foreground">
                Converts frequently occurring bytes to smaller values using a dynamic alphabet. 
                Works on full byte range (0-255).
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-surface border-tech-border">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Binary className="h-5 w-5 text-primary" />
                Run-Length Encoding
              </h3>
              <p className="text-sm text-muted-foreground">
                Efficiently compresses repeated byte sequences using escape-based encoding. 
                Handles binary data safely.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Technical Details */}
        <Card className="bg-gradient-surface border-tech-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Technical Implementation</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-muted-foreground">
              <div>
                <h4 className="font-medium text-foreground mb-2">Binary Safety</h4>
                <ul className="space-y-1">
                  <li>• All algorithms operate on Uint8Array internally</li>
                  <li>• Text converted via UTF-8 encoding/decoding</li>
                  <li>• Images and files processed byte-by-byte</li>
                  <li>• Exact byte-perfect reconstruction guaranteed</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">File Format</h4>
                <ul className="space-y-1">
                  <li>• Magic header: "BWTJS1\0" (7 bytes)</li>
                  <li>• 4-byte big-endian metadata length</li>
                  <li>• UTF-8 JSON metadata with all recovery info</li>
                  <li>• Binary compressed payload</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default App;