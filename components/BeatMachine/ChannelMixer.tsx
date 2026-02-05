'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useBeatStore, Pad, ChannelGroup } from '@/store/useBeatStore';
import { Volume2, VolumeX, Headphones, FolderPlus, ChevronDown, ChevronRight, Trash2, Users } from 'lucide-react';
import * as Tone from 'tone';

// Vertical Fader Component
const VerticalFader: React.FC<{
  value: number;
  onChange: (value: number) => void;
  color?: string;
  label?: string;
}> = ({ value, onChange, color = '#4CAF50', label }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const newValue = 1 - (e.clientY - rect.top) / rect.height;
    onChange(Math.max(0, Math.min(1, newValue)));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const newValue = 1 - (e.clientY - rect.top) / rect.height;
    onChange(Math.max(0, Math.min(1, newValue)));
  };

  React.useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mouseup', handleMouseUp);
      return () => window.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isDragging]);

  return (
    <div className="flex flex-col items-center gap-1">
      {label && <span className="text-[8px] text-gray-500 uppercase">{label}</span>}
      <div
        className="relative w-6 h-24 bg-gray-900 rounded cursor-pointer border border-gray-700"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      >
        {/* Track groove */}
        <div className="absolute inset-x-2 top-2 bottom-2 bg-gray-800 rounded-sm" />
        {/* Fill */}
        <div
          className="absolute inset-x-2 bottom-2 rounded-sm transition-all"
          style={{
            height: `${value * 80}%`,
            background: `linear-gradient(to top, ${color}, ${color}88)`,
          }}
        />
        {/* Fader knob */}
        <div
          className="absolute left-1 right-1 h-3 bg-gray-300 rounded shadow-md border border-gray-400"
          style={{ bottom: `${value * 80 + 4}%` }}
        />
        {/* dB markings */}
        <div className="absolute right-0 top-2 bottom-2 flex flex-col justify-between text-[6px] text-gray-600 pr-0.5">
          <span>0</span>
          <span>-6</span>
          <span>-12</span>
          <span>-∞</span>
        </div>
      </div>
      <span className="text-[9px] text-gray-400 font-mono">
        {value === 0 ? '-∞' : `${Math.round((value - 1) * 24)}dB`}
      </span>
    </div>
  );
};

// Pan Knob Component
const PanKnob: React.FC<{
  value: number; // -1 to 1
  onChange: (value: number) => void;
}> = ({ value, onChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startValue, setStartValue] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(e.clientY);
    setStartValue(value);
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const delta = (startY - e.clientY) / 50;
      const newValue = Math.max(-1, Math.min(1, startValue + delta));
      onChange(newValue);
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, startY, startValue, onChange]);

  const rotation = value * 135; // -135 to 135 degrees

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[7px] text-gray-500">PAN</span>
      <div
        className="w-6 h-6 rounded-full bg-gray-800 border border-gray-600 cursor-pointer relative"
        onMouseDown={handleMouseDown}
        style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)' }}
      >
        <div
          className="absolute top-1 left-1/2 w-0.5 h-2 bg-orange-400 rounded origin-bottom"
          style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
        />
      </div>
      <span className="text-[8px] text-gray-400">
        {value === 0 ? 'C' : value < 0 ? `L${Math.abs(Math.round(value * 100))}` : `R${Math.round(value * 100)}`}
      </span>
    </div>
  );
};

// Volume Meter Component - Shows real-time audio levels
const VolumeMeter: React.FC<{
  height?: number;
  color?: string;
}> = ({ height = 80, color = '#4CAF50' }) => {
  const [level, setLevel] = useState(0);
  const [peak, setPeak] = useState(0);
  const analyzerRef = useRef<Tone.Analyser | null>(null);
  const animationRef = useRef<number>(0);
  const peakHoldRef = useRef<number>(0);
  const { isPlaying } = useBeatStore();

  useEffect(() => {
    if (!analyzerRef.current) {
      analyzerRef.current = new Tone.Analyser('waveform', 32);
      Tone.getDestination().connect(analyzerRef.current);
    }

    const updateMeter = () => {
      if (analyzerRef.current) {
        const values = analyzerRef.current.getValue() as Float32Array;
        // Calculate RMS level
        let sum = 0;
        for (let i = 0; i < values.length; i++) {
          sum += values[i] * values[i];
        }
        const rms = Math.sqrt(sum / values.length);
        const dbLevel = Math.max(0, Math.min(1, (rms + 0.5) * 1.5)); // Normalize to 0-1

        setLevel(dbLevel);

        // Peak hold
        if (dbLevel > peak) {
          setPeak(dbLevel);
          peakHoldRef.current = Date.now();
        } else if (Date.now() - peakHoldRef.current > 1000) {
          setPeak(prev => Math.max(dbLevel, prev * 0.95));
        }
      }
      animationRef.current = requestAnimationFrame(updateMeter);
    };

    if (isPlaying) {
      updateMeter();
    } else {
      setLevel(0);
      setPeak(0);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, peak]);

  // Determine color based on level (green -> yellow -> red)
  const getMeterColor = (lvl: number) => {
    if (lvl > 0.9) return '#ef4444'; // Red (clipping)
    if (lvl > 0.7) return '#f59e0b'; // Yellow (hot)
    return color; // Default green
  };

  return (
    <div className="flex gap-0.5" style={{ height }}>
      {/* Left channel */}
      <div className="w-2 bg-gray-900 rounded-sm relative overflow-hidden border border-gray-700">
        <div
          className="absolute bottom-0 left-0 right-0 transition-all duration-75"
          style={{
            height: `${level * 100}%`,
            background: `linear-gradient(to top, ${getMeterColor(level)}, ${getMeterColor(level)}88)`,
          }}
        />
        {/* Peak indicator */}
        {peak > 0 && (
          <div
            className="absolute left-0 right-0 h-0.5"
            style={{
              bottom: `${peak * 100}%`,
              backgroundColor: getMeterColor(peak),
            }}
          />
        )}
        {/* dB scale marks */}
        <div className="absolute inset-0 flex flex-col justify-between opacity-50">
          <div className="h-px bg-gray-600" /> {/* 0dB */}
          <div className="h-px bg-gray-700" /> {/* -6dB */}
          <div className="h-px bg-gray-700" /> {/* -12dB */}
          <div className="h-px bg-gray-700" /> {/* -18dB */}
        </div>
      </div>
      {/* Right channel (simulated stereo) */}
      <div className="w-2 bg-gray-900 rounded-sm relative overflow-hidden border border-gray-700">
        <div
          className="absolute bottom-0 left-0 right-0 transition-all duration-75"
          style={{
            height: `${level * 98}%`, // Slightly different for stereo effect
            background: `linear-gradient(to top, ${getMeterColor(level)}, ${getMeterColor(level)}88)`,
          }}
        />
        {peak > 0 && (
          <div
            className="absolute left-0 right-0 h-0.5"
            style={{
              bottom: `${peak * 100}%`,
              backgroundColor: getMeterColor(peak),
            }}
          />
        )}
      </div>
    </div>
  );
};

// Channel Strip Component
const ChannelStrip: React.FC<{
  pad: Pad;
  padIndex: number;
  color: string;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ pad, padIndex, color, isSelected, onSelect }) => {
  const { setPadVolume, setPadPan, togglePadMute, togglePadSolo } = useBeatStore();

  return (
    <div
      className={`flex flex-col items-center p-2 rounded-lg transition-all cursor-pointer ${
        isSelected ? 'bg-gray-700/50 ring-1 ring-orange-500' : 'bg-gray-800/30 hover:bg-gray-700/30'
      }`}
      onClick={onSelect}
      style={{ minWidth: '60px' }}
    >
      {/* Channel Number */}
      <div
        className="w-full text-center text-[10px] font-bold text-white py-1 rounded-t mb-2"
        style={{ backgroundColor: color }}
      >
        {padIndex + 1}
      </div>

      {/* Pan Knob */}
      <PanKnob value={pad.pan} onChange={(v) => setPadPan(padIndex, v)} />

      {/* Volume Fader with Meter */}
      <div className="my-2 flex gap-1 items-center">
        <VolumeMeter height={96} color={color} />
        <VerticalFader
          value={pad.volume}
          onChange={(v) => setPadVolume(padIndex, v)}
          color={color}
        />
      </div>

      {/* Mute/Solo Buttons */}
      <div className="flex gap-1 mb-2">
        <button
          onClick={(e) => { e.stopPropagation(); togglePadMute(padIndex); }}
          className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold ${
            pad.muted ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
          title="Mute"
        >
          M
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); togglePadSolo(padIndex); }}
          className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold ${
            pad.solo ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
          title="Solo"
        >
          S
        </button>
      </div>

      {/* Channel Name */}
      <div className="w-full text-center">
        <span className="text-[9px] text-gray-300 truncate block" title={pad.sample?.name || `Ch ${padIndex + 1}`}>
          {pad.sample?.name?.slice(0, 8) || `Ch ${padIndex + 1}`}
        </span>
      </div>
    </div>
  );
};

// Channel colors
const CHANNEL_COLORS = [
  '#ff6b35', '#f7c948', '#2ec4b6', '#e71d36',
  '#7b2cbf', '#3a86ff', '#06d6a0', '#ff006e',
  '#8338ec', '#fb5607', '#ffbe0b', '#3a0ca3',
  '#4cc9f0', '#f72585', '#4361ee', '#7209b7',
];

// Group colors for channel groups
const GROUP_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
];

// Channel Group Header Component (FL Studio style)
const ChannelGroupHeader: React.FC<{
  group: ChannelGroup;
  trackCount: number;
  onToggleCollapse: () => void;
  onToggleMute: () => void;
  onToggleSolo: () => void;
  onDelete: () => void;
  onRename: (newName: string) => void;
}> = ({ group, trackCount, onToggleCollapse, onToggleMute, onToggleSolo, onDelete, onRename }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(group.name);

  const handleRename = () => {
    if (editName.trim() && editName !== group.name) {
      onRename(editName.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all"
      style={{
        backgroundColor: `${group.color}20`,
        borderColor: group.color,
      }}
    >
      {/* Collapse/Expand Button */}
      <button
        onClick={onToggleCollapse}
        className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
        title={group.collapsed ? 'Expand Group' : 'Collapse Group'}
      >
        {group.collapsed ? (
          <ChevronRight size={14} className="text-gray-300" />
        ) : (
          <ChevronDown size={14} className="text-gray-300" />
        )}
      </button>

      {/* Group Icon */}
      <Users size={14} style={{ color: group.color }} />

      {/* Group Name (editable) */}
      {isEditing ? (
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRename();
            if (e.key === 'Escape') setIsEditing(false);
          }}
          className="bg-gray-900 text-white text-xs px-1 py-0.5 rounded border border-gray-600 w-20"
          autoFocus
        />
      ) : (
        <span
          className="text-xs font-medium text-gray-200 cursor-pointer hover:text-white"
          onDoubleClick={() => setIsEditing(true)}
          title="Double-click to rename"
        >
          {group.name}
        </span>
      )}

      {/* Track count */}
      <span className="text-[10px] text-gray-500">({trackCount})</span>

      {/* Mute/Solo/Delete Buttons */}
      <div className="flex gap-1 ml-auto">
        <button
          onClick={onToggleMute}
          className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold ${
            group.muted ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
          title="Mute Group"
        >
          M
        </button>
        <button
          onClick={onToggleSolo}
          className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold ${
            group.solo ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
          title="Solo Group"
        >
          S
        </button>
        <button
          onClick={onDelete}
          className="w-5 h-5 flex items-center justify-center rounded bg-gray-700 text-gray-400 hover:bg-red-600 hover:text-white transition-colors"
          title="Delete Group"
        >
          <Trash2 size={10} />
        </button>
      </div>
    </div>
  );
};

// Main Channel Mixer Component
const ChannelMixer: React.FC = () => {
  const {
    pads,
    channelGroups,
    createChannelGroup,
    deleteChannelGroup,
    updateChannelGroup,
    toggleGroupCollapsed,
    toggleGroupMute,
    toggleGroupSolo,
    getTracksInGroup,
  } = useBeatStore();
  const [selectedChannel, setSelectedChannel] = useState<number | null>(null);
  const [showNewGroupInput, setShowNewGroupInput] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  // Only show pads that have samples assigned
  const activeChannels = pads.map((pad, index) => ({ pad, index }));

  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      const colorIndex = channelGroups.length % GROUP_COLORS.length;
      createChannelGroup(newGroupName.trim(), GROUP_COLORS[colorIndex]);
      setNewGroupName('');
      setShowNewGroupInput(false);
    }
  };

  return (
    <div className="channel-mixer h-full flex flex-col bg-gradient-to-b from-[#2a2a2a] to-[#1f1f1f] rounded-xl border border-gray-800 overflow-hidden">
      {/* Mixer Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#333] to-[#2a2a2a] border-b border-gray-700">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-200">Channel Mixer</span>
          <span className="text-[10px] text-gray-500">{pads.filter(p => p.sample).length} / {pads.length} Channels</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Add Group Button */}
          {showNewGroupInput ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateGroup();
                  if (e.key === 'Escape') setShowNewGroupInput(false);
                }}
                placeholder="Group name..."
                className="bg-gray-900 text-white text-xs px-2 py-1 rounded border border-gray-600 w-24"
                autoFocus
              />
              <button
                onClick={handleCreateGroup}
                className="px-2 py-1 bg-green-600 text-white text-[10px] rounded hover:bg-green-500"
              >
                Add
              </button>
              <button
                onClick={() => setShowNewGroupInput(false)}
                className="px-2 py-1 bg-gray-600 text-white text-[10px] rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewGroupInput(true)}
              className="flex items-center gap-1 px-2 py-1 bg-gray-700 text-gray-300 text-[10px] rounded hover:bg-gray-600 transition-colors"
              title="Create Channel Group"
            >
              <FolderPlus size={12} />
              <span>New Group</span>
            </button>
          )}
          <span className="text-[10px] text-gray-500 ml-2">Drag faders to adjust volume</span>
        </div>
      </div>

      {/* Channel Groups Section */}
      {channelGroups.length > 0 && (
        <div className="px-4 py-2 bg-gray-800/50 border-b border-gray-700 flex flex-wrap gap-2">
          {channelGroups.map((group) => (
            <ChannelGroupHeader
              key={group.id}
              group={group}
              trackCount={getTracksInGroup(group.id).length}
              onToggleCollapse={() => toggleGroupCollapsed(group.id)}
              onToggleMute={() => toggleGroupMute(group.id)}
              onToggleSolo={() => toggleGroupSolo(group.id)}
              onDelete={() => deleteChannelGroup(group.id)}
              onRename={(newName) => updateChannelGroup(group.id, { name: newName })}
            />
          ))}
        </div>
      )}

      {/* Mixer Channels - Horizontal scrollable */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
        <div className="flex gap-2 h-full">
          {activeChannels.map(({ pad, index }) => (
            <ChannelStrip
              key={index}
              pad={pad}
              padIndex={index}
              color={CHANNEL_COLORS[index % CHANNEL_COLORS.length]}
              isSelected={selectedChannel === index}
              onSelect={() => setSelectedChannel(index)}
            />
          ))}

          {/* Master Channel */}
          <div className="flex flex-col items-center p-2 rounded-lg bg-purple-900/30 border border-purple-700/50 ml-4" style={{ minWidth: '80px' }}>
            <div className="w-full text-center text-[10px] font-bold text-white py-1 rounded-t mb-2 bg-purple-600">
              MASTER
            </div>
            <PanKnob value={0} onChange={() => {}} />
            <div className="my-2 flex gap-1 items-center">
              <VolumeMeter height={96} color="#9333ea" />
              <VerticalFader value={0.8} onChange={() => {}} color="#9333ea" />
            </div>
            <span className="text-[9px] text-purple-300">Master Out</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChannelMixer;

