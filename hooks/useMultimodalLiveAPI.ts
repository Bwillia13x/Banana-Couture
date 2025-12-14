
import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from "@google/genai";
import { getGeminiApiKey, promptForApiKeySelection, MISSING_API_KEY_MESSAGE } from '../services/apiKey';

const LIVE_MODEL_ID = 'gemini-2.5-flash-native-audio-preview-12-2025';
const FALLBACK_MODEL_ID = 'gemini-2.5-flash-native-audio-preview-09-2025';

// Enhanced Tool Definitions for Multimodal Context
const toolsDef: FunctionDeclaration[] = [
  {
    name: "updatePrompt",
    description: "Update the design prompt text based on the user's verbal description or visual reference.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING, description: "The full text for the fashion prompt." },
        visualInsight: { type: Type.STRING, description: "Optional insight derived from visual input (webcam/screen)." }
      },
      required: ["text"]
    }
  },
  {
    name: "triggerGenerate",
    description: "Trigger the generation of the design concept.",
    parameters: { type: Type.OBJECT, properties: {} }
  },
  {
    name: "setViewMode",
    description: "Change the current view mode of the studio.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        mode: { type: Type.STRING, enum: ["concept", "engineering", "xray", "split"] }
      },
      required: ["mode"]
    }
  },
  {
    name: "generatePattern",
    description: "Generate a custom textile pattern based on a description or visual reference.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        description: { type: Type.STRING, description: "Description of the pattern (e.g. 'blue paisley', 'neon grid', 'like the fabric I'm showing')." }
      },
      required: ["description"]
    }
  },
  {
    name: "analyzeReference",
    description: "Analyze a visual reference shown via webcam (mood board, sketch, fabric swatch) and extract design elements.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        analysisType: { 
          type: Type.STRING, 
          enum: ["mood", "color_palette", "silhouette", "texture", "full"],
          description: "What aspect of the reference to analyze."
        }
      },
      required: ["analysisType"]
    }
  },
  {
    name: "suggestModification",
    description: "Suggest a modification to the current design based on visual context.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        modification: { type: Type.STRING, description: "The suggested design modification." },
        reasoning: { type: Type.STRING, description: "Why this modification would improve the design." }
      },
      required: ["modification", "reasoning"]
    }
  },
  {
    name: "captureReferenceFrame",
    description: "Capture the current webcam frame as a design reference.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        label: { type: Type.STRING, description: "Label for this reference (e.g. 'mood board', 'fabric swatch')." }
      },
      required: ["label"]
    }
  }
];

export interface VisualReference {
  id: string;
  label: string;
  imageData: string; // base64
  timestamp: number;
  analysis?: string;
}

export interface MultimodalLiveAPIState {
  isConnected: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  volume: number;
  isVideoEnabled: boolean;
  videoStream: MediaStream | null;
  capturedReferences: VisualReference[];
  lastVisualContext: string | null;
  connect: (options?: { enableVideo?: boolean }) => Promise<void>;
  disconnect: () => void;
  toggleVideo: () => void;
  sendScreenCapture: (imageBase64: string) => void;
  clearReferences: () => void;
}

interface UseMultimodalLiveAPIProps {
  onToolCall: (name: string, args: any) => Promise<any>;
  currentDesignImage?: string | null;
  onVisualInsight?: (insight: string) => void;
  onReferenceCapture?: (ref: VisualReference) => void;
}

export const useMultimodalLiveAPI = ({ 
  onToolCall, 
  currentDesignImage,
  onVisualInsight,
  onReferenceCapture
}: UseMultimodalLiveAPIProps): MultimodalLiveAPIState => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [volume, setVolume] = useState(0);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [capturedReferences, setCapturedReferences] = useState<VisualReference[]>([]);
  const [lastVisualContext, setLastVisualContext] = useState<string | null>(null);

  // Audio Contexts & Nodes
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const inputProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  // Video Refs
  const videoStreamRef = useRef<MediaStream | null>(null);
  const videoIntervalRef = useRef<any>(null); // Use any to avoid NodeJS namespace issues
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  
  // Playback State
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // Gemini Session
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  // Create hidden canvas for frame capture
  useEffect(() => {
    if (!canvasRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      canvasRef.current = canvas;
    }
    if (!videoElementRef.current) {
      const video = document.createElement('video');
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      videoElementRef.current = video;
    }
  }, []);

  // Helper: Base64 to Float32Array
  const decodeAudioData = async (base64: string, ctx: AudioContext): Promise<AudioBuffer> => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768.0;
    }

    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.copyToChannel(float32, 0);
    return buffer;
  };

  // Helper: Float32Array to Base64 (PCM 16-bit 16kHz)
  const floatTo16BitPCM = (float32: Float32Array): string => {
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      let s = Math.max(-1, Math.min(1, float32[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Capture video frame as base64
  const captureVideoFrame = useCallback((): string | null => {
    if (!videoElementRef.current || !canvasRef.current || !videoStreamRef.current) return null;
    
    const video = videoElementRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || video.readyState < 2) return null;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.7).split(',')[1]; // Return base64 without prefix
  }, []);

  const connect = useCallback(async (options?: { enableVideo?: boolean }) => {
    if (isConnected) return;

    try {
      const apiKey = getGeminiApiKey();
      const ai = new GoogleGenAI({ apiKey });
      
      // Init Audio Contexts
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
      
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      
      // Request audio (and optionally video)
      const constraints: MediaStreamConstraints = { 
        audio: {
          channelCount: 1,
          sampleRate: 16000
        }
      };
      
      if (options?.enableVideo) {
        constraints.video = {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 5 } // Low framerate for API efficiency
        };
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;
      
      // Handle video track if present
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && videoElementRef.current) {
        const videoOnlyStream = new MediaStream([videoTrack]);
        videoStreamRef.current = videoOnlyStream;
        videoElementRef.current.srcObject = videoOnlyStream;
        setVideoStream(videoOnlyStream);
        setIsVideoEnabled(true);
      }

      // Analyser for visualization
      analyserRef.current = inputCtx.createAnalyser();
      analyserRef.current.fftSize = 256;
      const audioTrack = stream.getAudioTracks()[0];
      const audioOnlyStream = new MediaStream([audioTrack]);
      const inputSource = inputCtx.createMediaStreamSource(audioOnlyStream);
      inputSource.connect(analyserRef.current);

      // Processor
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      inputProcessorRef.current = processor;
      
      sourceNodeRef.current = inputSource;
      inputSource.connect(processor);
      processor.connect(inputCtx.destination);

      // Build system instruction with current design context
      let systemInstruction = `You are Aura, an advanced AI fashion co-pilot with VISUAL AWARENESS.
      
You can SEE through the user's webcam and their current design canvas. Use this visual context to provide intelligent, contextual assistance.

CAPABILITIES:
- See the user's current design on canvas
- See visual references they show (mood boards, sketches, fabric swatches)
- Hear their voice commands and descriptions
- Make proactive suggestions based on what you see

BEHAVIOR:
- When the user shows you something, acknowledge what you see specifically
- If you see a fabric swatch, describe its texture, color, and suggest how to incorporate it
- If you see a sketch, identify key silhouette elements
- Compare visual references to the current design and suggest modifications
- Be proactive: "I notice your design has a structured shoulder - the fabric you're showing would drape beautifully for that"

TOOLS:
- updatePrompt: Update design text, include visualInsight if you derived info from camera
- triggerGenerate: Generate the design
- generatePattern: Create textile patterns (can reference what you see: "a pattern like the fabric I'm looking at")
- analyzeReference: Deep-dive analysis of shown reference
- suggestModification: Proactive design suggestions
- captureReferenceFrame: Save current webcam view as a reference
- setViewMode: Switch canvas views`;

      if (currentDesignImage) {
        systemInstruction += `\n\nCURRENT DESIGN: A fashion concept is currently loaded on the canvas. Reference it when making suggestions.`;
      }

      const sessionConfig = {
        responseModalities: [Modality.AUDIO],
        tools: [{ functionDeclarations: toolsDef }],
        systemInstruction,
      };

      const callbacks = {
        onopen: () => {
          console.log("Multimodal Live Connected");
          setIsConnected(true);
          setIsListening(true);
        },
        onmessage: async (msg: LiveServerMessage) => {
          // Handle Audio Output
          const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audioData && audioContextRef.current) {
            setIsSpeaking(true);
            setIsListening(false);
            const buffer = await decodeAudioData(audioData, audioContextRef.current);
            
            const source = audioContextRef.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContextRef.current.destination);
            
            const now = audioContextRef.current.currentTime;
            const start = Math.max(now, nextStartTimeRef.current);
            source.start(start);
            nextStartTimeRef.current = start + buffer.duration;
            
            activeSourcesRef.current.add(source);
            source.onended = () => {
              activeSourcesRef.current.delete(source);
              if (activeSourcesRef.current.size === 0) {
                setIsSpeaking(false);
                setIsListening(true);
              }
            };
          }

          // Handle Tool Calls
          if (msg.toolCall) {
            for (const fc of msg.toolCall.functionCalls) {
              console.log("Multimodal Tool Call:", fc.name, fc.args);
              try {
                // Special handling for visual-aware tools
                if (fc.name === 'captureReferenceFrame') {
                  const frameData = captureVideoFrame();
                  if (frameData) {
                    const newRef: VisualReference = {
                      id: `ref-${Date.now()}`,
                      label: (fc.args as any).label || 'Reference',
                      imageData: frameData,
                      timestamp: Date.now()
                    };
                    setCapturedReferences(prev => [...prev, newRef]);
                    if (onReferenceCapture) onReferenceCapture(newRef);
                  }
                }
                
                if (fc.name === 'suggestModification' && onVisualInsight) {
                  const args = fc.args as any;
                  onVisualInsight(`${args.modification}\n\nReasoning: ${args.reasoning}`);
                }
                
                const result = await onToolCall(fc.name, fc.args);
                sessionPromiseRef.current?.then(session => {
                  session.sendToolResponse({
                    functionResponses: {
                      id: fc.id,
                      name: fc.name,
                      response: { result: "OK" }
                    }
                  });
                });
              } catch (e) {
                console.error("Tool execution error", e);
              }
            }
          }
          
          // Handle Interruption
          if (msg.serverContent?.interrupted) {
            activeSourcesRef.current.forEach(s => {
              try { s.stop(); } catch(e){}
            });
            activeSourcesRef.current.clear();
            nextStartTimeRef.current = 0;
            setIsSpeaking(false);
            setIsListening(true);
          }

          // Handle turn completion
          if (msg.serverContent?.turnComplete) {
            setIsListening(true);
          }
        },
        onclose: () => {
          console.log("Multimodal Live Closed");
          setIsConnected(false);
          setIsListening(false);
        },
        onerror: (e) => {
          console.error("Multimodal Live Error", e);
          setIsConnected(false);
          setIsSpeaking(false);
          setIsListening(false);
        }
      };

      // Start Gemini Session with retry logic
      let sessionPromise;
      try {
        sessionPromise = ai.live.connect({
          model: LIVE_MODEL_ID,
          config: sessionConfig,
          callbacks: callbacks
        });
        await sessionPromise; // Wait to ensure connection success
      } catch (e) {
        console.warn(`[Multimodal] Connection to ${LIVE_MODEL_ID} failed, falling back to ${FALLBACK_MODEL_ID}`, e);
        sessionPromise = ai.live.connect({
          model: FALLBACK_MODEL_ID,
          config: sessionConfig,
          callbacks: callbacks
        });
      }
      
      sessionPromiseRef.current = sessionPromise;

      // Start Streaming Audio Input
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Calculate volume for visualizer
        let sum = 0;
        for (let i = 0; i < inputData.length; i += 10) {
          sum += Math.abs(inputData[i]);
        }
        const avg = sum / (inputData.length / 10);
        setVolume(Math.min(1, avg * 5));

        const b64 = floatTo16BitPCM(inputData);
        
        sessionPromiseRef.current?.then(session => {
          session.sendRealtimeInput({
            media: {
              mimeType: 'audio/pcm;rate=16000',
              data: b64
            }
          });
        });
      };

      // Start Video Frame Streaming (if enabled)
      if (options?.enableVideo) {
        videoIntervalRef.current = setInterval(() => {
          const frameData = captureVideoFrame();
          if (frameData && sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => {
              session.sendRealtimeInput({
                media: {
                  mimeType: 'image/jpeg',
                  data: frameData
                }
              });
            });
          }
        }, 1000); // Send 1 frame per second to conserve bandwidth
      }

      // Send current design context if available
      if (currentDesignImage && sessionPromiseRef.current) {
        setTimeout(() => {
          sessionPromiseRef.current?.then(session => {
            session.sendRealtimeInput({
              media: {
                mimeType: 'image/png',
                data: currentDesignImage
              }
            });
          });
        }, 2000); // Slight delay to ensure connection is stable
      }

    } catch (e: any) {
      console.error("Failed to connect multimodal live", e);

      // Clean up any partial media/interval state
      if (videoIntervalRef.current) {
        clearInterval(videoIntervalRef.current);
        videoIntervalRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
      }
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach(t => t.stop());
        videoStreamRef.current = null;
      }
      setIsVideoEnabled(false);
      setVideoStream(null);
      setIsConnected(false);

      const rawMsg = e?.message || '';
      const lowerMsg = rawMsg.toLowerCase();
      const name = e?.name || '';

      // If this is a key issue, open key picker and rethrow a clear message
      if (rawMsg.includes(MISSING_API_KEY_MESSAGE) || lowerMsg.includes('api key')) {
        promptForApiKeySelection();
        throw new Error(MISSING_API_KEY_MESSAGE);
      }

      // Permission/device errors should not prompt for API keys
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        throw new Error('Camera/microphone permission denied. Please allow access to use Living Atelier.');
      }
      if (name === 'NotFoundError') {
        throw new Error('No camera/microphone found. Please connect a device to use Living Atelier.');
      }

      throw e instanceof Error ? e : new Error('Failed to connect Living Atelier.');
    }
  }, [isConnected, onToolCall, currentDesignImage, captureVideoFrame, onVisualInsight, onReferenceCapture]);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setIsSpeaking(false);
    setIsListening(false);
    setIsVideoEnabled(false);
    setVideoStream(null);
    
    if (videoIntervalRef.current) {
      clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = null;
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(t => t.stop());
      videoStreamRef.current = null;
    }
    
    if (inputProcessorRef.current) {
      inputProcessorRef.current.disconnect();
      inputProcessorRef.current = null;
    }
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    sessionPromiseRef.current = null;
  }, []);

  const toggleVideo = useCallback(async () => {
    if (!isConnected) return;
    
    if (isVideoEnabled) {
      // Disable video
      if (videoIntervalRef.current) {
        clearInterval(videoIntervalRef.current);
        videoIntervalRef.current = null;
      }
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach(t => t.stop());
        videoStreamRef.current = null;
      }
      setIsVideoEnabled(false);
      setVideoStream(null);
    } else {
      // Enable video
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 5 }
          }
        });
        
        videoStreamRef.current = stream;
        if (videoElementRef.current) {
          videoElementRef.current.srcObject = stream;
        }
        setVideoStream(stream);
        setIsVideoEnabled(true);
        
        // Start frame streaming
        videoIntervalRef.current = setInterval(() => {
          const frameData = captureVideoFrame();
          if (frameData && sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => {
              session.sendRealtimeInput({
                media: {
                  mimeType: 'image/jpeg',
                  data: frameData
                }
              });
            });
          }
        }, 1000);
      } catch (e) {
        console.error("Failed to enable video", e);
      }
    }
  }, [isConnected, isVideoEnabled, captureVideoFrame]);

  const sendScreenCapture = useCallback((imageBase64: string) => {
    if (!sessionPromiseRef.current) return;
    
    sessionPromiseRef.current.then(session => {
      session.sendRealtimeInput({
        media: {
          mimeType: 'image/png',
          data: imageBase64
        }
      });
    });
    setLastVisualContext(imageBase64);
  }, []);

  const clearReferences = useCallback(() => {
    setCapturedReferences([]);
  }, []);

  return {
    isConnected,
    isSpeaking,
    isListening,
    volume,
    isVideoEnabled,
    videoStream,
    capturedReferences,
    lastVisualContext,
    connect,
    disconnect,
    toggleVideo,
    sendScreenCapture,
    clearReferences
  };
};