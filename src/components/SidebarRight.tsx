'use client';

import React, { useState, useEffect } from 'react';
import { useEditor } from '../context/EditorContext';
import { Trash2, Settings, HelpCircle, Sliders, Type, Link2, Lock, LockOpen, Sparkles, Copy, Scissors, Clipboard, Layers } from 'lucide-react';
import { CanvasNode, ComponentStyles } from '../types/canvas';

export default function SidebarRight() {
  const { 
    selectedNodeId, 
    canvasState, 
    updateNodeProps, 
    deleteNode, 
    alignNode,
    dbTables,
    dbBindings,
    createDataBinding,
    deleteDataBinding,
    rightSidebarCollapsed,
    copyNode,
    cutNode,
    pasteNode,
    clipboard
  } = useEditor();

  if (rightSidebarCollapsed) return null;

  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [selectedColName, setSelectedColName] = useState<string>('');
  const [selectedBindType, setSelectedBindType] = useState<'read' | 'write'>('read');

  // Reset dropdown selections when node selection changes
  useEffect(() => {
    setSelectedTableId('');
    setSelectedColName('');
    setSelectedBindType('read');
  }, [selectedNodeId]);

  // Recursive search to get the currently selected node details
  const findNode = (node: CanvasNode | null, id: string): CanvasNode | null => {
    if (!node) return null;
    if (node.id === id) return node;
    for (const child of node.children) {
      const found = findNode(child, id);
      if (found) return found;
    }
    return null;
  };

  const selectedNode = selectedNodeId ? findNode(canvasState, selectedNodeId) : null;

  const handlePropChange = (key: string, value: any) => {
    if (!selectedNodeId) return;
    updateNodeProps(selectedNodeId, { [key]: value });
  };

  const handleStyleChange = (key: keyof ComponentStyles, value: string) => {
    if (!selectedNodeId || !selectedNode) return;
    const currentStyle = selectedNode.props.style || {};
    updateNodeProps(selectedNodeId, {
      style: {
        ...currentStyle,
        [key]: value === '' ? undefined : value
      }
    });
  };

  if (!selectedNode) {
    return (
      <aside className="w-80 border-l border-slate-900 bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-12 h-12 rounded-full bg-slate-900/80 border border-slate-800 flex items-center justify-center mb-4 text-slate-500">
          <Settings className="w-5 h-5 animate-spin-slow" />
        </div>
        <h3 className="text-xs font-bold text-slate-350">No Element Selected</h3>
        <p className="text-[10px] text-slate-550 max-w-xs mt-1 leading-relaxed">
          Click on any element in the canvas to customize its text, links, sizing, padding, colors, and layout properties.
        </p>
      </aside>
    );
  }

  const styles = selectedNode.props.style || {};

  return (
    <aside className="w-80 border-l border-slate-900 bg-slate-950/80 backdrop-blur-lg flex flex-col h-full overflow-y-auto select-none">
      {/* Header */}
      <div className="p-4 border-b border-slate-900/60 flex items-center justify-between sticky top-0 bg-slate-950/90 backdrop-blur-md z-15">
        <div>
          <span className="text-[10px] font-mono text-blue-450 uppercase tracking-widest font-bold">
            {selectedNode.type} Element
          </span>
          <h2 className="text-xs font-bold text-white truncate max-w-[160px]" title={selectedNode.id}>
            {selectedNode.id}
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Copy Button */}
          <button
            onClick={() => copyNode(selectedNode.id)}
            className="p-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all"
            title="Copy Element (Ctrl+C)"
          >
            <Copy className="w-4 h-4" />
          </button>

          {/* Cut Button */}
          <button
            onClick={() => cutNode(selectedNode.id)}
            disabled={selectedNode.id === 'root'}
            className="p-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            title="Cut Element (Ctrl+X)"
          >
            <Scissors className="w-4 h-4" />
          </button>

          {/* Paste Button */}
          <button
            onClick={() => pasteNode(selectedNode.id)}
            disabled={!clipboard}
            className={`p-1.5 border rounded-lg transition-all ${
              clipboard
                ? 'bg-emerald-950/40 border-emerald-900/35 text-emerald-450 hover:bg-emerald-900/40 hover:text-emerald-400'
                : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed opacity-30'
            }`}
            title="Paste Clipboard Element (Ctrl+V)"
          >
            <Clipboard className="w-4 h-4" />
          </button>

          {/* Lock/Unlock Crop Sizing */}
          <button
            onClick={() => handlePropChange('locked', !selectedNode.props.locked)}
            className={`p-1.5 border rounded-lg transition-all ${
              selectedNode.props.locked
                ? 'bg-orange-950/40 border-orange-900/30 text-orange-400'
                : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
            title={selectedNode.props.locked ? 'Unlock element dimensions' : 'Lock element dimensions (freeze crop handles)'}
          >
            {selectedNode.props.locked ? (
              <Lock className="w-4 h-4" />
            ) : (
              <LockOpen className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={() => deleteNode(selectedNode.id)}
            disabled={selectedNode.id === 'root'}
            className="p-1.5 hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-slate-900 hover:border-red-900/35 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            title="Delete Element"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Layer Rank Settings */}
        {selectedNode.id !== 'root' && (
          <section className="space-y-2 border-b border-slate-900 pb-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-450" />
              <span>Layer Rank (Layout)</span>
            </h3>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={selectedNode.props.layerNo !== undefined ? selectedNode.props.layerNo : 1}
                onChange={(e) => handlePropChange('layerNo', parseInt(e.target.value) || 1)}
                className="w-20 px-3 py-1.5 bg-slate-950 border border-slate-900 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-blue-500 font-mono"
                min={1}
                max={9999}
              />
              <span className="text-[10px] text-slate-500 leading-normal">
                Siblings with the same rank auto-flow without overlap. Higher ranks stack absolute on top.
              </span>
            </div>
          </section>
        )}

        {/* Alignment Actions */}
        {selectedNode.id !== 'root' && (
          <section className="space-y-2 border-b border-slate-900 pb-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-450" />
              <span>Align Layer</span>
            </h3>
            <div className="grid grid-cols-6 gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-900">
              <button
                onClick={() => alignNode(selectedNode.id, 'left')}
                className="p-1 hover:bg-slate-800 text-slate-350 hover:text-white rounded border border-slate-850 text-[9px] font-bold text-center transition-all"
                title="Align Left"
              >
                Left
              </button>
              <button
                onClick={() => alignNode(selectedNode.id, 'center')}
                className="p-1 hover:bg-slate-800 text-slate-350 hover:text-white rounded border border-slate-855 text-[9px] font-bold text-center transition-all"
                title="Align Horizontal Center"
              >
                Center
              </button>
              <button
                onClick={() => alignNode(selectedNode.id, 'right')}
                className="p-1 hover:bg-slate-800 text-slate-350 hover:text-white rounded border border-slate-855 text-[9px] font-bold text-center transition-all"
                title="Align Right"
              >
                Right
              </button>
              <button
                onClick={() => alignNode(selectedNode.id, 'top')}
                className="p-1 hover:bg-slate-800 text-slate-355 hover:text-white rounded border border-slate-855 text-[9px] font-bold text-center transition-all"
                title="Align Top"
              >
                Top
              </button>
              <button
                onClick={() => alignNode(selectedNode.id, 'middle')}
                className="p-1 hover:bg-slate-800 text-slate-355 hover:text-white rounded border border-slate-855 text-[9px] font-bold text-center transition-all"
                title="Align Vertical Center"
              >
                Middle
              </button>
              <button
                onClick={() => alignNode(selectedNode.id, 'bottom')}
                className="p-1 hover:bg-slate-800 text-slate-355 hover:text-white rounded border border-slate-855 text-[9px] font-bold text-center transition-all"
                title="Align Bottom"
              >
                Bottom
              </button>
            </div>
          </section>
        )}

        {/* Data Bindings Inspector (only for Text, Button, and Image elements) */}
        {(selectedNode.type === 'TextBlock' || selectedNode.type === 'Button' || selectedNode.type === 'ImageBlock') && (
          <section className="space-y-4 border-b border-slate-900 pb-4">
            <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-blue-450" />
              <span>Database Binding</span>
            </h3>

            {selectedNode.props.dataBinding ? (
              <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-450 font-mono">Linked Column:</span>
                  <span className="font-mono text-blue-400 font-bold">
                    {dbTables.find(t => t.id === selectedNode.props.dataBinding?.tableId)?.name || 'Table'}.
                    {selectedNode.props.dataBinding.columnName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-455">Binding Type:</span>
                  <span className="bg-slate-800 text-slate-350 px-1.5 py-0.5 rounded font-mono uppercase text-[9px]">
                    {selectedNode.props.dataBinding.bindType}
                  </span>
                </div>
                <button
                  onClick={() => {
                    const binding = dbBindings.find(b => b.nodeId === selectedNode.id);
                    if (binding) {
                      deleteDataBinding(binding.id);
                    } else {
                      updateNodeProps(selectedNode.id, { dataBinding: undefined });
                    }
                  }}
                  className="w-full py-1.5 bg-red-955/20 hover:bg-red-900/30 text-red-400 hover:text-red-300 text-[10px] font-bold rounded-lg border border-red-500/15 transition-all cursor-pointer"
                >
                  Unlink Database
                </button>
              </div>
            ) : (
              <div className="space-y-3 bg-slate-900/40 p-3 rounded-xl border border-slate-900">
                {dbTables.length === 0 ? (
                  <p className="text-[10px] text-slate-500 leading-relaxed italic">
                    No schema tables available. Configure your database connection and create tables first.
                  </p>
                ) : (
                  <>
                    {/* Table Select */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-semibold text-slate-500">Select Table</label>
                      <select
                        value={selectedTableId}
                        onChange={(e) => {
                          setSelectedTableId(e.target.value);
                          const tbl = dbTables.find(t => t.id === e.target.value);
                          if (tbl && tbl.columns.length > 0) {
                            setSelectedColName(tbl.columns[0].name);
                          } else {
                            setSelectedColName('');
                          }
                        }}
                        className="w-full px-2 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Choose Table --</option>
                        {dbTables.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Column Select */}
                    {selectedTableId && (
                      <div className="space-y-1">
                        <label className="block text-[10px] font-semibold text-slate-550">Select Column</label>
                        <select
                          value={selectedColName}
                          onChange={(e) => setSelectedColName(e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                        >
                          {dbTables.find(t => t.id === selectedTableId)?.columns.map(c => (
                            <option key={c.name} value={c.name}>{c.name} ({c.type})</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Binding Type */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-semibold text-slate-555">Binding Type</label>
                      <select
                        value={selectedBindType}
                        onChange={(e) => setSelectedBindType(e.target.value as 'read' | 'write')}
                        className="w-full px-2 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                      >
                        <option value="read">Read Data (Display Value)</option>
                        {selectedNode.type === 'Button' && (
                          <option value="write">Write Data (Form Submit Action)</option>
                        )}
                      </select>
                    </div>

                    <button
                      onClick={() => {
                        if (!selectedTableId || !selectedColName) return;
                        createDataBinding({
                          nodeId: selectedNode.id,
                          tableId: selectedTableId,
                          columnName: selectedColName,
                          bindType: selectedBindType
                        });
                      }}
                      disabled={!selectedTableId || !selectedColName}
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-[11px] rounded-lg shadow transition-all cursor-pointer"
                    >
                      Connect Field
                    </button>
                  </>
                )}
              </div>
            )}
          </section>
        )}

        {/* Core Attributes */}
        <section className="space-y-4">
          <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Attributes</span>
          </h3>

          {/* Text Content (TextBlock & Button) */}
          {(selectedNode.type === 'TextBlock' || selectedNode.type === 'Button') && (
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                Text Content
              </label>
              <input
                type="text"
                value={selectedNode.props.text || ''}
                onChange={(e) => handlePropChange('text', e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {/* Heading Tag Type Selector (TextBlock) */}
          {selectedNode.type === 'TextBlock' && (
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                HTML Heading Tag
              </label>
              <select
                value={selectedNode.props.tag || 'p'}
                onChange={(e) => handlePropChange('tag', e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="h1">Heading 1 (h1)</option>
                <option value="h2">Heading 2 (h2)</option>
                <option value="h3">Heading 3 (h3)</option>
                <option value="p">Paragraph (p)</option>
                <option value="span">Inline Span (span)</option>
              </select>
            </div>
          )}

          {/* Button Link path (Button) */}
          {selectedNode.type === 'Button' && (
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
                <Link2 className="w-3 h-3 text-slate-500" />
                <span>Link To URL / Route</span>
              </label>
              <input
                type="text"
                placeholder="e.g. /signup or https://google.com"
                value={selectedNode.props.linkTo || ''}
                onChange={(e) => handlePropChange('linkTo', e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {/* Image attributes (ImageBlock) */}
          {selectedNode.type === 'ImageBlock' && (
            <>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                  Image Source URL
                </label>
                <input
                  type="text"
                  placeholder="https://example.com/image.png"
                  value={selectedNode.props.imageUrl || ''}
                  onChange={(e) => handlePropChange('imageUrl', e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                  Alt Text (SEO)
                </label>
                <input
                  type="text"
                  placeholder="Description of image"
                  value={selectedNode.props.imageAlt || ''}
                  onChange={(e) => handlePropChange('imageAlt', e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </>
          )}

          {/* Icon attributes (Icon) */}
          {selectedNode.type === 'Icon' && (
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                Icon Selector
              </label>
              <select
                value={selectedNode.props.iconName || 'Star'}
                onChange={(e) => handlePropChange('iconName', e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="Star">Star ⭐</option>
                <option value="Heart">Heart ❤️</option>
                <option value="Sparkles">Sparkles ✨</option>
                <option value="Search">Search 🔍</option>
                <option value="Mail">Mail ✉️</option>
                <option value="Lock">Lock 🔒</option>
                <option value="Settings">Settings ⚙️</option>
                <option value="Home">Home 🏠</option>
                <option value="User">User 👤</option>
                <option value="Phone">Phone 📞</option>
                <option value="Menu">Menu ☰</option>
              </select>
            </div>
          )}
        </section>

        {/* Styling controls (fully active for Phase 3 planning) */}
        <section className="space-y-4 pt-4 border-t border-slate-900">
          <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-slate-500" />
            <span>Styles</span>
          </h3>

          {/* Background Color */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-semibold text-slate-500">
                Background Color
              </label>
              <span className="text-[10px] font-mono text-slate-400">
                {styles.backgroundColor || 'transparent'}
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="color"
                value={styles.backgroundColor && styles.backgroundColor.startsWith('#') ? styles.backgroundColor : '#1e293b'}
                onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                className="w-8 h-8 rounded border border-slate-800 bg-slate-900 cursor-pointer"
              />
              <input
                type="text"
                placeholder="#hex or transparent"
                value={styles.backgroundColor || ''}
                onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                className="flex-1 px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-250 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Text Color */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-semibold text-slate-500">
                Text Color
              </label>
              <span className="text-[10px] font-mono text-slate-400">
                {styles.textColor || 'default'}
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="color"
                value={styles.textColor && styles.textColor.startsWith('#') ? styles.textColor : '#f1f5f9'}
                onChange={(e) => handleStyleChange('textColor', e.target.value)}
                className="w-8 h-8 rounded border border-slate-800 bg-slate-900 cursor-pointer"
              />
              <input
                type="text"
                placeholder="#hex or color name"
                value={styles.textColor || ''}
                onChange={(e) => handleStyleChange('textColor', e.target.value)}
                className="flex-1 px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-250 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Text Alignment (TextBlock) */}
          {selectedNode.type === 'TextBlock' && (
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                Text Alignment
              </label>
              <div className="grid grid-cols-4 gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
                {(['left', 'center', 'right', 'justify'] as const).map((align) => (
                  <button
                    key={align}
                    onClick={() => handleStyleChange('textAlign', align)}
                    className={`py-1 text-[10px] capitalize font-medium rounded transition-all ${
                      styles.textAlign === align
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                Width
              </label>
              <input
                type="text"
                placeholder="e.g. 100% or 250px"
                value={styles.width || ''}
                onChange={(e) => handleStyleChange('width', e.target.value)}
                disabled={selectedNode.props.locked}
                className="w-full px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                Height
              </label>
              <input
                type="text"
                placeholder="e.g. auto or 300px"
                value={styles.height || ''}
                onChange={(e) => handleStyleChange('height', e.target.value)}
                disabled={selectedNode.props.locked}
                className="w-full px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Border Radius */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">
              Border Radius
            </label>
            <input
              type="text"
              placeholder="e.g. 8px or 50%"
              value={styles.borderRadius || ''}
              onChange={(e) => handleStyleChange('borderRadius', e.target.value)}
              className="w-full px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Padding Slider (Simple Quick Modifier) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-semibold text-slate-500">
                Padding
              </label>
              <span className="text-[10px] font-mono text-slate-400">
                {styles.padding || '0px'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="64"
              value={parseInt(styles.padding || '0', 10) || 0}
              onChange={(e) => handleStyleChange('padding', `${e.target.value}px`)}
              className="w-full accent-blue-500 bg-slate-850 rounded-lg appearance-none h-1 cursor-pointer"
            />
          </div>

          {/* Margin Slider (Simple Quick Modifier) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-semibold text-slate-500">
                Margin
              </label>
              <span className="text-[10px] font-mono text-slate-400">
                {styles.margin || '0px'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="64"
              value={parseInt(styles.margin || '0', 10) || 0}
              onChange={(e) => handleStyleChange('margin', `${e.target.value}px`)}
              className="w-full accent-blue-500 bg-slate-850 rounded-lg appearance-none h-1 cursor-pointer"
            />
          </div>
        </section>

        {/* Typography Customization Section */}
        {(selectedNode.type === 'TextBlock' || selectedNode.type === 'Button') && (
          <section className="space-y-4 pt-4 border-t border-slate-900">
            <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-blue-450" />
              <span>Typography</span>
            </h3>

            {/* Font Size slider/text */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-semibold text-slate-500">
                  Font Size
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  {styles.fontSize || '16px'}
                </span>
              </div>
              <input
                type="range"
                min="8"
                max="72"
                value={parseInt(styles.fontSize || '16', 10) || 16}
                onChange={(e) => handleStyleChange('fontSize', `${e.target.value}px`)}
                className="w-full accent-blue-500 bg-slate-850 rounded-lg appearance-none h-1 cursor-pointer"
              />
            </div>

            {/* Font Weight */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                Font Weight
              </label>
              <select
                value={styles.fontWeight || 'normal'}
                onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="normal">Normal</option>
                <option value="medium">Medium</option>
                <option value="semibold">Semibold</option>
                <option value="bold">Bold</option>
                <option value="900">Black (900)</option>
              </select>
            </div>

            {/* Font Style */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                Font Style
              </label>
              <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => handleStyleChange('fontStyle', 'normal')}
                  className={`py-1 text-[10px] font-medium rounded transition-all ${
                    styles.fontStyle !== 'italic'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => handleStyleChange('fontStyle', 'italic')}
                  className={`py-1 text-[10px] font-medium rounded transition-all ${
                    styles.fontStyle === 'italic'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Italic
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Canva Transitions & Hover Animations Section */}
        <section className="space-y-4 pt-4 border-t border-slate-900">
          <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-450" />
            <span>Animations & Hover</span>
          </h3>

          {/* Entrance Animation Preset */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">
              Canva Entrance Transition
            </label>
            <select
              value={selectedNode.props.animation || 'none'}
              onChange={(e) => handlePropChange('animation', e.target.value)}
              className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="none">None (Static)</option>
              <option value="fade">Fade In</option>
              <option value="slide-up">Slide Up</option>
              <option value="zoom-in">Zoom In</option>
              <option value="bounce">Bounce Play</option>
            </select>
          </div>

          {/* Hover Micro-Interactions */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">
              Hover Interaction Style
            </label>
            <select
              value={selectedNode.props.hoverEffect || 'none'}
              onChange={(e) => handlePropChange('hoverEffect', e.target.value)}
              className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="none">None (Static)</option>
              <option value="scale">Scale Up (105%)</option>
              <option value="lift">Lift Up (-6px)</option>
              <option value="glow">Neon Glow Shadow</option>
            </select>
          </div>
        </section>

        {/* Layout details (for Container elements) */}
        {selectedNode.type === 'Container' && (
          <section className="space-y-4 pt-4 border-t border-slate-900">
            <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Flexbox Properties
            </h3>

            {/* Flex Direction */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                Direction
              </label>
              <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
                <button
                  onClick={() => handleStyleChange('flexDirection', 'row')}
                  className={`py-1 text-[10px] font-medium rounded transition-all ${
                    styles.flexDirection === 'row'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-505 hover:text-slate-300'
                  }`}
                >
                  Row (Horizontal)
                </button>
                <button
                  onClick={() => handleStyleChange('flexDirection', 'column')}
                  className={`py-1 text-[10px] font-medium rounded transition-all ${
                    styles.flexDirection === 'column' || !styles.flexDirection
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-505 hover:text-slate-300'
                  }`}
                >
                  Column (Vertical)
                </button>
              </div>
            </div>

            {/* Gap */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-semibold text-slate-500">
                  Gap Spacing
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  {styles.gap || '0px'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="48"
                value={parseInt(styles.gap || '0', 10) || 0}
                onChange={(e) => handleStyleChange('gap', `${e.target.value}px`)}
                className="w-full accent-blue-500 bg-slate-850 rounded-lg appearance-none h-1 cursor-pointer"
              />
            </div>
          </section>
        )}
      </div>
    </aside>
  );
}
