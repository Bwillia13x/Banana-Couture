
import React, { useState, useEffect } from 'react';

interface Material {
  id: string;
  name: string;
  image: string; // Base64
  timestamp: number;
}

interface MaterialLibraryProps {
  onApply: (textureBase64: string) => void;
  onClose?: () => void;
}

export const MaterialLibrary: React.FC<MaterialLibraryProps> = ({ onApply }) => {
  const [materials, setMaterials] = useState<Material[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('nanoFashion_materials');
      if (saved) {
        setMaterials(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load materials", e);
    }
  }, []);

  const deleteMaterial = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = materials.filter(m => m.id !== id);
    setMaterials(updated);
    localStorage.setItem('nanoFashion_materials', JSON.stringify(updated));
  };

  const handleDragStart = (e: React.DragEvent, material: Material) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
        type: 'material',
        image: material.image,
        name: material.name
    }));
    e.dataTransfer.effectAllowed = 'copy';
    
    // Create a drag image
    const dragImg = document.createElement("img");
    dragImg.src = `data:image/png;base64,${material.image}`;
    dragImg.style.width = "50px";
    dragImg.style.height = "50px";
    dragImg.style.borderRadius = "8px";
    dragImg.style.position = "absolute";
    dragImg.style.top = "-1000px";
    document.body.appendChild(dragImg);
    e.dataTransfer.setDragImage(dragImg, 25, 25);
    setTimeout(() => document.body.removeChild(dragImg), 0);
  };

  if (materials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400">
        <div className="w-12 h-12 mb-3 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
        </div>
        <p className="text-xs font-bold">Library Empty</p>
        <p className="text-[10px] mt-1">Generate patterns or textures to save them here.</p>
      </div>
    );
  }

  return (
    <div>
        <p className="text-[9px] text-nc-ink-subtle uppercase tracking-widest mb-3 text-center">Drag to Canvas to Apply</p>
        <div className="grid grid-cols-3 gap-2 p-1">
        {materials.map((mat) => (
            <div 
            key={mat.id} 
            draggable
            onDragStart={(e) => handleDragStart(e, mat)}
            onClick={() => onApply(mat.image)}
            className="group relative aspect-square rounded-lg overflow-hidden cursor-grab active:cursor-grabbing border border-gray-200 hover:border-indigo-500 transition-all shadow-sm hover:shadow-md hover:scale-105 z-10"
            title={mat.name}
            >
            <img src={`data:image/png;base64,${mat.image}`} className="w-full h-full object-cover pointer-events-none" alt={mat.name} />
            
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-[9px] text-white font-bold uppercase tracking-wider bg-black/50 px-2 py-1 rounded backdrop-blur-sm">Apply</span>
            </div>

            <button 
                onClick={(e) => deleteMaterial(mat.id, e)}
                className="absolute top-1 right-1 w-5 h-5 bg-white/80 hover:bg-red-500 hover:text-white text-gray-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
            >
                ×
            </button>
            
            <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm px-2 py-1 translate-y-full group-hover:translate-y-0 transition-transform">
                <p className="text-[8px] font-bold text-gray-800 truncate">{mat.name}</p>
            </div>
            </div>
        ))}
        </div>
    </div>
  );
};

export const saveMaterialToLibrary = (name: string, image: string) => {
    try {
        const saved = localStorage.getItem('nanoFashion_materials');
        const materials: Material[] = saved ? JSON.parse(saved) : [];
        
        const newMaterial: Material = {
            id: `mat-${Date.now()}`,
            name: name || 'Untitled Fabric',
            image,
            timestamp: Date.now()
        };
        
        const updated = [newMaterial, ...materials];
        localStorage.setItem('nanoFashion_materials', JSON.stringify(updated));
        return true;
    } catch (e) {
        console.error("Failed to save material", e);
        return false;
    }
};
