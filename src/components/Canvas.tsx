'use client';

import React, { useState, useEffect } from 'react';
import { useEditor } from '../context/EditorContext';
import CanvasNodeRenderer from './CanvasNodeRenderer';
import { 
  Eye, Save, Code, Laptop, Smartphone, Tablet, Grid, AlertTriangle, CheckCircle, Info, X, 
  Database, Sliders, Terminal, Server, ChevronLeft, ChevronRight, Lock, Unlock, 
  ChevronsUp, ChevronsDown, Trash2, Copy, Scissors, ArrowUp, ArrowDown
} from 'lucide-react';
import ExportModal from './ExportModal';
import DatabaseSchemaEditor from './DatabaseSchemaEditor';
import LogicEditor from './LogicEditor';
import BackendDeployer from './BackendDeployer';

export default function Canvas() {
  const { 
    canvasState, 
    saveProject, 
    project, 
    selectedNodeId, 
    deleteNode, 
    snapToGrid, 
    setSnapToGrid, 
    undo, 
    redo, 
    toasts, 
    removeToast,
    guides,
    addGuide,
    removeGuide,
    isPreview,
    setIsPreview,
    addNode,
    selectNode,
    pages,
    currentPageId,
    changePage,
    addPage,
    deletePage,
    updateNodeProps,
    workspaceMode,
    setWorkspaceMode,
    leftSidebarCollapsed,
    toggleLeftSidebar,
    rightSidebarCollapsed,
    toggleRightSidebar,
    copyNode,
    cutNode,
    pasteNode,
    clipboard,
    toggleNodeLock,
    reorderNode,
    alignNode
  } = useEditor();
  
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [zoom, setZoom] = useState<number>(100);
  const [showCheatsheet, setShowCheatsheet] = useState(false);

  // Helper to find selected node in the canvas tree
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
  const isTextOrButton = selectedNode && (selectedNode.type === 'TextBlock' || selectedNode.type === 'Button');

  const handleZoomIn = () => {
    setZoom(prev => Math.min(200, prev + 25));
  };
  const handleZoomOut = () => {
    setZoom(prev => Math.max(50, prev - 25));
  };

  // Click handler on rulers to create vertical/horizontal guide lines
  const handleTopRulerClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    addGuide('vertical', x);
  };

  const handleLeftRulerClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = Math.round(e.clientY - rect.top);
    addGuide('horizontal', y);
  };

  // Watch for key events (Delete, Undo/Redo, Photoshop tools shortcuts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      // Delete Node
      if (selectedNodeId && selectedNodeId !== 'root' && (e.key === 'Delete' || e.key === 'Backspace')) {
        deleteNode(selectedNodeId);
      }

      // Undo shortcut (Ctrl + Z)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Redo shortcut (Ctrl + Y or Ctrl + Shift + Z)
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        redo();
      }

      // Copy shortcut (Ctrl + C)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        if (selectedNodeId) {
          e.preventDefault();
          copyNode(selectedNodeId);
        }
      }

      // Cut shortcut (Ctrl + X)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
        if (selectedNodeId && selectedNodeId !== 'root') {
          e.preventDefault();
          cutNode(selectedNodeId);
        }
      }

      // Paste shortcut (Ctrl + V)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        pasteNode(selectedNodeId);
      }

      // Photoshop tool shortcuts
      if (e.key.toLowerCase() === 'v') {
        selectNode(null);
      }
      if (e.key.toLowerCase() === 'r') {
        addNode('root', 'Container');
      }
      if (e.key.toLowerCase() === 't') {
        addNode('root', 'TextBlock');
      }
      if (e.key.toLowerCase() === 'b') {
        addNode('root', 'Button');
      }
      if (e.key.toLowerCase() === 'i') {
        addNode('root', 'ImageBlock');
      }
      if (e.key.toLowerCase() === 'h') {
        addNode('root', 'Divider');
      }
      if (e.key.toLowerCase() === 'o') {
        addNode('root', 'Icon');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNodeId, deleteNode, undo, redo, addNode, selectNode, copyNode, cutNode, pasteNode]);

  if (!canvasState) {
    return (
      <div className="flex-1 bg-slate-900 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading visual canvas...</p>
      </div>
    );
  }

  // Get responsive wrapper width based on viewport selection
  const getViewportWidth = () => {
    switch (viewport) {
      case 'mobile':
        return 'max-w-md';
      case 'tablet':
        return 'max-w-2xl';
      default:
        return 'w-full';
    }
  };

  const ticks = Array.from({ length: 15 }, (_, i) => (i + 1) * 100);

  return (
    <div className="flex-1 bg-slate-900 flex flex-col h-full overflow-hidden">
      {/* Editor Toolbar */}
      <div className="h-14 border-b border-slate-950 bg-slate-950/40 backdrop-blur px-6 flex items-center justify-between select-none">
        
        {/* Left: Viewport Toggles & Zoom & Snapping (only in Edit Mode) */}
        <div className="flex items-center gap-4">
          {!isPreview && (
            <>
              {/* Viewports */}
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                <button
                  onClick={() => setViewport('desktop')}
                  className={`p-1.5 rounded-md transition-all ${
                    viewport === 'desktop' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-350'
                  }`}
                  title="Desktop View"
                >
                  <Laptop className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewport('tablet')}
                  className={`p-1.5 rounded-md transition-all ${
                    viewport === 'tablet' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-555 hover:text-slate-350'
                  }`}
                  title="Tablet View"
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewport('mobile')}
                  className={`p-1.5 rounded-md transition-all ${
                    viewport === 'mobile' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-555 hover:text-slate-350'
                  }`}
                  title="Mobile View"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="h-4 w-px bg-slate-900" />

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                  className="p-1 px-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 font-bold transition-all"
                  title="Zoom Out"
                >
                  -
                </button>
                <button
                  onClick={() => setZoom(100)}
                  className="px-1 text-[10px] text-slate-355 hover:text-white font-mono min-w-[32px] text-center"
                  title="Reset Zoom to 100%"
                >
                  {zoom}%
                </button>
                <button
                  onClick={handleZoomIn}
                  disabled={zoom >= 200}
                  className="p-1 px-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 font-bold transition-all"
                  title="Zoom In"
                >
                  +
                </button>
              </div>

              <div className="h-4 w-px bg-slate-900" />

              {/* Snap to Grid Toggle */}
              <button
                onClick={() => setSnapToGrid(!snapToGrid)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  snapToGrid 
                    ? 'bg-blue-600/10 border-blue-500/30 text-blue-400' 
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-350'
                }`}
                title="Snap coordinates on drag & drop"
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Snap Grid</span>
              </button>
            </>
          )}
        </div>

        {/* Center: Workspace Mode Switcher (only in Edit mode) */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-900 text-[10px]">
          {isPreview ? (
            <span className="bg-blue-600/10 border border-blue-500/20 px-3 py-1 rounded-full text-[10px] text-blue-400 font-bold uppercase tracking-wider animate-pulse font-mono">
              Preview Mode
            </span>
          ) : (
            <>
              <button
                onClick={() => setWorkspaceMode('design')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all font-bold border border-transparent ${
                  workspaceMode === 'design' 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-650 text-white shadow-md shadow-blue-500/15 border-blue-500/10' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <Sliders className="w-3 h-3" />
                <span>Design</span>
              </button>
              <button
                onClick={() => setWorkspaceMode('data-flow')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all font-bold border border-transparent ${
                  workspaceMode === 'data-flow' 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-650 text-white shadow-md shadow-blue-500/15 border-blue-500/10' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <Database className="w-3 h-3" />
                <span>Data Schema</span>
              </button>
              <button
                onClick={() => setWorkspaceMode('scripting')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all font-bold border border-transparent ${
                  workspaceMode === 'scripting' 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-650 text-white shadow-md shadow-blue-500/15 border-blue-500/10' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <Terminal className="w-3 h-3" />
                <span>Visual Scripts</span>
              </button>
              <button
                onClick={() => setWorkspaceMode('backend')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all font-bold border border-transparent ${
                  workspaceMode === 'backend' 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-650 text-white shadow-md shadow-blue-500/15 border-blue-500/10' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <Server className="w-3 h-3" />
                <span>Visual Backend</span>
              </button>
            </>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPreview(!isPreview)}
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isPreview 
                ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.35)]' 
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isPreview ? 'Edit Mode' : 'Preview'}</span>
          </button>
          
          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/60 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition-all cursor-pointer"
          >
            <Code className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          <button
            onClick={saveProject}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Pages Tab Bar Sub-Header */}
      {!isPreview && workspaceMode === 'design' && (
        <div className="h-10 border-b border-slate-950 bg-slate-900/40 backdrop-blur px-6 flex items-center justify-between select-none text-[11px]">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-[80%] scrollbar-none">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] mr-1.5">Pages:</span>
            {Object.keys(pages).map((pId) => (
              <div
                key={pId}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer border ${
                  currentPageId === pId 
                    ? 'bg-slate-800 text-blue-400 border-slate-700 font-semibold' 
                    : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-850/50'
                }`}
                onClick={() => changePage(pId)}
              >
                <span className="font-mono">{pId}</span>
                {pId !== 'index' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePage(pId);
                    }}
                    className="p-0.5 rounded hover:bg-red-500/20 hover:text-red-400 text-slate-500 transition-colors"
                    title="Delete Page"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <button
            onClick={() => {
              const pName = prompt('Enter new page route name (e.g. about, contact, pricing):');
              if (pName) {
                addPage(pName);
              }
            }}
            className="flex items-center gap-1 px-3 py-1 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-all text-[11px] font-semibold border border-slate-800"
          >
            <span>+ Add Page</span>
          </button>
        </div>
      )}

      {/* Canva-Style Contextual Sub-Toolbar */}
      {!isPreview && workspaceMode === 'design' && (
        <div className="h-12 border-b border-slate-950 bg-slate-950/60 backdrop-blur px-6 flex items-center justify-between select-none text-xs text-slate-300 z-30 shrink-0 overflow-x-auto overflow-y-hidden scrollbar-none gap-4">
          {/* Left Side: Element Info & Specific Formatting Tools */}
          <div className="flex items-center gap-4 shrink-0">
            {selectedNode && selectedNode.id !== 'root' ? (
              <>
                {/* Element Name Badge */}
                <div className="flex items-center gap-2 font-bold text-white border-r border-slate-900 pr-4">
                  <span>{selectedNode.type}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono">
                    {selectedNode.props.layerName || selectedNode.id}
                  </span>
                </div>

                {/* CONTAINER SPECIFIC TOOLS */}
                {selectedNode.type === 'Container' && (
                  <div className="flex items-center gap-4">
                    {/* Background Color swatch */}
                    <div className="flex items-center gap-2 border-r border-slate-900 pr-4">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Bg Color</span>
                      <input
                        type="color"
                        value={selectedNode.props.style?.backgroundColor || '#1e293b'}
                        onChange={(e) => {
                          updateNodeProps(selectedNode.id, {
                            style: { ...selectedNode.props.style, backgroundColor: e.target.value, backgroundImage: '' }
                          });
                        }}
                        className="w-5 h-5 rounded cursor-pointer border border-slate-800 bg-transparent"
                        title="Choose Background Color"
                      />
                    </div>
                    {/* Flex direction toggle */}
                    <div className="flex items-center gap-1.5 border-r border-slate-900 pr-4">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Layout</span>
                      <button
                        onClick={() => updateNodeProps(selectedNode.id, { style: { ...selectedNode.props.style, flexDirection: 'row' } })}
                        className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer ${
                          selectedNode.props.style?.flexDirection === 'row'
                            ? 'bg-blue-600/10 border border-blue-500/30 text-blue-400'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Row
                      </button>
                      <button
                        onClick={() => updateNodeProps(selectedNode.id, { style: { ...selectedNode.props.style, flexDirection: 'column' } })}
                        className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer ${
                          (selectedNode.props.style?.flexDirection || 'column') === 'column'
                            ? 'bg-blue-600/10 border border-blue-500/30 text-blue-400'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Column
                      </button>
                    </div>
                    {/* Gap Input */}
                    <div className="flex items-center gap-2 border-r border-slate-900 pr-4">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Gap</span>
                      <input
                        type="number"
                        value={parseInt(selectedNode.props.style?.gap || '0')}
                        onChange={(e) => updateNodeProps(selectedNode.id, { style: { ...selectedNode.props.style, gap: `${e.target.value}px` } })}
                        className="w-12 px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500 font-mono"
                        min={0}
                      />
                      <span className="text-[9px] text-slate-500 font-mono">px</span>
                    </div>
                  </div>
                )}

                {/* TEXTBLOCK SPECIFIC TOOLS */}
                {selectedNode.type === 'TextBlock' && (
                  <div className="flex items-center gap-4">
                    {/* Tag Selector */}
                    <div className="flex items-center gap-2 border-r border-slate-900 pr-4">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tag</span>
                      <select
                        value={selectedNode.props.tag || 'p'}
                        onChange={(e) => updateNodeProps(selectedNode.id, { tag: e.target.value as any })}
                        className="bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-slate-200 text-[10px] focus:outline-none focus:border-blue-500 font-bold uppercase cursor-pointer"
                      >
                        {['h1', 'h2', 'h3', 'p', 'span'].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    {/* Font Size slider */}
                    <div className="flex items-center gap-2 border-r border-slate-900 pr-4">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Size</span>
                      <input
                        type="range"
                        min="8"
                        max="72"
                        value={parseInt(selectedNode.props.style?.fontSize || '16')}
                        onChange={(e) => updateNodeProps(selectedNode.id, { style: { ...selectedNode.props.style, fontSize: `${e.target.value}px` } })}
                        className="w-16 accent-blue-500 h-1 bg-slate-850 rounded-lg cursor-pointer"
                      />
                      <span className="font-bold text-white font-mono text-[10px] min-w-[28px]">{selectedNode.props.style?.fontSize || '16px'}</span>
                    </div>
                    {/* Weight and Style */}
                    <div className="flex items-center gap-1 border-r border-slate-900 pr-4">
                      <button
                        onClick={() => updateNodeProps(selectedNode.id, { style: { ...selectedNode.props.style, fontWeight: selectedNode.props.style?.fontWeight === 'bold' ? 'normal' : 'bold' } })}
                        className={`p-1.5 rounded-lg border transition-all text-[10px] font-bold cursor-pointer ${
                          selectedNode.props.style?.fontWeight === 'bold'
                            ? 'bg-blue-600/10 border-blue-500/30 text-blue-400'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                        title="Bold"
                      >
                        B
                      </button>
                      <button
                        onClick={() => updateNodeProps(selectedNode.id, { style: { ...selectedNode.props.style, fontStyle: selectedNode.props.style?.fontStyle === 'italic' ? 'normal' : 'italic' } })}
                        className={`p-1.5 rounded-lg border transition-all text-[10px] italic font-serif cursor-pointer ${
                          selectedNode.props.style?.fontStyle === 'italic'
                            ? 'bg-blue-600/10 border-blue-500/30 text-blue-400'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                        title="Italic"
                      >
                        I
                      </button>
                    </div>
                    {/* Alignment */}
                    <div className="flex items-center gap-1 border-r border-slate-900 pr-4">
                      {(['left', 'center', 'right', 'justify'] as const).map(align => (
                        <button
                          key={align}
                          onClick={() => updateNodeProps(selectedNode.id, { style: { ...selectedNode.props.style, textAlign: align } })}
                          className={`p-1 px-1.5 rounded-lg border text-[9px] font-bold uppercase transition-all cursor-pointer ${
                            (selectedNode.props.style?.textAlign || 'left') === align
                              ? 'bg-blue-600/10 border-blue-500/30 text-blue-400'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                          title={`Align ${align}`}
                        >
                          {align[0]}
                        </button>
                      ))}
                    </div>
                    {/* Text Color */}
                    <div className="flex items-center gap-2 border-r border-slate-900 pr-4">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Color</span>
                      <input
                        type="color"
                        value={selectedNode.props.style?.textColor || '#ffffff'}
                        onChange={(e) => updateNodeProps(selectedNode.id, { style: { ...selectedNode.props.style, textColor: e.target.value } })}
                        className="w-5 h-5 rounded cursor-pointer border border-slate-800 bg-transparent"
                      />
                    </div>
                  </div>
                )}

                {/* BUTTON SPECIFIC TOOLS */}
                {selectedNode.type === 'Button' && (
                  <div className="flex items-center gap-4">
                    {/* Button label */}
                    <div className="flex items-center gap-2 border-r border-slate-900 pr-4">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Label</span>
                      <input
                        type="text"
                        value={selectedNode.props.text || ''}
                        onChange={(e) => updateNodeProps(selectedNode.id, { text: e.target.value })}
                        className="w-24 px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    {/* Button Link */}
                    <div className="flex items-center gap-2 border-r border-slate-900 pr-4">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Link</span>
                      <input
                        type="text"
                        placeholder="#"
                        value={selectedNode.props.linkTo || ''}
                        onChange={(e) => updateNodeProps(selectedNode.id, { linkTo: e.target.value })}
                        className="w-24 px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                    {/* Background color */}
                    <div className="flex items-center gap-2 border-r border-slate-900 pr-4">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Bg Color</span>
                      <input
                        type="color"
                        value={selectedNode.props.style?.backgroundColor || '#3b82f6'}
                        onChange={(e) => updateNodeProps(selectedNode.id, { style: { ...selectedNode.props.style, backgroundColor: e.target.value } })}
                        className="w-5 h-5 rounded cursor-pointer border border-slate-800 bg-transparent"
                      />
                    </div>
                    {/* Text Color */}
                    <div className="flex items-center gap-2 border-r border-slate-900 pr-4">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Text Color</span>
                      <input
                        type="color"
                        value={selectedNode.props.style?.textColor || '#ffffff'}
                        onChange={(e) => updateNodeProps(selectedNode.id, { style: { ...selectedNode.props.style, textColor: e.target.value } })}
                        className="w-5 h-5 rounded cursor-pointer border border-slate-800 bg-transparent"
                      />
                    </div>
                  </div>
                )}

                {/* IMAGEBLOCK SPECIFIC TOOLS */}
                {selectedNode.type === 'ImageBlock' && (
                  <div className="flex items-center gap-4">
                    {/* Image URL */}
                    <div className="flex items-center gap-2 border-r border-slate-900 pr-4">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">URL</span>
                      <input
                        type="text"
                        placeholder="Source URL"
                        value={selectedNode.props.imageUrl || ''}
                        onChange={(e) => updateNodeProps(selectedNode.id, { imageUrl: e.target.value })}
                        className="w-40 px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                    {/* Image Alt */}
                    <div className="flex items-center gap-2 border-r border-slate-900 pr-4">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Alt</span>
                      <input
                        type="text"
                        placeholder="SEO Alternate description"
                        value={selectedNode.props.imageAlt || ''}
                        onChange={(e) => updateNodeProps(selectedNode.id, { imageAlt: e.target.value })}
                        className="w-28 px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* DIVIDER SPECIFIC TOOLS */}
                {selectedNode.type === 'Divider' && (
                  <div className="flex items-center gap-4">
                    {/* Thickness */}
                    <div className="flex items-center gap-2 border-r border-slate-900 pr-4">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Thickness</span>
                      <input
                        type="number"
                        value={parseInt(selectedNode.props.style?.height || '2')}
                        onChange={(e) => updateNodeProps(selectedNode.id, { style: { ...selectedNode.props.style, height: `${e.target.value}px` } })}
                        className="w-12 px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500 font-mono"
                        min={1}
                      />
                    </div>
                    {/* Color */}
                    <div className="flex items-center gap-2 border-r border-slate-900 pr-4">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Color</span>
                      <input
                        type="color"
                        value={selectedNode.props.style?.backgroundColor || '#334155'}
                        onChange={(e) => updateNodeProps(selectedNode.id, { style: { ...selectedNode.props.style, backgroundColor: e.target.value } })}
                        className="w-5 h-5 rounded cursor-pointer border border-slate-800 bg-transparent"
                      />
                    </div>
                  </div>
                )}

                {/* ICON SPECIFIC TOOLS */}
                {selectedNode.type === 'Icon' && (
                  <div className="flex items-center gap-4">
                    {/* Selector */}
                    <div className="flex items-center gap-2 border-r border-slate-900 pr-4">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Icon</span>
                      <select
                        value={selectedNode.props.iconName || 'Star'}
                        onChange={(e) => updateNodeProps(selectedNode.id, { iconName: e.target.value as any })}
                        className="bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-slate-200 text-[10px] focus:outline-none focus:border-blue-500 font-bold cursor-pointer"
                      >
                        {['Sparkles', 'Mail', 'Lock', 'Settings', 'Eye', 'Heart', 'Star', 'Search', 'Home', 'User', 'Phone', 'Menu'].map(i => (
                          <option key={i} value={i}>{i}</option>
                        ))}
                      </select>
                    </div>
                    {/* Color */}
                    <div className="flex items-center gap-2 border-r border-slate-900 pr-4">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Color</span>
                      <input
                        type="color"
                        value={selectedNode.props.style?.textColor || '#eab308'}
                        onChange={(e) => updateNodeProps(selectedNode.id, { style: { ...selectedNode.props.style, textColor: e.target.value } })}
                        className="w-5 h-5 rounded cursor-pointer border border-slate-800 bg-transparent"
                      />
                    </div>
                  </div>
                )}

                {/* Stacking layerNo rank (common for all elements except root) */}
                <div className="flex items-center gap-2 border-r border-slate-900 pr-4">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Layer Rank</span>
                  <input
                    type="number"
                    value={selectedNode.props.layerNo !== undefined ? selectedNode.props.layerNo : 1}
                    onChange={(e) => updateNodeProps(selectedNode.id, { layerNo: parseInt(e.target.value) || 1 })}
                    className="w-12 px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none font-mono focus:border-blue-500"
                    min={1}
                  />
                </div>
              </>
            ) : (
              <>
                {/* ROOT CANVAS TOOLS */}
                <div className="flex items-center gap-2 font-bold text-white border-r border-slate-900 pr-4">
                  <span>Page Settings</span>
                </div>
                {/* Canvas Width */}
                <div className="flex items-center gap-2 border-r border-slate-900 pr-4">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Width</span>
                  <input
                    type="number"
                    value={parseInt(canvasState.props.style?.width || '800')}
                    onChange={(e) => updateNodeProps('root', { style: { ...canvasState.props.style, width: `${e.target.value}px` } })}
                    className="w-16 px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none font-mono focus:border-blue-500"
                    min={300}
                  />
                  <span className="text-[9px] text-slate-550 font-mono">px</span>
                </div>
                {/* Canvas Height */}
                <div className="flex items-center gap-2 border-r border-slate-900 pr-4">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Height</span>
                  <input
                    type="number"
                    value={parseInt(canvasState.props.style?.height || '600')}
                    onChange={(e) => updateNodeProps('root', { style: { ...canvasState.props.style, height: `${e.target.value}px` } })}
                    className="w-16 px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none font-mono focus:border-blue-500"
                    min={300}
                  />
                  <span className="text-[9px] text-slate-550 font-mono">px</span>
                </div>
                {/* Page Background */}
                <div className="flex items-center gap-2 border-r border-slate-900 pr-4">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Page Color</span>
                  <input
                    type="color"
                    value={canvasState.props.style?.backgroundColor || '#0f172a'}
                    onChange={(e) => updateNodeProps('root', { style: { ...canvasState.props.style, backgroundColor: e.target.value } })}
                    className="w-5 h-5 rounded cursor-pointer border border-slate-800 bg-transparent"
                  />
                </div>
                {/* Clear guidelines */}
                {guides.length > 0 && (
                  <button
                    onClick={() => {
                      guides.forEach(g => removeGuide(g.id));
                    }}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-855 text-slate-400 hover:text-white rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer"
                  >
                    Clear Guides
                  </button>
                )}
              </>
            )}
          </div>

          {/* Right Side: Common Align/Stacking/Delete Tools */}
          {selectedNode && selectedNode.id !== 'root' && (
            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              {/* Lock Toggle */}
              <button
                onClick={() => toggleNodeLock(selectedNode.id)}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  selectedNode.props.locked
                    ? 'bg-blue-600/10 border-blue-500/30 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
                title={selectedNode.props.locked ? 'Unlock Element' : 'Lock Element'}
              >
                {selectedNode.props.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              </button>

              <div className="h-4 w-px bg-slate-900 mx-1" />

              {/* Order Depth */}
              <button
                onClick={() => reorderNode(selectedNode.id, 'front')}
                className="p-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
                title="Bring to Front"
              >
                <ChevronsUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => reorderNode(selectedNode.id, 'up')}
                className="p-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
                title="Bring Forward"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => reorderNode(selectedNode.id, 'down')}
                className="p-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
                title="Send Backward"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => reorderNode(selectedNode.id, 'back')}
                className="p-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
                title="Send to Back"
              >
                <ChevronsDown className="w-3.5 h-3.5" />
              </button>

              <div className="h-4 w-px bg-slate-900 mx-1" />

              {/* Alignments */}
              {(['left', 'center', 'right', 'top', 'middle', 'bottom'] as const).map(align => (
                <button
                  key={align}
                  onClick={() => alignNode(selectedNode.id, align)}
                  className="p-1 px-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg text-[9px] font-bold uppercase transition-all font-mono cursor-pointer"
                  title={`Align Layer ${align}`}
                >
                  {align === 'middle' ? 'MID' : align.slice(0, 3)}
                </button>
              ))}

              <div className="h-4 w-px bg-slate-900 mx-1" />

              {/* Clipboard Actions */}
              <button
                onClick={() => copyNode(selectedNode.id)}
                className="p-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
                title="Copy Layer (Ctrl+C)"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => cutNode(selectedNode.id)}
                className="p-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
                title="Cut Layer (Ctrl+X)"
              >
                <Scissors className="w-3.5 h-3.5" />
              </button>

              <div className="h-4 w-px bg-slate-900 mx-1" />

              {/* Delete */}
              <button
                onClick={() => deleteNode(selectedNode.id)}
                className="p-1.5 bg-slate-900 border border-slate-800 hover:border-red-500 hover:bg-red-500/10 text-red-500 hover:text-red-400 rounded-lg transition-all cursor-pointer"
                title="Delete Layer (Delete)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Droppable Canvas Viewport */}
      {workspaceMode === 'data-flow' ? (
        <DatabaseSchemaEditor />
      ) : workspaceMode === 'scripting' ? (
        <LogicEditor />
      ) : workspaceMode === 'backend' ? (
        <BackendDeployer />
      ) : (
        <div className="flex-1 overflow-auto p-8 pb-32 flex items-start justify-center bg-slate-950 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] relative">
        <div 
          className={`w-full ${getViewportWidth()} bg-white dark:bg-slate-950 rounded-2xl shadow-[0_24px_70px_rgba(0,0,0,0.55)] border border-slate-800/60 relative pl-6 pt-6 overflow-hidden ${!isPreview ? 'ring-1 ring-blue-500/20 shadow-[0_0_50px_-10px_rgba(59,130,246,0.15)]' : ''}`}
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            transition: 'width 0.3s ease, max-width 0.3s ease',
          }}
        >
          {/* Top Horizontal Ruler */}
          {!isPreview && (
            <div 
              onClick={handleTopRulerClick}
              className="absolute top-0 left-6 right-0 h-6 bg-slate-950 border-b border-slate-900 ruler-x z-20 cursor-crosshair select-none overflow-hidden"
              title="Click to place vertical guideline"
            >
              {ticks.map(t => (
                <span key={t} className="absolute text-[8px] text-slate-500 font-mono" style={{ left: `${t}px`, top: '4px' }}>
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Left Vertical Ruler */}
          {!isPreview && (
            <div 
              onClick={handleLeftRulerClick}
              className="absolute top-6 left-0 bottom-0 w-6 bg-slate-955 border-r border-slate-900 ruler-y z-20 cursor-crosshair select-none overflow-hidden"
              title="Click to place horizontal guideline"
            >
              {ticks.map(t => (
                <span key={t} className="absolute text-[8px] text-slate-500 font-mono origin-center -rotate-90" style={{ top: `${t}px`, left: '2px' }}>
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Top Left Empty Corner block */}
          {!isPreview && (
            <div className="absolute top-0 left-0 w-6 h-6 bg-slate-950 border-r border-b border-slate-900 z-35" />
          )}

          {/* Horizontal and Vertical guides overlay list */}
          {!isPreview && guides.map((g) => {
            if (g.type === 'horizontal') {
              return (
                <div
                  key={g.id}
                  className="absolute left-6 right-0 h-px bg-cyan-400/60 border-t border-dashed border-cyan-400 z-30 pointer-events-auto cursor-ns-resize hover:bg-cyan-300 transition-colors"
                  style={{ top: `${g.value + 24}px` }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    removeGuide(g.id);
                  }}
                  title="Double click to remove guideline"
                />
              );
            } else {
              return (
                <div
                  key={g.id}
                  className="absolute top-6 bottom-0 w-px bg-cyan-400/60 border-l border-dashed border-cyan-400 z-30 pointer-events-auto cursor-ew-resize hover:bg-cyan-300 transition-colors"
                  style={{ left: `${g.value + 24}px` }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    removeGuide(g.id);
                  }}
                  title="Double click to remove guideline"
                />
              );
            }
          })}

          {/* Recursively render CanvasNode tree */}
          <CanvasNodeRenderer node={canvasState} />
        </div>
      </div>
      )}

      {/* Code Export popup dialog */}
      <ExportModal 
        isOpen={isExportOpen} 
        onClose={() => setIsExportOpen(false)} 
        pages={pages} 
        currentPageId={currentPageId}
      />

      {/* Photoshop Keyboard Shortcuts cheatsheet collapsible button */}
      {!isPreview && (
        <div className="fixed bottom-6 left-6 z-40 pointer-events-auto">
          {showCheatsheet ? (
            <div className="bg-slate-905 border border-slate-800 rounded-xl p-4 shadow-2xl text-xs w-60 select-none animate-slide-in text-slate-300 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                <span className="font-bold text-white uppercase tracking-wider text-[10px]">Photoshop Hotkeys</span>
                <button onClick={() => setShowCheatsheet(false)} className="text-slate-500 hover:text-white p-0.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1.5 font-medium">
                <div className="flex justify-between"><span>Select Tool</span><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-white">V</kbd></div>
                <div className="flex justify-between"><span>Create Container</span><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-white">R</kbd></div>
                <div className="flex justify-between"><span>Create Text Block</span><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-white">T</kbd></div>
                <div className="flex justify-between"><span>Create Button</span><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-white">B</kbd></div>
                <div className="flex justify-between"><span>Create Image Frame</span><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-white">I</kbd></div>
                <div className="flex justify-between"><span>Create Divider Line</span><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-white">H</kbd></div>
                <div className="flex justify-between"><span>Create SVG Icon</span><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-white">O</kbd></div>
                <div className="flex justify-between border-t border-slate-800 pt-1.5 mt-1.5 text-slate-400"><span>Copy Element</span><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-white font-mono">Ctrl+C</kbd></div>
                <div className="flex justify-between text-slate-400"><span>Cut Element</span><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-white font-mono">Ctrl+X</kbd></div>
                <div className="flex justify-between text-slate-400"><span>Paste Element</span><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-white font-mono">Ctrl+V</kbd></div>
                <div className="flex justify-between text-slate-400"><span>Undo History</span><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-white font-mono">Ctrl+Z</kbd></div>
                <div className="flex justify-between text-slate-400"><span>Redo History</span><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-white font-mono">Ctrl+Y</kbd></div>
                <div className="flex justify-between text-slate-400"><span>Delete Element</span><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-white font-mono">Del</kbd></div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCheatsheet(true)}
              className="bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xl flex items-center gap-1.5 transition-all"
            >
              <span>⌨️ Hotkeys</span>
            </button>
          )}
        </div>
      )}

      {/* Toast Notifications Overlay */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
        {toasts.map((toast) => {
          let ToastIcon = Info;
          let bgClass = 'bg-slate-900 border-slate-800 text-slate-100';
          let iconColorClass = 'text-blue-400';
          
          if (toast.type === 'success') {
            ToastIcon = CheckCircle;
            bgClass = 'bg-slate-900 border-emerald-500/25 text-slate-150';
            iconColorClass = 'text-emerald-500';
          } else if (toast.type === 'error') {
            ToastIcon = AlertTriangle;
            bgClass = 'bg-slate-900 border-red-500/25 text-slate-150';
            iconColorClass = 'text-red-500';
          }
          
          return (
            <div
              key={toast.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md pointer-events-auto transition-all duration-300 animate-slide-in ${bgClass}`}
            >
              <ToastIcon className={`w-4 h-4 shrink-0 ${iconColorClass}`} />
              <span className="text-xs font-medium">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-auto text-slate-500 hover:text-slate-350 p-0.5 font-sans"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Floating Collapse Sidebars Trigger Tabs */}
      {!isPreview && (
        <>
          {/* Left Collapse Trigger */}
          <button
            onClick={toggleLeftSidebar}
            className={`fixed top-1/2 -translate-y-1/2 z-45 bg-slate-950 border border-slate-800 text-slate-450 hover:text-white rounded-r-lg py-4 px-1.5 flex items-center justify-center hover:bg-slate-900 shadow-2xl transition-all cursor-pointer ${
              leftSidebarCollapsed ? 'left-0' : 'left-64'
            }`}
            style={{ transition: 'left 0.15s ease' }}
            title={leftSidebarCollapsed ? "Expand Left Panel" : "Collapse Left Panel"}
          >
            {leftSidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>

          {/* Right Collapse Trigger */}
          <button
            onClick={toggleRightSidebar}
            className={`fixed top-1/2 -translate-y-1/2 z-45 bg-slate-950 border border-slate-800 text-slate-450 hover:text-white rounded-l-lg py-4 px-1.5 flex items-center justify-center hover:bg-slate-900 shadow-2xl transition-all cursor-pointer ${
              rightSidebarCollapsed ? 'right-0' : 'right-80'
            }`}
            style={{ transition: 'right 0.15s ease' }}
            title={rightSidebarCollapsed ? "Expand Right Panel" : "Collapse Right Panel"}
          >
            {rightSidebarCollapsed ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        </>
      )}
    </div>
  );
}
