import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Archive, Download, Trash2, Clock, FileText } from 'lucide-react';
import { listSavedItems, loadFromLocalStorage, deleteSavedItem } from '../utils/io.js';

export function SavedList({ onLoadSaved, isProcessing }) {
  const [savedItems, setSavedItems] = useState([]);

  const loadSavedItems = () => {
    try {
      const items = listSavedItems();
      setSavedItems(items);
    } catch (error) {
      console.error('Failed to load saved items:', error);
    }
  };

  useEffect(() => {
    loadSavedItems();
  }, []);

  const handleLoadItem = async (key) => {
    try {
      const { blob, meta } = await loadFromLocalStorage(key);
      onLoadSaved(blob, meta);
    } catch (error) {
      console.error('Failed to load item:', error);
      alert('Failed to load saved item: ' + error.message);
    }
  };

  const handleDeleteItem = (key) => {
    if (window.confirm('Are you sure you want to delete this saved item?')) {
      try {
        deleteSavedItem(key);
        loadSavedItems(); // Refresh the list
      } catch (error) {
        console.error('Failed to delete item:', error);
        alert('Failed to delete item: ' + error.message);
      }
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString() + ' ' + 
           new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="bg-gradient-surface border-tech-border shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 gradient-text">
            <Archive className="h-5 w-5" />
            Saved Compressed Files
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadSavedItems}
            className="border-tech-border hover:bg-tech-surface"
          >
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {savedItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No saved compressed files</p>
            <p className="text-sm mt-2">
              Use the "Save" button in the results panel to save compressed files locally
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedItems.map((item) => (
              <div 
                key={item.key}
                className="bg-tech-surface rounded-lg p-4 border border-tech-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">
                      {item.meta.originalFilename || 'untitled'}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {item.meta.encoding || 'binary'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {item.meta.mimeType?.split('/')[0] || 'file'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLoadItem(item.key)}
                      disabled={isProcessing}
                      className="border-tech-border hover:bg-primary hover:text-primary-foreground"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Load
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteItem(item.key)}
                      disabled={isProcessing}
                      className="border-tech-border hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    <span>Original: {formatBytes(item.meta.originalSize || 0)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Archive className="h-3 w-3" />
                    <span>Compressed: {formatBytes(item.size)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(item.savedAt)}</span>
                  </div>
                  <div>
                    <span>Ratio: {(item.meta.compressionRatio * 100).toFixed(1)}%</span>
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-muted-foreground">
                  Pipeline: {item.meta.pipeline?.join(' → ') || 'BWT → MTF → RLE'}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}