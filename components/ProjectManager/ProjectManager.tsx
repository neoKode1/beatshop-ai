'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useBeatStore } from '@/store/useBeatStore';
import { Save, FolderOpen, Download, Upload, X, Clock, Check } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  createdAt: number;
  modifiedAt: number;
  bpm: number;
  timeSignature: string;
  patterns: any[];
  arrangementClips: any[];
  masterSettings: any;
  pads: any[]; // Include pad/sample assignments
  steps: any[]; // Include step sequencer state
  tracks: any[]; // Include tracks
  midiNotes: any[]; // Include MIDI notes
}

export const ProjectManager: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const store = useBeatStore();
  const [projectName, setProjectName] = useState('');
  const [savedProjects, setSavedProjects] = useState<Project[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('beatshop_projects');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);

  // Serialize pads (remove Tone.js objects)
  const serializePads = (pads: any[]) => {
    return pads.map(pad => ({
      id: pad.id,
      sample: pad.sample,
      volume: pad.volume,
      pan: pad.pan,
      muted: pad.muted,
      solo: pad.solo,
      note: pad.note,
      effects: pad.effects,
    }));
  };

  const createProjectData = (name: string, existingId?: string): Project => {
    return {
      id: existingId || `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      createdAt: existingId ? savedProjects.find(p => p.id === existingId)?.createdAt || Date.now() : Date.now(),
      modifiedAt: Date.now(),
      bpm: store.bpm,
      timeSignature: store.timeSignature,
      patterns: store.patterns,
      arrangementClips: store.arrangementClips,
      pads: serializePads(store.pads),
      steps: store.steps,
      tracks: store.tracks,
      midiNotes: store.midiNotes,
      masterSettings: {
        masterVolume: store.masterVolume,
        compressorThreshold: store.compressorThreshold,
        compressorRatio: store.compressorRatio,
        compressorAttack: store.compressorAttack,
        compressorRelease: store.compressorRelease,
        limiterThreshold: store.limiterThreshold,
        eqLow: store.eqLow,
        eqMid: store.eqMid,
        eqHigh: store.eqHigh,
        distortion: store.distortion,
        reverb: store.reverb,
        delay: store.delay,
        stereoWidth: store.stereoWidth,
        swing: store.swing,
        patternLength: store.patternLength,
      },
    };
  };

  const saveProject = () => {
    if (!projectName.trim()) {
      alert('Please enter a project name');
      return;
    }

    const project = createProjectData(projectName);
    const updatedProjects = [...savedProjects, project];
    setSavedProjects(updatedProjects);
    localStorage.setItem('beatshop_projects', JSON.stringify(updatedProjects));

    // Also save as current working project for auto-restore
    localStorage.setItem('beatshop_current_project', JSON.stringify(project));

    setProjectName('');
    setShowSaveDialog(false);
    alert(`Project "${project.name}" saved successfully!`);
  };

  const loadProject = (project: Project, skipConfirm = false) => {
    if (!skipConfirm && !confirm(`Load project "${project.name}"? This will replace your current work.`)) {
      return;
    }

    // Use the new restoreProject action to restore everything at once
    store.restoreProject({
      bpm: project.bpm,
      timeSignature: project.timeSignature,
      patterns: project.patterns,
      arrangementClips: project.arrangementClips,
      pads: project.pads,
      steps: project.steps,
      tracks: project.tracks,
      midiNotes: project.midiNotes,
      masterSettings: project.masterSettings,
    });

    // Save as current working project
    localStorage.setItem('beatshop_current_project', JSON.stringify(project));

    setShowLoadDialog(false);
    if (!skipConfirm) {
      alert(`Project "${project.name}" loaded successfully!`);
    }
  };

  const deleteProject = (projectId: string) => {
    const project = savedProjects.find(p => p.id === projectId);
    if (!project) return;

    if (!confirm(`Delete project "${project.name}"?`)) return;

    const updatedProjects = savedProjects.filter(p => p.id !== projectId);
    setSavedProjects(updatedProjects);
    localStorage.setItem('beatshop_projects', JSON.stringify(updatedProjects));
  };

  const exportProject = (project: Project) => {
    const dataStr = JSON.stringify(project, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name}.beatshop.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importProject = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.beatshop.json,.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const project = JSON.parse(event.target?.result as string);
          const updatedProjects = [...savedProjects, project];
          setSavedProjects(updatedProjects);
          localStorage.setItem('beatshop_projects', JSON.stringify(updatedProjects));
          alert(`Project "${project.name}" imported successfully!`);
        } catch (error) {
          alert('Error importing project file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#2A2A2A] to-[#1F1F1F] rounded-xl shadow-2xl border-2 border-gray-800/50 max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b-2 border-gray-800/50 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-200">Project Manager</h2>
            <p className="text-sm text-gray-400">Save, load, and manage your projects</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700/50 rounded-lg transition-all"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Actions */}
        <div className="p-6 border-b-2 border-gray-800/50 flex gap-3">
          <button
            onClick={() => setShowSaveDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-bold text-white transition-all"
          >
            <Save size={18} />
            Save Project
          </button>
          <button
            onClick={() => setShowLoadDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-white transition-all"
          >
            <FolderOpen size={18} />
            Load Project
          </button>
          <button
            onClick={importProject}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold text-white transition-all"
          >
            <Upload size={18} />
            Import
          </button>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-lg font-bold text-gray-300 mb-4">Saved Projects ({savedProjects.length})</h3>

          {savedProjects.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FolderOpen size={48} className="mx-auto mb-4 opacity-50" />
              <p>No saved projects yet</p>
              <p className="text-sm">Click "Save Project" to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedProjects.map(project => (
                <div
                  key={project.id}
                  className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 hover:border-purple-500/50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-200 text-lg">{project.name}</h4>
                      <div className="text-sm text-gray-400 mt-1 space-y-1">
                        <p>Created: {new Date(project.createdAt).toLocaleString()}</p>
                        <p>BPM: {project.bpm} | Time: {project.timeSignature}</p>
                        <p>Patterns: {project.patterns.length} | Clips: {project.arrangementClips.length}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => loadProject(project)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm font-bold text-white transition-all"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => exportProject(project)}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm font-bold text-white transition-all"
                        title="Export to file"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => deleteProject(project.id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-sm font-bold text-white transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save Dialog */}
        {showSaveDialog && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-[#2A2A2A] to-[#1F1F1F] rounded-xl p-6 border-2 border-gray-800/50 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-200 mb-4">Save Project</h3>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name..."
                className="w-full px-4 py-2 bg-gray-800 border-2 border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && saveProject()}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg font-bold text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={saveProject}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-bold text-white transition-all"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectManager;

