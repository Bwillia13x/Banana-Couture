
import React, { useState, useRef, useEffect } from 'react';

interface CompareSliderProps {
  image1: string; // Concept (Bottom)
  image2: string; // CAD (Top)
  zoom: number;
}

export const CompareSlider: React.FC<CompareSliderProps> = ({ image1, image2, zoom }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => { 
    e.preventDefault();
    isDragging.current = true; 
  };
  
  const handleMouseUp = () => { isDragging.current = false; };
  
  const handleMouseMove = (e: React.MouseEvent | MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.min(100, Math.max(0, x)));
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove as any);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove as any);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none overflow-hidden cursor-col-resize group rounded-xl border border-white/10 shadow-2xl bg-[#0F131E]"
    >
        {/* Interaction Layer */}
        <div 
            className="absolute inset-0 z-30 cursor-col-resize"
            onMouseDown={handleMouseDown}
        ></div>

        {/* Background Image (Concept) */}
        <div className="absolute inset-0 flex items-center justify-center w-full h-full p-0 overflow-hidden">
             <img
                src={`data:image/png;base64,${image1}`}
                className="max-w-none max-h-none object-contain transition-transform duration-75"
                style={{ 
                    transform: `scale(${zoom})`,
                    width: '100%',
                    height: '100%'
                }}
                alt="Concept"
                draggable={false}
            />
        </div>

        {/* Labels */}
        <div className="absolute top-4 left-4 z-20 pointer-events-none">
            <span className="bg-black/60 text-white text-[9px] px-2 py-1 rounded backdrop-blur font-bold uppercase tracking-widest border border-white/10">Concept</span>
        </div>
        <div className="absolute top-4 right-4 z-20 pointer-events-none">
            <span className="bg-white/90 text-slate-900 text-[9px] px-2 py-1 rounded backdrop-blur font-bold uppercase tracking-widest border border-white/10">Structure</span>
        </div>

        {/* Foreground Image (CAD) - Clipped */}
        <div
            className="absolute inset-0 w-full h-full pointer-events-none select-none bg-white"
            style={{ 
                clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` 
            }}
        >
             <div className="w-full h-full flex items-center justify-center overflow-hidden">
                 <img
                    src={`data:image/png;base64,${image2}`}
                    className="max-w-none max-h-none object-contain mix-blend-multiply transition-transform duration-75"
                    style={{ 
                        transform: `scale(${zoom})`,
                        width: '100%',
                        height: '100%'
                    }}
                    alt="CAD"
                    draggable={false}
                />
            </div>
            
            {/* Grid Overlay on CAD side for technical feel */}
            <div className="absolute inset-0 bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none"></div>
        </div>

        {/* Slider Handle Line */}
        <div
            className="absolute top-0 bottom-0 w-0.5 bg-indigo-500 cursor-col-resize z-20 shadow-[0_0_15px_rgba(99,102,241,1)] pointer-events-none"
            style={{ left: `${sliderPosition}%` }}
        >
             {/* Glowing Handle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-600 rounded-full border-2 border-white shadow-xl flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 9l-3 3m0 0l3 3m-3-3h12m3-3l3 3m0 0l-3 3" /></svg>
            </div>
        </div>
    </div>
  );
};
