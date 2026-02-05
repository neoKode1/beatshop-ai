'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useBeatStore, Sample, SynthType } from '@/store/useBeatStore';
import { Music, Drum, Zap, FolderPlus, Folder, ChevronRight, ChevronDown, Trash2, X } from 'lucide-react';
import * as Tone from 'tone';
import { previewSynth, SynthType as SynthTypeFromFactory } from '@/lib/audio/synthesizers';
import { previewAudio } from '@/lib/audio/audioPlayerService';
import { useDragSource } from '@/hooks/useDragDrop';
import { AUDIO_SAMPLES } from '@/lib/data/audioSamples';

// User folder structure for uploaded samples
interface UserFolder {
  id: string;
  name: string;
  samples: Sample[];
  subfolders: UserFolder[];
  isExpanded: boolean;
}

// Stored folder structure (with File objects instead of blob URLs)
interface StoredFolder {
  id: string;
  name: string;
  files: { file: File; relativePath: string; category: Sample['category'] }[];
  subfolders: StoredFolder[];
  isExpanded: boolean;
}

// Utility to detect category from folder/file name
const detectCategory = (name: string): Sample['category'] => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('kick') || lowerName.includes('808')) return 'kick';
  if (lowerName.includes('snare') || lowerName.includes('clap') || lowerName.includes('rim')) return 'snare';
  if (lowerName.includes('hat') || lowerName.includes('hihat') || lowerName.includes('hi-hat')) return 'hihat';
  if (lowerName.includes('perc') || lowerName.includes('shaker') || lowerName.includes('tom') || lowerName.includes('conga') || lowerName.includes('bongo')) return 'perc';
  if (lowerName.includes('bass') || lowerName.includes('sub')) return 'bass';
  if (lowerName.includes('synth') || lowerName.includes('lead') || lowerName.includes('pad') || lowerName.includes('keys')) return 'synth';
  if (lowerName.includes('fx') || lowerName.includes('effect') || lowerName.includes('riser') || lowerName.includes('impact')) return 'fx';
  if (lowerName.includes('loop') || lowerName.includes('melody') || lowerName.includes('chord') || lowerName.includes('melodic')) return 'melodic';
  return 'perc'; // Default category
};

// Supported audio formats
const AUDIO_EXTENSIONS = ['.wav', '.mp3', '.ogg', '.aif', '.aiff', '.flac', '.m4a'];

const isAudioFile = (fileName: string): boolean => {
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return AUDIO_EXTENSIONS.includes(ext);
};

// IndexedDB helper for persisting user folders
const DB_NAME = 'BeatShopAI_SampleLibrary';
const STORE_NAME = 'userFolders';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

// Convert UserFolder to StoredFolder (extract File objects from blob URLs)
const convertToStoredFolder = (folder: UserFolder, fileMap: Map<string, File>): StoredFolder => {
  return {
    id: folder.id,
    name: folder.name,
    files: folder.samples.map(sample => ({
      file: fileMap.get(sample.url!) || new File([], 'unknown'),
      relativePath: sample.name,
      category: sample.category,
    })),
    subfolders: folder.subfolders.map(sf => convertToStoredFolder(sf, fileMap)),
    isExpanded: folder.isExpanded,
  };
};

const saveFoldersToDB = async (folders: UserFolder[], fileMap: Map<string, File>): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  // Clear and save all (convert to StoredFolder format)
  store.clear();
  folders.forEach(folder => {
    const storedFolder = convertToStoredFolder(folder, fileMap);
    store.put(storedFolder);
  });
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

// Convert StoredFolder back to UserFolder (recreate blob URLs from File objects)
const convertFromStoredFolder = (storedFolder: StoredFolder, fileMap: Map<string, File>): UserFolder => {
  const folder: UserFolder = {
    id: storedFolder.id,
    name: storedFolder.name,
    samples: [],
    subfolders: [],
    isExpanded: storedFolder.isExpanded,
  };

  // Recreate blob URLs from File objects
  storedFolder.files.forEach(({ file, relativePath, category }) => {
    const blobUrl = URL.createObjectURL(file);
    // Store File object in map for future persistence
    fileMap.set(blobUrl, file);

    const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
    folder.samples.push({
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: baseName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      type: 'audio',
      url: blobUrl,
      category,
    });
  });

  // Recursively convert subfolders
  folder.subfolders = storedFolder.subfolders.map(sf => convertFromStoredFolder(sf, fileMap));

  return folder;
};

const loadFoldersFromDB = async (): Promise<{ folders: UserFolder[]; fileMap: Map<string, File> }> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const storedFolders = request.result || [];
        const fileMap = new Map<string, File>();
        // Convert StoredFolder[] to UserFolder[] (recreate blob URLs)
        const userFolders = storedFolders.map((sf: StoredFolder) => convertFromStoredFolder(sf, fileMap));
        resolve({ folders: userFolders, fileMap });
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to load folders from IndexedDB:', error);
    return { folders: [], fileMap: new Map() };
  }
};

// Tone.js Synthesizer Samples
const SYNTH_SAMPLES: Sample[] = [
  { id: 'kick1', name: 'Kick 808', type: 'synth', synthType: 'kick808', category: 'kick' },
  { id: 'kick2', name: 'Kick Acoustic', type: 'synth', synthType: 'kickAcoustic', category: 'kick' },
  { id: 'snare1', name: 'Snare', type: 'synth', synthType: 'snare', category: 'snare' },
  { id: 'snare2', name: 'Clap', type: 'synth', synthType: 'clap', category: 'snare' },
  { id: 'snare3', name: 'Rim Shot', type: 'synth', synthType: 'rimShot', category: 'snare' },
  { id: 'hihat1', name: 'Hi-Hat Closed', type: 'synth', synthType: 'hihatClosed', category: 'hihat' },
  { id: 'hihat2', name: 'Hi-Hat Open', type: 'synth', synthType: 'hihatOpen', category: 'hihat' },
  { id: 'perc1', name: 'Shaker', type: 'synth', synthType: 'shaker', category: 'perc' },
  { id: 'perc2', name: 'Tom', type: 'synth', synthType: 'tom', category: 'perc' },
  { id: 'perc3', name: 'Cowbell', type: 'synth', synthType: 'cowbell', category: 'perc' },
  { id: 'bass1', name: 'Sub Bass', type: 'synth', synthType: 'subBass', category: 'bass', pitch: 'C1' },
];

// Audio samples imported from auto-generated file
// To regenerate: node scripts/update-audio-samples.js

// Combine all samples (11 synths + 358 audio samples = 369 total)
const ALL_SAMPLES = [...SYNTH_SAMPLES, ...AUDIO_SAMPLES];

const SampleBrowser: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [draggedSample, setDraggedSample] = useState<Sample | null>(null);
  const [userFolders, setUserFolders] = useState<UserFolder[]>([]);
  const [viewMode, setViewMode] = useState<'library' | 'folders'>('library');
  const folderInputRef = useRef<HTMLInputElement>(null);
  const assignSampleToPad = useBeatStore(state => state.assignSampleToPad);

  // Map to track File objects for blob URLs (needed for persistence)
  const fileMapRef = useRef<Map<string, File>>(new Map());

  // Load user folders from IndexedDB on mount
  useEffect(() => {
    loadFoldersFromDB().then(({ folders, fileMap }) => {
      // Populate fileMapRef with File objects from loaded folders
      fileMapRef.current = fileMap;
      setUserFolders(folders);
      console.log(`✅ Loaded ${folders.length} folders from IndexedDB with ${fileMap.size} files`);
    });
  }, []);

  // Save user folders to IndexedDB when they change
  useEffect(() => {
    if (userFolders.length > 0) {
      saveFoldersToDB(userFolders, fileMapRef.current);
    }
  }, [userFolders]);

  // Process uploaded folder
  const processFiles = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    // Group files by their folder paths
    const folderMap = new Map<string, { file: File; relativePath: string }[]>();

    fileArray.forEach(file => {
      // webkitRelativePath gives us the full path from the selected folder
      const relativePath = (file as any).webkitRelativePath || file.name;
      const parts = relativePath.split('/');
      const rootFolderName = parts[0] || 'Uploaded Samples';

      if (!folderMap.has(rootFolderName)) {
        folderMap.set(rootFolderName, []);
      }
      folderMap.get(rootFolderName)!.push({ file, relativePath });
    });

    // Process each root folder
    const newFolders: UserFolder[] = [];

    for (const [folderName, filesInFolder] of folderMap) {
      const rootFolder: UserFolder = {
        id: `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: folderName,
        samples: [],
        subfolders: [],
        isExpanded: true,
      };

      // Build folder structure
      const subfolderMap = new Map<string, UserFolder>();

      for (const { file, relativePath } of filesInFolder) {
        if (!isAudioFile(file.name)) continue;

        // Create blob URL for the file
        const blobUrl = URL.createObjectURL(file);

        // Store File object in map for persistence
        fileMapRef.current.set(blobUrl, file);

        const parts = relativePath.split('/');
        const fileName = parts[parts.length - 1];
        const baseName = fileName.substring(0, fileName.lastIndexOf('.'));

        // Determine category from path
        const pathCategory = detectCategory(relativePath);

        const sample: Sample = {
          id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: baseName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          type: 'audio',
          url: blobUrl,
          category: pathCategory,
        };

        // If file is in a subfolder
        if (parts.length > 2) {
          const subfolderPath = parts.slice(1, -1).join('/');
          const subfolderName = parts[parts.length - 2];

          if (!subfolderMap.has(subfolderPath)) {
            const subfolder: UserFolder = {
              id: `subfolder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: subfolderName,
              samples: [],
              subfolders: [],
              isExpanded: false,
            };
            subfolderMap.set(subfolderPath, subfolder);
          }
          subfolderMap.get(subfolderPath)!.samples.push(sample);
        } else {
          rootFolder.samples.push(sample);
        }
      }

      // Add subfolders to root
      rootFolder.subfolders = Array.from(subfolderMap.values());
      newFolders.push(rootFolder);
    }

    setUserFolders(prev => [...prev, ...newFolders]);
    setViewMode('folders');
  }, []);

  // Handle folder input change
  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  // Toggle folder expansion
  const toggleFolder = (folderId: string) => {
    setUserFolders(prev => prev.map(folder => {
      if (folder.id === folderId) {
        return { ...folder, isExpanded: !folder.isExpanded };
      }
      return {
        ...folder,
        subfolders: folder.subfolders.map(sub =>
          sub.id === folderId ? { ...sub, isExpanded: !sub.isExpanded } : sub
        ),
      };
    }));
  };

  // Remove a user folder
  const removeFolder = (folderId: string) => {
    setUserFolders(prev => {
      // Revoke blob URLs before removing
      const folder = prev.find(f => f.id === folderId);
      if (folder) {
        folder.samples.forEach(s => s.url && URL.revokeObjectURL(s.url));
        folder.subfolders.forEach(sf =>
          sf.samples.forEach(s => s.url && URL.revokeObjectURL(s.url))
        );
      }
      return prev.filter(f => f.id !== folderId);
    });
  };

  // Get all samples from user folders (flattened)
  const getUserSamples = useCallback((): Sample[] => {
    const samples: Sample[] = [];
    userFolders.forEach(folder => {
      samples.push(...folder.samples);
      folder.subfolders.forEach(sub => samples.push(...sub.samples));
    });
    return samples;
  }, [userFolders]);

  const categories = [
    { id: 'all', name: 'All', icon: Music },
    { id: 'kick', name: 'Kicks', icon: Drum },
    { id: 'snare', name: 'Snares', icon: Drum },
    { id: 'hihat', name: 'Hi-Hats', icon: Drum },
    { id: 'perc', name: 'Percussion', icon: Drum },
    { id: 'bass', name: 'Bass', icon: Music },
    { id: 'synth', name: 'Synths', icon: Music },
    { id: 'melodic', name: 'Loops', icon: Music },
    { id: 'fx', name: 'FX', icon: Zap },
  ];

  // Combine built-in and user samples
  const allSamplesWithUser = [...ALL_SAMPLES, ...getUserSamples()];

  const filteredSamples = selectedCategory === 'all'
    ? allSamplesWithUser
    : allSamplesWithUser.filter(s => s.category === selectedCategory);

  // Use the unified drag source hook
  const { draggedSample: hookDraggedSample, handlers: dragHandlers } = useDragSource();

  // Sync hook state with local state for backward compatibility
  useEffect(() => {
    setDraggedSample(hookDraggedSample);
  }, [hookDraggedSample]);

  const previewSample = async (sample: Sample) => {
    if (sample.type === 'synth' && sample.synthType) {
      // Use unified synth preview - handles creation, triggering, and disposal
      await previewSynth(
        sample.synthType as SynthTypeFromFactory,
        sample.pitch || 'C2',
        0.8
      );
    } else if (sample.type === 'audio' && sample.url) {
      // Use unified audio preview - handles pooling and cleanup
      await previewAudio(sample.url, 0.8);
    }
  };

  // Wrap drag handlers to use the hook
  const handleDragStart = (e: React.DragEvent, sample: Sample) => {
    dragHandlers.onDragStart(e, sample);
  };

  const handleDragEnd = () => {
    dragHandlers.onDragEnd();
  };

  // Render a folder item with samples
  const renderFolder = (folder: UserFolder, depth: number = 0) => (
    <div key={folder.id} className="mb-2">
      {/* Folder header */}
      <div
        className="flex items-center gap-2 px-2 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 cursor-pointer transition-all group"
        style={{ marginLeft: depth * 12 }}
      >
        <button onClick={() => toggleFolder(folder.id)} className="flex items-center gap-2 flex-1">
          {folder.isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <Folder size={16} className="text-yellow-500" />
          <span className="text-sm font-medium text-gray-300 truncate">{folder.name}</span>
          <span className="text-xs text-gray-500 ml-auto">
            {folder.samples.length + folder.subfolders.reduce((acc, sf) => acc + sf.samples.length, 0)}
          </span>
        </button>
        {depth === 0 && (
          <button
            onClick={() => removeFolder(folder.id)}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
            title="Remove folder"
          >
            <Trash2 size={14} className="text-red-400" />
          </button>
        )}
      </div>

      {/* Folder contents */}
      {folder.isExpanded && (
        <div className="mt-1 space-y-1">
          {/* Subfolders */}
          {folder.subfolders.map(sub => renderFolder(sub, depth + 1))}

          {/* Samples in this folder */}
          {folder.samples.map(sample => (
            <div
              key={sample.id}
              draggable
              onDragStart={(e) => handleDragStart(e, sample)}
              onDragEnd={handleDragEnd}
              className="flex items-center justify-between px-3 py-2 ml-6 rounded bg-gray-800/30 hover:bg-gray-700/50 cursor-move transition-all border border-transparent hover:border-purple-500/50"
              style={{ marginLeft: (depth + 1) * 12 + 8 }}
            >
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => previewSample(sample)}
              >
                <div className="text-xs font-medium text-gray-300 truncate hover:text-purple-400 transition-colors">{sample.name}</div>
              </div>
              <button
                onClick={() => previewSample(sample)}
                className="px-2 py-0.5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300 ml-2 flex-shrink-0"
              >
                ▶
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="sample-browser h-full flex flex-col">
      {/* BEATSHOP Branding */}
      <div className="p-4 border-b-2 border-gray-900/50 bg-gradient-to-r from-[#1A1A1A] to-[#252525]">
        <h1
          className="text-2xl font-black tracking-wider text-gray-100 text-center"
          style={{
            fontFamily: '"Orbitron", "Share Tech Mono", "Rajdhani", monospace',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f97316 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          BEATSHOP
        </h1>
      </div>

      {/* Sample Library Header with View Mode Toggle */}
      <div className="p-4 border-b-2 border-gray-900/50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Sample Library</h2>
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-1 mb-3 bg-gray-900/50 rounded-lg p-1">
          <button
            onClick={() => setViewMode('library')}
            className={`flex-1 px-3 py-1.5 rounded text-xs font-bold transition-all ${
              viewMode === 'library'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Library
          </button>
          <button
            onClick={() => setViewMode('folders')}
            className={`flex-1 px-3 py-1.5 rounded text-xs font-bold transition-all ${
              viewMode === 'folders'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            My Folders {userFolders.length > 0 && `(${userFolders.length})`}
          </button>
        </div>

        {/* Add Folder Button */}
        <input
          ref={folderInputRef}
          type="file"
          // @ts-ignore - webkitdirectory is a non-standard attribute
          webkitdirectory=""
          multiple
          onChange={handleFolderSelect}
          className="hidden"
        />
        <button
          onClick={() => folderInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white text-sm font-bold transition-all shadow-lg mb-3"
        >
          <FolderPlus size={16} />
          Add Folder
        </button>

        {/* Category Filter - only show in library mode */}
        {viewMode === 'library' && (
          <div className="space-y-1">
            {categories.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all font-semibold ${
                    selectedCategory === cat.id
                      ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg'
                      : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                  }`}
                >
                  <Icon size={16} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {viewMode === 'library' ? (
          /* Sample List - Library Mode */
          <div className="space-y-2">
            {filteredSamples.map(sample => (
              <div
                key={sample.id}
                draggable
                onDragStart={(e) => handleDragStart(e, sample)}
                onDragEnd={handleDragEnd}
                className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 hover:from-gray-700/80 hover:to-gray-800/80 rounded-lg p-3 cursor-move transition-all border border-gray-700/50 hover:border-purple-500/70 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => previewSample(sample)}
                  >
                    <div className="text-sm font-medium text-gray-200 hover:text-purple-400 transition-colors">{sample.name}</div>
                    <div className="text-xs text-gray-500 uppercase font-semibold">{sample.category}</div>
                  </div>
                  <button
                    onClick={() => previewSample(sample)}
                    className="px-3 py-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 rounded text-xs font-bold text-white shadow-md transition-all"
                  >
                    Preview
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Folder View Mode */
          <div>
            {userFolders.length === 0 ? (
              <div className="text-center py-8">
                <Folder size={48} className="mx-auto text-gray-600 mb-3" />
                <p className="text-gray-500 text-sm mb-2">No folders added yet</p>
                <p className="text-gray-600 text-xs">
                  Click "Add Folder" to import your sample collection
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {userFolders.map(folder => renderFolder(folder))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="p-4 border-t-2 border-gray-900/50 bg-gradient-to-b from-[#1F1F1F] to-[#1A1A1A]">
        <p className="text-xs text-gray-500">
          💡 Drag samples to pads, sequencer, or click a pad to select
        </p>
      </div>
    </div>
  );
};

export default SampleBrowser;

