import React, { useRef, useEffect, useState, useCallback } from 'react';

interface VisualEditorProps {
  imageBase64: string;
  onApply: (maskBase64: string, instruction: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

type Tool = 'brush' | 'eraser' | 'hand';

interface Point {
  x: number;
  y: number;
}

export const VisualEditor: React.FC<VisualEditorProps> = ({
  imageBase64,
  onApply,
  onCancel,
  isLoading
}) => {
  // Canvas & Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // State: Tools & Interaction
  const [activeTool, setActiveTool] = useState<Tool>('brush');
  const [brushSize, setBrushSize] = useState(40);
  const [instruction, setInstruction] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [mousePos, setMousePos] = useState<Point | null>(null); // For custom cursor
  
  // State: Viewport
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const lastMousePos = useRef<Point>({ x: 0, y: 0 });

  // State: History
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);

  const saveHistory = (ctx: CanvasRenderingContext2D) => {
      const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
      setHistory(prev => {
          const newHistory = prev.slice(0, historyStep + 1);
          newHistory.push(imageData);
          return newHistory;
      });
      setHistoryStep(prev => prev + 1);
  };

  const saveHistoryRef = useRef(saveHistory);
  useEffect(() => {
    saveHistoryRef.current = saveHistory;
  }, [saveHistory]);

  // Initialize
  useEffect(() => {
    const img = new Image();
    img.src = `data:image/png;base64,${imageBase64}`;
    img.onload = () => {
      imageRef.current = img;
      if (canvasRef.current && containerRef.current) {
        // Fit image to container initially
        const containerW = containerRef.current.clientWidth;
        const containerH = containerRef.current.clientHeight;
        const imageW = img.width;
        const imageH = img.height;
        
        const scaleX = (containerW - 80) / imageW;
        const scaleY = (containerH - 80) / imageH;
        const initialScale = Math.min(1, scaleX, scaleY);
        
        setScale(initialScale);
        
        // Center it
        setOffset({
            x: (containerW - imageW * initialScale) / 2,
            y: (containerH - imageH * initialScale) / 2
        });

        // Set canvas size to match image resolution
        canvasRef.current.width = imageW;
        canvasRef.current.height = imageH;
        
        // Save initial blank state
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
            saveHistoryRef.current(ctx);
        }
      }
    };
  }, [imageBase64]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUndo = useCallback(() => {
      if (historyStep > 0) {
          const newStep = historyStep - 1;
          const ctx = canvasRef.current?.getContext('2d');
          if (ctx) {
              ctx.putImageData(history[newStep], 0, 0);
              setHistoryStep(newStep);
          }
      }
  }, [history, historyStep]);

  const handleRedo = useCallback(() => {
      if (historyStep < history.length - 1) {
          const newStep = historyStep + 1;
          const ctx = canvasRef.current?.getContext('2d');
          if (ctx) {
              ctx.putImageData(history[newStep], 0, 0);
              setHistoryStep(newStep);
          }
      }
  }, [history, historyStep]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Ignore if typing in input
        if ((e.target as HTMLElement).tagName === 'INPUT') return;

        if (e.key.toLowerCase() === 'b') setActiveTool('brush');
        if (e.key.toLowerCase() === 'e') setActiveTool('eraser');
        if (e.key.toLowerCase() === 'h') setActiveTool('hand');
        if (e.key === '[') setBrushSize(s => Math.max(5, s - 5));
        if (e.key === ']') setBrushSize(s => Math.min(200, s + 5));
        
        if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
            e.preventDefault();
            if (e.shiftKey) handleRedo();
            else handleUndo();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);


  // --- Input Handling ---

  const getCanvasCoordinates = (clientX: number, clientY: number): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
    const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (isLoading) return;
    
    let clientX, clientY;
    if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
    }

    if (activeTool === 'hand' || (e as React.MouseEvent).button === 1 || (e as React.MouseEvent).shiftKey) { // Middle mouse or Shift+Drag
        setIsPanning(true);
        lastMousePos.current = { x: clientX, y: clientY };
        return;
    }

    setIsDrawing(true);
    const { x, y } = getCanvasCoordinates(clientX, clientY);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
        ctx.beginPath();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = brushSize;
        ctx.globalCompositeOperation = activeTool === 'eraser' ? 'destination-out' : 'source-over';
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.8)'; // nc-rose mask
        ctx.moveTo(x, y);
        // Draw a dot for single clicks
        ctx.lineTo(x, y); 
        ctx.stroke();
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (isLoading) return;

    let clientX, clientY;
    if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
        setMousePos({ x: clientX, y: clientY }); // Update cursor preview position
    }

    if (isPanning) {
        const dx = clientX - lastMousePos.current.x;
        const dy = clientY - lastMousePos.current.y;
        
        setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        lastMousePos.current = { x: clientX, y: clientY };
        return;
    }

    if (!isDrawing) return;
    
    // Prevent scrolling on touch
    if (e.cancelable && 'touches' in e) e.preventDefault(); 
    
    const { x, y } = getCanvasCoordinates(clientX, clientY);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
        ctx.lineTo(x, y);
        ctx.stroke();
    }
  };

  const handlePointerUp = () => {
    if (isPanning) {
        setIsPanning(false);
        return;
    }
    if (isDrawing) {
        const ctx = canvasRef.current?.getContext('2d');
        ctx?.closePath();
        setIsDrawing(false);
        if (ctx) saveHistory(ctx);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey || activeTool !== 'hand') { 
        if ((e.target as HTMLElement).tagName === 'INPUT') return;

        const container = containerRef.current;
        if (!container) return;
        
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const worldX = (mouseX - offset.x) / scale;
        const worldY = (mouseY - offset.y) / scale;

        const zoomSensitivity = 0.001;
        const zoomFactor = Math.exp(-e.deltaY * zoomSensitivity);
        const newScale = Math.min(8, Math.max(0.05, scale * zoomFactor));

        const newOffsetX = mouseX - worldX * newScale;
        const newOffsetY = mouseY - worldY * newScale;

        setScale(newScale);
        setOffset({ x: newOffsetX, y: newOffsetY });
    }
  };

  const handleClear = () => {
     const ctx = canvasRef.current?.getContext('2d');
     if (ctx && canvasRef.current) {
         ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
         saveHistory(ctx);
     }
  };

  const handleInvert = () => {
     const ctx = canvasRef.current?.getContext('2d');
     if (ctx && canvasRef.current) {
         const w = canvasRef.current.width;
         const h = canvasRef.current.height;
         const imgData = ctx.getImageData(0, 0, w, h);
         const data = imgData.data;
         
         for(let i=0; i<data.length; i+=4) {
             const alpha = data[i+3];
             if (alpha > 10) {
                 data[i+3] = 0;
             } else {
                 data[i] = 244;
                 data[i+1] = 63;
                 data[i+2] = 94;
                 data[i+3] = 204;
             }
         }
         
         ctx.putImageData(imgData, 0, 0);
         saveHistory(ctx);
     }
  };

  const handleSubmit = () => {
     if (!canvasRef.current || !instruction.trim()) return;
     
     const maskCanvas = document.createElement('canvas');
     maskCanvas.width = canvasRef.current.width;
     maskCanvas.height = canvasRef.current.height;
     const mCtx = maskCanvas.getContext('2d');
     
     if (mCtx) {
         mCtx.fillStyle = '#000000';
         mCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
         mCtx.drawImage(canvasRef.current, 0, 0);
         
         const imageData = mCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
         const data = imageData.data;
         for (let i = 0; i < data.length; i += 4) {
             if (data[i+3] > 10) { 
                 data[i] = 255;
                 data[i+1] = 255;
                 data[i+2] = 255;
                 data[i+3] = 255;
             }
         }
         mCtx.putImageData(imageData, 0, 0);
         const maskBase64 = maskCanvas.toDataURL('image/png').split(',')[1];
         onApply(maskBase64, instruction);
     }
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col animate-fade-in font-sans bg-nc-ink select-none overflow-hidden">
        
        {/* Floating Top Bar */}
        <div className="absolute top-6 left-6 right-6 z-50 flex justify-between items-center pointer-events-none">
             {/* Left Island: Title & Brush Settings */}
             <div className="bg-nc-ink/90 backdrop-blur-xl border border-white/10 rounded-full px-5 py-3 shadow-2xl flex items-center gap-6 pointer-events-auto">
                 <div className="flex items-center gap-2 pr-4 border-r border-white/10">
                     <div className="w-2 h-2 bg-nc-rose rounded-full animate-pulse"></div>
                     <span className="text-white font-bold text-xs uppercase tracking-widest">Visual Editor</span>
                 </div>
                 
                 <div className="flex items-center gap-4">
                     <div className="flex items-center gap-2">
                        <span className="text-[9px] text-white/50 uppercase font-bold tracking-wider">Size</span>
                        <input 
                            type="range" 
                            min="5" 
                            max="200" 
                            value={brushSize} 
                            onChange={(e) => setBrushSize(parseInt(e.target.value))}
                            className="w-20 accent-nc-rose h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                        />
                     </div>
                     <div className="w-px h-3 bg-white/10"></div>
                     <div className="flex items-center gap-2">
                        <span className="text-[9px] text-white/50 uppercase font-bold tracking-wider">Zoom</span>
                        <div className="flex gap-1">
                             <button onClick={() => setScale(s => Math.max(0.1, s - 0.2))} className="w-5 h-5 rounded hover:bg-white/10 text-white flex items-center justify-center text-xs">-</button>
                             <span className="text-[10px] text-white w-8 text-center pt-0.5">{Math.round(scale * 100)}%</span>
                             <button onClick={() => setScale(s => Math.min(5, s + 0.2))} className="w-5 h-5 rounded hover:bg-white/10 text-white flex items-center justify-center text-xs">+</button>
                        </div>
                     </div>
                 </div>
             </div>

             {/* Right Island: History & Close */}
             <div className="bg-nc-ink/90 backdrop-blur-xl border border-white/10 rounded-full px-3 py-2 shadow-2xl flex items-center gap-1 pointer-events-auto">
                 <button onClick={handleUndo} disabled={historyStep <= 0} className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white disabled:opacity-30 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                 </button>
                 <button onClick={handleRedo} disabled={historyStep >= history.length - 1} className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white disabled:opacity-30 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>
                 </button>
                 <div className="w-px h-4 bg-white/10 mx-1"></div>
                 <button onClick={onCancel} className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
             </div>
        </div>

        {/* Floating Toolbar (Left) */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2 bg-nc-ink/90 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl">
            <button 
                onClick={() => setActiveTool('brush')}
                className={`p-3 rounded-xl transition-all ${activeTool === 'brush' ? 'bg-nc-rose text-white shadow-lg shadow-nc-rose/30' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
                title="Brush Tool (B)"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
            <button 
                onClick={() => setActiveTool('eraser')}
                className={`p-3 rounded-xl transition-all ${activeTool === 'eraser' ? 'bg-nc-accent text-white shadow-lg shadow-nc-accent/30' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
                title="Eraser Tool (E)"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
            <button 
                onClick={() => setActiveTool('hand')}
                className={`p-3 rounded-xl transition-all ${activeTool === 'hand' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
                title="Hand Tool (H)"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11" /></svg>
            </button>
            
            <div className="w-full h-px bg-white/10 my-1"></div>

            <button 
                onClick={handleInvert}
                className="p-3 rounded-xl text-white/50 hover:bg-white/5 hover:text-white transition-all"
                title="Invert Mask"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
            </button>
            
            <button 
                onClick={handleClear}
                className="p-3 rounded-xl text-white/50 hover:bg-red-500/20 hover:text-red-400 transition-all"
                title="Clear Mask"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
        </div>

        {/* Main Canvas Area */}
        <div 
            ref={containerRef}
            className="flex-1 relative overflow-hidden bg-[radial-gradient(circle_at_center,_#201213_0%,_#0F0A0A_100%)]"
            onWheel={handleWheel}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            style={{ 
                cursor: activeTool === 'hand' || isPanning ? 'grab' : 'none'
            }}
        >
            {/* Custom Cursor */}
            {(activeTool === 'brush' || activeTool === 'eraser') && mousePos && !isPanning && (
                <div 
                    className="pointer-events-none fixed z-[100] rounded-full border-2 border-white mix-blend-difference shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                    style={{
                        left: mousePos.x,
                        top: mousePos.y,
                        width: brushSize * scale,
                        height: brushSize * scale,
                        transform: 'translate(-50%, -50%)'
                    }}
                ></div>
            )}

            {/* Transform Wrapper */}
            <div 
                className="origin-top-left absolute left-0 top-0 will-change-transform"
                style={{ 
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` 
                }}
            >
                <img 
                    src={`data:image/png;base64,${imageBase64}`}
                    alt="Target"
                    className="pointer-events-none select-none block shadow-2xl rounded-sm"
                    draggable={false}
                />
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full"
                />
            </div>
        </div>

        {/* Floating Bottom Prompt Bar */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-3xl px-6 z-50">
             <div className="flex gap-2 p-2 bg-nc-ink/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                 <input 
                    type="text" 
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    placeholder="Describe changes (e.g. 'Change to red velvet', 'Remove sleeve')..."
                    className="flex-1 bg-transparent border-none text-white placeholder-white/40 focus:ring-0 px-4 text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    autoFocus
                 />
                 <div className="w-px h-10 bg-white/10 mx-1 self-center"></div>
                 <button 
                    onClick={handleSubmit} 
                    disabled={isLoading || !instruction.trim()}
                    className="bg-nc-rose hover:bg-rose-500 disabled:opacity-50 disabled:bg-white/10 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all shadow-lg flex items-center gap-2"
                 >
                    {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <span>Generate</span>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </>
                    )}
                 </button>
             </div>
        </div>
    </div>
  );
};