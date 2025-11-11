import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';
import { ref, set } from 'firebase/database';
import { database } from '../firebase/firebase';
import './QRScanner.css';

// Minimal, single-frame scanner. Emits scanned text via onScan prop.
const QRScanner = ({ onScan, onClose }) => {
  const html5QrcodeRef = useRef(null);
  const isRunningRef = useRef(false);
  const lastTextRef = useRef('');
  const lastTimeRef = useRef(0);
  const [scannerState, setScannerState] = useState('initializing'); // initializing, streaming, error
  const [scannedItems, setScannedItems] = useState([]); // Store scanned products
  
  // Person detection states
  const [personDetected, setPersonDetected] = useState(false);
  const [personCount, setPersonCount] = useState(0);
  const detectionModelRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const canvasRef = useRef(null);
  const [currentDirection, setCurrentDirection] = useState('S');
  const [manualControl, setManualControl] = useState(false);
  
  // Camera selection states
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);

  // Send direction to Firebase
  const sendDirectionToFirebase = useCallback(async (direction) => {
    try {
      const directionRef = ref(database, 'Shopping_Basket/Direction');
      await set(directionRef, direction);
      setCurrentDirection(direction);
      console.log(`📍 Direction sent to Firebase: ${direction}`);
    } catch (error) {
      console.error('Error sending direction to Firebase:', error);
    }
  }, []);

  // Manual control handlers
  const handleManualControl = useCallback((direction) => {
    setManualControl(true);
    sendDirectionToFirebase(direction);
    
    // Reset manual control after 2 seconds to allow auto-detection to resume
    setTimeout(() => {
      setManualControl(false);
    }, 2000);
  }, [sendDirectionToFirebase]);

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
    
    // Stop person detection
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  }, []);

  // Person detection function
  const detectPerson = useCallback(async () => {
    if (!detectionModelRef.current) return;
    
    try {
      // Get the video element from html5-qrcode
      const videoElement = document.querySelector('#qr-reader video');
      const canvas = canvasRef.current;
      
      if (!videoElement || videoElement.readyState !== 4 || !canvas) {
        return;
      }
      
      // Get the actual display dimensions
      const displayWidth = videoElement.offsetWidth;
      const displayHeight = videoElement.offsetHeight;
      const videoWidth = videoElement.videoWidth;
      const videoHeight = videoElement.videoHeight;
      
      // Set canvas size to match displayed video size
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      }
      
      const ctx = canvas.getContext('2d');
      
      // Clear previous drawings
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Run person detection
      const predictions = await detectionModelRef.current.detect(videoElement);
      
      // Filter for person detections
      const persons = predictions.filter(pred => pred.class === 'person');
      
      // Calculate scaling factors
      const scaleX = displayWidth / videoWidth;
      const scaleY = displayHeight / videoHeight;
      
      // Draw green bounding boxes around detected persons
      persons.forEach(person => {
        const [x, y, width, height] = person.bbox;
        const confidence = (person.score * 100).toFixed(1);
        
        // Scale coordinates to match display size
        const scaledX = x * scaleX;
        const scaledY = y * scaleY;
        const scaledWidth = width * scaleX;
        const scaledHeight = height * scaleY;
        
        // Draw green rectangle
        ctx.strokeStyle = '#10b981'; // Green color
        ctx.lineWidth = 4;
        ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);
        
        // Draw filled background for label
        ctx.fillStyle = '#10b981';
        const labelHeight = 30;
        const labelY = scaledY > labelHeight ? scaledY - labelHeight : scaledY + scaledHeight;
        ctx.fillRect(scaledX, labelY, scaledWidth, labelHeight);
        
        // Draw label text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        const textY = scaledY > labelHeight ? labelY + 20 : labelY + 20;
        ctx.fillText(`Person ${confidence}%`, scaledX + 5, textY);
      });
      
      const detected = persons.length > 0;
      setPersonDetected(detected);
      setPersonCount(persons.length);
      
      // Send direction to Firebase based on person detection (only if not in manual control mode)
      if (!manualControl) {
        const direction = detected ? 'F' : 'S';
        if (direction !== currentDirection) {
          sendDirectionToFirebase(direction);
        }
      }
      
    } catch (err) {
      console.error('Person detection error:', err);
    }
  }, [manualControl, currentDirection, sendDirectionToFirebase]);

  // Get available cameras
  useEffect(() => {
    const getCameras = async () => {
      try {
        // Request permission first
        await navigator.mediaDevices.getUserMedia({ video: true });
        
        // Get list of all video devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        setCameras(videoDevices);
        
        // Try to select external camera (usually the last one or contains "USB" in label)
        const externalCamera = videoDevices.find(device => 
          device.label.toLowerCase().includes('usb') || 
          device.label.toLowerCase().includes('external')
        );
        
        // If external camera found, use it; otherwise use the last camera (often external)
        const defaultCamera = externalCamera || videoDevices[videoDevices.length - 1];
        if (defaultCamera) {
          setSelectedCameraId(defaultCamera.deviceId);
          console.log('📹 Selected camera:', defaultCamera.label);
        }
      } catch (err) {
        console.error('Error getting cameras:', err);
      }
    };
    
    getCameras();
  }, []);

  useEffect(() => {
    const elementId = 'qr-reader';
    let mounted = true;
    
    // Wait for camera to be selected
    if (!selectedCameraId) return;
    
    const initializeScanner = async () => {
      try {
        if (!mounted) return;
        
        html5QrcodeRef.current = new Html5Qrcode(elementId);
        
        // Start scanner with selected camera
        await html5QrcodeRef.current.start(
          { deviceId: { exact: selectedCameraId } },
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
            
            // Parse QR code data (format: id|title|weight|price)
            const parts = String(decodedText).split('|');
            if (parts.length >= 4) {
              const [id, title, weight, price] = parts;
              const scannedProduct = {
                id,
                title,
                weight,
                price: Number(price) || 0,
                timestamp: now
              };
              
              // Add to scanned items list
              setScannedItems(prev => [scannedProduct, ...prev]);
            }
            
            if (onScan) onScan(decodedText);
          },
          () => {
            // Error callback - silent for continuous scanning
          }
        );
        
        if (mounted) {
          isRunningRef.current = true;
          setScannerState('streaming');
          console.log('✅ QR Scanner live streaming started');
          
          // Load person detection model
          loadPersonDetection();
        }
      } catch (err) {
        console.error('Failed to start scanner:', err);
        if (mounted) {
          setScannerState('error');
        }
      }
    };

    // Load person detection model
    const loadPersonDetection = async () => {
      try {
        console.log('🤖 Loading person detection model...');
        const model = await cocoSsd.load();
        if (mounted) {
          detectionModelRef.current = model;
          console.log('✅ Person detection model loaded');
          
          // Start person detection interval (every 1 second)
          detectionIntervalRef.current = setInterval(() => {
            detectPerson();
          }, 1000);
        }
      } catch (err) {
        console.error('Failed to load person detection model:', err);
      }
    };

    // Start scanner immediately when component mounts
    initializeScanner();

    return () => {
      mounted = false;
      // On unmount, stop only if running
      safeStop();
    };
  }, [onScan, safeStop, detectPerson, selectedCameraId]);

  // UI: Inline scanner embedded in the page

  return (
    <div className="qr-scanner-inline">
      <div className="scanner-header">
        <h2>🔍 Scan QR Code to Add Products</h2>
      </div>

      {/* Camera Selection */}
      {cameras.length > 1 && (
        <div className="camera-selector">
          <label htmlFor="camera-select">📹 Select Camera:</label>
          <select 
            id="camera-select"
            value={selectedCameraId || ''}
            onChange={(e) => {
              setSelectedCameraId(e.target.value);
              // Stop current scanner to restart with new camera
              safeStop();
            }}
          >
            {cameras.map(camera => (
              <option key={camera.deviceId} value={camera.deviceId}>
                {camera.label || `Camera ${camera.deviceId.substring(0, 8)}`}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="scanner-section">
        <div className="scanner-wrapper">
          <div id="qr-reader"></div>
          <canvas ref={canvasRef} id="detection-canvas"></canvas>
        </div>
        {scannerState === 'initializing' && (
          <p className="scanner-instruction">📷 Starting camera...</p>
        )}
        {scannerState === 'streaming' && (
          <div className="scanner-status">
            <p className="scanner-instruction">🎥 Live - Position the QR code within the frame</p>
            <div className={`person-detection-badge ${personDetected ? 'detected' : 'not-detected'}`}>
              {personDetected ? (
                <>
                  👤 {personCount} {personCount === 1 ? 'Person' : 'People'} Detected
                </>
              ) : (
                <>
                  👤 No Person Detected
                </>
              )}
            </div>
          </div>
        )}
        {scannerState === 'error' && (
          <p className="scanner-instruction error">❌ Camera access denied. Please allow camera permissions.</p>
        )}
      </div>

      {/* Manual Direction Control */}
      <div className="manual-control-section">
        <h3>🎮 Manual Direction Control</h3>
        <div className="control-buttons">
          <div className="control-row">
            <button 
              className="control-btn forward" 
              onClick={() => handleManualControl('F')}
              title="Forward"
            >
              ⬆️ Forward
            </button>
          </div>
          <div className="control-row middle-row">
            <button 
              className="control-btn left" 
              onClick={() => handleManualControl('L')}
              title="Left"
            >
              ⬅️ Left
            </button>
            <button 
              className="control-btn stop" 
              onClick={() => handleManualControl('S')}
              title="Stop"
            >
              ⏹️ Stop
            </button>
            <button 
              className="control-btn right" 
              onClick={() => handleManualControl('R')}
              title="Right"
            >
              ➡️ Right
            </button>
          </div>
          <div className="control-row">
            <button 
              className="control-btn backward" 
              onClick={() => handleManualControl('B')}
              title="Backward"
            >
              ⬇️ Backward
            </button>
          </div>
        </div>
        <div className="direction-status">
          Current Direction: <span className={`status-badge ${currentDirection}`}>{currentDirection}</span>
          {manualControl && <span className="manual-badge">Manual Mode</span>}
        </div>
      </div>

      {/* Display Scanned Items */}
      {scannedItems.length > 0 && (
        <div className="scanned-items-section">
          <h3>✅ Recently Scanned Products</h3>
          <div className="scanned-items-list">
            {scannedItems.map((item, index) => (
              <div key={`${item.id}-${item.timestamp}`} className="scanned-item">
                <div className="scanned-item-info">
                  <h4>{item.title}</h4>
                  <div className="scanned-item-details">
                    <span className="scanned-weight">⚖️ {item.weight}</span>
                    <span className="scanned-price">💰 ₹{item.price}</span>
                  </div>
                </div>
                <div className="scanned-badge">
                  Scanned #{scannedItems.length - index}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
