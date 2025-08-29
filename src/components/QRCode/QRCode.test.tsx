/* eslint-disable no-restricted-globals */
import QRCode from 'qrcode';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import React from 'react';

import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';

import QRCodeComponent from './QRCode';

vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn(),
  },
}));

// Mock React
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).React = React;

// Type for mocked QRCode function
type MockedQRCode = {
  toDataURL: ReturnType<typeof vi.fn>;
};

// eslint-disable-next-line max-lines-per-function
describe('QRCodeComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render QR code container', async () => {
      await act(async () => {
        render(<QRCodeComponent url="https://example.com" />);
      });

      // Check that the component renders without crashing
      const container = document.querySelector('div');
      expect(container).toBeInTheDocument();
    });

    it('should display label when provided', async () => {
      await act(async () => {
        render(<QRCodeComponent url="https://example.com" label="Test Label" />);
      });

      expect(screen.getByText('Test Label')).toBeInTheDocument();
    });

    it('should not display label when not provided', async () => {
      await act(async () => {
        render(<QRCodeComponent url="https://example.com" />);
      });

      expect(screen.queryByText('Test Label')).not.toBeInTheDocument();
    });
  });

  describe('Props Validation', () => {
    it('should render with default props', async () => {
      await act(async () => {
        render(<QRCodeComponent url="https://example.com" />);
      });

      // Component should render without errors
      const container = document.querySelector('div');
      expect(container).toBeInTheDocument();
    });

    it('should render with custom size', async () => {
      await act(async () => {
        render(<QRCodeComponent url="https://example.com" size={128} />);
      });

      // Component should render without errors
      const container = document.querySelector('div');
      expect(container).toBeInTheDocument();
    });
  });

  describe('QR Code Generation', () => {
    it('should call QRCode.toDataURL with correct parameters', async () => {
      const mockDataUrl = 'data:image/png;base64,mock-qr-code-data';
      (QRCode.toDataURL as MockedQRCode['toDataURL']).mockResolvedValue(mockDataUrl);

      await act(async () => {
        render(<QRCodeComponent url="https://example.com" size={64} />);
      });

      await waitFor(() => {
        expect(QRCode.toDataURL).toHaveBeenCalledWith('https://example.com', {
          width: 64,
          margin: 1,
          color: {
            dark: '#000000',
          },
        });
      });
    });

    it('should display QR code image when generation succeeds', async () => {
      const mockDataUrl = 'data:image/png;base64,mock-qr-code-data';
      (QRCode.toDataURL as MockedQRCode['toDataURL']).mockResolvedValue(mockDataUrl);

      await act(async () => {
        render(<QRCodeComponent url="https://example.com" size={64} />);
      });

      await waitFor(() => {
        const img = document.querySelector('img');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', mockDataUrl);
        expect(img).toHaveAttribute('alt', 'QR code for https://example.com');
      });
    });

    it('should show loading skeleton initially', async () => {
      (QRCode.toDataURL as MockedQRCode['toDataURL']).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('data:image/png;base64,mock'), 100)),
      );

      await act(async () => {
        render(<QRCodeComponent url="https://example.com" size={64} />);
      });

      // Should show loading skeleton initially
      const skeleton =
        document.querySelector('[data-testid="skeleton"]') ||
        document.querySelector('.MuiSkeleton-root');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error state when QR code generation fails', async () => {
      (QRCode.toDataURL as MockedQRCode['toDataURL']).mockRejectedValue(
        new Error('Generation failed'),
      );

      await act(async () => {
        render(<QRCodeComponent url="https://example.com" size={64} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to generate QR code')).toBeInTheDocument();
      });
    });

    it('should clear error state when URL changes and generation succeeds', async () => {
      (QRCode.toDataURL as MockedQRCode['toDataURL'])
        .mockRejectedValueOnce(new Error('Generation failed'))
        .mockResolvedValueOnce('data:image/png;base64,success');

      const { rerender } = render(<QRCodeComponent url="https://example.com" size={64} />);

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('Failed to generate QR code')).toBeInTheDocument();
      });

      // Change URL to trigger re-generation
      await act(async () => {
        rerender(<QRCodeComponent url="https://new-example.com" size={64} />);
      });

      // Wait for success state
      await waitFor(() => {
        const img = document.querySelector('img');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', 'data:image/png;base64,success');
      });

      // Error text should no longer be present
      expect(screen.queryByText('Failed to generate QR code')).not.toBeInTheDocument();
    });
  });
});
