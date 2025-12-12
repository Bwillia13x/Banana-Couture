
import React, { useEffect, useRef, useState } from 'react';

interface DismissiblePanelProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  autoHideMs?: number;
  anchor?: 'right' | 'bottom';
  children: React.ReactNode;
}

export const DismissiblePanel: React.FC<DismissiblePanelProps> = ({
  title,
  isOpen,
  onClose,
  autoHideMs,
  anchor = 'right',
  children
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Resize state
  const [dimension, setDimension] = useState(384); // Default 384px (matches w-96)
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (isOpen && autoHideMs && !isHovered && !isResizing) {
      timeoutRef.current = setTimeout(() => {
        onClose();
      }, autoHideMs);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isOpen, autoHideMs, isHovered, isResizing, onClose]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (anchor === 'right') {
        const rightMargin = 24; 
        const newWidth = document.body.clientWidth - e.clientX - rightMargin;
        setDimension(Math.max(300, Math.min(newWidth, 800)));
      } else {
        const newHeight = window.innerHeight - e.clientY;
        setDimension(Math.max(200, Math.min(newHeight, window.innerHeight - 100)));
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    document.body.style.userSelect = 'none';
    document.body.style.cursor = anchor === 'right' ? 'ew-resize' : 'ns-resize';

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing, anchor]);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  };

  const isRight = anchor === 'right';

  // Enhanced Dark Glassmorphism Styles with sophisticated easing
  // Using a custom cubic-bezier for a "spring-like" feel without the bounce, just smooth settling.
  // Transition includes subtle scaling and blurring for depth.
  const positionClasses = isRight
    ? `top-20 right-6 max-h-[calc(100vh-8rem)] ${isOpen ? 'translate-x-0 opacity-100 scale-100 blur-0' : 'translate-x-[20%] opacity-0 scale-95 blur-sm pointer-events-none'}`
    : `bottom-0 left-0 right-0 ${isOpen ? 'translate-y-0 opacity-100 scale-100 blur-0' : 'translate-y-[20%] opacity-0 scale-95 blur-sm pointer-events-none'}`;
    
  const style = isRight ? { width: `${dimension}px` } : { height: `${dimension}px` };
  
  const resizeActiveClass = isResizing ? 'ring-1 ring-indigo-500/50 border-indigo-500/50' : 'border-white/10';

  return (
    <div
      className={`absolute z-30 flex flex-col transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)]
        bg-slate-900/90 backdrop-blur-xl border shadow-2xl shadow-black/50 rounded-2xl
        ${resizeActiveClass} ${positionClasses}`}
      style={style}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocusCapture={handleMouseEnter}
      onBlurCapture={handleMouseLeave}
      role="dialog"
      aria-labelledby="panel-title"
    >
      {/* Resize Handle */}
      <div 
        className={`absolute z-50 group/handle flex items-center justify-center hover:bg-white/5 transition-colors
        ${isRight ? 'left-0 top-0 bottom-0 w-5 -ml-2.5 cursor-ew-resize' : 'top-0 left-0 right-0 h-5 -mt-2.5 cursor-ns-resize'}`}
        onMouseDown={startResize}
        title="Drag to resize"
      >
          <div className={`bg-white/20 rounded-full transition-all group-hover/handle:bg-indigo-400 group-hover/handle:shadow-[0_0_10px_rgba(99,102,241,0.5)] 
            ${isResizing ? 'bg-indigo-500 opacity-100' : 'opacity-0 group-hover/handle:opacity-100'} 
            ${isRight ? 'w-1 h-12' : 'h-1 w-12'}`}>
          </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0 select-none bg-white/[0.02] rounded-t-2xl">
        <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
            <h3 id="panel-title" className="text-[10px] font-bold text-slate-200 uppercase tracking-[0.2em] drop-shadow-sm">{title}</h3>
        </div>
        <button 
          onClick={onClose}
          className="group/close p-2 rounded-full hover:bg-white/10 transition-colors focus:outline-none flex items-center justify-center border border-transparent hover:border-white/5"
          aria-label="Close panel"
        >
          <svg className="w-4 h-4 text-slate-500 group-hover/close:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
        {children}
      </div>
    </div>
  );
};
