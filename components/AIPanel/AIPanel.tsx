'use client';

import React, { useState } from 'react';
import { Sparkles, Send } from 'lucide-react';
import { useBeatStore } from '@/store/useBeatStore';
import { claudeService } from '@/lib/ai/claude';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AIPanel: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hey! I\'m your AI beat assistant. Tell me what kind of beat you want to create, and I\'ll help you build it! 🎵',
    },
  ]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const { pads, bpm, toggleStep, clearPattern } = useBeatStore();

  const quickPrompts = [
    'Create a classic boom-bap pattern',
    'Generate a trap beat with rolling hi-hats',
    'Make a four-on-the-floor house groove',
    'Create a minimal techno pattern',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const userPrompt = input;
    setInput('');
    setIsGenerating(true);

    // Get available pads with samples
    const availablePads = pads
      .map((pad, index) => ({
        index,
        name: pad.sample?.name || 'Empty',
        category: pad.sample?.category || 'empty',
      }))
      .filter(p => p.category !== 'empty');

    if (availablePads.length === 0) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `I'd love to help, but you need to assign some samples to pads first! Drag samples from the library on the left onto the pads. 🎵`,
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsGenerating(false);
      return;
    }

    try {
      // Detect style from prompt
      const style = detectStyle(userPrompt);

      // Generate pattern with Claude
      const pattern = await claudeService.generateBeatPattern(
        userPrompt,
        style,
        bpm,
        availablePads
      );

      // Clear existing pattern
      clearPattern();

      // Apply pattern to sequencer
      pattern.steps.forEach(step => {
        toggleStep(step.padIndex, step.stepIndex);
      });

      const aiMessage: Message = {
        role: 'assistant',
        content: `✨ Created "${pattern.name}"! ${pattern.description}\n\nI've programmed the sequencer with a ${style} pattern at ${bpm} BPM. Hit play to hear it! 🎵`,
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Sorry, I had trouble generating that pattern. Please try again or describe your beat differently. 🎵`,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const detectStyle = (prompt: string): string => {
    const lower = prompt.toLowerCase();
    if (lower.includes('trap')) return 'trap';
    if (lower.includes('house') || lower.includes('four-on-the-floor')) return 'house';
    if (lower.includes('boom') || lower.includes('bap') || lower.includes('hip-hop') || lower.includes('hip hop')) return 'hip-hop';
    if (lower.includes('techno')) return 'techno';
    if (lower.includes('dnb') || lower.includes('drum and bass')) return 'dnb';
    return 'hip-hop'; // default
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="ai-panel h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-purple-900/20 to-pink-900/20">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="text-purple-400" size={20} />
          <h2 className="text-lg font-semibold">AI Beat Assistant</h2>
        </div>
        <p className="text-xs text-gray-400">Powered by Claude Opus 4.5</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-100'
              }`}
            >
              <p className="text-sm">{msg.content}</p>
            </div>
          </div>
        ))}
        
        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="p-4 border-t border-gray-800 space-y-2">
        <p className="text-xs text-gray-500 mb-2">Quick Prompts:</p>
        <div className="grid grid-cols-1 gap-2">
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleQuickPrompt(prompt)}
              className="text-left px-3 py-2 bg-gray-800 hover:bg-gray-750 rounded-lg text-xs text-gray-300 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe the beat you want..."
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isGenerating}
          />
          <button
            type="submit"
            disabled={isGenerating || !input.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default AIPanel;

