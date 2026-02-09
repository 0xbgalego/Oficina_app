
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { extractLicensePlate } from '../services/geminiService';
import { Camera, RefreshCw, AlertTriangle, Loader2, X, Keyboard } from 'lucide-react';

interface CameraScannerProps {
  onPlateDetected: (plate: string, photoUrl: string) => void;
  onCancel: () => void;
  onManualEntry?: () => void;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({ onPlateDetected, onCancel, onManualEntry }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanStatus, setScanStatus] = useState<'searching' | 'detected'>('searching');

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', 
          width: { ideal: 1920 },
          height: { ideal: 1080 } 
        },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError("Câmara inacessível. Verifique as permissões do navegador.");
    }
  };

  const captureAndProcess = useCallback(async (isAuto = false) => {
    if (!videoRef.current || !canvasRef.current || isProcessing || scanStatus === 'detected') return;

    setIsProcessing(true);
    setError(null);
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const photoUrl = canvas.toDataURL('image/jpeg', 0.3);

        const cropWidth = canvas.width * 0.75;
        const cropHeight = canvas.width * 0.35;
        const startX = (canvas.width - cropWidth) / 2;
        const startY = (canvas.height - cropHeight) / 2;

        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = 1000;
        cropCanvas.height = (cropHeight / cropWidth) * 1000;
        const cropCtx = cropCanvas.getContext('2d');
        
        if (cropCtx) {
          cropCtx.drawImage(video, startX, startY, cropWidth, cropHeight, 0, 0, cropCanvas.width, cropCanvas.height);
          const base64ImageForAI = cropCanvas.toDataURL('image/jpeg', 0.8).split(',')[1];

          const plate = await extractLicensePlate(base64ImageForAI);

          if (plate) {
            setScanStatus('detected');
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            onPlateDetected(plate, photoUrl);
          } else {
             if (!isAuto) setError("Não detectado. Tente alinhar melhor a matrícula.");
          }
        }
      }
    } catch (err) {
      console.error("Falha no scanner:", err);
      if (!isAuto) setError("Erro de processamento. Tente novamente.");
    } finally {
      setTimeout(() => setIsProcessing(false), 800);
    }
  }, [isProcessing, scanStatus, onPlateDetected]);

  useEffect(() => {
    startCamera();
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  useEffect(() => {
    if (scanStatus !== 'searching' || isProcessing) return;
    const timer = setTimeout(() => captureAndProcess(true), 3500);
    return () => clearTimeout(timer);
  }, [scanStatus, isProcessing, captureAndProcess]);

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col overflow-hidden animate-in fade-in duration-300">
      <style>{`
        @keyframes scan-line {
          0% { top: 0%; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .scanner-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 4px;
          background: #eab308;
          box-shadow: 0 0 25px #eab308;
          animation: scan-line 3s ease-in-out infinite;
          z-index: 10;
        }
      `}</style>

      {/* Header do Scanner */}
      <div className="absolute top-0 left-0 right-0 p-6 z-50 flex justify-between items-center pointer-events-none">
        <button 
          onClick={onCancel} 
          className="p-4 bg-black/50 backdrop-blur-xl rounded-full text-white border border-white/20 active:scale-90 transition-transform pointer-events-auto"
        >
          <X className="w-6 h-6" />
        </button>
        
        {onManualEntry && (
          <button 
            onClick={onManualEntry}
            className="p-4 bg-black/50 backdrop-blur-xl rounded-full text-white border border-white/20 active:scale-90 transition-transform pointer-events-auto flex items-center gap-2 px-6"
          >
            <Keyboard className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase tracking-widest">Manual</span>
          </button>
        )}
      </div>

      <div className="relative flex-1 bg-slate-900 flex items-center justify-center">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />

        {/* MIRA DE PRECISÃO */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-[340px] aspect-[3/1] border-2 border-white/10 rounded-2xl relative bg-black/5">
             <div className="scanner-line"></div>
             <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-yellow-500 rounded-tl-xl -translate-x-1 -translate-y-1"></div>
             <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-yellow-500 rounded-tr-xl translate-x-1 -translate-y-1"></div>
             <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-yellow-500 rounded-bl-xl -translate-x-1 translate-y-1"></div>
             <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-yellow-500 rounded-br-xl translate-x-1 translate-y-1"></div>
          </div>
          
          <div className="mt-12 text-center">
            {isProcessing ? (
              <div className="bg-yellow-500 text-slate-950 px-8 py-3 rounded-full font-black flex items-center gap-3 animate-pulse shadow-2xl">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="tracking-tighter">A ANALISAR...</span>
              </div>
            ) : (
              <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/5">
                <p className="text-white font-black text-xs tracking-widest uppercase">Mantenha a câmara estável</p>
                <p className="text-white/40 text-[9px] mt-1 font-bold uppercase tracking-widest">Deteção automática inteligente</p>
              </div>
            )}
          </div>
        </div>

        {scanStatus === 'detected' && (
          <div className="absolute inset-0 bg-green-600/90 backdrop-blur-md flex flex-col items-center justify-center z-[60] animate-in fade-in duration-200">
             <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl animate-bounce">
                <RefreshCw className="w-12 h-12 text-green-600 animate-spin" />
             </div>
             <h3 className="mt-8 text-white font-black text-3xl tracking-tighter uppercase">MATRÍCULA OK!</h3>
          </div>
        )}
      </div>

      {/* Painel Inferior */}
      <div className="bg-slate-950 p-8 safe-bottom border-t border-slate-900">
        {error && (
          <div className="mb-6 p-4 bg-red-950/50 border border-red-500/50 rounded-2xl flex items-center gap-3 text-red-200 animate-in slide-in-from-bottom-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-xs font-bold uppercase tracking-tighter">{error}</span>
          </div>
        )}

        <button 
          onClick={() => captureAndProcess(false)}
          disabled={isProcessing}
          className="w-full py-6 bg-white text-slate-950 rounded-2xl font-black flex items-center justify-center gap-4 text-xl shadow-2xl active:scale-95 transition-all disabled:opacity-50"
        >
          <Camera className="w-7 h-7" />
          CAPTURA MANUAL
        </button>
        
        <p className="text-center text-slate-700 text-[9px] font-black uppercase tracking-[0.4em] mt-6">
          Oficina Digital Pro v2.5
        </p>
      </div>
    </div>
  );
};
