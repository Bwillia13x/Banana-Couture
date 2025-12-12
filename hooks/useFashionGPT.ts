import { useState, useCallback, useRef } from 'react';
import { 
  FashionGPTResult, 
  runFashionGPTPipeline 
} from '../services/fashionGPTService';
import { FashionGPTInput, FashionGPTStage } from '../types';

export interface UseFashionGPTReturn {
  // State
  isRunning: boolean;
  currentStage: FashionGPTStage | null;
  stages: FashionGPTStage[];
  result: FashionGPTResult | null;
  error: string | null;
  
  // Actions
  run: (input: FashionGPTInput) => Promise<FashionGPTResult | null>;
  reset: () => void;
  
  // Computed
  overallProgress: number;
  completedStages: number;
  totalStages: number;
  estimatedTimeRemaining: string;
}

export const useFashionGPT = (): UseFashionGPTReturn => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStage, setCurrentStage] = useState<FashionGPTStage | null>(null);
  const [stages, setStages] = useState<FashionGPTStage[]>([]);
  const [result, setResult] = useState<FashionGPTResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const stageTimingsRef = useRef<Map<string, number>>(new Map());
  
  const handleStageProgress = useCallback((stage: FashionGPTStage) => {
    setCurrentStage(stage);
    setStages(prev => {
      const idx = prev.findIndex(s => s.id === stage.id);
      if (idx === -1) {
        return [...prev, stage];
      }
      const newStages = [...prev];
      newStages[idx] = stage;
      return newStages;
    });
    
    // Track timings for estimation
    if (typeof stage.startTime === 'number' && typeof stage.endTime === 'number') {
      stageTimingsRef.current.set(stage.id, stage.endTime - stage.startTime);
    }
    
    if (stage.status === 'error') {
      setError(stage.error || 'Stage failed');
    }
  }, []);

  const run = useCallback(async (input: FashionGPTInput): Promise<FashionGPTResult | null> => {
    setIsRunning(true);
    setError(null);
    setResult(null);
    setStages([]);
    setCurrentStage(null);
    stageTimingsRef.current.clear();
    
    try {
      const pipelineResult = await runFashionGPTPipeline(input, handleStageProgress);
      setResult(pipelineResult);
      
      if (!pipelineResult.output) {
        setError('Pipeline completed with errors');
      }
      
      return pipelineResult;
    } catch (e: any) {
      setError(e.message || 'Pipeline failed');
      return null;
    } finally {
      setIsRunning(false);
    }
  }, [handleStageProgress]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setCurrentStage(null);
    setStages([]);
    setResult(null);
    setError(null);
    stageTimingsRef.current.clear();
  }, []);

  // Computed values
  const completedStages = stages.filter(s => s.status === 'completed').length;
  const totalStages: number = 9; // Fixed number of stages
  const overallProgress = Math.round((completedStages / totalStages) * 100);
  
  // Estimate remaining time based on average stage duration
  const timings: number[] = Array.from(stageTimingsRef.current.values());
  const totalDuration: number = timings.reduce((a: number, b: number) => a + b, 0);
  
  const avgStageDuration: number = stageTimingsRef.current.size > 0
    ? totalDuration / stageTimingsRef.current.size
    : 15000; // Default 15s per stage
    
  const remainingStages: number = totalStages - completedStages;
  const estimatedMs: number = remainingStages * avgStageDuration;
  const estimatedTimeRemaining = estimatedMs > 60000 
    ? `~${Math.ceil(estimatedMs / 60000)} min` 
    : `~${Math.ceil(estimatedMs / 1000)}s`;

  return {
    isRunning,
    currentStage,
    stages,
    result,
    error,
    run,
    reset,
    overallProgress,
    completedStages,
    totalStages,
    estimatedTimeRemaining
  };
};