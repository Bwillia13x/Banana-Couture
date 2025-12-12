
import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from "@google/genai";
import { getGeminiApiKey, promptForApiKeySelection } from '../services/apiKey';

// ============================================
// AURA 2.0 - ENHANCED TOOL DEFINITIONS
// ============================================

const aura2ToolsDef: FunctionDeclaration[] = [
  // Original tools
  {
    name: "updatePrompt",
    description: "Update the design prompt text based on the user's verbal description.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING, description: "The full text for the fashion prompt." }
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
        mode: { type: Type.STRING, enum: ["concept", "engineering", "split", "runway"] }
      },
      required: ["mode"]
    }
  },
  {
    name: "generatePattern",
    description: "Generate a custom textile pattern based on a description.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        description: { type: Type.STRING, description: "Description of the pattern (e.g. 'blue paisley', 'neon grid')." }
      },
      required: ["description"]
    }
  },
  
  // NEW: Aura 2.0 Enhanced Tools
  {
    name: "analyzeCurrentDesign",
    description: "Analyze the currently visible design on canvas and provide insights or suggestions.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        analysisType: { 
          type: Type.STRING, 
          enum: ["general", "silhouette", "color", "fabric", "construction", "marketability", "sustainability"],
          description: "Type of analysis to perform"
        }
      },
      required: ["analysisType"]
    }
  },
  {
    name: "suggestImprovement",
    description: "Suggest a specific improvement to the current design based on visual analysis.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        area: { type: Type.STRING, description: "Which part of the garment to improve (e.g., 'collar', 'sleeves', 'hemline')" },
        suggestion: { type: Type.STRING, description: "The specific improvement suggestion" },
        reasoning: { type: Type.STRING, description: "Why this improvement would help" }
      },
      required: ["area", "suggestion", "reasoning"]
    }
  },
  {
    name: "applyMaskEdit",
    description: "Open the mask editor to edit a specific region of the design.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        targetArea: { type: Type.STRING, description: "The area to edit (e.g., 'collar', 'pocket', 'sleeve')" },
        editInstruction: { type: Type.STRING, description: "What to do to that area" }
      },
      required: ["targetArea", "editInstruction"]
    }
  },
  {
    name: "generateTechPack",
    description: "Generate the technical/engineering pack for the current design.",
    parameters: { type: Type.OBJECT, properties: {} }
  },
  {
    name: "compareWithTrend",
    description: "Compare the current design with trending fashion styles.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        trendCategory: { type: Type.STRING, description: "The trend category to compare against (e.g., 'streetwear 2024', 'minimalist', 'sustainable fashion')" }
      },
      required: ["trendCategory"]
    }
  },
  {
    name: "estimateCost",
    description: "Estimate the production cost for the current design.",
    parameters: { type: Type.OBJECT, properties: {} }
  },
  {
    name: "generateColorVariant",
    description: "Generate a color variant of the current design.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        colorScheme: { type: Type.STRING, description: "The new color scheme (e.g., 'monochrome black', 'earth tones', 'neon pop')" }
      },
      required: ["colorScheme"]
    }
  },
  {
    name: "saveSnapshot",
    description: "Save the current design state to history.",
    parameters: { type: Type.OBJECT, properties: {} }
  },
  {
    name: "undoLastChange",
    description: "Undo the last design change.",
    parameters: { type: Type.OBJECT, properties: {} }
  },
  {
    name: "openTryOn",
    description: "Open the virtual try-on/magic mirror feature.",
    parameters: { type: Type.OBJECT, properties: {} }
  },
  {
    name: "generateRunwayVideo",
    description: "Generate a runway video of the current design.",
    parameters: { type: Type.OBJECT, properties: {} }
  },
  {
    name: "showAuraPanel",
    description: "Show or hide the Aura 2.0 analysis panel.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        show: { type: Type.BOOLEAN, description: "Whether to show or hide the panel" }
      },
      required: ["show"]
    }
  }
];

// ============================================
// AURA 2.0 STATE & TYPES
// ============================================

export interface AuraInsight {
  id: string;
  type: 'observation' | 'suggestion' | 'warning' | 'praise';
  title: string;
  content: string;
  timestamp: number;
  actionable?: {
    tool: string;
    args: any;
    label: string;
  };
}

export interface AuraContextState {
  lastCanvasAnalysis: string | null;
  activeDesignDescription: string | null;
  conversationContext: string[];
  insights: AuraInsight[];
  isAnalyzing: boolean;
  lastAnalysisTimestamp: number;
}

export interface LiveAPIv2State {
  isConnected: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  volume: number;
  auraContext: AuraContextState;
  transcript: { role: 'user' | 'aura'; text: string; timestamp: number }[];
  connect: (canvasImageGetter: () => string | null) => Promise<void>;
  disconnect: () => void;
  sendCanvasUpdate: (imageBase64: string) => void;
  clearInsights: () => void;
}

interface UseLiveAPIv2Props {
  onToolCall: (name: string, args: any) => Promise<any>;
  onAuraInsight: (insight: AuraInsight) => void;
  onTranscriptUpdate: (role: 'user' | 'aura', text: string) => void;
}

// ============================================
// AURA 2.0 SYSTEM INSTRUCTION
// ============================================

const AURA_2_SYSTEM_INSTRUCTION = `You are Aura 2.0, an advanced AI fashion design co-pilot with LIVE VISION capabilities.

## Your Capabilities:
1. **Real-Time Canvas Vision**: You can SEE the user's design canvas in real-time. Use this to provide proactive, contextual feedback.
2. **Voice Interaction**: Engage in natural conversation about fashion design.
3. **Tool Execution**: You can manipulate the design environment through tools.

## Personality:
- Professional but warm, like a seasoned creative director mentoring a promising designer
- Concise yet insightful - every word should add value
- Proactively helpful - don't wait to be asked if you see something worth mentioning
- Fashion-forward with deep technical knowledge

## Behavior Guidelines:

### When You Receive a Canvas Image:
- Analyze silhouette, proportion, color, texture, and construction details
- Note any technical issues (seam placement, fabric compatibility)
- Consider market positioning and trend alignment
- Look for opportunities to enhance the design

### When Speaking Proactively:
- Keep observations brief: "I notice the shoulder line could use more definition - would you like me to suggest adjustments?"
- Only interrupt with HIGH-VALUE insights, not obvious observations
- Phrase suggestions as collaborative offers, not criticisms

### When the User Speaks:
- Listen for intent: Are they asking for help, describing a vision, or seeking validation?
- If they describe changes, call the appropriate tool immediately
- If they ask "what do you think?", provide structured feedback (strengths, opportunities, suggestions)

## Tool Usage:
- **updatePrompt**: When user describes design changes verbally
- **triggerGenerate**: When user says "generate", "create", "make it"
- **analyzeCurrentDesign**: When you need to provide detailed feedback
- **suggestImprovement**: To offer specific, actionable suggestions
- **applyMaskEdit**: When user wants to edit a specific region
- **setViewMode**: When user wants to see different views
- **generatePattern**: When user describes a pattern/print
- **generateTechPack**: When user asks about construction, materials, or production
- **compareWithTrend**: When discussing market fit or trends
- **estimateCost**: When user asks about pricing or production costs
- **generateColorVariant**: When user wants to explore colors
- **undoLastChange**: When user says "undo" or "go back"
- **openTryOn**: When user wants to see it on a model
- **generateRunwayVideo**: When user wants to see it in motion
- **showAuraPanel**: To show/hide your analysis panel

## Response Format:
- Keep audio responses under 30 seconds
- Lead with the most important point
- End with a clear next step or question when appropriate

Remember: You are a creative PARTNER, not just an assistant. Your insights should feel like working with a brilliant collaborator who truly understands fashion.`;

// ============================================
// MAIN HOOK IMPLEMENTATION
// ============================================

export const useLiveAPIv2 = ({ onToolCall, onAuraInsight, onTranscriptUpdate }: UseLiveAPIv2Props): LiveAPIv2State => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [volume, setVolume] = useState(0);
  const [transcript, setTranscript] = useState<{ role: 'user' | 'aura'; text: string; timestamp: number }[]>([]);
  
  const [auraContext, setAuraContext] = useState<AuraContextState>({
    lastCanvasAnalysis: null,
    activeDesignDescription: null,
    conversationContext: [],
    insights: [],
    isAnalyzing: false,
    lastAnalysisTimestamp: 0
  });

  // Audio Contexts & Nodes
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const inputProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  // Playback State
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // Gemini Session
  const sessionRef = useRef<any>(null);
  
  // Canvas getter function
  const canvasImageGetterRef = useRef<(() => string | null) | null>(null);
  
  // Debounce canvas updates
  const lastCanvasUpdateRef = useRef<number>(0);
  const canvasUpdateThrottleMs = 3000; // Send canvas updates at most every 3 seconds

  // Helper: Base64 to AudioBuffer
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

  // Helper: Float32 to Base64 PCM
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

  // Send canvas update to Aura
  const sendCanvasUpdate = useCallback((imageBase64: string) => {
    const now = Date.now();
    if (now - lastCanvasUpdateRef.current < canvasUpdateThrottleMs) {
      return; // Throttle canvas updates
    }
    lastCanvasUpdateRef.current = now;

    if (sessionRef.current && isConnected) {
      setAuraContext(prev => ({ ...prev, isAnalyzing: true }));
      
      sessionRef.current.sendRealtimeInput({
        media: {
          mimeType: 'image/png',
          data: imageBase64
        }
      });

      // Also send a context message
      sessionRef.current.sendClientContent({
        turns: [{
          role: 'user',
          parts: [{ text: '[Canvas Updated - New design state visible]' }]
        }]
      });
    }
  }, [isConnected]);

  // Clear insights
  const clearInsights = useCallback(() => {
    setAuraContext(prev => ({ ...prev, insights: [] }));
  }, []);

  // Main connect function
  const connect = useCallback(async (canvasImageGetter: () => string | null) => {
    if (isConnected) return;
    canvasImageGetterRef.current = canvasImageGetter;

    try {
      const apiKey = getGeminiApiKey();
      const ai = new GoogleGenAI({ apiKey });
      
      // Initialize audio contexts
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      outputAudioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
      
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      audioContextRef.current = inputCtx;
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      mediaStreamRef.current = stream;

      // Setup analyser for visualization
      analyserRef.current = inputCtx.createAnalyser();
      analyserRef.current.fftSize = 256;
      const inputSource = inputCtx.createMediaStreamSource(stream);
      inputSource.connect(analyserRef.current);

      // Setup processor
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      inputProcessorRef.current = processor;
      sourceNodeRef.current = inputSource;
      inputSource.connect(processor);
      processor.connect(inputCtx.destination);

      // Connect to Gemini Live API with Aura 2.0 config
      const session = await ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO, Modality.TEXT],
          tools: [{ functionDeclarations: aura2ToolsDef }],
          systemInstruction: AURA_2_SYSTEM_INSTRUCTION,
        },
        callbacks: {
          onopen: () => {
            console.log("Aura 2.0 Connected");
            setIsConnected(true);
            setIsListening(true);
            
            // Send initial canvas state if available
            const currentCanvas = canvasImageGetterRef.current?.();
            if (currentCanvas) {
              setTimeout(() => {
                sendCanvasUpdate(currentCanvas);
              }, 1000);
            }
          },
          
          onmessage: async (msg: LiveServerMessage) => {
            // Handle Audio Output
            const audioParts = msg.serverContent?.modelTurn?.parts?.filter(
              (p: any) => p.inlineData?.mimeType?.startsWith('audio/')
            );
            
            if (audioParts && audioParts.length > 0 && outputAudioContextRef.current) {
              setIsSpeaking(true);
              setIsListening(false);
              
              for (const part of audioParts) {
                const audioData = part.inlineData?.data;
                if (audioData) {
                  const buffer = await decodeAudioData(audioData, outputAudioContextRef.current);
                  
                  const source = outputAudioContextRef.current.createBufferSource();
                  source.buffer = buffer;
                  source.connect(outputAudioContextRef.current.destination);
                  
                  const now = outputAudioContextRef.current.currentTime;
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
              }
            }

            // Handle Text Output (for transcript)
            const textParts = msg.serverContent?.modelTurn?.parts?.filter(
              (p: any) => p.text
            );
            
            if (textParts && textParts.length > 0) {
              const fullText = textParts.map((p: any) => p.text).join('');
              if (fullText.trim()) {
                onTranscriptUpdate('aura', fullText);
                setTranscript(prev => [...prev, { 
                  role: 'aura', 
                  text: fullText, 
                  timestamp: Date.now() 
                }]);
              }
            }

            // Handle Tool Calls
            if (msg.toolCall) {
              for (const fc of msg.toolCall.functionCalls) {
                console.log("Aura 2.0 Tool Call:", fc.name, fc.args);
                
                try {
                  const result = await onToolCall(fc.name, fc.args);
                  
                  // Send tool response
                  sessionRef.current?.sendToolResponse({
                    functionResponses: [{
                      id: fc.id,
                      name: fc.name,
                      response: { result: JSON.stringify(result || "OK") }
                    }]
                  });

                  // Generate insight for certain tools
                  if (fc.name === 'suggestImprovement') {
                    const args = fc.args as any;
                    const insight: AuraInsight = {
                      id: `insight-${Date.now()}`,
                      type: 'suggestion',
                      title: `Improve ${args.area}`,
                      content: args.suggestion,
                      timestamp: Date.now(),
                      actionable: {
                        tool: 'applyMaskEdit',
                        args: { 
                          targetArea: args.area, 
                          editInstruction: args.suggestion 
                        },
                        label: 'Apply This'
                      }
                    };
                    onAuraInsight(insight);
                    setAuraContext(prev => ({
                      ...prev,
                      insights: [...prev.insights.slice(-9), insight]
                    }));
                  }

                  if (fc.name === 'analyzeCurrentDesign') {
                    setAuraContext(prev => ({ 
                      ...prev, 
                      isAnalyzing: false,
                      lastAnalysisTimestamp: Date.now()
                    }));
                  }

                } catch (e) {
                  console.error("Tool execution error", e);
                  sessionRef.current?.sendToolResponse({
                    functionResponses: [{
                      id: fc.id,
                      name: fc.name,
                      response: { error: "Tool execution failed" }
                    }]
                  });
                }
              }
            }
            
            // Handle turn completion
            if (msg.serverContent?.turnComplete) {
              setAuraContext(prev => ({ ...prev, isAnalyzing: false }));
              setIsListening(true);
            }

            // Handle Interruption
            if (msg.serverContent?.interrupted) {
              activeSourcesRef.current.forEach(s => {
                try { s.stop(); } catch (e) {}
              });
              activeSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsSpeaking(false);
              setIsListening(true);
            }
          },
          
          onclose: () => {
            console.log("Aura 2.0 Disconnected");
            setIsConnected(false);
            setIsSpeaking(false);
            setIsListening(false);
          },
          
          onerror: (e) => {
            console.error("Aura 2.0 Error", e);
            setIsConnected(false);
            setIsSpeaking(false);
            setIsListening(false);
          }
        }
      });
      
      sessionRef.current = session;

      // Start streaming audio input
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Calculate volume for visualizer
        let sum = 0;
        for (let i = 0; i < inputData.length; i += 10) {
          sum += Math.abs(inputData[i]);
        }
        const avg = sum / (inputData.length / 10);
        setVolume(Math.min(1, avg * 5));

        // Send audio to Gemini
        const b64 = floatTo16BitPCM(inputData);
        sessionRef.current?.sendRealtimeInput({
          media: {
            mimeType: 'audio/pcm;rate=16000',
            data: b64
          }
        });
      };

    } catch (e) {
      console.error("Failed to connect Aura 2.0", e);
      promptForApiKeySelection();
      setIsConnected(false);
      throw e; // Re-throw so UI can display error
    }
  }, [isConnected, onToolCall, onAuraInsight, onTranscriptUpdate, sendCanvasUpdate]);

  // Disconnect function
  const disconnect = useCallback(() => {
    setIsConnected(false);
    setIsSpeaking(false);
    setIsListening(false);
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
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
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    
    if(sessionRef.current) {
        sessionRef.current.close();
        sessionRef.current = null;
    }
  }, []);

  return {
    isConnected,
    isSpeaking,
    isListening,
    volume,
    auraContext,
    transcript,
    connect,
    disconnect,
    sendCanvasUpdate,
    clearInsights
  };
};
