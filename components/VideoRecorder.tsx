
import React, { useState, useRef, useEffect } from 'react';

interface VideoRecorderProps {
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const VideoRecorder: React.FC<VideoRecorderProps> = ({ onShowToast }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsOpen(true);
    } catch (err) {
      console.error(err);
      onShowToast('error', 'Camera access denied');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsOpen(false);
    setIsRecording(false);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <>
        {!isOpen && (
            <button
                onClick={startCamera}
                className="fixed bottom-6 left-6 z-40 w-12 h-12 bg-nc-ink text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform hidden sm:flex"
                title="Open Camera"
                aria-label="Open Camera"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            </button>
        )}

        {isOpen && (
            <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
                <div className="relative w-full max-w-2xl bg-black rounded-2xl overflow-hidden border border-white/20 shadow-2xl aspect-video">
                    <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                    
                    <button 
                        onClick={stopCamera}
                        className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-white/20 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
                        <button 
                            onClick={() => {
                                setIsRecording(!isRecording);
                                onShowToast('info', isRecording ? 'Recording Stopped' : 'Recording Started');
                            }}
                            className={`w-16 h-16 rounded-full border-4 border-white flex items-center justify-center transition-all ${isRecording ? 'bg-red-600 scale-110' : 'bg-transparent hover:bg-white/20'}`}
                        >
                            <div className={`w-6 h-6 bg-white transition-all ${isRecording ? 'rounded-sm scale-75' : 'rounded-full'}`}></div>
                        </button>
                    </div>
                </div>
            </div>
        )}
    </>
  );
};
