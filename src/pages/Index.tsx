import React, { useState } from 'react';
import { InputPanel } from '@/components/InputPanel';
import { ResultPanel } from '@/components/ResultPanel';
import { compress, decompress, CompressionResult, DecompressionResult } from '@/algorithms/compression';
import { Zap, Binary, ChevronRight } from 'lucide-react';

const Index = () => {
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);
  const [decompressionResult, setDecompressionResult] = useState<DecompressionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleInputChange = async (text: string, type: 'text' | 'file') => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    setDecompressionResult(null);
    
    try {
      // Add a small delay to show processing state
      await new Promise(resolve => setTimeout(resolve, 100));
      const result = compress(text);
      setCompressionResult(result);
    } catch (error) {
      console.error('Compression failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecompress = async () => {
    if (!compressionResult) return;
    
    setIsProcessing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const result = decompress(
        compressionResult.compressedData, 
        compressionResult.metadata.originalIndex
      );
      setDecompressionResult(result);
    } catch (error) {
      console.error('Decompression failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!compressionResult) return;
    
    const blob = new Blob([compressionResult.compressedData], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'compressed_data.bwt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setCompressionResult(null);
    setDecompressionResult(null);
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
                <h1 className="text-2xl font-bold gradient-text">BWT Compression</h1>
                <p className="text-sm text-muted-foreground">Burrows-Wheeler Transform Pipeline</p>
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

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <InputPanel 
              onInputChange={handleInputChange}
              isProcessing={isProcessing}
            />
          </div>
          
          <div className="space-y-6">
            <ResultPanel
              result={compressionResult}
              decompressedResult={decompressionResult}
              onDownload={handleDownload}
              onDecompress={handleDecompress}
              onReset={handleReset}
              isProcessing={isProcessing}
            />
          </div>
        </div>

        {/* Algorithm Info */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-surface rounded-lg p-6 border border-tech-border">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Burrows-Wheeler Transform
            </h3>
            <p className="text-sm text-muted-foreground">
              Rearranges characters to group similar ones together, improving compressibility.
            </p>
          </div>
          
          <div className="bg-gradient-surface rounded-lg p-6 border border-tech-border">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Move-to-Front
            </h3>
            <p className="text-sm text-muted-foreground">
              Transforms frequently occurring characters to smaller index values.
            </p>
          </div>
          
          <div className="bg-gradient-surface rounded-lg p-6 border border-tech-border">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Run-Length Encoding
            </h3>
            <p className="text-sm text-muted-foreground">
              Compresses sequences of identical characters into count-value pairs.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
