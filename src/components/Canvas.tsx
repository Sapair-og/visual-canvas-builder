'use client';

import React, { useState, useEffect } from 'react';
import { useEditor } from '../context/EditorContext';
import CanvasNodeRenderer from './CanvasNodeRenderer';
import { Eye, Save, Code, Laptop, Smartphone, Tablet, Grid, AlertTriangle, CheckCircle, Info, X, Database, Sliders, Terminal, Server, ChevronLeft, ChevronRight } from 'lucide-react';
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
    clipboard
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

      {/* Main Droppable Canvas Viewport */}
      {workspaceMode === 'data-flow' ? (
        <DatabaseSchemaEditor />
      ) : workspaceMode === 'scripting' ? (
        <LogicEditor />
      ) : workspaceMode === 'backend' ? (
        <BackendDeployer />
      ) : (
        <div className="flex-1 overflow-auto p-8 pb-32 flex items-start justify-center bg-slate-950 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] relative">
        
        {/* Floating Text Formatting Toolbar */}
        {!isPreview && isTextOrButton && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-45 bg-slate-900/95 backdrop-blur border border-slate-800 rounded-xl px-4 py-2 shadow-2xl flex items-center gap-3 animate-slide-in select-none text-xs text-slate-300">
            {/* Font Size */}
            <div className="flex items-center gap-2 border-r border-slate-800 pr-3">
              <span className="text-[10px] text-slate-400 font-mono">Size</span>
              <input 
                type="range" 
                min="8" 
                max="72" 
                value={parseInt(selectedNode?.props?.style?.fontSize || '16')}
                onChange={(e) => {
                  const size = `${e.target.value}px`;
                  updateNodeProps(selectedNodeId!, {
                    style: {
                      ...selectedNode?.props?.style,
                      fontSize: size
                    }
                  });
                }}
                className="w-16 accent-blue-500 h-1 bg-slate-850 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-white font-bold font-mono min-w-[28px]">{selectedNode?.props?.style?.fontSize || '16px'}</span>
            </div>

            {/* Bold / Italic */}
            <div className="flex items-center gap-1 border-r border-slate-800 pr-3">
              <button
                onClick={() => {
                  const isBold = selectedNode?.props?.style?.fontWeight === 'bold';
                  updateNodeProps(selectedNodeId!, {
                    style: {
                      ...selectedNode?.props?.style,
                      fontWeight: isBold ? 'normal' : 'bold'
                    }
                  });
                }}
                className={`p-1.5 rounded hover:bg-slate-850 hover:text-white font-bold transition-all text-[11px] ${
                  selectedNode?.props?.style?.fontWeight === 'bold' ? 'text-blue-400 bg-blue-500/10' : ''
                }`}
                title="Bold"
              >
                B
              </button>
              <button
                onClick={() => {
                  const isItalic = selectedNode?.props?.style?.fontStyle === 'italic';
                  updateNodeProps(selectedNodeId!, {
                    style: {
                      ...selectedNode?.props?.style,
                      fontStyle: isItalic ? 'normal' : 'italic'
                    }
                  });
                }}
                className={`p-1.5 rounded hover:bg-slate-850 hover:text-white italic font-serif transition-all text-[11px] ${
                  selectedNode?.props?.style?.fontStyle === 'italic' ? 'text-blue-400 bg-blue-500/10' : ''
                }`}
                title="Italic"
              >
                I
              </button>
            </div>

            {/* Align */}
            <div className="flex items-center gap-1 border-r border-slate-800 pr-3">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => {
                    updateNodeProps(selectedNodeId!, {
                      style: {
                        ...selectedNode?.props?.style,
                        textAlign: align
                      }
                    });
                  }}
                  className={`p-1 px-1.5 rounded hover:bg-slate-850 hover:text-white uppercase text-[9px] font-bold font-mono transition-all ${
                    (selectedNode?.props?.style?.textAlign || 'left') === align ? 'text-blue-400 bg-blue-500/10' : ''
                  }`}
                  title={`Align ${align}`}
                >
                  {align[0]}
                </button>
              ))}
            </div>

            {/* Text Color */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-mono">Color</span>
              <input 
                type="color" 
                value={selectedNode?.props?.style?.textColor || '#ffffff'}
                onChange={(e) => {
                  updateNodeProps(selectedNodeId!, {
                    style: {
                      ...selectedNode?.props?.style,
                      textColor: e.target.value
                    }
                  });
                }}
                className="w-4 h-4 rounded cursor-pointer border border-slate-700 bg-transparent"
                title="Text Color"
              />
            </div>
          </div>
        )}
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
