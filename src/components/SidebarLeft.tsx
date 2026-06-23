'use client';

import React, { useState, useEffect } from 'react';
import { Square, Type, MousePointerSquareDashed, Sparkles, Layout, Eye, EyeOff, Lock, Unlock, Save, Code, Image as ImageIcon, Minus, Heart, Layers, LayoutGrid, Trash2, ArrowUp, ArrowDown, Database, Copy, Scissors, Clipboard } from 'lucide-react';
import { useEditor } from '../context/EditorContext';
import { NodeType, CanvasNode } from '../types/canvas';
import { TEMPLATES } from '../lib/templates';
import Link from 'next/link';

interface LibraryItem {
  type: NodeType;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
}

const LIBRARY_ITEMS: LibraryItem[] = [
  {
    type: 'Container',
    label: 'Box Container',
    description: 'Flexbox layout wrapper',
    icon: Layout,
  },
  {
    type: 'TextBlock',
    label: 'Text Block',
    description: 'Header, paragraph or span',
    icon: Type,
  },
  {
    type: 'Button',
    label: 'Action Button',
    description: 'Interactive button with route link',
    icon: MousePointerSquareDashed,
  },
  {
    type: 'ImageBlock',
    label: 'Image Frame',
    description: 'Responsive media frame',
    icon: ImageIcon,
  },
  {
    type: 'Divider',
    label: 'Divider Line',
    description: 'Horizontal styling rule',
    icon: Minus,
  },
  {
    type: 'Icon',
    label: 'SVG Icon',
    description: 'Customizable visual icon',
    icon: Heart,
  },
];

const SOLID_COLORS = [
  { name: 'Slate', value: '#0f172a' },
  { name: 'Red', value: '#7f1d1d' },
  { name: 'Emerald', value: '#064e3b' },
  { name: 'Blue', value: '#1e3a8a' },
  { name: 'Violet', value: '#4c1d95' },
  { name: 'Fuchsia', value: '#701a75' },
  { name: 'Amber', value: '#78350f' },
  { name: 'Rose', value: '#881337' },
];

const GRADIENTS = [
  { name: 'Sunset Glow', value: 'linear-gradient(to right, #ff7e5f, #feb47b)' },
  { name: 'Emerald Breeze', value: 'linear-gradient(to right, #11998e, #38ef7d)' },
  { name: 'Deep Nebula', value: 'linear-gradient(to right, #6a11cb, #2575fc)' },
  { name: 'Slate Tech', value: 'linear-gradient(to right, #3a7bd5, #3a6073)' },
  { name: 'Cyberpunk', value: 'linear-gradient(to right, #f857a6, #ff5858)' },
  { name: 'Aurora', value: 'linear-gradient(to right, #00c6ff, #0072ff)' },
];

const STOCK_PHOTOS = [
  { name: 'Abstract Art', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80' },
  { name: 'Forest Lake', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=300&q=80' },
  { name: 'Outer Space', url: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=300&q=80' },
  { name: 'Cyber Neon', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=300&q=80' },
  { name: 'Tech Grid', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=300&q=80' },
  { name: 'Minimal Desk', url: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=300&q=80' },
];

export default function SidebarLeft() {
  const { 
    saveProject, 
    project, 
    canvasState, 
    selectedNodeId, 
    selectNode, 
    deleteNode, 
    addTemplate,
    renameNode,
    toggleNodeVisibility,
    toggleNodeLock,
    reorderNode,
    updateNodeProps,
    dbConfig,
    updateDbConfig,
    dbTables,
    leftSidebarCollapsed,
    copyNode,
    cutNode,
    pasteNode,
    clipboard
  } = useEditor();

  if (leftSidebarCollapsed) return null;
  
  const [activeTab, setActiveTab] = useState<'components' | 'layers' | 'templates' | 'media' | 'database'>('components');
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');

  const [selectedProvider, setSelectedProvider] = useState<'supabase' | 'mongodb' | 'firebase'>('supabase');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [mongodbUri, setMongodbUri] = useState('');
  const [firebaseProjectId, setFirebaseProjectId] = useState('');
  const [firebaseApiKey, setFirebaseApiKey] = useState('');
  const [firebaseAuthDomain, setFirebaseAuthDomain] = useState('');

  // Sync state values on dbConfig change
  useEffect(() => {
    if (dbConfig) {
      setSelectedProvider(dbConfig.provider);
      setSupabaseUrl(dbConfig.supabaseUrl || '');
      setSupabaseAnonKey(dbConfig.supabaseAnonKey || '');
      setMongodbUri(dbConfig.mongodbUri || '');
      if (dbConfig.firebaseConfig) {
        setFirebaseProjectId(dbConfig.firebaseConfig.projectId || '');
        setFirebaseApiKey(dbConfig.firebaseConfig.apiKey || '');
        setFirebaseAuthDomain(dbConfig.firebaseConfig.authDomain || '');
      }
    }
  }, [dbConfig]);

  const handleSaveConfig = () => {
    updateDbConfig({
      provider: selectedProvider,
      supabaseUrl: selectedProvider === 'supabase' ? supabaseUrl : undefined,
      supabaseAnonKey: selectedProvider === 'supabase' ? supabaseAnonKey : undefined,
      mongodbUri: selectedProvider === 'mongodb' ? mongodbUri : undefined,
      firebaseConfig: selectedProvider === 'firebase' ? {
        projectId: firebaseProjectId,
        apiKey: firebaseApiKey,
        authDomain: firebaseAuthDomain
      } : undefined
    });
  };

  const findNodeById = (root: any, id: string): any => {
    if (!root) return null;
    if (root.id === id) return root;
    if (root.children) {
      for (const child of root.children) {
        const found = findNodeById(child, id);
        if (found) return found;
      }
    }
    return null;
  };
  
  const selectedNode = selectedNodeId ? findNodeById(canvasState, selectedNodeId) : null;

  const applyPreset = (type: 'color' | 'gradient' | 'photo', val: string) => {
    if (!selectedNodeId || !selectedNode) return;
    
    if (selectedNode.type === 'Container') {
      if (type === 'color') {
        updateNodeProps(selectedNodeId, {
          style: {
            ...selectedNode.props.style,
            backgroundColor: val,
            backgroundImage: '' // Clear gradient/image if color is clicked
          }
        });
      } else if (type === 'gradient' || type === 'photo') {
        updateNodeProps(selectedNodeId, {
          style: {
            ...selectedNode.props.style,
            backgroundColor: 'transparent',
            backgroundImage: val
          }
        });
      }
    } else if (selectedNode.type === 'ImageBlock') {
      if (type === 'photo') {
        updateNodeProps(selectedNodeId, {
          imageUrl: val
        });
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, type: NodeType) => {
    e.dataTransfer.setData('application/react-craft-type', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const startRename = (nodeId: string, currentName: string) => {
    setEditingNodeId(nodeId);
    setRenameValue(currentName);
  };

  const saveRename = (nodeId: string) => {
    if (renameValue.trim()) {
      renameNode(nodeId, renameValue.trim());
    }
    setEditingNodeId(null);
  };

  const renderLayerItem = (node: CanvasNode, depth = 0): React.ReactNode => {
    const isSelected = selectedNodeId === node.id;
    const isRoot = node.id === 'root';
    const isVisible = node.props.visible !== false;
    const isLocked = !!node.props.locked;
    
    // Choose appropriate Lucide icon
    let NodeIcon = Layout;
    if (node.type === 'TextBlock') NodeIcon = Type;
    else if (node.type === 'Button') NodeIcon = MousePointerSquareDashed;
    else if (node.type === 'ImageBlock') NodeIcon = ImageIcon;
    else if (node.type === 'Divider') NodeIcon = Minus;
    else if (node.type === 'Icon') NodeIcon = Heart;

    const displayName = node.props.layerName || (isRoot ? 'Root Canvas' : node.props.text ? `"${node.props.text}"` : node.id);

    return (
      <div key={node.id} className="space-y-0.5">
        <div 
          onClick={() => selectNode(node.id)}
          className={`group/layer flex items-center gap-1.5 py-1 px-2 rounded-lg cursor-pointer transition-all border ${
            isSelected 
              ? 'bg-blue-600/10 border-blue-500/25 text-blue-400 font-medium' 
              : 'hover:bg-slate-900 border-transparent text-slate-400 hover:text-slate-200'
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {/* Photoshop-Style toggles column (Eye and Lock) */}
          <div className="flex items-center gap-0.5 shrink-0 select-none">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNodeVisibility(node.id);
              }}
              className={`p-0.5 hover:text-white rounded hover:bg-slate-800 transition-all ${isVisible ? 'text-slate-400' : 'text-slate-650'}`}
              title={isVisible ? 'Hide Layer' : 'Show Layer'}
            >
              {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNodeLock(node.id);
              }}
              className={`p-0.5 hover:text-white rounded hover:bg-slate-800 transition-all ${isLocked ? 'text-blue-450' : 'text-slate-650'}`}
              title={isLocked ? 'Unlock Layer' : 'Lock Layer'}
            >
              {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            </button>
          </div>

          <NodeIcon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-blue-400' : 'text-slate-500 group-hover/layer:text-slate-400'}`} />
          
          {/* Rename inline input or span display */}
          <div className="flex-1 min-w-0">
            {editingNodeId === node.id ? (
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => saveRename(node.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveRename(node.id);
                  if (e.key === 'Escape') setEditingNodeId(null);
                }}
                autoFocus
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-800 text-white text-[11px] px-1 py-0.5 rounded border border-blue-500 w-full focus:outline-none"
              />
            ) : (
              <span 
                onDoubleClick={() => startRename(node.id, displayName)}
                className="text-[11px] truncate block" 
                title={`${displayName} (Double click to rename)`}
              >
                {displayName}
              </span>
            )}
          </div>
          
          {/* Shift / delete controls on hover (excluding Root Canvas) */}
          {!isRoot && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover/layer:opacity-100 transition-opacity shrink-0 ml-auto">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  copyNode(node.id);
                }}
                className="p-0.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded transition-all"
                title="Copy Layer (Ctrl+C)"
              >
                <Copy className="w-3 h-3" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  cutNode(node.id);
                }}
                className="p-0.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded transition-all"
                title="Cut Layer (Ctrl+X)"
              >
                <Scissors className="w-3 h-3" />
              </button>
              {node.type === 'Container' && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    pasteNode(node.id);
                  }}
                  disabled={!clipboard}
                  className={`p-0.5 rounded transition-all ${clipboard ? 'text-emerald-500 hover:text-emerald-400 hover:bg-slate-80' : 'text-slate-700 cursor-not-allowed opacity-30'}`}
                  title="Paste into Container (Ctrl+V)"
                >
                  <Clipboard className="w-3 h-3" />
                </button>
              )}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  reorderNode(node.id, 'up');
                }}
                className="p-0.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded transition-all"
                title="Bring Forward"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  reorderNode(node.id, 'down');
                }}
                className="p-0.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded transition-all"
                title="Send Backward"
              >
                <ArrowDown className="w-3 h-3" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNode(node.id);
                }}
                className="p-0.5 text-slate-550 hover:text-red-400 hover:bg-slate-800 rounded transition-all"
                title="Delete Layer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
          {isRoot && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover/layer:opacity-100 transition-opacity shrink-0 ml-auto">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  pasteNode(node.id);
                }}
                disabled={!clipboard}
                className={`p-0.5 rounded transition-all ${clipboard ? 'text-emerald-500 hover:text-emerald-400 hover:bg-slate-80' : 'text-slate-700 cursor-not-allowed opacity-30'}`}
                title="Paste into Root (Ctrl+V)"
              >
                <Clipboard className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
        
        {/* Render children in reverse array order to match stacking behavior */}
        {node.children && [...node.children].reverse().map(child => renderLayerItem(child, depth + 1))}
      </div>
    );
  };

  return (
    <aside className="w-66 border-r border-slate-900 bg-slate-950/80 backdrop-blur-lg flex flex-col h-full select-none">
      {/* Top branding / return link */}
      <div className="p-4 border-b border-slate-900 flex items-center justify-between">
        <Link 
          href="/" 
          className="flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-sm bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent tracking-wide">
            Dashboard
          </span>
        </Link>
        
        {/* Quick Save Button */}
        <button
          onClick={saveProject}
          title="Save Project (Ctrl+S)"
          className="p-1.5 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Modern Tabs Navigation */}
      <div className="flex border-b border-slate-900 bg-slate-950/20 p-2 gap-1 overflow-x-auto scrollbar-none shrink-0">
        <button
          onClick={() => setActiveTab('components')}
          className={`flex-1 py-1.5 px-1.5 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all flex flex-col items-center justify-center gap-1.5 shrink-0 border border-transparent ${
            activeTab === 'components'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-650 text-white shadow-md shadow-blue-500/10 border-blue-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
          }`}
        >
          <Layout className="w-3.5 h-3.5" />
          <span>Nodes</span>
        </button>
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex-1 py-1.5 px-1.5 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all flex flex-col items-center justify-center gap-1.5 shrink-0 border border-transparent ${
            activeTab === 'layers'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-650 text-white shadow-md shadow-blue-500/10 border-blue-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Layers</span>
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex-1 py-1.5 px-1.5 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all flex flex-col items-center justify-center gap-1.5 shrink-0 border border-transparent ${
            activeTab === 'templates'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-650 text-white shadow-md shadow-blue-500/10 border-blue-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Layouts</span>
        </button>
        <button
          onClick={() => setActiveTab('media')}
          className={`flex-1 py-1.5 px-1.5 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all flex flex-col items-center justify-center gap-1.5 shrink-0 border border-transparent ${
            activeTab === 'media'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-650 text-white shadow-md shadow-blue-500/10 border-blue-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Media</span>
        </button>
        <button
          onClick={() => setActiveTab('database')}
          className={`flex-1 py-1.5 px-1.5 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all flex flex-col items-center justify-center gap-1.5 shrink-0 border border-transparent ${
            activeTab === 'database'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-650 text-white shadow-md shadow-blue-500/10 border-blue-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>DB</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === 'components' && (
          <div className="p-4 space-y-4">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Component Library
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Drag items onto the canvas or a container.
              </p>
            </div>
            
            <div className="space-y-3">
              {LIBRARY_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.type)}
                    className="group flex items-start gap-3.5 p-3.5 bg-slate-900/30 hover:bg-slate-900/90 border border-slate-900 hover:border-blue-500/25 rounded-2xl cursor-grab active:cursor-grabbing hover:scale-[1.01] hover:shadow-lg shadow-sm hover:shadow-blue-500/5 transition-all duration-250 ease-out"
                  >
                    <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 group-hover:text-blue-450 group-hover:border-blue-500/20 group-hover:shadow-[0_0_10px_rgba(59,130,246,0.15)] transition-all">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">
                        {item.label}
                      </h3>
                      <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'layers' && (
          <div className="p-4 space-y-4">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Layers Outline
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Outline of your design elements tree. Double click to rename.
              </p>
            </div>
            <div className="space-y-1 py-1">
              {canvasState ? renderLayerItem(canvasState) : (
                <p className="text-[11px] text-slate-600 text-center py-4">No canvas elements loaded.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="p-4 space-y-4">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Pre-styled Layouts
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Inject pre-made responsive block layouts.
              </p>
            </div>
            
            <div className="space-y-3 py-1">
              {TEMPLATES.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => addTemplate(tpl)}
                  className="group flex flex-col items-start gap-2 p-4 bg-slate-900/30 hover:bg-slate-900/90 border border-slate-900 hover:border-blue-500/25 rounded-2xl cursor-pointer hover:scale-[1.01] hover:shadow-lg shadow-sm hover:shadow-blue-500/5 transition-all duration-250 ease-out"
                >
                  <div className="flex items-center justify-between w-full">
                    <h3 className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">
                      {tpl.name}
                    </h3>
                    <LayoutGrid className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    {tpl.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'media' && (
          <div className="p-4 space-y-5">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Media & Backgrounds
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Apply presets to the selected Container or Image element.
              </p>
            </div>

            {!selectedNodeId || !selectedNode ? (
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-900 text-center text-[10px] text-slate-500">
                Please select a Container box or Image block on the canvas to apply presets.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Active selection banner */}
                <div className="text-[10px] bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-lg p-2 flex items-center justify-between font-mono">
                  <span>Selected: {selectedNode.type}</span>
                </div>

                {/* Colors Grid */}
                {selectedNode.type === 'Container' && (
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Solid Colors</h3>
                    <div className="grid grid-cols-4 gap-1.5">
                      {SOLID_COLORS.map((c) => (
                        <button
                          key={c.name}
                          onClick={() => applyPreset('color', c.value)}
                          style={{ backgroundColor: c.value }}
                          className="h-8 rounded border border-slate-800 hover:border-white transition-all shadow"
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Gradients Grid */}
                {selectedNode.type === 'Container' && (
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gradients</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {GRADIENTS.map((g) => (
                        <button
                          key={g.name}
                          onClick={() => applyPreset('gradient', g.value)}
                          style={{ backgroundImage: g.value }}
                          className="h-10 rounded-lg border border-slate-800 hover:border-white transition-all text-[8px] text-white font-bold flex items-end p-1 shadow truncate"
                          title={g.name}
                        >
                          <span className="bg-slate-950/60 px-1 py-0.5 rounded backdrop-blur-sm">{g.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stock Photos Grid */}
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stock Images</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {STOCK_PHOTOS.map((ph) => (
                      <button
                        key={ph.name}
                        onClick={() => applyPreset('photo', ph.url)}
                        className="group relative h-14 rounded-lg overflow-hidden border border-slate-800 hover:border-white transition-all"
                        title={ph.name}
                      >
                        <img src={ph.url} alt={ph.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200" />
                        <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-transparent transition-all flex items-end p-1">
                          <span className="bg-slate-950/75 px-1 py-0.5 rounded backdrop-blur-sm text-[8px] text-white truncate max-w-full">{ph.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'database' && (
          <div className="p-4 space-y-4">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Database Connector
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Connect external cloud databases to map UI datasets.
              </p>
            </div>

            {/* Provider Selector */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold text-slate-500">
                Choose Provider
              </label>
              <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-900">
                {(['supabase', 'mongodb', 'firebase'] as const).map((prov) => (
                  <button
                    key={prov}
                    onClick={() => setSelectedProvider(prov)}
                    className={`py-1 text-[9px] uppercase font-bold rounded transition-all ${
                      selectedProvider === prov
                        ? 'bg-slate-800 text-blue-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {prov}
                  </button>
                ))}
              </div>
            </div>

            {/* Connection Inputs */}
            <div className="space-y-3 bg-slate-900/40 p-3 border border-slate-900 rounded-xl">
              {selectedProvider === 'supabase' && (
                <>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-semibold text-slate-500">Supabase API URL</label>
                    <input
                      type="text"
                      placeholder="https://xyz.supabase.co"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-semibold text-slate-500">Anon Public Key</label>
                    <input
                      type="password"
                      placeholder="eyJhbGciOi..."
                      value={supabaseAnonKey}
                      onChange={(e) => setSupabaseAnonKey(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              {selectedProvider === 'mongodb' && (
                <div className="space-y-1">
                  <label className="block text-[9px] font-semibold text-slate-500">MongoDB Connection String</label>
                  <input
                    type="password"
                    placeholder="mongodb+srv://..."
                    value={mongodbUri}
                    onChange={(e) => setMongodbUri(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {selectedProvider === 'firebase' && (
                <>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-semibold text-slate-500">Project ID</label>
                    <input
                      type="text"
                      placeholder="my-firebase-app"
                      value={firebaseProjectId}
                      onChange={(e) => setFirebaseProjectId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-semibold text-slate-500">API Key</label>
                    <input
                      type="password"
                      placeholder="AIzaSy..."
                      value={firebaseApiKey}
                      onChange={(e) => setFirebaseApiKey(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-semibold text-slate-500">Auth Domain</label>
                    <input
                      type="text"
                      placeholder="my-app.firebaseapp.com"
                      value={firebaseAuthDomain}
                      onChange={(e) => setFirebaseAuthDomain(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              <button
                onClick={handleSaveConfig}
                className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] rounded-lg shadow transition-all cursor-pointer"
              >
                Save DB Connection
              </button>
            </div>

            {/* Configured DB Banner */}
            {dbConfig && (
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Connected: <strong className="uppercase text-blue-450">{dbConfig.provider}</strong></span>
                </div>
              </div>
            )}

            {/* Tables Directory */}
            {dbConfig && (
              <div className="space-y-2.5 pt-2 border-t border-slate-900">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Schema Tables</h3>
                {dbTables.length === 0 ? (
                  <p className="text-[10px] text-slate-600 italic">No tables created yet. Switch to Database Flow view to add tables.</p>
                ) : (
                  <div className="space-y-1.5">
                    {dbTables.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-2 bg-slate-900/60 border border-slate-900 rounded-lg text-xs">
                        <div className="flex items-center gap-1.5 text-slate-350">
                          <Database className="w-3.5 h-3.5 text-slate-500" />
                          <span className="font-mono text-[11px] text-white">{t.name}</span>
                        </div>
                        <span className="text-[9px] text-slate-550 font-mono">({t.columns.length} cols)</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer quick links / state */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/50 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>Active Project:</span>
          <span className="font-mono text-slate-400 truncate max-w-[120px]" title={project?.name}>
            {project?.name}
          </span>
        </div>
      </div>
    </aside>
  );
}
