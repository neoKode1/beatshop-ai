'use client';

import React, { useState } from 'react';
import {
  Wand2,
  Music,
  Settings2,
  History,
  Layers,
  Play,
  Pause,
  Download,
  X,
  ChevronDown,
  ChevronUp,
  Upload,
  Loader2,
  Sparkles,
  Drum,
  Guitar,
  Piano,
  Mic,
  Scissors,
} from 'lucide-react';
import { useAIStore } from '@/store/useAIStore';
import { useBeatStore } from '@/store/useBeatStore';
import { BEATMAKER_PRESETS, MusicalKey } from '@/lib/ai/types';
import StemSeparatorPanel from './StemSeparatorPanel';

// Musical keys for dropdown
const MUSICAL_KEYS: MusicalKey[] = [
  '', 'C Major', 'C Minor', 'C# Major', 'C# Minor',
  'D Major', 'D Minor', 'D# Major', 'D# Minor',
  'E Major', 'E Minor', 'F Major', 'F Minor',
  'F# Major', 'F# Minor', 'G Major', 'G Minor',
  'G# Major', 'G# Minor', 'A Major', 'A Minor',
  'A# Major', 'A# Minor', 'B Major', 'B Minor',
];

const AIGeneratorPanel: React.FC = () => {
  const {
    currentParams,
    currentJob,
    isGenerating,
    generatedAudios,
    selectedAudioId,
    activeTab,
    showAdvancedParams,
    referenceAudioUrl,
    error,
    setParams,
    applyPreset,
    startGeneration,
    setActiveTab,
    setShowAdvancedParams,
    setReferenceAudio,
    uploadReferenceAudio,
    setSelectedAudio,
    setError,
  } = useAIStore();

  const { bpm } = useBeatStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  // Sync BPM from Beatmaker
  React.useEffect(() => {
    if (bpm && currentParams.bpm !== bpm) {
      setParams({ bpm });
    }
  }, [bpm]);

  const handleGenerate = async () => {
    setError(null);
    await startGeneration();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await uploadReferenceAudio(file);
      } catch (err) {
        // Error handled in store
      }
    }
  };

  const selectedAudio = generatedAudios.find(a => a.id === selectedAudioId);

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-[#1F1F1F] to-[#1A1A1A]">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-amber-900/30 to-orange-900/30">
        <div className="flex items-center gap-2 mb-1">
          <Wand2 className="text-amber-400" size={20} />
          <h2 className="text-lg font-bold text-white">AI Music Generator</h2>
        </div>
        <p className="text-xs text-gray-400">Powered by ACE-Step</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {[
          { id: 'generate', label: 'Generate', icon: Wand2 },
          { id: 'stems', label: 'Stems', icon: Scissors },
          { id: 'history', label: 'History', icon: History },
          { id: 'presets', label: 'Presets', icon: Layers },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as typeof activeTab)}
            className={`flex-1 py-2 px-3 flex items-center justify-center gap-1.5 text-xs font-medium transition-colors ${
              activeTab === id
                ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-400/10'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'generate' && (
          <GenerateTab
            currentParams={currentParams}
            currentJob={currentJob}
            isGenerating={isGenerating}
            showAdvancedParams={showAdvancedParams}
            referenceAudioUrl={referenceAudioUrl}
            error={error}
            setParams={setParams}
            setShowAdvancedParams={setShowAdvancedParams}
            handleGenerate={handleGenerate}
            handleFileUpload={handleFileUpload}
            setReferenceAudio={setReferenceAudio}
          />
        )}

        {activeTab === 'stems' && (
          <StemSeparatorPanel />
        )}

        {activeTab === 'history' && (
          <HistoryTab
            generatedAudios={generatedAudios}
            selectedAudioId={selectedAudioId}
            setSelectedAudio={setSelectedAudio}
          />
        )}

        {activeTab === 'presets' && (
          <PresetsTab
            presets={BEATMAKER_PRESETS}
            applyPreset={applyPreset}
            setActiveTab={setActiveTab}
          />
        )}
      </div>

      {/* Selected Audio Player */}
      {selectedAudio && (
        <div className="p-3 border-t border-gray-800 bg-gray-900/50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (audioRef.current) {
                  if (isPlaying) {
                    audioRef.current.pause();
                  } else {
                    audioRef.current.play();
                  }
                  setIsPlaying(!isPlaying);
                }
              }}
              className="w-10 h-10 rounded-full bg-amber-600 hover:bg-amber-700 flex items-center justify-center"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{selectedAudio.prompt}</p>
              <p className="text-xs text-gray-400">{selectedAudio.duration}s • {selectedAudio.format}</p>
            </div>
            <a
              href={selectedAudio.url}
              download
              className="p-2 hover:bg-gray-800 rounded-lg"
            >
              <Download size={16} className="text-gray-400" />
            </a>
          </div>
          <audio
            ref={audioRef}
            src={selectedAudio.url}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
};

// Generate Tab Component
const GenerateTab: React.FC<{
  currentParams: any;
  currentJob: any;
  isGenerating: boolean;
  showAdvancedParams: boolean;
  referenceAudioUrl: string | null;
  error: string | null;
  setParams: (params: any) => void;
  setShowAdvancedParams: (show: boolean) => void;
  handleGenerate: () => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setReferenceAudio: (url: string | null) => void;
}> = ({
  currentParams,
  currentJob,
  isGenerating,
  showAdvancedParams,
  referenceAudioUrl,
  error,
  setParams,
  setShowAdvancedParams,
  handleGenerate,
  handleFileUpload,
  setReferenceAudio,
}) => {
  return (
    <div className="space-y-4">
      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Prompt Input */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 mb-1.5">
          Describe your music
        </label>
        <textarea
          value={currentParams.prompt || ''}
          onChange={(e) => setParams({ prompt: e.target.value })}
          placeholder="E.g., Energetic trap beat with punchy 808s, crispy hi-hats, and dark synth melodies..."
          className="w-full h-24 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          disabled={isGenerating}
        />
      </div>

      {/* Quick Options */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1">Duration</label>
          <select
            value={currentParams.duration || 30}
            onChange={(e) => setParams({ duration: parseInt(e.target.value) })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white"
            disabled={isGenerating}
          >
            <option value={8}>8 sec (Loop)</option>
            <option value={15}>15 sec</option>
            <option value={30}>30 sec</option>
            <option value={60}>60 sec</option>
            <option value={120}>2 min</option>
            <option value={180}>3 min</option>
            <option value={240}>4 min</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1">BPM</label>
          <input
            type="number"
            value={currentParams.bpm || 0}
            onChange={(e) => setParams({ bpm: parseInt(e.target.value) || 0 })}
            placeholder="Auto"
            min={0}
            max={300}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white"
            disabled={isGenerating}
          />
        </div>
      </div>

      {/* Instrumental Toggle */}
      <label className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
        <input
          type="checkbox"
          checked={currentParams.instrumental || false}
          onChange={(e) => setParams({ instrumental: e.target.checked })}
          className="w-4 h-4 accent-amber-500"
          disabled={isGenerating}
        />
        <div>
          <span className="text-sm font-medium text-white">Instrumental Only</span>
          <p className="text-xs text-gray-400">No vocals or lyrics</p>
        </div>
      </label>

      {/* Advanced Parameters Toggle */}
      <button
        onClick={() => setShowAdvancedParams(!showAdvancedParams)}
        className="w-full flex items-center justify-between p-2 text-xs text-gray-400 hover:text-gray-200"
      >
        <span className="flex items-center gap-1">
          <Settings2 size={14} />
          Advanced Options
        </span>
        {showAdvancedParams ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Advanced Parameters */}
      {showAdvancedParams && (
        <div className="space-y-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Key</label>
              <select
                value={currentParams.keyScale || ''}
                onChange={(e) => setParams({ keyScale: e.target.value })}
                className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-white"
              >
                <option value="">Auto</option>
                {MUSICAL_KEYS.filter(k => k).map((key) => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Time Sig</label>
              <select
                value={currentParams.timeSignature || '4'}
                onChange={(e) => setParams({ timeSignature: e.target.value })}
                className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-white"
              >
                <option value="">Auto</option>
                <option value="2">2/4</option>
                <option value="3">3/4</option>
                <option value="4">4/4</option>
                <option value="6">6/8</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Quality Steps: {currentParams.inferSteps || 8}
            </label>
            <input
              type="range"
              min={4}
              max={32}
              value={currentParams.inferSteps || 8}
              onChange={(e) => setParams({ inferSteps: parseInt(e.target.value) })}
              className="w-full accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>Fast</span>
              <span>Quality</span>
            </div>
          </div>

          {/* Reference Audio Upload */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Reference Audio (Style Transfer)</label>
            {referenceAudioUrl ? (
              <div className="flex items-center gap-2 p-2 bg-gray-800 rounded">
                <Music size={14} className="text-amber-400" />
                <span className="flex-1 text-xs text-gray-300 truncate">{referenceAudioUrl}</span>
                <button onClick={() => setReferenceAudio(null)} className="text-gray-500 hover:text-red-400">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 p-3 border border-dashed border-gray-700 rounded-lg cursor-pointer hover:bg-gray-800/50">
                <Upload size={14} className="text-gray-400" />
                <span className="text-xs text-gray-400">Upload reference audio</span>
                <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
              </label>
            )}
          </div>
        </div>
      )}

      {/* Generation Status */}
      {isGenerating && currentJob && (
        <div className="p-3 bg-amber-500/20 border border-amber-500/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 size={16} className="text-amber-400 animate-spin" />
            <span className="text-sm text-amber-300">{currentJob.message || 'Generating...'}</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-300"
              style={{ width: `${currentJob.progress || 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !currentParams.prompt}
        className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
          isGenerating || !currentParams.prompt
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg'
        }`}
      >
        {isGenerating ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles size={18} />
            Generate Music
          </>
        )}
      </button>
    </div>
  );
};

// History Tab Component
const HistoryTab: React.FC<{
  generatedAudios: any[];
  selectedAudioId: string | null;
  setSelectedAudio: (id: string | null) => void;
}> = ({ generatedAudios, selectedAudioId, setSelectedAudio }) => {
  if (generatedAudios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
        <History size={32} className="mb-2 opacity-50" />
        <p className="text-sm">No generated audio yet</p>
        <p className="text-xs">Your generated tracks will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {generatedAudios.map((audio) => (
        <button
          key={audio.id}
          onClick={() => setSelectedAudio(audio.id)}
          className={`w-full p-3 rounded-lg text-left transition-all ${
            selectedAudioId === audio.id
              ? 'bg-amber-600/30 border border-amber-500'
              : 'bg-gray-800/50 hover:bg-gray-800 border border-transparent'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded bg-amber-600/20 flex items-center justify-center flex-shrink-0">
              <Music size={18} className="text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{audio.prompt}</p>
              <p className="text-xs text-gray-400">
                {audio.duration}s • {audio.format.toUpperCase()} • {new Date(audio.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

// Presets Tab Component
const PresetsTab: React.FC<{
  presets: any[];
  applyPreset: (preset: any) => void;
  setActiveTab: (tab: 'generate' | 'history' | 'stems' | 'presets') => void;
}> = ({ presets, applyPreset, setActiveTab }) => {
  const iconMap: { [key: string]: React.ReactNode } = {
    '🥁': <Drum size={20} />,
    '🎸': <Guitar size={20} />,
    '🎹': <Piano size={20} />,
    '🎵': <Music size={20} />,
    '🎤': <Mic size={20} />,
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400 mb-3">
        Quick presets to get you started. Click to apply and customize.
      </p>

      <div className="grid grid-cols-2 gap-2">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => {
              applyPreset(preset);
              setActiveTab('generate');
            }}
            className="p-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-lg text-left transition-all hover:border-amber-500/50"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-amber-400">
                {iconMap[preset.icon] || <Music size={20} />}
              </span>
              <span className="text-sm font-medium text-white">{preset.name}</span>
            </div>
            <p className="text-xs text-gray-400">{preset.description}</p>
          </button>
        ))}
      </div>

      <div className="mt-4 p-3 bg-gradient-to-r from-amber-900/20 to-orange-900/20 rounded-lg border border-amber-500/20">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={14} className="text-amber-400" />
          <span className="text-xs font-semibold text-amber-300">Pro Tip</span>
        </div>
        <p className="text-xs text-gray-400">
          Apply a preset, then customize the prompt and parameters in the Generate tab to create your unique sound.
        </p>
      </div>
    </div>
  );
};

export default AIGeneratorPanel;
