
import React, { useRef, useEffect, useState } from 'react';
import { extractLicensePlate } from '../services/geminiService';
import { Camera, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';

interface CameraScannerProps {
  onPlateDetected: (plate: string, photoUrl: string) => void;
  onCancel: () => void;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({ onPlateDetected, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'searching' | 'detected'>('searching');

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError("Permissão da câmara negada ou indisponível.");
    }
  };

  const captureAndProcess = async (isAuto = false) => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    setIsProcessing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Crop a bit to focus on the center area where the plate usually is
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
      const photoUrl = canvas.toDataURL('image/jpeg', 0.5);

      const plate = await extractLicensePlate(base64Image);

      if (plate) {
        setScanStatus('detected');
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        audio.play().catch(() => {});
        onPlateDetected(plate, photoUrl);
      } else if (!isAuto) {
        setError("Não foi possível detectar a matrícula nesta imagem.");
      }
    }
    setIsProcessing(false);
  };

  useEffect(() => {
    startCamera();
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  // Auto-scan logic: attempts to scan every 2.5 seconds
  useEffect(() => {
    if (scanStatus !== 'searching' || isProcessing) return;

    const interval = setInterval(() => {
      if (!isProcessing) {
        captureAndProcess(true);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [scanStatus, isProcessing]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <style>{`
        @keyframes scan-line {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .scanner-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: #eab308;
          box-shadow: 0 0 15px #eab308;
          animation: scan-line 2s linear infinite;
        }
      `}</style>

      <div className="relative flex-1 bg-slate-900 flex items-center justify-center overflow-hidden">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Target Overlay */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-sm aspect-[3/1] border-2 border-white/20 rounded-lg relative overflow-hidden">
             <div className="scanner-line"></div>
             
             {/* Corners */}
             <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-yellow-500 -translate-x-1 -translate-y-1 rounded-tl-lg"></div>
             <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-yellow-400 translate-x-1 -translate-y-1 rounded-tr-lg"></div>
             <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-yellow-400 -translate-x-1 translate-y-1 rounded-bl-lg"></div>
             <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-yellow-400 translate-x-1 translate-y-1 rounded-br-lg"></div>
          </div>
          
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 bg-black/50 backdrop-blur px-4 py-2 rounded-full border border-white/10">
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
                  <span className="text-white text-sm font-medium">A analisar...</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                  <span className="text-white text-sm font-medium">Aponte para a matrícula</span>
                </>
              )}
            </div>
          </div>
        </div>

        {scanStatus === 'detected' && (
          <div className="absolute inset-0 bg-green-500/20 flex flex-col items-center justify-center backdrop-blur-sm transition-all">
             <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <RefreshCw className="w-10 h-10 text-white" />
             </div>
             <span className="mt-4 text-white font-black text-xl tracking-widest">DETECTADA!</span>
          </div>
        )}
      </div>

      <div className="bg-slate-900 p-6 safe-bottom">
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500 rounded-lg flex items-center gap-2 text-red-200">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <button 
            onClick={onCancel}
            className="px-8 py-4 rounded-xl bg-slate-800 text-slate-300 font-bold"
          >
            Sair
          </button>
          
          <button 
            onClick={() => captureAndProcess(false)}
            disabled={isProcessing}
            className="flex-1 py-4 bg-yellow-500 active:bg-yellow-600 disabled:bg-yellow-800 text-slate-900 rounded-xl font-black flex items-center justify-center gap-2 text-lg shadow-lg uppercase"
          >
            <Camera className="w-6 h-6" />
            Forçar Captura
          </button>
        </div>
        <p className="text-center text-slate-500 text-[10px] mt-4 uppercase tracking-widest font-bold">A deteção é automática. Aguarde 2-3 segundos.</p>
      </div>
    </div>
  );
};
