'use client';

import React, { useState } from 'react';
import { useBeatStore, ArrangementClip } from '@/store/useBeatStore';
import { Play, Pause, Trash2, Square, Download, Music, Drum } from 'lucide-react';
import { motion } from 'framer-motion';
import ArrangementPlayback from './ArrangementPlayback';
import AudioExport from '../AudioExport/AudioExport';

const TRACK_HEIGHT = 80;
const BAR_WIDTH = 100;
const NUM_TRACKS = 8;
const NUM_BARS = 32;

const ArrangementView: React.FC = () => {
  const {
    patterns,
    arrangementClips,
    addClipToArrangement,
    removeClipFromArrangement,
    moveClip,
    resizeClip,
    isArrangementPlaying,
    playArrangement,
    stopArrangement,
    arrangementPosition,
  } = useBeatStore();

  const [draggedClip, setDraggedClip] = useState<ArrangementClip | null>(null);
  const [resizingClip, setResizingClip] = useState<string | null>(null);
  const [showAudioExport, setShowAudioExport] = useState(false);

  const handleDrop = (e: React.DragEvent, track: number, bar: number) => {
    e.preventDefault();
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      
      if (data.type === 'pattern' && data.patternId) {
        // Add new clip from pattern
        addClipToArrangement(data.patternId, bar, track);
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const getPatternName = (patternId: string) => {
    const pattern = patterns.find(p => p.id === patternId);
    return pattern?.name || 'Unknown';
  };

  const getPatternType = (patternId: string) => {
    const pattern = patterns.find(p => p.id === patternId);
    return pattern?.type || 'drum';
  };

  return (
    <>
      {/* Arrangement Playback Engine */}
      <ArrangementPlayback />

      <div className="arrangement-view h-full flex flex-col bg-gradient-to-br from-[#2A2A2A] to-[#1F1F1F] rounded-xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.6),0_4px_12px_rgba(0,0,0,0.4)] border-2 border-gray-800/50">
        {/* Header */}
        <div className="p-4 border-b-2 border-gray-800/50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-200">Arrangement</h2>
            <p className="text-sm text-gray-400">Drag patterns from the header to build your sequence</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Position Display */}
            <div className="px-3 py-2 bg-gray-800 border-2 border-gray-700/50 rounded-lg font-mono text-sm text-gray-200">
              Bar: {Math.floor(arrangementPosition)}
            </div>

            {/* Play/Stop Buttons */}
            <button
              onClick={isArrangementPlaying ? stopArrangement : playArrangement}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
                isArrangementPlaying
                  ? 'bg-gray-600 hover:bg-gray-500 text-white'
                  : 'bg-green-600 hover:bg-green-500 text-white'
              }`}
            >
              {isArrangementPlaying ? <Square size={18} /> : <Play size={18} />}
              {isArrangementPlaying ? 'Stop' : 'Play'}
            </button>

            {/* Export Button */}
            <button
              onClick={() => setShowAudioExport(true)}
              disabled={arrangementClips.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-bold text-white transition-all"
              title="Export to audio file"
            >
              <Download size={18} />
              Export
            </button>
          </div>
        </div>

      {/* Main Content - Pattern Panel + Timeline */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Pattern Panel */}
        <div className="w-48 border-r-2 border-gray-800/50 flex flex-col bg-gradient-to-b from-[#252525] to-[#1A1A1A]">
          <div className="p-3 border-b border-gray-800/50">
            <h3 className="text-sm font-bold text-gray-300">Patterns</h3>
            <p className="text-xs text-gray-500">Drag to timeline</p>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {patterns.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-xs">
                <p>No patterns created</p>
                <p className="mt-1">Switch to PAT mode to create patterns</p>
              </div>
            ) : (
              patterns.map((pattern) => (
                <div
                  key={pattern.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/json', JSON.stringify({
                      type: 'pattern',
                      patternId: pattern.id,
                    }));
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  className={`p-2 rounded-lg cursor-grab active:cursor-grabbing transition-all border-2 ${
                    pattern.type === 'drum'
                      ? 'bg-blue-900/40 border-blue-700/50 hover:bg-blue-800/50 hover:border-blue-600'
                      : 'bg-green-900/40 border-green-700/50 hover:bg-green-800/50 hover:border-green-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {pattern.type === 'drum' ? (
                      <Drum size={14} className="text-blue-400" />
                    ) : (
                      <Music size={14} className="text-green-400" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-gray-200 truncate">
                        {pattern.name}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {pattern.length} bars
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side - Timeline */}
        <div className="flex-1 overflow-auto">
          <div className="relative" style={{ minWidth: NUM_BARS * BAR_WIDTH, minHeight: NUM_TRACKS * TRACK_HEIGHT }}>
            {/* Grid Background */}
            <div className="absolute inset-0">
              {/* Vertical lines (bars) */}
              {Array.from({ length: NUM_BARS + 1 }).map((_, i) => (
                <div
                  key={`vline-${i}`}
                  className={`absolute top-0 bottom-0 ${i % 4 === 0 ? 'border-l-2 border-gray-700' : 'border-l border-gray-800/50'}`}
                  style={{ left: i * BAR_WIDTH }}
                >
                  {i % 4 === 0 && (
                    <div className="absolute -top-6 left-1 text-xs text-gray-500 font-mono">
                      {i}
                    </div>
                  )}
                </div>
              ))}

              {/* Horizontal lines (tracks) */}
              {Array.from({ length: NUM_TRACKS + 1 }).map((_, i) => (
                <div
                  key={`hline-${i}`}
                  className="absolute left-0 right-0 border-t border-gray-800/50"
                  style={{ top: i * TRACK_HEIGHT }}
                >
                  {i < NUM_TRACKS && (
                    <div className="absolute -left-12 top-2 text-xs text-gray-500 font-bold">
                      Track {i + 1}
                    </div>
                  )}
                </div>
              ))}
            </div>

          {/* Playhead */}
          {isArrangementPlaying && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)] z-50 pointer-events-none"
              style={{ left: arrangementPosition * BAR_WIDTH }}
            >
              <div className="absolute -top-2 -left-2 w-4 h-4 bg-purple-500 rounded-full shadow-lg" />
            </div>
          )}

          {/* Drop Zones */}
          {Array.from({ length: NUM_TRACKS }).map((_, trackIndex) => (
            <div
              key={`track-${trackIndex}`}
              className="absolute left-0 right-0"
              style={{ 
                top: trackIndex * TRACK_HEIGHT,
                height: TRACK_HEIGHT,
              }}
            >
              {Array.from({ length: NUM_BARS }).map((_, barIndex) => (
                <div
                  key={`drop-${trackIndex}-${barIndex}`}
                  className="absolute hover:bg-purple-500/10 transition-colors"
                  style={{
                    left: barIndex * BAR_WIDTH,
                    width: BAR_WIDTH,
                    height: TRACK_HEIGHT,
                  }}
                  onDrop={(e) => handleDrop(e, trackIndex, barIndex)}
                  onDragOver={handleDragOver}
                />
              ))}
            </div>
          ))}

          {/* Clips */}
          {arrangementClips.map((clip) => {
            const patternType = getPatternType(clip.patternId);
            const clipColor = patternType === 'drum' ? 'bg-blue-600' : 'bg-green-600';
            
            return (
              <motion.div
                key={clip.id}
                className={`absolute ${clipColor} rounded-lg border-2 border-white/20 shadow-lg overflow-hidden cursor-move group`}
                style={{
                  left: clip.startTime * BAR_WIDTH,
                  top: clip.track * TRACK_HEIGHT + 4,
                  width: clip.duration * BAR_WIDTH - 8,
                  height: TRACK_HEIGHT - 8,
                }}
                whileHover={{ scale: 1.02 }}
                drag
                dragMomentum={false}
                onDragEnd={(e, info) => {
                  const newBar = Math.round((clip.startTime * BAR_WIDTH + info.offset.x) / BAR_WIDTH);
                  const newTrack = Math.round((clip.track * TRACK_HEIGHT + info.offset.y) / TRACK_HEIGHT);
                  moveClip(clip.id, Math.max(0, newBar), Math.max(0, Math.min(NUM_TRACKS - 1, newTrack)));
                }}
              >
                <div className="p-2 h-full flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-sm truncate">
                        {getPatternName(clip.patternId)}
                      </div>
                      <div className="text-xs text-white/70">
                        {patternType} pattern
                      </div>
                    </div>
                    <button
                      onClick={() => removeClipFromArrangement(clip.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/30 rounded transition-all"
                    >
                      <Trash2 size={12} className="text-white" />
                    </button>
                  </div>
                  <div className="text-xs text-white/50 font-mono">
                    {clip.startTime} - {clip.startTime + clip.duration} bars
                  </div>
                </div>
              </motion.div>
            );
          })}
          </div>
        </div>
      </div>
    </div>

    {/* Audio Export Dialog */}
    {showAudioExport && (
      <AudioExport onClose={() => setShowAudioExport(false)} />
    )}
    </>
  );
};

export default ArrangementView;

