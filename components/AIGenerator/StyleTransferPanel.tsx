'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  Play,
  Pause,
  X,
  Sparkles,
  Loader2,
  Info,
} from 'lucide-react';
import { useAIStore } from '@/store/useAIStore';

const StyleTransferPanel: React.FC = () => {
  const {
    referenceAudioUrl,
    currentParams,
    isGenerating,
    error,
    setReferenceAudio,
    uploadReferenceAudio,
    setParams,
    startGeneration,
  } = useAIStore();

  const [isUploading, setIsUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transferStrength, setTransferStrength] = useState(0.7);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await uploadReferenceAudio(file);
    } catch (err) {
      // Error handled in store
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateWithStyle = async () => {
    setParams({
      taskType: 'cover',
      audioCoverStrength: transferStrength,
    });
    await startGeneration();
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="text-amber-400" size={20} />
        <h3 className="text-lg font-bold text-white">Style Transfer</h3>
      </div>
      
      <p className="text-xs text-gray-400">
        Upload a reference track to transfer its style to your generation.
      </p>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Upload Area */}
      {!referenceAudioUrl ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="p-6 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:bg-gray-800/50 hover:border-amber-500/50 transition-all"
        >
          <div className="flex flex-col items-center gap-2 text-center">
            {isUploading ? (
              <>
                <Loader2 size={32} className="text-amber-400 animate-spin" />
                <p className="text-sm text-gray-300">Uploading...</p>
              </>
            ) : (
              <>
                <Upload size={32} className="text-gray-500" />
                <p className="text-sm text-gray-300">Click to upload reference audio</p>
                <p className="text-xs text-gray-500">MP3, WAV, or FLAC • Max 50MB</p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      ) : (
        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlayback}
              className="w-10 h-10 rounded-full bg-amber-600 hover:bg-amber-700 flex items-center justify-center flex-shrink-0"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">Reference Audio</p>
              <p className="text-xs text-gray-400 truncate">{referenceAudioUrl}</p>
            </div>
            <button
              onClick={() => setReferenceAudio(null)}
              className="p-2 hover:bg-gray-700 rounded-lg"
            >
              <X size={16} className="text-gray-400" />
            </button>
          </div>
          <audio
            ref={audioRef}
            src={referenceAudioUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
        </div>
      )}

      {/* Transfer Strength */}
      {referenceAudioUrl && (
        <>
          <div>
            <label className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
              <span>Style Transfer Strength: {Math.round(transferStrength * 100)}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={transferStrength * 100}
              onChange={(e) => setTransferStrength(parseInt(e.target.value) / 100)}
              className="w-full accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>Original Style</span>
              <span>Reference Style</span>
            </div>
          </div>

          {/* Prompt for generation */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
              Describe what to generate
            </label>
            <textarea
              value={currentParams.prompt || ''}
              onChange={(e) => setParams({ prompt: e.target.value })}
              placeholder="E.g., Remix this with a modern trap style..."
              className="w-full h-20 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              disabled={isGenerating}
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateWithStyle}
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
                Generate with Style
              </>
            )}
          </button>
        </>
      )}

      {/* Info Box */}
      <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
        <div className="flex items-start gap-2">
          <Info size={14} className="text-gray-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-400">
            Style transfer extracts the musical characteristics from your reference audio
            (tempo, mood, instruments) and applies them to your new generation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StyleTransferPanel;

