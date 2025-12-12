
import React, { useState, useEffect, useCallback } from 'react';
import { AppView } from '../types';

interface GuidedTourProps {
  isActive: boolean;
  autoPlay: boolean;
  onEnd: () => void;
  onNavigate: (view: AppView) => void;
  currentView: AppView;
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

const STEPS = [
    {
        view: AppView.HOME,
        target: 'body', // General intro
        title: 'Welcome to Banana Couture',
        text: 'The first AI-powered fashion atelier. Design, engineer, and sell clothing in minutes.'
    },
    {
        view: AppView.STUDIO,
        target: '[data-purpose="ai-generation"]',
        title: 'Generative Design',
        text: 'Type a prompt here to visualize any garment instantly using Gemini 2.5.'
    },
    {
        view: AppView.STUDIO,
        target: '[data-purpose="left-toolbar-container"]',
        title: 'Professional Tools',
        text: 'Access tools like Magic Mirror, AI Critic, and the Video Generator here.'
    },
    {
        view: AppView.STUDIO,
        target: '[data-purpose="right-properties-panel"]',
        title: 'Engineering & Sourcing',
        text: 'Generate manufacturing-ready Tech Packs and find sustainable material suppliers.'
    },
    {
        view: AppView.MARKETPLACE,
        target: 'body',
        title: 'Global Marketplace',
        text: 'Publish your designs to the world. Other designers can remix your work, earning you royalties.'
    }
];

export const GuidedTour: React.FC<GuidedTourProps> = ({ isActive, autoPlay, onEnd, onNavigate, currentView, onShowToast }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Polling helper to find element
  const findElement = useCallback((selector: string, maxAttempts = 15, interval = 200): Promise<Element | null> => {
    return new Promise((resolve) => {
      if (selector === 'body') {
        resolve(document.body);
        return;
      }

      let attempts = 0;
      const check = () => {
        const el = document.querySelector(selector);
        if (el) {
          const rect = el.getBoundingClientRect();
          // Ensure it has size (is visible)
          if (rect.width > 0 || rect.height > 0) {
            resolve(el);
            return;
          }
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(check, interval);
        } else {
          console.warn(`GuidedTour: Element ${selector} not found after ${maxAttempts} attempts`);
          resolve(null);
        }
      };
      check();
    });
  }, []);

  useEffect(() => {
      if (!isActive) return;
      
      const step = STEPS[stepIndex];
      let mounted = true;

      const runStep = async () => {
        // If we need to change view, do it first
        if (step.view !== currentView) {
            setTargetRect(null); // Clear highlight immediately
            setIsReady(false); // Show loading state or hide tooltip
            onNavigate(step.view);
            // We wait for the parent to update currentView, which triggers this effect again
            return;
        }

        // View is correct, look for element
        setIsReady(false);
        const el = await findElement(step.target);
        
        if (!mounted) return;

        if (el && step.target !== 'body') {
            const rect = el.getBoundingClientRect();
            setTargetRect(rect);
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            setTargetRect(null); // Center modal for body or missing target
        }
        setIsReady(true);
      };

      runStep();

      return () => {
        mounted = false;
      };
  }, [stepIndex, isActive, currentView, onNavigate, findElement]);

  // Autoplay logic
  useEffect(() => {
      if (!isActive || !autoPlay || !isReady) return;

      const timer = setTimeout(() => {
          handleNext();
      }, 5000); // 5 seconds per step
      return () => clearTimeout(timer);
  }, [isActive, autoPlay, isReady, stepIndex]); // Depends on stepIndex to reset timer on change

  const handleNext = () => {
      if (stepIndex < STEPS.length - 1) {
          setStepIndex(prev => prev + 1);
      } else {
          onEnd();
          onShowToast('success', 'You are ready to design!');
      }
  };

  const handleSkip = () => {
      onEnd();
  };

  if (!isActive) return null;

  const currentStep = STEPS[stepIndex];

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none">
        {/* Spotlight Overlay */}
        <div 
            className="absolute inset-0 bg-nc-ink/80 transition-all duration-700 ease-out"
            style={targetRect ? {
                clipPath: `polygon(
                    0% 0%, 
                    0% 100%, 
                    ${targetRect.left}px 100%, 
                    ${targetRect.left}px ${targetRect.top}px, 
                    ${targetRect.right}px ${targetRect.top}px, 
                    ${targetRect.right}px ${targetRect.bottom}px, 
                    ${targetRect.left}px ${targetRect.bottom}px, 
                    ${targetRect.left}px 100%, 
                    100% 100%, 
                    100% 0%
                )`
            } : {}}
        ></div>

        {/* Highlight Border */}
        {targetRect && (
            <div 
                className="absolute border-2 border-nc-accent rounded-xl shadow-[0_0_30px_rgba(168,85,255,0.6)] transition-all duration-700 ease-out animate-pulse"
                style={{
                    top: targetRect.top - 4,
                    left: targetRect.left - 4,
                    width: targetRect.width + 8,
                    height: targetRect.height + 8
                }}
            ></div>
        )}

        {/* Tooltip Card */}
        {isReady && (
            <div 
                className="absolute transition-all duration-700 ease-out pointer-events-auto"
                style={{
                    top: targetRect ? Math.min(window.innerHeight - 250, Math.max(20, targetRect.bottom + 20)) : '50%',
                    left: targetRect ? Math.min(window.innerWidth - 320, Math.max(20, targetRect.left + (targetRect.width / 2) - 160)) : '50%',
                    transform: targetRect ? 'none' : 'translate(-50%, -50%)',
                    width: '320px'
                }}
            >
                <div className="bg-nc-bg-elevated p-6 rounded-2xl shadow-2xl border border-nc-border-subtle animate-scale-in">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 bg-nc-accent-soft text-nc-accent-strong rounded-full flex items-center justify-center font-black text-sm border border-nc-accent/20">
                            {stepIndex + 1}/{STEPS.length}
                        </div>
                        <button onClick={handleSkip} className="text-nc-ink-subtle hover:text-nc-ink transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    
                    <h3 className="text-lg font-bold text-nc-ink mb-2 font-display">{currentStep.title}</h3>
                    <p className="text-sm text-nc-ink-soft mb-6 leading-relaxed">{currentStep.text}</p>
                    
                    <div className="flex justify-between items-center">
                        <div className="flex gap-1">
                            {STEPS.map((_, i) => (
                                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === stepIndex ? 'bg-nc-accent' : 'bg-nc-border-strong'}`}></div>
                            ))}
                        </div>
                        <button 
                            onClick={handleNext} 
                            className="px-6 py-2.5 bg-nc-ink hover:bg-nc-ink-soft text-white rounded-full text-xs font-bold uppercase tracking-wider transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        >
                            {stepIndex === STEPS.length - 1 ? 'Start Designing' : 'Next'}
                        </button>
                    </div>
                </div>
                
                {/* Arrow (Visual only, position approx) */}
                {targetRect && (
                    <div 
                        className={`absolute w-4 h-4 bg-nc-bg-elevated border-l border-t border-nc-border-subtle transform rotate-45 -z-10`}
                        style={{
                            top: '-8px',
                            left: '50%',
                            marginLeft: '-8px'
                        }}
                    ></div>
                )}
            </div>
        )}
    </div>
  );
};
