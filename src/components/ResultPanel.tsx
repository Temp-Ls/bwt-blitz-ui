import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, ArrowLeft, BarChart3, Zap, Clock, FileArchive } from 'lucide-react';
import { CompressionResult, DecompressionResult } from '@/algorithms/compression';

interface ResultPanelProps {
  result: CompressionResult | null;
  decompressedResult: DecompressionResult | null;
  onDownload: () => void;
  onDecompress: () => void;
  onReset: () => void;
  isProcessing: boolean;
}

export function ResultPanel({ 
  result, 
  decompressedResult, 
  onDownload, 
  onDecompress, 
  onReset,
  isProcessing 
}: ResultPanelProps) {
  if (!result) {
    return (
      <Card className="bg-gradient-surface border-tech-border shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <BarChart3 className="h-5 w-5" />
            Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <FileArchive className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>Compression results will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatTime = (ms: number) => {
    return `${ms.toFixed(2)} ms`;
  };

  const compressionPercent = ((1 - result.compressionRatio) * 100).toFixed(1);
  const isCompressionEffective = result.compressionRatio < 1;

  return (
    <Card className="bg-gradient-surface border-tech-border shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 gradient-text">
            <BarChart3 className="h-5 w-5" />
            Compression Results
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onReset}
            className="border-tech-border hover:bg-tech-surface"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-tech-surface rounded-lg p-3 border border-tech-border">
            <div className="text-xs text-muted-foreground">Original Size</div>
            <div className="text-lg font-mono">{formatBytes(result.originalSize)}</div>
          </div>
          <div className="bg-tech-surface rounded-lg p-3 border border-tech-border">
            <div className="text-xs text-muted-foreground">Compressed Size</div>
            <div className="text-lg font-mono">{formatBytes(result.compressedSize)}</div>
          </div>
          <div className="bg-tech-surface rounded-lg p-3 border border-tech-border">
            <div className="text-xs text-muted-foreground">Compression</div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-mono">
                {isCompressionEffective ? `-${compressionPercent}%` : `+${Math.abs(parseFloat(compressionPercent)).toFixed(1)}%`}
              </span>
              <Badge variant={isCompressionEffective ? "default" : "destructive"} className="text-xs">
                {isCompressionEffective ? "Effective" : "Expanded"}
              </Badge>
            </div>
          </div>
          <div className="bg-tech-surface rounded-lg p-3 border border-tech-border">
            <div className="text-xs text-muted-foreground">Processing Time</div>
            <div className="text-lg font-mono flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatTime(result.processingTime)}
            </div>
          </div>
        </div>

        {/* Pipeline Steps */}
        <Tabs defaultValue="final" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-tech-surface">
            <TabsTrigger value="bwt" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              BWT
            </TabsTrigger>
            <TabsTrigger value="mtf" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              MTF
            </TabsTrigger>
            <TabsTrigger value="rle" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              RLE
            </TabsTrigger>
            <TabsTrigger value="final" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Final
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bwt">
            <div className="space-y-2">
              <label className="text-sm font-medium">After Burrows-Wheeler Transform:</label>
              <Textarea 
                value={result.steps.bwt} 
                readOnly 
                className="font-mono bg-tech-surface border-tech-border min-h-[100px]"
              />
            </div>
          </TabsContent>

          <TabsContent value="mtf">
            <div className="space-y-2">
              <label className="text-sm font-medium">After Move-to-Front Transform:</label>
              <Textarea 
                value={result.steps.mtf} 
                readOnly 
                className="font-mono bg-tech-surface border-tech-border min-h-[100px]"
              />
            </div>
          </TabsContent>

          <TabsContent value="rle">
            <div className="space-y-2">
              <label className="text-sm font-medium">After Run-Length Encoding:</label>
              <Textarea 
                value={result.steps.rle} 
                readOnly 
                className="font-mono bg-tech-surface border-tech-border min-h-[100px]"
              />
            </div>
          </TabsContent>

          <TabsContent value="final">
            <div className="space-y-2">
              <label className="text-sm font-medium">Final Compressed Data:</label>
              <Textarea 
                value={result.compressedData} 
                readOnly 
                className="font-mono bg-tech-surface border-tech-border min-h-[100px]"
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex gap-3">
          <Button 
            onClick={onDownload}
            className="bg-gradient-primary hover:opacity-90 transition-all duration-300"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Compressed
          </Button>
          <Button 
            variant="outline" 
            onClick={onDecompress}
            disabled={isProcessing}
            className="border-tech-border hover:bg-tech-surface"
          >
            <Zap className="h-4 w-4 mr-2" />
            Test Decompress
          </Button>
        </div>

        {/* Decompression Result */}
        {decompressedResult && (
          <div className="border-t border-tech-border pt-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Decompression Test
            </h4>
            {decompressedResult.success ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-500">Success</Badge>
                  <span className="text-sm text-muted-foreground">
                    Processed in {formatTime(decompressedResult.processingTime)}
                  </span>
                </div>
                <Textarea 
                  value={decompressedResult.originalData} 
                  readOnly 
                  className="font-mono bg-tech-surface border-tech-border min-h-[100px]"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Badge variant="destructive">Failed</Badge>
                <p className="text-sm text-destructive">
                  {decompressedResult.error || 'Unknown error occurred'}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}