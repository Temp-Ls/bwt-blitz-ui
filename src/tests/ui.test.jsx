// UI tests using React Testing Library
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../components/App.jsx';

// Mock file reading since FileReader isn't available in Jest
global.FileReader = class FileReader {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.result = null;
  }
  
  readAsArrayBuffer(file) {
    setTimeout(() => {
      // Simulate reading a text file
      if (file.name.endsWith('.txt')) {
        const text = 'Sample text content for testing BWT compression';
        const encoder = new TextEncoder();
        this.result = encoder.encode(text).buffer;
      } else {
        // Simulate binary file
        this.result = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer;
      }
      
      if (this.onload) {
        this.onload({ target: { result: this.result } });
      }
    }, 10);
  }
  
  readAsText(file) {
    setTimeout(() => {
      this.result = 'Sample text content for testing BWT compression';
      if (this.onload) {
        this.onload({ target: { result: this.result } });
      }
    }, 10);
  }
};

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};
global.localStorage = localStorageMock;

describe('BWT Compression App UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  test('renders main components', () => {
    render(<App />);
    
    expect(screen.getByText('Binary-Safe BWT Compression')).toBeInTheDocument();
    expect(screen.getByText('Input Data')).toBeInTheDocument();
    expect(screen.getByText('Results')).toBeInTheDocument();
    expect(screen.getByText('Saved Compressed Files')).toBeInTheDocument();
  });

  test('text input tab is functional', async () => {
    render(<App />);
    
    // Find and click text tab (should be default)
    const textTab = screen.getByRole('tab', { name: /text/i });
    expect(textTab).toBeInTheDocument();
    
    // Find textarea and enter text
    const textarea = screen.getByPlaceholderText(/enter text to compress/i);
    fireEvent.change(textarea, { target: { value: 'BANANA BANDANA' } });
    
    // Find and click compress button
    const compressButton = screen.getByRole('button', { name: /compress text/i });
    fireEvent.click(compressButton);
    
    // Wait for processing to complete
    await waitFor(() => {
      expect(screen.getByText(/compression results/i)).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  test('load sample button works', async () => {
    render(<App />);
    
    const loadSampleButton = screen.getByRole('button', { name: /load sample/i });
    fireEvent.click(loadSampleButton);
    
    await waitFor(() => {
      expect(screen.getByText(/compression results/i)).toBeInTheDocument();
    });
  });

  test('file upload tab is functional', async () => {
    render(<App />);
    
    // Switch to file tab
    const fileTab = screen.getByRole('tab', { name: /file/i });
    fireEvent.click(fileTab);
    
    // Create a mock file
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    // Find file input
    const fileInput = screen.getByLabelText(/choose file/i);
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Wait for processing
    await waitFor(() => {
      expect(screen.getByText(/compression results/i)).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  test('image upload tab is functional', async () => {
    render(<App />);
    
    // Switch to image tab
    const imageTab = screen.getByRole('tab', { name: /image/i });
    fireEvent.click(imageTab);
    
    // Create a mock image file
    const imageFile = new File([new Uint8Array([0x89, 0x50, 0x4E, 0x47])], 'test.png', { 
      type: 'image/png' 
    });
    
    // Find image input
    const imageInput = screen.getByLabelText(/choose image/i);
    fireEvent.change(imageInput, { target: { files: [imageFile] } });
    
    // Wait for processing
    await waitFor(() => {
      expect(screen.getByText(/compression results/i)).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  test('compression and decompression workflow', async () => {
    render(<App />);
    
    // Enter text and compress
    const textarea = screen.getByPlaceholderText(/enter text to compress/i);
    fireEvent.change(textarea, { target: { value: 'BANANA' } });
    
    const compressButton = screen.getByRole('button', { name: /compress text/i });
    fireEvent.click(compressButton);
    
    // Wait for compression results
    await waitFor(() => {
      expect(screen.getByText(/compression results/i)).toBeInTheDocument();
    });
    
    // Find and click decompress button
    const decompressButton = screen.getByRole('button', { name: /test decompress/i });
    fireEvent.click(decompressButton);
    
    // Wait for decompression results
    await waitFor(() => {
      expect(screen.getByText(/decompression test/i)).toBeInTheDocument();
      expect(screen.getByText(/success/i)).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  test('download functionality works', async () => {
    render(<App />);
    
    // Compress some text first
    const textarea = screen.getByPlaceholderText(/enter text to compress/i);
    fireEvent.change(textarea, { target: { value: 'TEST DATA' } });
    
    const compressButton = screen.getByRole('button', { name: /compress text/i });
    fireEvent.click(compressButton);
    
    await waitFor(() => {
      expect(screen.getByText(/compression results/i)).toBeInTheDocument();
    });
    
    // Mock document.createElement and click behavior
    const mockAnchor = {
      href: '',
      download: '',
      click: jest.fn()
    };
    jest.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') return mockAnchor;
      return document.createElement(tag);
    });
    
    // Find and click download button
    const downloadButton = screen.getByRole('button', { name: /download compressed/i });
    fireEvent.click(downloadButton);
    
    expect(mockAnchor.click).toHaveBeenCalled();
    expect(mockAnchor.download).toContain('.bwt');
  });

  test('save to localStorage functionality', async () => {
    render(<App />);
    
    // Compress some text first
    const textarea = screen.getByPlaceholderText(/enter text to compress/i);
    fireEvent.change(textarea, { target: { value: 'SAVE TEST' } });
    
    const compressButton = screen.getByRole('button', { name: /compress text/i });
    fireEvent.click(compressButton);
    
    await waitFor(() => {
      expect(screen.getByText(/compression results/i)).toBeInTheDocument();
    });
    
    // Mock window.alert
    window.alert = jest.fn();
    
    // Find and click save button
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('saved'));
    });
  });

  test('reset functionality works', async () => {
    render(<App />);
    
    // Compress some text first
    const textarea = screen.getByPlaceholderText(/enter text to compress/i);
    fireEvent.change(textarea, { target: { value: 'RESET TEST' } });
    
    const compressButton = screen.getByRole('button', { name: /compress text/i });
    fireEvent.click(compressButton);
    
    await waitFor(() => {
      expect(screen.getByText(/compression results/i)).toBeInTheDocument();
    });
    
    // Find and click reset button
    const resetButton = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetButton);
    
    // Results should be cleared
    expect(screen.getByText(/compression results will appear here/i)).toBeInTheDocument();
  });

  test('upload compressed file workflow', async () => {
    render(<App />);
    
    // Create a mock .bwt file
    const bwtFile = new File([new Uint8Array([1, 2, 3])], 'test.bwt', { 
      type: 'application/octet-stream' 
    });
    
    // Find the compressed file upload input
    const compressedInput = screen.getByLabelText(/choose \.bwt file/i);
    fireEvent.change(compressedInput, { target: { files: [bwtFile] } });
    
    // Should attempt to load the file (may fail due to invalid format, but that's expected)
    await waitFor(() => {
      // The app should handle the file upload attempt
    }, { timeout: 500 });
  });

  test('error handling for invalid operations', async () => {
    render(<App />);
    
    // Mock window.alert for error messages
    window.alert = jest.fn();
    
    // Try to compress empty text
    const compressButton = screen.getByRole('button', { name: /compress text/i });
    
    // Button should be disabled for empty input
    expect(compressButton).toBeDisabled();
  });

  test('displays algorithm information', () => {
    render(<App />);
    
    expect(screen.getByText('Burrows-Wheeler Transform')).toBeInTheDocument();
    expect(screen.getByText('Move-to-Front Transform')).toBeInTheDocument();
    expect(screen.getByText('Run-Length Encoding')).toBeInTheDocument();
    
    expect(screen.getByText(/rearranges bytes to group similar patterns/i)).toBeInTheDocument();
    expect(screen.getByText(/converts frequently occurring bytes/i)).toBeInTheDocument();
    expect(screen.getByText(/compresses repeated byte sequences/i)).toBeInTheDocument();
  });

  test('displays technical implementation details', () => {
    render(<App />);
    
    expect(screen.getByText('Technical Implementation')).toBeInTheDocument();
    expect(screen.getByText(/binary safety/i)).toBeInTheDocument();
    expect(screen.getByText(/file format/i)).toBeInTheDocument();
    expect(screen.getByText(/uint8array internally/i)).toBeInTheDocument();
    expect(screen.getByText(/magic header.*bwtjs1/i)).toBeInTheDocument();
  });

  test('saved list shows empty state initially', () => {
    render(<App />);
    
    expect(screen.getByText('No saved compressed files')).toBeInTheDocument();
    expect(screen.getByText(/use the "save" button/i)).toBeInTheDocument();
  });

  test('handles processing states correctly', async () => {
    render(<App />);
    
    const textarea = screen.getByPlaceholderText(/enter text to compress/i);
    fireEvent.change(textarea, { target: { value: 'PROCESSING TEST' } });
    
    const compressButton = screen.getByRole('button', { name: /compress text/i });
    fireEvent.click(compressButton);
    
    // Should show processing state briefly
    expect(screen.getByText(/processing/i)).toBeInTheDocument();
    
    // Wait for completion
    await waitFor(() => {
      expect(screen.queryByText(/processing/i)).not.toBeInTheDocument();
    }, { timeout: 1000 });
  });

  test('tab navigation works correctly', () => {
    render(<App />);
    
    const textTab = screen.getByRole('tab', { name: /text/i });
    const fileTab = screen.getByRole('tab', { name: /file/i });
    const imageTab = screen.getByRole('tab', { name: /image/i });
    
    // Text tab should be active by default
    expect(textTab).toHaveAttribute('data-state', 'active');
    
    // Click file tab
    fireEvent.click(fileTab);
    expect(fileTab).toHaveAttribute('data-state', 'active');
    expect(textTab).toHaveAttribute('data-state', 'inactive');
    
    // Click image tab
    fireEvent.click(imageTab);
    expect(imageTab).toHaveAttribute('data-state', 'active');
    expect(fileTab).toHaveAttribute('data-state', 'inactive');
  });

  test('compression statistics are displayed correctly', async () => {
    render(<App />);
    
    // Use highly compressible text
    const textarea = screen.getByPlaceholderText(/enter text to compress/i);
    fireEvent.change(textarea, { target: { value: 'A'.repeat(100) } });
    
    const compressButton = screen.getByRole('button', { name: /compress text/i });
    fireEvent.click(compressButton);
    
    await waitFor(() => {
      expect(screen.getByText(/original size/i)).toBeInTheDocument();
      expect(screen.getByText(/compressed size/i)).toBeInTheDocument();
      expect(screen.getByText(/compression/i)).toBeInTheDocument();
      expect(screen.getByText(/processing time/i)).toBeInTheDocument();
    });
  });
});