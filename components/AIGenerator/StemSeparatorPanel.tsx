'use client';

import React, { useState, useRef } from 'react';
import {
  Layers,
  Upload,
  Music,
  Mic,
  Drum,
  Guitar,
  Volume2,
  Download,
  Play,
  Pause,
  Loader2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { StemSeparationResult } from '@/lib/ai/types';
import { aceStepService } from '@/lib/ai/aceStepService';

interface StemInfo {
  id: keyof StemSeparationResult;
  name: string;
  icon: React.ReactNode;
  color: string;
}

const STEM_INFO: StemInfo[] = [
  { id: 'vocals', name: 'Vocals', icon: <Mic size={16} />, color: 'text-pink-400' },
  { id: 'drums', name: 'Drums', icon: <Drum size={16} />, color: 'text-orange-400' },
  { id: 'bass', name: 'Bass', icon: <Volume2 size={16} />, color: 'text-amber-400' },
  { id: 'other', name: 'Other', icon: <Guitar size={16} />, color: 'text-blue-400' },
];

const StemSeparatorPanel: React.FC = () => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stems, setStems] = useState<StemSeparationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setStems(null);
    setError(null);
  };

  const handleSeparate = async () => {
    if (!audioUrl) return;

    setIsProcessing(true);
    setError(null);

    try {
      const result = await aceStepService.separateStems(audioUrl);
      if ('stems' in result) {
        setStems(result.stems as StemSeparationResult);
      } else {
        setStems(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to separate stems');
    } finally {
      setIsProcessing(false);
    }
  };

  const togglePlayStem = (stemId: string, url: string) => {
    const audio = audioRefs.current[stemId];
    
    // Stop all other playing audio
    Object.entries(audioRefs.current).forEach(([id, audioEl]) => {
      if (id !== stemId && audioEl) {
        audioEl.pause();
        audioEl.currentTime = 0;
      }
    });

    if (audio) {
      if (playingId === stemId) {
        audio.pause();
        setPlayingId(null);
      } else {
        audio.src = url;
        audio.play();
        setPlayingId(stemId);
      }
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Layers className="text-amber-400" size={20} />
        <h3 className="text-lg font-bold text-white">Stem Separator</h3>
      </div>
      
      <p className="text-xs text-gray-400">
        Separate audio into individual stems using AI-powered Demucs.
      </p>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Upload Area */}
      {!audioUrl ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="p-6 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:bg-gray-800/50 hover:border-amber-500/50 transition-all"
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <Upload size={32} className="text-gray-500" />
            <p className="text-sm text-gray-300">Click to upload audio</p>
            <p className="text-xs text-gray-500">MP3, WAV, or FLAC</p>
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
        <div className="space-y-3">
          {/* Source Audio */}
          <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="flex items-center gap-3">
              <Music size={18} className="text-gray-400" />
              <span className="flex-1 text-sm text-gray-300 truncate">Source Audio</span>
              <button
                onClick={() => {
                  setAudioUrl(null);
                  setStems(null);
                }}
                className="text-xs text-gray-500 hover:text-gray-300"
              >
                Change
              </button>
            </div>
          </div>

          {/* Separate Button */}
          {!stems && (
            <button
              onClick={handleSeparate}
              disabled={isProcessing}
              className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                isProcessing
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Separating...
                </>
              ) : (
                <>
                  <Layers size={18} />
                  Separate Stems
                </>
              )}
            </button>
          )}

          {/* Stems Display */}
          {stems && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 mb-2">Separated Stems</p>
              {STEM_INFO.map((stem) => {
                const url = stems[stem.id];
                if (!url) return null;

                return (
                  <div
                    key={stem.id}
                    className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-amber-500/50 transition-all"
                  >
                    <button
                      onClick={() => togglePlayStem(stem.id, url)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        playingId === stem.id
                          ? 'bg-amber-600'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      {playingId === stem.id ? (
                        <Pause size={14} />
                      ) : (
                        <Play size={14} className="ml-0.5" />
                      )}
                    </button>

                    <div className={`${stem.color}`}>{stem.icon}</div>
                    <span className="flex-1 text-sm font-medium text-white">
                      {stem.name}
                    </span>

                    <a
                      href={url}
                      download={`${stem.name.toLowerCase()}.mp3`}
                      className="p-2 hover:bg-gray-700 rounded-lg"
                      title="Download"
                    >
                      <Download size={14} className="text-gray-400" />
                    </a>

                    <button
                      className="p-2 hover:bg-gray-700 rounded-lg"
                      title="Add to Beatmaker"
                    >
                      <Plus size={14} className="text-gray-400" />
                    </button>

                    <audio
                      ref={(el) => { audioRefs.current[stem.id] = el; }}
                      onEnded={() => setPlayingId(null)}
                      className="hidden"
                    />
                  </div>
                );
              })}

              {/* Re-separate Button */}
              <button
                onClick={handleSeparate}
                disabled={isProcessing}
                className="w-full py-2 mt-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
              >
                Re-separate with different settings
              </button>
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/50 text-xs text-gray-400">
        <p className="mb-1">💡 Powered by Demucs AI</p>
        <p>Separates audio into vocals, drums, bass, and other instruments.</p>
      </div>
    </div>
  );
};

export default StemSeparatorPanel;

