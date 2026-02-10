'use client';

import React, { useState } from 'react';
import { useBeatStore } from '@/store/useBeatStore';

const AIPanel: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const _store = useBeatStore(); // Store access reserved for future PHAZE generation

  const handleGenerate = async () => {
    setIsGenerating(true);
    // TODO: Implement PHAZE generation
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="h-full flex flex-col bg-gray-500 p-6">
      {/* Main PHAZE Container */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Device Frame */}
        <div className="w-full max-w-[280px] bg-gray-400 rounded-3xl border-2 border-white p-6 flex flex-col gap-6">

          {/* Visualizer Display */}
          <div className="w-full aspect-[4/3] bg-gray-500 rounded-xl border-2 border-white flex items-center justify-center">
            <div className="text-center text-white/60 text-sm font-medium px-4">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-8 bg-white/40 rounded animate-pulse" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-12 bg-white/40 rounded animate-pulse" style={{ animationDelay: '100ms' }}></div>
                    <div className="w-2 h-6 bg-white/40 rounded animate-pulse" style={{ animationDelay: '200ms' }}></div>
                    <div className="w-2 h-10 bg-white/40 rounded animate-pulse" style={{ animationDelay: '300ms' }}></div>
                    <div className="w-2 h-8 bg-white/40 rounded animate-pulse" style={{ animationDelay: '400ms' }}></div>
                  </div>
                  <span>GENERATING...</span>
                </div>
              ) : (
                <>
                  VISUALIZER DISPLAY<br />
                  DURING GENERATION
                </>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-3 rounded-lg border-2 border-green-500 text-green-500 font-bold text-sm tracking-wider hover:bg-green-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'GENERATING...' : 'GENERATE'}
          </button>

          {/* PHAZE Branding */}
          <div className="text-center">
            <h1 className="text-white text-3xl font-bold tracking-[0.3em]">PHAZE</h1>
          </div>

          {/* Control Buttons - Row 1 (3 buttons) */}
          <div className="flex justify-center gap-6">
            <button className="w-12 h-12 rounded-full border-2 border-white bg-transparent hover:bg-white/10 transition-colors" />
            <button className="w-12 h-12 rounded-full border-2 border-white bg-transparent hover:bg-white/10 transition-colors" />
            <button className="w-12 h-12 rounded-full border-2 border-white bg-transparent hover:bg-white/10 transition-colors" />
          </div>

          {/* Control Buttons - Row 2 (2 buttons) */}
          <div className="flex justify-center gap-6">
            <button className="w-12 h-12 rounded-full border-2 border-white bg-transparent hover:bg-white/10 transition-colors" />
            <button className="w-12 h-12 rounded-full border-2 border-white bg-transparent hover:bg-white/10 transition-colors" />
          </div>

        </div>
      </div>
    </div>
  );
};

export default AIPanel;

