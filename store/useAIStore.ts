/**
 * AI Generation Store
 * Zustand store for managing AI music generation state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  GenerationParams,
  GenerationJob,
  GeneratedAudio,
  DEFAULT_GENERATION_PARAMS,
  JobStatus,
  GenerationPreset,
  BEATMAKER_PRESETS,
} from '@/lib/ai/types';
import { aceStepService } from '@/lib/ai/aceStepService';

interface AIState {
  // Current generation
  currentParams: Partial<GenerationParams>;
  currentJob: GenerationJob | null;
  isGenerating: boolean;
  
  // Generated content
  generatedAudios: GeneratedAudio[];
  selectedAudioId: string | null;
  
  // Presets
  presets: GenerationPreset[];
  customPresets: GenerationPreset[];
  
  // UI state
  activeTab: 'generate' | 'history' | 'stems' | 'presets';
  showAdvancedParams: boolean;
  
  // Reference audio for style transfer
  referenceAudioUrl: string | null;
  referenceAudioFile: File | null;
  
  // Error handling
  error: string | null;
}

interface AIActions {
  // Parameter management
  setParams: (params: Partial<GenerationParams>) => void;
  resetParams: () => void;
  applyPreset: (preset: GenerationPreset) => void;
  
  // Generation
  startGeneration: () => Promise<void>;
  cancelGeneration: () => void;
  
  // Job management
  setCurrentJob: (job: GenerationJob | null) => void;
  updateJobStatus: (job: GenerationJob) => void;
  
  // Generated audio management
  addGeneratedAudio: (audio: GeneratedAudio) => void;
  removeGeneratedAudio: (id: string) => void;
  setSelectedAudio: (id: string | null) => void;
  clearHistory: () => void;
  
  // Reference audio
  setReferenceAudio: (url: string | null, file?: File | null) => void;
  uploadReferenceAudio: (file: File) => Promise<string>;
  
  // Custom presets
  saveCustomPreset: (name: string, description: string) => void;
  deleteCustomPreset: (id: string) => void;
  
  // UI
  setActiveTab: (tab: AIState['activeTab']) => void;
  setShowAdvancedParams: (show: boolean) => void;
  setError: (error: string | null) => void;
}

type AIStore = AIState & AIActions;

export const useAIStore = create<AIStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentParams: { ...DEFAULT_GENERATION_PARAMS },
      currentJob: null,
      isGenerating: false,
      generatedAudios: [],
      selectedAudioId: null,
      presets: BEATMAKER_PRESETS,
      customPresets: [],
      activeTab: 'generate',
      showAdvancedParams: false,
      referenceAudioUrl: null,
      referenceAudioFile: null,
      error: null,

      // Parameter management
      setParams: (params) => {
        set((state) => ({
          currentParams: { ...state.currentParams, ...params },
        }));
      },

      resetParams: () => {
        set({ currentParams: { ...DEFAULT_GENERATION_PARAMS } });
      },

      applyPreset: (preset) => {
        set((state) => ({
          currentParams: { ...state.currentParams, ...preset.params },
        }));
      },

      // Generation
      startGeneration: async () => {
        const { currentParams, referenceAudioUrl } = get();
        
        if (!currentParams.prompt) {
          set({ error: 'Please enter a prompt' });
          return;
        }

        set({ isGenerating: true, error: null });

        try {
          // Include reference audio if set
          const params: GenerationParams = {
            ...DEFAULT_GENERATION_PARAMS,
            ...currentParams,
            prompt: currentParams.prompt!,
            instrumental: currentParams.instrumental ?? DEFAULT_GENERATION_PARAMS.instrumental ?? false,
            duration: currentParams.duration ?? DEFAULT_GENERATION_PARAMS.duration ?? 30,
            referenceAudioUrl: referenceAudioUrl || undefined,
          };

          // Start generation
          const job = await aceStepService.generate(params);
          set({ currentJob: job });

          // Poll for updates
          aceStepService.pollJobStatus(
            job.id,
            (updatedJob) => {
              set({ currentJob: updatedJob });
            },
            (completedJob) => {
              set({ isGenerating: false, currentJob: completedJob });
              
              // Add to generated audios
              if (completedJob.audioUrls?.length) {
                completedJob.audioUrls.forEach((url, index) => {
                  const audio: GeneratedAudio = {
                    id: `${completedJob.id}_${index}`,
                    jobId: completedJob.id,
                    url,
                    filename: `generated_${Date.now()}.mp3`,
                    duration: params.duration || 30,
                    format: params.audioFormat || 'mp3',
                    createdAt: new Date().toISOString(),
                    prompt: params.prompt,
                    params,
                  };
                  get().addGeneratedAudio(audio);
                });
              }
            },
            (error) => {
              set({ isGenerating: false, error: error.message });
            }
          );
        } catch (error) {
          set({
            isGenerating: false,
            error: error instanceof Error ? error.message : 'Generation failed',
          });
        }
      },

      cancelGeneration: () => {
        set({ isGenerating: false, currentJob: null });
      },

      // Job management
      setCurrentJob: (job) => set({ currentJob: job }),
      
      updateJobStatus: (job) => set({ currentJob: job }),

      // Generated audio management
      addGeneratedAudio: (audio) => {
        set((state) => ({
          generatedAudios: [audio, ...state.generatedAudios].slice(0, 50),
          selectedAudioId: audio.id,
        }));
      },

      removeGeneratedAudio: (id) => {
        set((state) => ({
          generatedAudios: state.generatedAudios.filter((a) => a.id !== id),
          selectedAudioId: state.selectedAudioId === id ? null : state.selectedAudioId,
        }));
      },

      setSelectedAudio: (id) => set({ selectedAudioId: id }),

      clearHistory: () => set({ generatedAudios: [], selectedAudioId: null }),

      // Reference audio
      setReferenceAudio: (url, file = null) => {
        set({ referenceAudioUrl: url, referenceAudioFile: file });
      },

      uploadReferenceAudio: async (file) => {
        try {
          const result = await aceStepService.uploadReferenceAudio(file);
          set({ referenceAudioUrl: result.url, referenceAudioFile: file });
          return result.url;
        } catch (error) {
          set({ error: 'Failed to upload reference audio' });
          throw error;
        }
      },

      // Custom presets
      saveCustomPreset: (name, description) => {
        const { currentParams, customPresets } = get();
        const preset: GenerationPreset = {
          id: `custom_${Date.now()}`,
          name,
          description,
          icon: '🎵',
          params: { ...currentParams },
        };
        set({ customPresets: [...customPresets, preset] });
      },

      deleteCustomPreset: (id) => {
        set((state) => ({
          customPresets: state.customPresets.filter((p) => p.id !== id),
        }));
      },

      // UI
      setActiveTab: (tab) => set({ activeTab: tab }),
      setShowAdvancedParams: (show) => set({ showAdvancedParams: show }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'beatshop-ai-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        generatedAudios: state.generatedAudios,
        customPresets: state.customPresets,
        currentParams: state.currentParams,
      }),
    }
  )
);

