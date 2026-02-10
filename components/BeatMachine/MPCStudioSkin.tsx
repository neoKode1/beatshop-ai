'use client';

import React from 'react';

// MPC Studio Chassis - the hardware "skin"
const MPCStudioSkin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div
      className="relative w-full"
      style={{
        background: 'linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 5%, #1a1a1a 95%, #0a0a0a 100%)',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: `
          0 20px 60px rgba(0,0,0,0.8),
          0 10px 20px rgba(0,0,0,0.6),
          inset 0 1px 0 rgba(255,255,255,0.1),
          inset 0 -1px 0 rgba(0,0,0,0.5)
        `,
        border: '1px solid #444',
      }}
    >
      {/* Metal texture overlay */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background: `
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 1px,
              rgba(255,255,255,0.02) 1px,
              rgba(255,255,255,0.02) 2px
            )
          `,
          opacity: 0.5,
        }}
      />

      {/* Inner bezel */}
      <div
        className="relative"
        style={{
          background: 'linear-gradient(180deg, #252525 0%, #1a1a1a 100%)',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
        }}
      >
        {children}
      </div>
    </div>
  );
};

// MPC Small Button - used throughout the interface
export const MPCSmallButton: React.FC<{
  label: string;
  subLabel?: string;
  active?: boolean;
  color?: 'red' | 'orange' | 'green' | 'blue' | 'gray' | 'cyan';
  size?: 'xs' | 'sm' | 'md';
  onClick?: () => void;
}> = ({ label, subLabel, active = false, color = 'gray', size = 'sm', onClick }) => {
  const colorMap = {
    red: { bg: 'bg-red-600', activeBg: 'bg-red-500', glow: 'shadow-red-500/50' },
    orange: { bg: 'bg-orange-600', activeBg: 'bg-orange-500', glow: 'shadow-orange-500/50' },
    green: { bg: 'bg-green-600', activeBg: 'bg-green-500', glow: 'shadow-green-500/50' },
    blue: { bg: 'bg-blue-600', activeBg: 'bg-blue-500', glow: 'shadow-blue-500/50' },
    cyan: { bg: 'bg-cyan-600', activeBg: 'bg-cyan-500', glow: 'shadow-cyan-500/50' },
    gray: { bg: 'bg-gray-700', activeBg: 'bg-gray-600', glow: '' },
  };

  const sizeMap = {
    xs: 'px-1 py-0.5 text-[5px] min-w-[24px]',
    sm: 'px-1.5 py-0.5 text-[6px] min-w-[32px]',
    md: 'px-2 py-1 text-[7px] min-w-[40px]',
  };

  const { bg, activeBg, glow } = colorMap[color];

  return (
    <button
      onClick={onClick}
      className={`
        ${sizeMap[size]}
        ${active ? `${activeBg} text-white ${glow} shadow-lg` : `${bg} text-gray-300 hover:brightness-110`}
        rounded font-bold uppercase tracking-wide
        border border-gray-600/50
        transition-all duration-100
        active:scale-95
      `}
      style={{
        boxShadow: active
          ? `0 0 8px ${color === 'red' ? '#ef4444' : color === 'orange' ? '#f97316' : color === 'green' ? '#22c55e' : color === 'blue' ? '#3b82f6' : color === 'cyan' ? '#06b6d4' : '#666'}40`
          : 'inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.3)',
      }}
    >
      <div className="leading-tight whitespace-nowrap">{label}</div>
      {subLabel && <div className="text-[5px] opacity-70 leading-tight">{subLabel}</div>}
    </button>
  );
};

// LCD Display Component
export const MPCLCDDisplay: React.FC<{
  line1?: string;
  line2?: string;
  line3?: string;
  subText?: string;
}> = ({ line1 = '01:01:00', line2 = 'SEQ 01 TRK 01', line3 = 'Velocity', subText }) => {
  return (
    <div
      className="rounded-md p-2 font-mono"
      style={{
        background: 'linear-gradient(180deg, #1a2a1a 0%, #0d1a0d 100%)',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.1)',
        border: '1px solid #2a3a2a',
      }}
    >
      <div className="flex justify-between text-[8px] text-green-400/80 mb-1">
        <span>{line1}</span>
        <span>{line2}</span>
      </div>
      <div className="text-center">
        <div className="text-[12px] text-green-400 font-bold tracking-wide">{line3}</div>
        {subText && <div className="text-[7px] text-green-500/60 mt-0.5">{subText}</div>}
      </div>
    </div>
  );
};

// Large Jog Wheel Component
export const MPCJogWheel: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  value?: number;
  onChange?: (value: number) => void;
}> = ({ size = 'md', value = 0, onChange }) => {
  const sizeMap = { sm: 'w-16 h-16', md: 'w-20 h-20', lg: 'w-24 h-24' };
  const capSizeMap = { sm: 'w-6 h-6', md: 'w-8 h-8', lg: 'w-10 h-10' };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    onChange?.(Math.round((angle * 180) / Math.PI));
  };

  return (
    <div
      className={`${sizeMap[size]} rounded-full relative cursor-pointer`}
      style={{
        background: `
          radial-gradient(ellipse at 30% 30%, #4a4a4a 0%, transparent 50%),
          linear-gradient(145deg, #3a3a3a 0%, #1a1a1a 50%, #2a2a2a 100%)
        `,
        boxShadow: `
          0 4px 16px rgba(0,0,0,0.6),
          0 2px 4px rgba(0,0,0,0.4),
          inset 0 2px 4px rgba(255,255,255,0.1),
          inset 0 -2px 4px rgba(0,0,0,0.3)
        `,
        border: '3px solid #333',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Grooves on wheel */}
      {[...Array(24)].map((_, i) => (
        <div
          key={i}
          className="absolute w-0.5 h-2 bg-gray-600/30"
          style={{
            top: '4px',
            left: '50%',
            transform: `translateX(-50%) rotate(${i * 15}deg)`,
            transformOrigin: `center ${size === 'lg' ? '46px' : size === 'md' ? '38px' : '30px'}`,
          }}
        />
      ))}
      {/* Center cap */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${capSizeMap[size]} rounded-full`}
        style={{
          background: 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 100%)',
          boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.15), 0 2px 4px rgba(0,0,0,0.4)',
          border: '1px solid #3a3a3a',
        }}
      />
      {/* Indicator notch */}
      <div
        className="absolute top-2 left-1/2 w-1 h-2 bg-gray-300 rounded-full"
        style={{
          transform: `translateX(-50%) rotate(${value}deg)`,
          transformOrigin: `center ${size === 'lg' ? '44px' : size === 'md' ? '36px' : '28px'}`,
        }}
      />
    </div>
  );
};

// MPC Pad with colored border (matches MPC Studio pad colors)
export const MPCPad: React.FC<{
  padNumber: number;
  label?: string;
  borderColor?: string;
  active?: boolean;
  hasContent?: boolean;
  onClick?: () => void;
}> = ({ padNumber, label, borderColor = '#666', active = false, hasContent = false, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative aspect-square rounded-md
        flex flex-col items-center justify-center
        transition-all duration-75
        ${active ? 'scale-95' : 'hover:scale-[1.02]'}
      `}
      style={{
        background: active
          ? `linear-gradient(145deg, #4a4a4a 0%, #3a3a3a 100%)`
          : `linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 100%)`,
        boxShadow: active
          ? `inset 0 2px 4px rgba(0,0,0,0.5), 0 0 12px ${borderColor}40`
          : `0 4px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)`,
        border: `2px solid ${borderColor}`,
      }}
    >
      {hasContent && (
        <div className="text-[8px] text-gray-400 font-bold">
          PAD {padNumber}
        </div>
      )}
      {label && (
        <div className="absolute -bottom-4 left-0 right-0 text-center">
          <span className="text-[6px] text-gray-500 font-bold uppercase tracking-wide">{label}</span>
        </div>
      )}
    </button>
  );
};

export default MPCStudioSkin;

