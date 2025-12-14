
import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { getGeminiApiKey } from '../services/apiKey';

const LIVE_MODEL_ID = 'gemini-2.5-flash-native-audio-preview-12-2025';
const FALLBACK_MODEL_ID = 'gemini-2.5-flash-native-audio-preview-09-2025';

// Helper for audio encoding
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper for audio decoding
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

interface UseLiveAPIProps {
  onToolCall?: (name: string, args: any) => Promise<any>;
}

export const useLiveAPI = ({ onToolCall }: UseLiveAPIProps = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // AI is speaking
  const [volume, setVolume] = useState(0); // User volume level

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  const connect = async () => {
    if (isConnected) return;

    let apiKey = '';
    try {
        apiKey = getGeminiApiKey();
    } catch (e) {
        console.error("No API Key");
        return;
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Setup Audio Output
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
    nextStartTimeRef.current = 0;

    // Setup Audio Input
    inputContextRef.current = new AudioContextClass({ sampleRate: 16000 });
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Analyze volume for UI
    const analyzer = inputContextRef.current.createAnalyser();
    analyzer.fftSize = 256;
    const source = inputContextRef.current.createMediaStreamSource(stream);
    source.connect(analyzer);
    
    const dataArray = new Uint8Array(analyzer.frequencyBinCount);
    const updateVolume = () => {
        if (!isConnected) return;
        analyzer.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setVolume(avg / 255); // Normalize 0-1
        requestAnimationFrame(updateVolume);
    };
    updateVolume();

    const config: any = {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
      },
      systemInstruction: 'You are Aura, an advanced AI fashion design assistant. You are helpful, creative, and professional. You can see the design canvas and help manipulate it.',
    };

    const callbacks = {
      onopen: () => {
        setIsConnected(true);
        // Start streaming audio
        const processor = inputContextRef.current!.createScriptProcessor(4096, 1, 1);
        processor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          // Convert Float32 to Int16
          const l = inputData.length;
          const int16 = new Int16Array(l);
          for (let i = 0; i < l; i++) {
            int16[i] = inputData[i] * 32768;
          }
          const blob = {
              data: encode(new Uint8Array(int16.buffer)),
              mimeType: 'audio/pcm;rate=16000'
          };
          
          sessionRef.current?.then((session: any) => {
              session.sendRealtimeInput({ media: blob });
          });
        };
        source.connect(processor);
        processor.connect(inputContextRef.current!.destination);
      },
      onmessage: async (msg: LiveServerMessage) => {
        // Handle Audio
        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (audioData) {
          setIsSpeaking(true);
          const ctx = audioContextRef.current!;
          nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
          
          const audioBuffer = await decodeAudioData(
            decode(audioData),
            ctx,
            24000,
            1
          );
          
          const sourceNode = ctx.createBufferSource();
          sourceNode.buffer = audioBuffer;
          sourceNode.connect(ctx.destination);
          sourceNode.addEventListener('ended', () => {
              sourcesRef.current.delete(sourceNode);
              if (sourcesRef.current.size === 0) setIsSpeaking(false);
          });
          
          sourceNode.start(nextStartTimeRef.current);
          sourcesRef.current.add(sourceNode);
          nextStartTimeRef.current += audioBuffer.duration;
        }

        // Handle Tools
        if (msg.toolCall && onToolCall) {
           for (const fc of msg.toolCall.functionCalls) {
               const result = await onToolCall(fc.name, fc.args);
               sessionRef.current?.then((session: any) => {
                   session.sendToolResponse({
                       functionResponses: {
                           id: fc.id,
                           name: fc.name,
                           response: { result: JSON.stringify(result) }
                       }
                   });
               });
           }
        }
        
        if (msg.serverContent?.interrupted) {
            sourcesRef.current.forEach(s => s.stop());
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
            setIsSpeaking(false);
        }
      },
      onclose: () => {
        setIsConnected(false);
        setIsSpeaking(false);
      },
      onerror: (err: any) => {
        console.error("Live API Error", err);
        setIsConnected(false);
      }
    };

    // Connection logic with retry/fallback
    let sessionPromise;
    try {
      sessionPromise = ai.live.connect({
        model: LIVE_MODEL_ID,
        config,
        callbacks
      });
      // We don't await here to keep the existing promise structure for sessionRef
      // But we can check if it rejects quickly? No, simpler to just wrap connect.
      // Actually, since we need to assign sessionRef.current = sessionPromise immediately,
      // and ai.live.connect returns a Promise<LiveSession>, we can just use .catch() for fallback.
      
      // However, to do a clean fallback we might want to try-catch the connect call if we were awaiting.
      // Since the original code structure relies on sessionPromise being the promise itself, let's wrap it.
      
      const connectWithFallback = async () => {
        try {
          return await ai.live.connect({ model: LIVE_MODEL_ID, config, callbacks });
        } catch (e) {
          console.warn(`[LiveAPI] Primary connection failed, retrying with fallback ${FALLBACK_MODEL_ID}`, e);
          return await ai.live.connect({ model: FALLBACK_MODEL_ID, config, callbacks });
        }
      };
      
      sessionPromise = connectWithFallback();
      sessionRef.current = sessionPromise;

    } catch (e) {
      console.error("Failed to initiate connection", e);
    }
  };

  const disconnect = () => {
    if (sessionRef.current) {
        sessionRef.current.then((s: any) => s.close());
    }
    if (audioContextRef.current) audioContextRef.current.close();
    if (inputContextRef.current) inputContextRef.current.close();
    setIsConnected(false);
    setIsSpeaking(false);
    setVolume(0);
  };

  return {
    isConnected,
    isSpeaking,
    volume,
    connect,
    disconnect
  };
};