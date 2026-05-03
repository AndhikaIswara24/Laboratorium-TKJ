'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface QRScannerProps {
  onScanSuccess?: (decodedText: string, parsedData?: any) => void;
  onScanError?: (error: string) => void;
  autoRedirectPath?: (itemId: string) => string; // Optional: define redirect path based on item ID
}

export default function QRScanner({ onScanSuccess, onScanError, autoRedirectPath }: QRScannerProps) {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [isLoadingScanner, setIsLoadingScanner] = useState(false);
  const [error, setError] = useState('');
  const [lastScannedData, setLastScannedData] = useState<any>(null);
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    if (!isScanning) return;

    let isCancelled = false;

    const initializeScanner = async () => {
      setIsLoadingScanner(true);
      try {
        const { Html5QrcodeScanner } = await import('html5-qrcode');
        if (isCancelled) return;

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
            try {
              // Try to parse as JSON (for inventory items)
              const parsedData = JSON.parse(decodedText);
              setLastScannedData(parsedData);
              
              if (onScanSuccess) {
                onScanSuccess(decodedText, parsedData);
              }
              
              // Auto-redirect if path function provided and itemId exists
              if (autoRedirectPath && parsedData.itemId) {
                const redirectPath = autoRedirectPath(parsedData.itemId);
                // Pause scanner before redirect
                scanner.pause();
                setTimeout(() => router.push(redirectPath), 500);
              } else {
                // Otherwise just pause
                scanner.pause();
              }
            } catch {
              // If not JSON, treat as plain text
              if (onScanSuccess) {
                onScanSuccess(decodedText);
              }
              scanner.pause();
            }
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
        const errorMsg = err instanceof Error ? err.message : 'Gagal menyiapkan pemindai';
        setError(errorMsg);
        if (onScanError) onScanError(errorMsg);
      } finally {
        if (!isCancelled) {
          setIsLoadingScanner(false);
        }
      }
    };

    initializeScanner();

    return () => {
      isCancelled = true;
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {
        });
      }
    };
  }, [isScanning, onScanSuccess, onScanError, autoRedirectPath, router]);

  const handleStartScanning = () => {
    setError('');
    setLastScannedData(null);
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

          {isLoadingScanner && (
            <div className="mt-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded text-center">
              Menyiapkan kamera...
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {lastScannedData && (
            <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              <p className="font-semibold">✓ QR Code Terdeteksi</p>
              <p className="text-sm">{lastScannedData.name || 'Item'}</p>
            </div>
          )}

          <div className="mt-4 flex gap-2 justify-center">
            {!lastScannedData && (
              <>
                <button
                  onClick={handleResume}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                  Lanjutkan Pindai
                </button>
              </>
            )}
            <button
              onClick={handleStopScanning}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Hentikan Pemindaian
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">Aktifkan kamera untuk memindai kode QR barang</p>
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
