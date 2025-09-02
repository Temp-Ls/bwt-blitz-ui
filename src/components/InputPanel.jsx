import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, Type, Image } from 'lucide-react';

export function InputPanel({ onInputChange, isProcessing }) {
  const [textInput, setTextInput] = useState('');
  const [activeTab, setActiveTab] = useState('text');

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    onInputChange(file, 'file');
    event.target.value = ''; // Reset file input
  }, [onInputChange]);

  const handleTextSubmit = useCallback(() => {
    if (textInput.trim()) {
      onInputChange(textInput, 'text');
    }
  }, [textInput, onInputChange]);

  const loadSampleText = useCallback(() => {
    const sampleText = `BANANA BANDANA CANADA CABANA ABACABA
This is a sample text with repetitive patterns that should compress well using BWT.
AAAAAAAAAAAAAAAAAAAA
BBBBBBBBBBBBBBBBBBBB
The quick brown fox jumps over the lazy dog.
Lorem ipsum dolor sit amet, consectetur adipiscing elit.`;
    setTextInput(sampleText);
    onInputChange(sampleText, 'text');
  }, [onInputChange]);

  return (
    <Card className="bg-gradient-surface border-tech-border shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 gradient-text">
          <Type className="h-5 w-5" />
          Input Data
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-tech-surface">
            <TabsTrigger value="text" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Type className="h-4 w-4 mr-2" />
              Text
            </TabsTrigger>
            <TabsTrigger value="file" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="h-4 w-4 mr-2" />
              File
            </TabsTrigger>
            <TabsTrigger value="image" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Image className="h-4 w-4 mr-2" />
              Image
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4">
            <Textarea
              placeholder="Enter text to compress using BWT algorithm...
              
Try pasting repetitive text for better compression ratios!"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="min-h-[200px] font-mono bg-tech-surface border-tech-border focus:ring-primary"
              disabled={isProcessing}
            />
            <div className="flex gap-2">
              <Button 
                onClick={handleTextSubmit}
                disabled={!textInput.trim() || isProcessing}
                className="bg-gradient-primary hover:opacity-90 transition-all duration-300"
              >
                {isProcessing ? 'Processing...' : 'Compress Text'}
              </Button>
              <Button 
                variant="outline" 
                onClick={loadSampleText}
                disabled={isProcessing}
                className="border-tech-border hover:bg-tech-surface"
              >
                Load Sample
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="file" className="space-y-4">
            <div className="border-2 border-dashed border-tech-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <Input
                type="file"
                accept=".txt,.log,.md,.csv,.json,.xml,.html,.css,.js"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={isProcessing}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="text-sm text-muted-foreground mb-2">
                  Click to upload a text/document file
                </div>
                <Button variant="outline" disabled={isProcessing} className="border-tech-border">
                  Choose File
                </Button>
              </label>
              <p className="text-xs text-muted-foreground mt-2">
                Supports: .txt, .log, .md, .csv, .json, .xml, .html, .css, .js
              </p>
            </div>
          </TabsContent>

          <TabsContent value="image" className="space-y-4">
            <div className="border-2 border-dashed border-tech-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <Image className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <Input
                type="file"
                accept="image/*,.png,.jpg,.jpeg,.gif,.bmp,.webp"
                onChange={handleFileUpload}
                className="hidden"
                id="image-upload"
                disabled={isProcessing}
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <div className="text-sm text-muted-foreground mb-2">
                  Click to upload an image file
                </div>
                <Button variant="outline" disabled={isProcessing} className="border-tech-border">
                  Choose Image
                </Button>
              </label>
              <p className="text-xs text-muted-foreground mt-2">
                Supports: PNG, JPG, GIF, BMP, WebP (treated as binary data)
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 p-3 bg-tech-surface rounded-lg border border-tech-border">
          <h4 className="text-sm font-medium mb-2">Binary-Safe Processing</h4>
          <p className="text-xs text-muted-foreground">
            All input is processed as binary data (Uint8Array) internally. 
            Text is UTF-8 encoded, files/images are processed byte-by-byte.
            Compression preserves exact original bytes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}