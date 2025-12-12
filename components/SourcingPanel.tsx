
import React, { useState } from 'react';
import { findMaterialSources, findLocalSuppliers } from '../services/geminiService';

interface SourcingPanelProps {
  bom: string;
}

interface SourceResult {
  material: string;
  data: { text: string, links: { title: string, uri: string }[] } | null;
  loading: boolean;
  error: string | null;
}

interface LocalResult {
  material: string;
  places: { name: string, address: string, url: string }[] | null;
  loading: boolean;
  error: string | null;
}

export const SourcingPanel: React.FC<SourcingPanelProps> = ({ bom }) => {
  const [mode, setMode] = useState<'global' | 'local'>('global');
  
  // Parse materials
  const materials = React.useMemo(() => {
    return bom.split('\n')
      .filter(line => line.trim().startsWith('- **'))
      .map(line => line.replace(/^- \*\*(.*?)\*\*:\s*/, '$1: '));
  }, [bom]);

  const [globalResults, setGlobalResults] = useState<Record<string, SourceResult>>({});
  const [localResults, setLocalResults] = useState<Record<string, LocalResult>>({});

  const handleGlobalSource = async (material: string) => {
    setGlobalResults(prev => ({ ...prev, [material]: { material, data: null, loading: true, error: null } }));
    try {
      const data = await findMaterialSources(material);
      setGlobalResults(prev => ({ ...prev, [material]: { material, data, loading: false, error: null } }));
    } catch (e: any) {
      setGlobalResults(prev => ({ ...prev, [material]: { material, data: null, loading: false, error: e.message } }));
    }
  };

  const handleLocalSource = async (material: string) => {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }

    setLocalResults(prev => ({ ...prev, [material]: { material, places: null, loading: true, error: null } }));

    navigator.geolocation.getCurrentPosition(async (position) => {
        try {
            const { latitude, longitude } = position.coords;
            const data = await findLocalSuppliers(material, latitude, longitude);
            setLocalResults(prev => ({ ...prev, [material]: { material, places: data.places, loading: false, error: null } }));
        } catch (e: any) {
            setLocalResults(prev => ({ ...prev, [material]: { material, places: null, loading: false, error: e.message } }));
        }
    }, (err) => {
        setLocalResults(prev => ({ ...prev, [material]: { material, places: null, loading: false, error: "Location access denied." } }));
    });
  };

  if (materials.length === 0) {
    return <div className="p-4 text-center text-slate-500 text-xs">No materials detected. Generate Tech Pack first.</div>;
  }

  return (
    <div className="space-y-4">
      {/* Mode Switcher */}
      <div className="bg-slate-100 p-1 rounded-lg flex mb-4">
          <button 
            onClick={() => setMode('global')}
            className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-2 rounded-md transition-all ${mode === 'global' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Global Search
          </button>
          <button 
            onClick={() => setMode('local')}
            className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-2 rounded-md transition-all ${mode === 'local' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Local Maps
          </button>
      </div>

      <div className="bg-indigo-900/10 border border-indigo-500/20 p-3 rounded-lg mb-4">
        <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-1 flex items-center gap-2">
            {mode === 'global' ? 'Supply Chain Connect' : 'Fabric Scout'}
            {mode === 'local' && <span className="bg-emerald-500 text-white text-[8px] px-1.5 py-0.5 rounded">GPS Active</span>}
        </h4>
        <p className="text-[10px] text-slate-500">
          {mode === 'global' ? 'Find online sustainable suppliers.' : 'Find physical stores and wholesalers near you.'}
        </p>
      </div>

      {materials.map((mat, idx) => {
        const isGlobal = mode === 'global';
        const result = isGlobal ? globalResults[mat] : localResults[mat];
        const hasData = isGlobal ? !!(result as SourceResult)?.data : !!(result as LocalResult)?.places;

        return (
          <div key={idx} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-3 bg-gray-50 flex justify-between items-center">
              <span className="text-xs font-bold text-gray-700 truncate mr-2" title={mat}>{mat}</span>
              <button
                onClick={() => isGlobal ? handleGlobalSource(mat) : handleLocalSource(mat)}
                disabled={result?.loading}
                className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-colors ${
                  hasData 
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                } disabled:opacity-50`}
              >
                {result?.loading ? 'Scouting...' : (hasData ? 'Refresh' : (isGlobal ? 'Search Web' : 'Find Nearby'))}
              </button>
            </div>

            {result?.error && (
              <div className="p-3 text-[10px] text-red-500 bg-red-50 border-t border-red-100">
                Error: {result.error}
              </div>
            )}

            {/* Global Results */}
            {isGlobal && (result as SourceResult)?.data && (
              <div className="p-3 border-t border-gray-100 bg-white animate-fade-in">
                <div className="prose prose-sm max-w-none text-[10px] text-slate-600 leading-relaxed mb-3">
                   {(result as SourceResult)?.data?.text.split('\n').map((l, i) => <p key={i} className="mb-1">{l}</p>)}
                </div>
                {(result as SourceResult)?.data?.links.length! > 0 && (
                  <div className="flex flex-wrap gap-2">
                      {(result as SourceResult)?.data?.links.slice(0, 3).map((link, i) => (
                        <a key={i} href={link.uri} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded border border-indigo-200 truncate max-w-[150px] block">
                          {link.title || 'Supplier Site'} ↗
                        </a>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Local Maps Results */}
            {!isGlobal && (result as LocalResult)?.places && (
                <div className="p-3 border-t border-gray-100 bg-white animate-fade-in space-y-2">
                    {(result as LocalResult)?.places?.length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic">No nearby locations found.</p>
                    ) : (
                        (result as LocalResult)?.places?.map((place, i) => (
                            <div key={i} className="flex justify-between items-start border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                                <div>
                                    <div className="text-[11px] font-bold text-slate-800">{place.name}</div>
                                    <div className="text-[9px] text-slate-500">{place.address}</div>
                                </div>
                                <a href={place.url} target="_blank" rel="noreferrer" className="text-indigo-500 hover:text-indigo-700">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                </a>
                            </div>
                        ))
                    )}
                </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
