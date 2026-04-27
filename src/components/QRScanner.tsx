'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
}

export default function QRScanner({ onScanSuccess, onScanError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Initialize scanner
    if (!isScanning) return;

    const initializeScanner = () => {
      try {
        const scanner = new Html5QrcodeScanner(
          'qr-scanner',
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true,
            aspectRatio: 1.0,
          },
          /* verbose= */ false
        );

        scanner.render(
          (decodedText) => {
            // Success callback
            onScanSuccess(decodedText);
            // Auto-stop after successful scan
            scanner.pause();
          },
          (err) => {
            // Error callback - ignore QR code not detected errors
            if (!err.includes('QR code not detected')) {
              console.error('Scan error:', err);
              if (onScanError) onScanError(err);
            }
          }
        );

        scannerRef.current = scanner;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to initialize scanner';
        setError(errorMsg);
        if (onScanError) onScanError(errorMsg);
      }
    };

    initializeScanner();

    return () => {
      // Cleanup
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {
          // Ignore errors during cleanup
        });
      }
    };
  }, [isScanning, onScanSuccess, onScanError]);

  const handleStartScanning = () => {
    setError('');
    setIsScanning(true);
  };

  const handleStopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().then(() => {
        setIsScanning(false);
      });
    }
  };

  const handleResume = () => {
    if (scannerRef.current) {
      scannerRef.current.resume();
    }
  };

  return (
    <div className="space-y-4">
      {/* Scanner Container */}
      {isScanning ? (
        <div>
          <div
            id="qr-scanner"
            className="w-full rounded-lg overflow-hidden border-2 border-blue-500"
            style={{ maxWidth: '500px', margin: '0 auto' }}
          />

          {error && (
            <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="mt-4 flex gap-2 justify-center">
            <button
              onClick={handleResume}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Resume Scan
            </button>
            <button
              onClick={handleStopScanning}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Stop Scanning
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">📷 Aktifkan kamera untuk scan QR Code barang</p>
          <button
            onClick={handleStartScanning}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-8 rounded-lg transition-colors inline-block"
          >
            Mulai Scan
          </button>
        </div>
      )}
    </div>
  );
}
