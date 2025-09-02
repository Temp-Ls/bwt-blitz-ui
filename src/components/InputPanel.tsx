import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, Type } from 'lucide-react';

interface InputPanelProps {
  onInputChange: (text: string, type: 'text' | 'file') => void;
  isProcessing: boolean;
}

export function InputPanel({ onInputChange, isProcessing }: InputPanelProps) {
  const [textInput, setTextInput] = useState('');
  const [activeTab, setActiveTab] = useState('text');

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onInputChange(result, 'file');
    };
    reader.readAsText(file);
  }, [onInputChange]);

  const handleTextSubmit = useCallback(() => {
    if (textInput.trim()) {
      onInputChange(textInput, 'text');
    }
  }, [textInput, onInputChange]);

  const loadSampleText = useCallback(() => {
    const sampleText = "BANANA BANDANA CANADA CABANA ABACABA";
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
          <TabsList className="grid w-full grid-cols-2 bg-tech-surface">
            <TabsTrigger value="text" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Type className="h-4 w-4 mr-2" />
              Text Input
            </TabsTrigger>
            <TabsTrigger value="file" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="h-4 w-4 mr-2" />
              File Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4">
            <Textarea
              placeholder="Enter text to compress using BWT algorithm..."
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
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <Input
                type="file"
                accept=".txt,.log,.md,.csv"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={isProcessing}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="text-sm text-muted-foreground mb-2">
                  Click to upload a text file
                </div>
                <Button variant="outline" disabled={isProcessing} className="border-tech-border">
                  Choose File
                </Button>
              </label>
              <p className="text-xs text-muted-foreground mt-2">
                Supports: .txt, .log, .md, .csv files
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}