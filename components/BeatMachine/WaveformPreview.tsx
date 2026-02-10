'use client';

import React, { useEffect, useRef, useState } from 'react';

interface WaveformPreviewProps {
  sampleUrl: string;
  color?: string;
  width?: number;
  height?: number;
  className?: string;
}

// Cache for decoded waveform data to avoid re-decoding
const waveformCache = new Map<string, number[]>();

const WaveformPreview: React.FC<WaveformPreviewProps> = ({
  sampleUrl,
  color = '#ffffff',
  width = 60,
  height = 20,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformData, setWaveformData] = useState<number[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Extract waveform data from audio
  useEffect(() => {
    if (!sampleUrl) {
      setIsLoading(false);
      return;
    }

    // Check cache first
    if (waveformCache.has(sampleUrl)) {
      setWaveformData(waveformCache.get(sampleUrl)!);
      setIsLoading(false);
      return;
    }

    const loadWaveform = async () => {
      try {
        setIsLoading(true);

        // Validate URL before fetching
        if (!sampleUrl || typeof sampleUrl !== 'string' || sampleUrl.trim() === '') {
          setWaveformData(null);
          return;
        }

        const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

        let response: Response;
        try {
          response = await fetch(sampleUrl);
        } catch (fetchError) {
          // Network error, blob revoked, or invalid URL
          console.warn(`Waveform fetch error for ${sampleUrl}:`, fetchError);
          setWaveformData(null);
          audioContext.close();
          return;
        }

        // Check if fetch was successful
        if (!response.ok) {
          console.warn(`Waveform fetch failed: ${response.status} for ${sampleUrl}`);
          setWaveformData(null);
          audioContext.close();
          return;
        }

        const arrayBuffer = await response.arrayBuffer();

        // Check if we got valid data
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
          console.warn(`Empty audio data for ${sampleUrl}`);
          setWaveformData(null);
          audioContext.close();
          return;
        }

        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Get channel data (mono or left channel)
        const channelData = audioBuffer.getChannelData(0);
        
        // Downsample to ~50 points for visualization
        const samples = 50;
        const blockSize = Math.floor(channelData.length / samples);
        const peaks: number[] = [];
        
        for (let i = 0; i < samples; i++) {
          const start = i * blockSize;
          let max = 0;
          
          for (let j = 0; j < blockSize; j++) {
            const absValue = Math.abs(channelData[start + j] || 0);
            if (absValue > max) max = absValue;
          }
          peaks.push(max);
        }
        
        // Normalize peaks
        const maxPeak = Math.max(...peaks, 0.01);
        const normalizedPeaks = peaks.map(p => p / maxPeak);
        
        // Cache the result
        waveformCache.set(sampleUrl, normalizedPeaks);
        setWaveformData(normalizedPeaks);
        
        // Close audio context
        audioContext.close();
        console.log(`🎵 Waveform loaded for: ${sampleUrl.split('/').pop()}`);
      } catch (error) {
        console.error('Failed to load waveform:', error);
        setWaveformData(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadWaveform();
  }, [sampleUrl]);

  // Draw waveform on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveformData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw waveform bars
    const barWidth = width / waveformData.length;
    const centerY = height / 2;

    ctx.fillStyle = color;
    ctx.globalAlpha = 0.7;

    waveformData.forEach((value, i) => {
      const barHeight = value * height * 0.9;
      const x = i * barWidth;
      const y = centerY - barHeight / 2;
      
      // Draw rounded bars
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth - 1, barHeight, 1);
      ctx.fill();
    });
  }, [waveformData, color, width, height]);

  if (isLoading) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse" />
      </div>
    );
  }

  if (!waveformData) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`pointer-events-none ${className}`}
      style={{ width, height }}
    />
  );
};

export default WaveformPreview;

