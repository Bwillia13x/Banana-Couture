import React, { useState, useEffect, useRef } from 'react';
import { AuraInsight, AuraContextState } from '../hooks/useLiveAPIv2';

interface Aura2PanelProps {
  isOpen: boolean;
  onClose: () => void;
  isConnected: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  volume: number;
  auraContext: AuraContextState;
  transcript: { role: 'user' | 'aura'; text: string; timestamp: number }[];
  onConnect: () => void;
  onDisconnect: () => void;
  onInsightAction: (insight: AuraInsight) => void;
  onClearInsights: () => void;
}

export const Aura2Panel: React.FC<Aura2PanelProps> = ({
  isOpen,
  onClose,
  isConnected,
  isSpeaking,
  isListening,
  volume,
  auraContext,
  transcript,
  onConnect,
  onDisconnect,
  onInsightAction,
  onClearInsights
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'insights'>('chat');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Animated orb visualization inside panel
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const draw = () => {
      time += 0.05;
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      if (!isConnected) {
        // Dormant state - subtle pulse
        const gradient = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, 40);
        gradient.addColorStop(0, 'rgba(151, 71, 255, 0.3)');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(151, 71, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8 + Math.sin(time) * 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (isSpeaking) {
        // Speaking - purple waves (nc-accent)
        for (let i = 0; i < 3; i++) {
          const radius = 20 + i * 15 + Math.sin(time * 3 + i) * 5;
          const alpha = 0.3 - i * 0.1;
          ctx.strokeStyle = `rgba(168, 85, 255, ${alpha})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        const gradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, 25);
        gradient.addColorStop(0, '#A855FF');
        gradient.addColorStop(1, 'rgba(168, 85, 255, 0.3)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 15 + Math.sin(time * 5) * 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (isListening) {
        // Listening - responds to volume
        const volBoost = volume * 30;
        
        const gradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, 35 + volBoost);
        gradient.addColorStop(0, volume > 0.1 ? '#10B981' : '#9747FF');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 35 + volBoost, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = volume > 0.1 ? '#22C55E' : '#7C2AE8';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 12 + volBoost * 0.3, 0, Math.PI * 2);
        ctx.fill();
      } else if (auraContext.isAnalyzing) {
        // Analyzing - scanning effect (Gold)
        const scanAngle = time * 2;
        
        ctx.strokeStyle = 'rgba(220, 165, 74, 0.5)'; // nc-gold
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 30, scanAngle, scanAngle + Math.PI / 2);
        ctx.stroke();
        
        const gradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, 25);
        gradient.addColorStop(0, '#DCA54A');
        gradient.addColorStop(1, 'rgba(220, 165, 74, 0.2)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
        ctx.fill();
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [isConnected, isSpeaking, isListening, volume, auraContext.isAnalyzing]);

  if (!isOpen) return null;

  const getStatusText = () => {
    if (!isConnected) return 'Offline';
    if (auraContext.isAnalyzing) return 'Analyzing Design...';
    if (isSpeaking) return 'Speaking...';
    if (isListening) return 'Listening...';
    return 'Ready';
  };

  return (
    <div className="fixed bottom-24 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-nc-border-strong overflow-hidden z-50 animate-slide-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-nc-accent to-purple-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <canvas 
              ref={canvasRef} 
              width={80} 
              height={80} 
              className="w-10 h-10"
            />
            <div>
              <h3 className="text-white font-bold text-sm font-display">Aura 2.0</h3>
              <p className={`text-xs ${isConnected ? 'text-white/80' : 'text-white/50'}`}>
                {getStatusText()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <button
                onClick={onDisconnect}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all"
                title="Disconnect"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </button>
            ) : (
              <button
                onClick={onConnect}
                className="px-3 py-1.5 rounded-lg bg-white text-nc-accent-strong font-bold text-xs hover:bg-white/90 transition-all"
              >
                Connect
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-nc-border-subtle bg-nc-bg-elevated">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'chat' 
              ? 'text-nc-accent-strong border-b-2 border-nc-accent' 
              : 'text-nc-ink-subtle hover:text-nc-ink'
          }`}
        >
          Conversation
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all relative ${
            activeTab === 'insights' 
              ? 'text-nc-accent-strong border-b-2 border-nc-accent' 
              : 'text-nc-ink-subtle hover:text-nc-ink'
          }`}
        >
          Insights
          {auraContext.insights.length > 0 && (
            <span className="absolute top-2 right-4 w-4 h-4 bg-nc-rose text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {auraContext.insights.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="h-80 overflow-y-auto bg-nc-bg-soft/50 custom-scrollbar">
        {activeTab === 'chat' ? (
          <div className="p-4 space-y-3">
            {transcript.length === 0 ? (
              <div className="text-center py-10 text-nc-ink-subtle opacity-60">
                <div className="w-16 h-16 bg-nc-bg-soft rounded-full flex items-center justify-center mx-auto mb-3 border border-nc-border-subtle">
                  <svg className="w-8 h-8 text-nc-ink-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-sm font-medium">No conversation yet</p>
                <p className="text-xs mt-1">Connect and start talking to Aura</p>
              </div>
            ) : (
              transcript.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-nc-ink text-white rounded-br-md' 
                      : 'bg-white text-nc-ink border border-nc-border-subtle rounded-bl-md'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {auraContext.insights.length === 0 ? (
              <div className="text-center py-10 text-nc-ink-subtle opacity-60">
                <div className="w-16 h-16 bg-nc-bg-soft rounded-full flex items-center justify-center mx-auto mb-3 border border-nc-border-subtle">
                  <svg className="w-8 h-8 text-nc-ink-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <p className="text-sm font-medium">No insights yet</p>
                <p className="text-xs mt-1">Aura will analyze your design and provide suggestions</p>
              </div>
            ) : (
              <>
                <div className="flex justify-end mb-2">
                  <button
                    onClick={onClearInsights}
                    className="text-[10px] text-nc-ink-subtle hover:text-nc-ink uppercase tracking-wider font-bold"
                  >
                    Clear All
                  </button>
                </div>
                {auraContext.insights.map((insight) => (
                  <div 
                    key={insight.id}
                    className={`p-3 rounded-xl border shadow-sm ${
                      insight.type === 'suggestion' ? 'bg-indigo-50/50 border-indigo-100' :
                      insight.type === 'warning' ? 'bg-amber-50/50 border-amber-100' :
                      insight.type === 'praise' ? 'bg-emerald-50/50 border-emerald-100' :
                      'bg-white border-nc-border-subtle'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className={`text-xs font-bold ${
                        insight.type === 'suggestion' ? 'text-indigo-700' :
                        insight.type === 'warning' ? 'text-amber-700' :
                        insight.type === 'praise' ? 'text-emerald-700' :
                        'text-nc-ink'
                      }`}>
                        {insight.type === 'suggestion' && '💡'}
                        {insight.type === 'warning' && '⚠️'}
                        {insight.type === 'praise' && '✨'}
                        {insight.type === 'observation' && '👁️'}
                        {' '}{insight.title}
                      </span>
                      <span className="text-[9px] text-nc-ink-subtle">
                        {new Date(insight.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-nc-ink-soft mb-3 leading-relaxed">{insight.content}</p>
                    {insight.actionable && (
                      <button
                        onClick={() => onInsightAction(insight)}
                        className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all w-full flex items-center justify-center gap-2 ${
                          insight.type === 'suggestion' ? 'bg-indigo-600 text-white hover:bg-indigo-500' :
                          'bg-nc-ink text-white hover:bg-nc-ink-soft'
                        }`}
                      >
                        {insight.actionable.label} →
                      </button>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};