'use client';

import React, { useState } from 'react';
import { useBeatStore } from '@/store/useBeatStore';
import { GROOVE_TEMPLATES } from '@/lib/audio/grooveTemplates';
import { useToast } from '@/components/Toast/Toast';
import { Music, Zap, Check, ChevronDown, Percent } from 'lucide-react';

interface GroovePanelProps {
  compact?: boolean;
}

const GroovePanel: React.FC<GroovePanelProps> = ({ compact = false }) => {
  const {
    currentGrooveTemplate,
    grooveAmount,
    setGrooveTemplate,
    setGrooveAmount,
    applyGrooveToPattern,
  } = useBeatStore();

  const { showToast } = useToast();
  const [showDropdown, setShowDropdown] = useState(false);

  const currentTemplate = GROOVE_TEMPLATES.find(t => t.id === currentGrooveTemplate);

  const handleApplyGroove = () => {
    if (!currentGrooveTemplate) {
      showToast('Select a groove template first', 'warning');
      return;
    }
    applyGrooveToPattern();
    showToast(`Applied ${currentTemplate?.name || 'groove'} template`, 'success');
  };

  const categoryColors: Record<string, string> = {
    mpc: 'text-orange-400 bg-orange-500/20',
    sp1200: 'text-cyan-400 bg-cyan-500/20',
    classic: 'text-amber-400 bg-amber-500/20',
    custom: 'text-green-400 bg-green-500/20',
  };

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-all ${
            currentGrooveTemplate
              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
              : 'bg-gray-700/50 text-gray-400 border border-gray-600 hover:border-gray-500'
          }`}
        >
          <Music size={12} />
          <span>{currentTemplate?.name || 'Groove'}</span>
          <ChevronDown size={10} />
        </button>

        {showDropdown && (
          <GrooveDropdown
            currentTemplate={currentGrooveTemplate}
            grooveAmount={grooveAmount}
            onSelect={(id) => { setGrooveTemplate(id); setShowDropdown(false); }}
            onAmountChange={setGrooveAmount}
            onApply={applyGrooveToPattern}
            onClose={() => setShowDropdown(false)}
            categoryColors={categoryColors}
          />
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
          <Music size={12} className="text-orange-500" />
          Groove / Swing
        </h3>
        <button
          onClick={handleApplyGroove}
          disabled={!currentGrooveTemplate}
          className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-all ${
            currentGrooveTemplate
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Zap size={10} /> Apply
        </button>
      </div>

      {/* Template Selector */}
      <div className="relative mb-3">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full flex items-center justify-between px-3 py-2 bg-gray-900 rounded border border-gray-700 hover:border-gray-600 transition-colors"
        >
          <span className="text-sm text-gray-300">
            {currentTemplate?.name || 'Select template...'}
          </span>
          <ChevronDown size={14} className="text-gray-500" />
        </button>

        {showDropdown && (
          <GrooveDropdown
            currentTemplate={currentGrooveTemplate}
            grooveAmount={grooveAmount}
            onSelect={(id) => { setGrooveTemplate(id); setShowDropdown(false); }}
            onAmountChange={setGrooveAmount}
            onApply={applyGrooveToPattern}
            onClose={() => setShowDropdown(false)}
            categoryColors={categoryColors}
          />
        )}
      </div>

      {/* Amount Slider */}
      <div className="flex items-center gap-2">
        <Percent size={12} className="text-gray-500" />
        <input
          type="range"
          min="0"
          max="100"
          value={grooveAmount}
          onChange={(e) => setGrooveAmount(parseInt(e.target.value))}
          className="flex-1 h-1 bg-gray-700 rounded appearance-none cursor-pointer accent-orange-500"
        />
        <span className="text-xs text-gray-400 w-8 text-right">{grooveAmount}%</span>
      </div>

      {/* Template Description */}
      {currentTemplate && (
        <p className="text-[10px] text-gray-500 mt-2">{currentTemplate.description}</p>
      )}
    </div>
  );
};

interface GrooveDropdownProps {
  currentTemplate: string | null;
  grooveAmount: number;
  onSelect: (id: string | null) => void;
  onAmountChange: (amount: number) => void;
  onApply: () => void;
  onClose: () => void;
  categoryColors: Record<string, string>;
}

const GrooveDropdown: React.FC<GrooveDropdownProps> = ({
  currentTemplate, onSelect, categoryColors
}) => {
  const categories = ['mpc', 'sp1200', 'classic', 'custom'] as const;
  const categoryLabels: Record<string, string> = {
    mpc: 'MPC', sp1200: 'SP-1200', classic: 'Classic', custom: 'Custom',
  };

  return (
    <div className="absolute top-full left-0 mt-1 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 max-h-80 overflow-auto">
      {/* Clear option */}
      <button
        onClick={() => onSelect(null)}
        className="w-full px-3 py-2 text-left text-sm text-gray-400 hover:bg-gray-800 border-b border-gray-700"
      >
        No Groove (Straight)
      </button>

      {categories.map(cat => {
        const templates = GROOVE_TEMPLATES.filter(t => t.category === cat);
        if (!templates.length) return null;
        return (
          <div key={cat}>
            <div className={`px-3 py-1 text-[10px] font-bold uppercase ${categoryColors[cat]}`}>
              {categoryLabels[cat]}
            </div>
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => onSelect(t.id)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-800 flex items-center justify-between ${
                  t.id === currentTemplate ? 'bg-gray-800 text-orange-400' : 'text-gray-300'
                }`}
              >
                <span>{t.name}</span>
                {t.id === currentTemplate && <Check size={12} />}
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default GroovePanel;

