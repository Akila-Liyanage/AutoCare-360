import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  Upload,
  Link as LinkIcon,
  X,
  AlertCircle,
  CheckCircle2,
  Search,
  ScanLine
} from 'lucide-react';
import '../../styles/qr-scanner.css';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (tokenOrPayload: string) => void;
  title?: string;
  subtitle?: string;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Scan AutoCare 360 QR Code',
  subtitle = 'Point camera at vehicle QR sticker, upload image, or paste verification link',
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestAnimationRef = useRef<number | null>(null);

  // Helper to extract clean token from URL or raw string
  const extractToken = (raw: string): string => {
    try {
      const trimmed = raw.trim();
      if (trimmed.includes('token=')) {
        const url = new URL(trimmed.startsWith('http') ? trimmed : `http://dummy.com/${trimmed}`);
        const token = url.searchParams.get('token');
        if (token) return token;
      }
      if (trimmed.includes('/shared/')) {
        const parts = trimmed.split('/shared/');
        if (parts[1]) return parts[1].split('?')[0];
      }
      return trimmed;
    } catch {
      return raw.trim();
    }
  };

  const handleDetected = (payload: string) => {
    const token = extractToken(payload);
    setScanSuccess(`QR Code Decoded Successfully: ${token.slice(0, 16)}...`);
    stopCamera();
    setTimeout(() => {
      onScan(token);
      onClose();
    }, 600);
  };

  const startCamera = async () => {
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera access is not supported by your current browser environment.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        scanFrame();
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Unable to initialize camera. Please check permissions or upload an image instead.';
      setCameraError(msg);
    }
  };

  const stopCamera = () => {
    if (requestAnimationRef.current) {
      cancelAnimationFrame(requestAnimationRef.current);
      requestAnimationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const scanFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && video.readyState === video.HAVE_ENOUGH_DATA && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          handleDetected(code.data);
          return;
        }
      }
    }

    requestAnimationRef.current = requestAnimationFrame(scanFrame);
  };

  // Manage camera on tab change or open/close
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  // Handle image upload and QR parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setUploadError('Failed to initialize 2D canvas context.');
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (code && code.data) {
          handleDetected(code.data);
        } else {
          setUploadError('No valid AutoCare 360 QR code detected in this image. Please ensure the QR is well-lit and unobstructed.');
        }
      };
      img.onerror = () => {
        setUploadError('Failed to load image file.');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleDetected(manualInput.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="autocare-qr-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="autocare-qr-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="autocare-qr-modal-header">
          <div className="autocare-qr-modal-title-box">
            <div className="autocare-qr-modal-icon-badge">
              <ScanLine size={20} />
            </div>
            <div>
              <h3 className="autocare-qr-modal-title">{title}</h3>
              <p className="autocare-qr-modal-subtitle">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            className="autocare-qr-modal-close-btn"
            onClick={onClose}
            aria-label="Close scanner"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="autocare-qr-modal-tabs">
          <button
            type="button"
            className={`autocare-qr-tab-btn ${activeTab === 'camera' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('camera')}
          >
            <Camera size={15} />
            <span>Live Camera</span>
          </button>

          <button
            type="button"
            className={`autocare-qr-tab-btn ${activeTab === 'upload' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <Upload size={15} />
            <span>Upload Image</span>
          </button>

          <button
            type="button"
            className={`autocare-qr-tab-btn ${activeTab === 'manual' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('manual')}
          >
            <LinkIcon size={15} />
            <span>Paste / VIN</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="autocare-qr-modal-body">
          {scanSuccess && (
            <div className="autocare-qr-banner-success">
              <CheckCircle2 size={18} color="#16a34a" />
              <span>{scanSuccess}</span>
            </div>
          )}

          {/* TAB 1: LIVE CAMERA */}
          {activeTab === 'camera' && (
            <div className="autocare-qr-camera-container">
              {cameraError ? (
                <div className="autocare-qr-camera-error">
                  <AlertCircle size={36} color="#ef4444" />
                  <h4>Camera Access Restricted</h4>
                  <p>{cameraError}</p>
                  <button
                    type="button"
                    className="autocare-qr-btn-retry"
                    onClick={() => setActiveTab('upload')}
                  >
                    <Upload size={14} />
                    <span>Upload QR Image Instead</span>
                  </button>
                </div>
              ) : (
                <div className="autocare-qr-viewfinder">
                  <video
                    ref={videoRef}
                    className="autocare-qr-video"
                    muted
                    playsInline
                  />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />

                  {/* Visual Target Frame */}
                  <div className="autocare-qr-target-box">
                    <div className="corner-tl" />
                    <div className="corner-tr" />
                    <div className="corner-bl" />
                    <div className="corner-br" />
                    <div className="autocare-qr-laser-line" />
                  </div>

                  <div className="autocare-qr-camera-caption">
                    Align QR code within the frame to verify
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: UPLOAD IMAGE */}
          {activeTab === 'upload' && (
            <div className="autocare-qr-upload-container">
              <label htmlFor="qr-file-input" className="autocare-qr-upload-zone">
                <Upload size={36} className="autocare-qr-upload-icon" />
                <span className="autocare-qr-upload-title">
                  Choose QR Screenshot or Photo
                </span>
                <span className="autocare-qr-upload-sub">
                  Supports PNG, JPG, WEBP from phone camera or certificates
                </span>
                <input
                  id="qr-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>

              {uploadError && (
                <div className="autocare-qr-banner-error">
                  <AlertCircle size={16} color="#ef4444" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PASTE TOKEN / REG NO / VIN */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="autocare-qr-manual-form">
              <label htmlFor="qr-manual-input" className="autocare-qr-field-label">
                Enter Share Token, Verification URL, or Vehicle Plate / VIN:
              </label>
              <div className="autocare-qr-input-row">
                <input
                  id="qr-manual-input"
                  type="text"
                  className="autocare-qr-text-input"
                  placeholder="e.g. 6ad8..., WP CAR-1010, or https://.../buyer-qr?token=..."
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  autoFocus
                />
                <button
                  type="submit"
                  className="autocare-qr-btn-submit"
                  disabled={!manualInput.trim()}
                >
                  <Search size={15} />
                  <span>Verify</span>
                </button>
              </div>

              <div className="autocare-qr-hints">
                <span>Quick examples:</span>
                <button
                  type="button"
                  className="autocare-qr-hint-pill"
                  onClick={() => setManualInput('WP CAR-1010')}
                >
                  WP CAR-1010
                </button>
                <button
                  type="button"
                  className="autocare-qr-hint-pill"
                  onClick={() => setManualInput('WP CAS-4521')}
                >
                  WP CAS-4521
                </button>
                <button
                  type="button"
                  className="autocare-qr-hint-pill"
                  onClick={() => setManualInput('CAA-1234')}
                >
                  CAA-1234
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
