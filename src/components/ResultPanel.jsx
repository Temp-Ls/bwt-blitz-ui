import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, ArrowLeft, BarChart3, Zap, Clock, FileArchive, Eye, Save } from 'lucide-react';

export function ResultPanel({ 
  result, 
  decompressedResult, 
  onDownload, 
  onDecompress, 
  onReset,
  onSave,
  isProcessing 
}) {
  const [previewUrl, setPreviewUrl] = useState(null);

  React.useEffect(() => {
    // Clean up preview URL on unmount
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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
            <p className="text-sm mt-2">
              Upload text, files, or images to see binary-safe BWT compression in action
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatTime = (ms) => {
    return `${ms.toFixed(2)} ms`;
  };

  const compressionPercent = ((1 - result.compressionRatio) * 100).toFixed(1);
  const isCompressionEffective = result.compressionRatio < 1;

  const handlePreview = () => {
    if (decompressedResult && decompressedResult.fileBytes) {
      const blob = new Blob([decompressedResult.fileBytes], { 
        type: decompressedResult.meta.mimeType 
      });
      const url = URL.createObjectURL(blob);
      
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      
      setPreviewUrl(url);
      
      if (decompressedResult.meta.mimeType.startsWith('image/')) {
        // For images, open in new tab
        window.open(url, '_blank');
      } else {
        // For other files, trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = decompressedResult.meta.originalFilename;
        a.click();
      }
    }
  };

  return (
    <Card className="bg-gradient-surface border-tech-border shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 gradient-text">
            <BarChart3 className="h-5 w-5" />
            Compression Results
          </div>
          <div className="flex gap-2">
            {onSave && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onSave}
                className="border-tech-border hover:bg-tech-surface"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onReset}
              className="border-tech-border hover:bg-tech-surface"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Info */}
        <div className="bg-tech-surface rounded-lg p-3 border border-tech-border">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">File:</span>
              <span className="ml-2 font-mono">{result.originalFilename || 'untitled'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Type:</span>
              <span className="ml-2">{result.mimeType}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Encoding:</span>
              <Badge variant="secondary" className="ml-2">
                {result.encoding || 'binary'}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Pipeline:</span>
              <span className="ml-2 font-mono text-xs">
                {result.pipeline?.join(' → ') || 'BWT → MTF → RLE'}
              </span>
            </div>
          </div>
        </div>

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

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
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
          {decompressedResult && decompressedResult.success && (
            <Button 
              variant="outline" 
              onClick={handlePreview}
              className="border-tech-border hover:bg-tech-surface"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview/Download Original
            </Button>
          )}
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
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="default" className="bg-green-500">✓ Success</Badge>
                  <span className="text-sm text-muted-foreground">
                    Processed in {formatTime(decompressedResult.processingTime)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    • {formatBytes(decompressedResult.fileBytes?.length || 0)} bytes recovered
                  </span>
                </div>
                
                {decompressedResult.text ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Decompressed Text:</label>
                    <Textarea 
                      value={decompressedResult.text} 
                      readOnly 
                      className="font-mono bg-tech-surface border-tech-border min-h-[100px]"
                    />
                  </div>
                ) : (
                  <div className="bg-tech-surface rounded-lg p-4 border border-tech-border">
                    <p className="text-sm text-muted-foreground mb-2">
                      Binary file successfully decompressed:
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span>
                        <strong>Filename:</strong> {decompressedResult.meta?.originalFilename}
                      </span>
                      <span>
                        <strong>Type:</strong> {decompressedResult.meta?.mimeType}
                      </span>
                      <span>
                        <strong>Size:</strong> {formatBytes(decompressedResult.fileBytes?.length || 0)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Badge variant="destructive">✗ Failed</Badge>
                <p className="text-sm text-destructive">
                  {decompressedResult.error || 'Unknown error occurred during decompression'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Technical Details */}
        <div className="border-t border-tech-border pt-4">
          <h4 className="font-medium mb-2">Technical Details</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Binary-safe BWT with suffix array implementation</p>
            <p>• Primary index: {result.primaryIndex}</p>
            <p>• Algorithm version: {result.algorithm || 'BWT+MTF+RLE'} v{result.version || '1.0'}</p>
            <p>• Serialization format: BWTJS1 with JSON metadata header</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}