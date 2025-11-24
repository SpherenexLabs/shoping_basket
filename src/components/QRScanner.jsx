import React, { useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import './QRScanner.css';

// Minimal, single-frame scanner. Emits scanned text via onScan prop.
const QRScanner = ({ onScan, onClose }) => {
  const html5QrcodeRef = useRef(null);
  const isRunningRef = useRef(false);
  const lastTextRef = useRef('');
  const lastTimeRef = useRef(0);

  const safeStop = useCallback(async () => {
    const instance = html5QrcodeRef.current;
    if (!instance) return;
    if (!isRunningRef.current) return;
    try {
      await instance.stop();
    } catch (e) {
      // Ignore stop errors if not running
      // console.warn('Stop error', e);
    }
    try {
      await instance.clear();
    } catch (_) {
      // ignore
    }
    isRunningRef.current = false;
  }, []);

  useEffect(() => {
    const elementId = 'qr-reader';
    html5QrcodeRef.current = new Html5Qrcode(elementId);

    const startScanner = async () => {
      try {
        await html5QrcodeRef.current.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 260, height: 260 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // Debounce duplicate scans within ~2s and identical content
            const now = Date.now();
            if (decodedText === lastTextRef.current && now - lastTimeRef.current < 2000) {
              return;
            }
            lastTextRef.current = decodedText;
            lastTimeRef.current = now;
            if (onScan) onScan(decodedText);
          },
          () => {}
        );
        isRunningRef.current = true;
      } catch (err) {
        console.error('Failed to start scanner', err);
      }
    };

    startScanner();

    return () => {
      // On unmount, stop only if running
      safeStop();
    };
  }, [onScan, safeStop]);

  const handleClose = useCallback(async () => {
    await safeStop();
    if (onClose) onClose();
  }, [onClose, safeStop]);

  // UI: Just a simple scanner with title and close.

  return (
    <div className="qr-scanner-overlay">
      <div className="qr-scanner-container small">
        <div className="scanner-header">
          <h2>🔍 Scan Products</h2>
          <button className="close-scanner-btn" onClick={handleClose}>✕</button>
        </div>

        <div className="scanner-section">
          <div id="qr-reader"></div>
          <p className="scanner-instruction">Position the QR code within the frame</p>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
