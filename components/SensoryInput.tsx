
import React, { useState, useRef, useEffect } from 'react';

interface SensoryInputProps {
  onAnalyze: (blob: Blob, type: 'video' | 'audio', context: string) => Promise<void>;
  isProcessing: boolean;
}

export const SensoryInput: React.FC<SensoryInputProps> = ({ onAnalyze, isProcessing }) => {
  const [mode, setMode] = useState<'video' | 'audio'>('video');
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [context, setContext] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // Audio Visualizer
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    return () => {
      stopStream();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const startStream = async () => {
    try {
      const constraints = mode === 'video' 
        ? { video: true, audio: true }
        : { audio: true, video: false };
      
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);

      if (mode === 'video' && videoRef.current) {
        videoRef.current.srcObject = newStream;
      }

      if (mode === 'audio') {
        initAudioVisualizer(newStream);
      }
    } catch (err) {
      console.error("Error accessing media devices:", err);
      alert("Could not access camera/microphone.");
    }
  };

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const initAudioVisualizer = (s: MediaStream) => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioContextRef.current.createMediaStreamSource(s);
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;
    source.connect(analyserRef.current);
    drawVisualizer();
  };

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyserRef.current!.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgb(24 24 27)'; // Zinc-900
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for(let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        ctx.fillStyle = `rgb(${barHeight + 100}, 50, 200)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    draw();
  };

  const handleStartRecording = async () => {
    if (!stream) await startStream();
    // Wait a tick for stream to set if we just started it
    if (!stream && !videoRef.current?.srcObject && !audioContextRef.current) {
        // Simple retry logic or assume stream set in state
    }

    if (!stream && mode === 'video' && !videoRef.current?.srcObject) return; // check again
    
    // Use the *current* stream which might be from state or ref
    const activeStream = stream || (videoRef.current?.srcObject as MediaStream);
    if (!activeStream) return;

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(activeStream);
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mode === 'video' ? 'video/webm' : 'audio/webm' });
      setRecordedBlob(blob);
      stopStream(); // Stop camera/mic after recording
    };

    mediaRecorder.start();
    setIsRecording(true);
    mediaRecorderRef.current = mediaRecorder;
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = () => {
    if (recordedBlob) {
      onAnalyze(recordedBlob, mode, context);
    }
  };

  const reset = () => {
    setRecordedBlob(null);
    setContext('');
    startStream();
  };

  useEffect(() => {
    if (!recordedBlob) {
        startStream();
    }
  }, [mode]);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl overflow-hidden shadow-sm border border-stone-200">
      <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
        <h3 className="font-bold text-stone-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></span>
            Sensory Input
        </h3>
        <div className="flex bg-stone-200 p-1 rounded-lg">
          <button 
            onClick={() => { setMode('video'); setRecordedBlob(null); }}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${mode === 'video' ? 'bg-white text-violet-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
          >
            Video / Gesture
          </button>
          <button 
            onClick={() => { setMode('audio'); setRecordedBlob(null); }}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${mode === 'audio' ? 'bg-white text-violet-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
          >
            Audio / Rhythm
          </button>
        </div>
      </div>

      <div className="flex-1 bg-zinc-900 relative flex items-center justify-center overflow-hidden">
        {!recordedBlob ? (
            <>
                {mode === 'video' ? (
                    <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover opacity-90" />
                ) : (
                    <canvas ref={canvasRef} width="600" height="400" className="w-full h-full" />
                )}
                
                {isRecording && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-red-500/90 rounded-full text-white text-xs font-bold animate-pulse">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                        REC
                    </div>
                )}
            </>
        ) : (
            <div className="text-center">
                 {mode === 'video' ? (
                    <video src={URL.createObjectURL(recordedBlob)} controls className="max-h-[300px] mb-4 rounded-lg border border-stone-700" />
                 ) : (
                    <div className="w-64 h-32 bg-stone-800 rounded-xl flex items-center justify-center mb-4 border border-stone-700">
                        <svg className="w-12 h-12 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                    </div>
                 )}
                 <div className="text-white text-sm font-medium">Recording Captured</div>
            </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-stone-100 space-y-4">
        {!recordedBlob ? (
            <div className="flex justify-center">
                {!isRecording ? (
                    <button onClick={handleStartRecording} className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 border-4 border-stone-100 shadow-lg flex items-center justify-center transition-transform hover:scale-105">
                        <div className="w-4 h-4 bg-white rounded-sm"></div>
                    </button>
                ) : (
                    <button onClick={handleStopRecording} className="w-14 h-14 rounded-full bg-stone-800 hover:bg-stone-900 border-4 border-stone-100 shadow-lg flex items-center justify-center transition-transform hover:scale-105">
                        <div className="w-5 h-5 bg-red-500 rounded-sm"></div>
                    </button>
                )}
            </div>
        ) : (
            <>
                <div>
                    <label className="block text-xs font-bold text-stone-500 mb-1 uppercase tracking-wide">Context (Optional)</label>
                    <input 
                        type="text" 
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        placeholder={mode === 'video' ? "e.g., 'Flowing evening gown'" : "e.g., 'Aggressive streetwear'"}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-base md:text-sm text-stone-800 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all placeholder:text-stone-400"
                    />
                </div>
                <div className="flex gap-2">
                    <button onClick={reset} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 font-bold text-sm hover:bg-stone-50 transition-colors">
                        Retake
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={isProcessing}
                        className="flex-[2] py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold text-sm shadow-md shadow-violet-200 hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isProcessing ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Translating...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                Generate Concept
                            </>
                        )}
                    </button>
                </div>
            </>
        )}
      </div>
      
      {!recordedBlob && (
        <div className="px-4 py-2 bg-stone-50 text-[10px] text-stone-400 text-center border-t border-stone-100">
            {mode === 'video' ? "Record a gesture to define shape & flow." : "Hum or beatbox to define rhythm & vibe."}
        </div>
      )}
    </div>
  );
};
