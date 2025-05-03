import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, XCircle, Camera, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface QRScannerProps {
  onScan: (data: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, isOpen, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load QR code scanning library dynamically to avoid SSR issues
  useEffect(() => {
    if (isOpen && !window.jsQR) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
      script.async = true;
      script.onload = () => {
        initCamera();
      };
      document.body.appendChild(script);
      
      return () => {
        document.body.removeChild(script);
      };
    } else if (isOpen) {
      initCamera();
    }
  }, [isOpen]);

  // Stop camera when component unmounts or scanner is closed
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Initialize camera
  const initCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Camera access is not supported by your browser");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraReady(true);
        setIsScanning(true);
        scanQRCode();
      }
    } catch (err) {
      setError("Failed to access the camera: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      setIsCameraReady(false);
      setIsScanning(false);
    }
  };

  // Scan QR code from video stream
  const scanQRCode = () => {
    if (!isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        if (window.jsQR) {
          const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });
          
          if (code) {
            setResult(code.data);
            setIsScanning(false);
            onScan(code.data);
            return;
          }
        }
      }
    }
    
    requestAnimationFrame(scanQRCode);
  };

  // Handle close
  const handleClose = () => {
    stopCamera();
    setResult(null);
    setError(null);
    onClose();
  };

  // Handle scan again
  const handleScanAgain = () => {
    setResult(null);
    setError(null);
    setIsScanning(true);
    initCamera();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="w-full max-w-md mx-auto overflow-hidden">
            <div className="relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 z-10 bg-black/20 text-white hover:bg-black/40 hover:text-white rounded-full"
                onClick={handleClose}
              >
                <XCircle className="h-5 w-5" />
              </Button>
              
              <div className="aspect-square bg-black relative overflow-hidden">
                {!isCameraReady && !error && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                    <span className="ml-2 text-white">Initializing camera...</span>
                  </div>
                )}
                
                {error && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <XCircle className="h-10 w-10 text-red-500 mb-2" />
                    <p className="text-white mb-4">{error}</p>
                    <Button onClick={handleClose}>Close</Button>
                  </div>
                )}
                
                <video 
                  ref={videoRef} 
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  autoPlay
                />
                
                <canvas ref={canvasRef} className="hidden" />
                
                {isCameraReady && isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-3/4 h-3/4 border-2 border-white/70 rounded-lg"></div>
                  </div>
                )}
                
                {result && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
                    <div className="bg-green-100 dark:bg-green-900 rounded-full p-3 mb-3">
                      <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-white font-semibold mb-1">QR Code Scanned!</p>
                    <p className="text-white/70 text-sm mb-6 px-8 text-center truncate max-w-full">{result}</p>
                  </div>
                )}
              </div>
            </div>
            
            <CardContent className="p-4">
              {!result ? (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Position QR code within the frame
                  </p>
                  <div className="flex items-center">
                    <Camera className="h-4 w-4 mr-1 text-primary" />
                    <span className="text-xs text-primary font-medium">
                      {isScanning ? "Scanning..." : "Ready"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleClose}>Done</Button>
                  <Button onClick={handleScanAgain}>Scan Again</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

declare global {
  interface Window { 
    jsQR: any;
  }
}

export default QRScanner;
