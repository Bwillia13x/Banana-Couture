
import React, { useRef, useState, useEffect } from 'react';
import { generateVirtualTryOn } from '../services/geminiService';
import { CompareSlider } from './CompareSlider';

interface VirtualTryOnProps {
  garmentImage: string | null;
  garmentPrompt: string;
  onClose: () => void;
  onSave: (resultImage: string) => void;
}

export const VirtualTryOn: React.FC<VirtualTryOnProps> = ({ garmentImage, garmentPrompt, onClose, onSave }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // Start Camera
  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: facingMode, 
                width: { ideal: 1280 }, 
                height: { ideal: 720 } 
            } 
        });
        
        currentStream = mediaStream;
        setStream(mediaStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Could not access camera. Please check permissions.");
      }
    };

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const toggleCamera = () => {
      setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const context = canvasRef.current.getContext('2d');
    if (context) {
        // Draw current video frame to canvas
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        
        // If user facing mode, flip horizontally for mirror effect
        if (facingMode === 'user') {
            context.translate(canvasRef.current.width, 0);
            context.scale(-1, 1);
        }
        
        context.drawImage(videoRef.current, 0, 0);
        
        // Convert to base64
        const dataUrl = canvasRef.current.toDataURL('image/png');
        setCapturedImage(dataUrl.split(',')[1]);
        
        // Stop stream to freeze UI
        if (stream) {
             stream.getTracks().forEach(track => track.stop());
             setStream(null);
        }
    }
  };

  const handleRetake = async () => {
      setCapturedImage(null);
      setResultImage(null);
      setError(null);
      
      // Force restart logic via state update if needed, but here we just re-mount or re-call logic
      // Since we unmounted the stream in handleCapture, we need to restart it.
      // The easiest way is to trigger the useEffect again or manually call start.
      // We'll toggle state slightly or just call getUserMedia again.
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setError("Could not restart camera.");
      }
  };

  const handleGenerate = async () => {
      if (!capturedImage) return;
      setIsProcessing(true);
      setError(null);
      
      try {
          const result = await generateVirtualTryOn(capturedImage, garmentImage, garmentPrompt);
          setResultImage(result);
      } catch (e: any) {
          setError(e.message || "Failed to generate Try-On.");
      } finally {
          setIsProcessing(false);
      }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-nc-ink/95 backdrop-blur-lg flex flex-col animate-fade-in text-white">
        
        {/* Header */}
        <div className="h-16 px-6 border-b border-white/10 flex items-center justify-between bg-white/5">
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-nc-rose animate-pulse"></span>
                <h2 className="text-sm font-bold uppercase tracking-widest font-display">Magic Mirror</h2>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <svg className="w-6 h-6 text-white/60 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            
            {/* Background Effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-nc-rose/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="relative w-full max-w-4xl aspect-[9/16] md:aspect-video bg-[#0F0505] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                
                {/* View State Management */}
                {!capturedImage ? (
                    // Camera View
                    <div className="w-full h-full relative">
                        {error ? (
                            <div className="absolute inset-0 flex items-center justify-center text-nc-rose text-sm">{error}</div>
                        ) : (
                            <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline 
                                muted 
                                className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform scale-x-[-1]' : ''}`} 
                            />
                        )}
                        
                        {/* Overlay Guide */}
                        <div className="absolute inset-0 border-[20px] border-[#0F0505]/50 pointer-events-none"></div>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
                             <div className="w-64 h-96 border-2 border-white/30 rounded-full border-dashed"></div>
                        </div>

                        {/* Top Controls Overlay */}
                        <div className="absolute top-4 right-4 z-20">
                            <button 
                                onClick={toggleCamera}
                                className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors border border-white/10"
                                title="Flip Camera"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                        </div>

                        {/* Capture Controls */}
                        <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20">
                            <button 
                                onClick={handleCapture}
                                className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 transition-transform bg-white/20 backdrop-blur-sm"
                            >
                                <div className="w-12 h-12 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"></div>
                            </button>
                        </div>
                    </div>
                ) : (
                    // Captured / Result View
                    <div className="w-full h-full relative bg-[#0F0505]">
                        {resultImage ? (
                            <div className="w-full h-full">
                                <CompareSlider 
                                    image1={capturedImage} // Before
                                    image2={resultImage}   // After
                                    zoom={1}
                                />
                                <div className="absolute top-4 left-4 z-20 bg-black/60 px-3 py-1 rounded text-xs text-white backdrop-blur border border-white/10">
                                    Compare: Original vs AI Try-On
                                </div>
                            </div>
                        ) : (
                            <img src={`data:image/png;base64,${capturedImage}`} className="w-full h-full object-contain" />
                        )}

                        {isProcessing && (
                            <div className="absolute inset-0 bg-nc-ink/80 backdrop-blur-sm flex flex-col items-center justify-center z-30">
                                <div className="relative">
                                    <div className="w-16 h-16 border-4 border-nc-accent/30 border-t-nc-accent rounded-full animate-spin mb-4"></div>
                                    <div className="absolute inset-0 flex items-center justify-center animate-pulse">✨</div>
                                </div>
                                <span className="text-white font-bold tracking-widest animate-pulse font-display">Designing Fit...</span>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Hidden Canvas for Capture */}
                <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Prompt Preview */}
            <div className="mt-6 max-w-2xl text-center">
                <p className="text-white/40 text-xs mb-2 uppercase tracking-widest font-bold">Applying Design</p>
                <p className="text-white font-medium text-sm line-clamp-1 opacity-90">"{garmentPrompt}"</p>
            </div>

            {/* Action Bar (Only when image is captured) */}
            {capturedImage && !isProcessing && (
                <div className="mt-8 flex gap-4">
                    <button 
                        onClick={handleRetake}
                        className="px-6 py-3 rounded-xl border border-white/10 hover:bg-white/10 text-white text-sm font-bold uppercase tracking-wider transition-colors"
                    >
                        Retake
                    </button>
                    
                    {!resultImage ? (
                        <button 
                            onClick={handleGenerate}
                            className="px-8 py-3 rounded-xl bg-gradient-to-r from-nc-accent to-nc-accent-strong hover:to-purple-600 text-white text-sm font-bold uppercase tracking-wider shadow-lg shadow-nc-accent/30 transition-all flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            Generate Try-On
                        </button>
                    ) : (
                        <button 
                            onClick={() => onSave(resultImage)}
                            className="px-8 py-3 rounded-xl bg-nc-emerald hover:bg-emerald-600 text-white text-sm font-bold uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Save Photo
                        </button>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};
