'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useEditor } from '../context/EditorContext';
import { DatabaseTable, DatabaseColumn, DatabaseFieldType } from '../types/database';
import { Database, Plus, Trash2, Key, Link2, Settings, ArrowRight, Save, Layout, Type, MousePointerSquareDashed, ImageIcon } from 'lucide-react';
import { CanvasNode } from '../types/canvas';

export default function DatabaseSchemaEditor() {
  const {
    dbConfig,
    dbTables,
    addDbTable,
    updateDbTable,
    deleteDbTable,
    dbBindings,
    createDataBinding,
    deleteDataBinding,
    canvasState
  } = useEditor();

  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Drag-and-drop table positions state
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // State to track active connection drawing
  const [activeConnectionSource, setActiveConnectionSource] = useState<{ tableId: string; columnName: string } | null>(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  // Local coordinates refresh trigger state
  const [, setRefreshCount] = useState(0);

  // Trigger coordinate recalculations when tables drag or bindings load
  useEffect(() => {
    const handleResize = () => setRefreshCount(prev => prev + 1);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTableDragStart = (e: React.MouseEvent, tableId: string, currentX: number, currentY: number) => {
    e.stopPropagation();
    setDraggingTableId(tableId);
    setDragOffset({
      x: e.clientX - currentX,
      y: e.clientY - currentY
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingTableId) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      updateDbTable(draggingTableId, { x: Math.max(0, newX), y: Math.max(0, newY) });
      setRefreshCount(prev => prev + 1);
    }

    if (activeConnectionSource && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setCursorPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseUp = () => {
    setDraggingTableId(null);
    setActiveConnectionSource(null);
  };

  const handleConnectStart = (e: React.MouseEvent, tableId: string, columnName: string) => {
    e.stopPropagation();
    setActiveConnectionSource({ tableId, columnName });
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setCursorPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleConnectEnd = (nodeId: string, bindType: 'read' | 'write') => {
    if (activeConnectionSource) {
      createDataBinding({
        nodeId,
        tableId: activeConnectionSource.tableId,
        columnName: activeConnectionSource.columnName,
        bindType
      });
      setActiveConnectionSource(null);
    }
  };

  const handleAddTable = () => {
    if (!dbConfig) return;
    const tableId = `table-${Math.random().toString(36).substring(2, 9)}`;
    const newTable: DatabaseTable = {
      id: tableId,
      name: `users_table`,
      provider: dbConfig.provider,
      columns: [
        { name: 'id', type: 'number', primaryKey: true, nullable: false },
        { name: 'name', type: 'string', nullable: true },
        { name: 'email', type: 'string', nullable: true }
      ],
      x: 100 + dbTables.length * 60,
      y: 100 + dbTables.length * 40
    };
    addDbTable(newTable);
    setRefreshCount(prev => prev + 1);
  };

  const handleAddColumn = (tableId: string) => {
    const table = dbTables.find(t => t.id === tableId);
    if (!table) return;
    const newColName = `col_${table.columns.length + 1}`;
    const updatedCols = [...table.columns, { name: newColName, type: 'string' as DatabaseFieldType }];
    updateDbTable(tableId, { columns: updatedCols });
    setTimeout(() => setRefreshCount(prev => prev + 1), 50);
  };

  const handleUpdateColumn = (tableId: string, colIndex: number, updates: Partial<DatabaseColumn>) => {
    const table = dbTables.find(t => t.id === tableId);
    if (!table) return;
    const updatedCols = table.columns.map((c, idx) => idx === colIndex ? { ...c, ...updates } : c);
    updateDbTable(tableId, { columns: updatedCols });
  };

  const handleDeleteColumn = (tableId: string, colIndex: number) => {
    const table = dbTables.find(t => t.id === tableId);
    if (!table) return;
    const updatedCols = table.columns.filter((_, idx) => idx !== colIndex);
    updateDbTable(tableId, { columns: updatedCols });
  };

  // Helper to extract UI elements
  const getBindableNodes = (node: CanvasNode): CanvasNode[] => {
    const list: CanvasNode[] = [];
    const traverse = (n: CanvasNode) => {
      if (n.type === 'TextBlock' || n.type === 'Button' || n.type === 'ImageBlock') {
        list.push(n);
      }
      if (n.children) {
        n.children.forEach(traverse);
      }
    };
    if (node) traverse(node);
    return list;
  };

  const bindableNodes = canvasState ? getBindableNodes(canvasState) : [];

  // Helper to measure element coordinates inside the canvas space
  const getCoordinates = (id: string) => {
    const el = document.getElementById(id);
    const canvasEl = canvasRef.current;
    if (!el || !canvasEl) return null;
    
    const rect = el.getBoundingClientRect();
    const canvasRect = canvasEl.getBoundingClientRect();
    
    return {
      x: rect.left - canvasRect.left + rect.width / 2,
      y: rect.top - canvasRect.top + rect.height / 2
    };
  };

  return (
    <div 
      className="flex-1 flex bg-slate-950 text-slate-100 overflow-hidden select-none relative"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Visual Flow Canvas Area */}
      <div 
        ref={canvasRef}
        className="flex-1 overflow-auto bg-slate-950 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] relative p-8"
      >
        <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
          <button
            onClick={handleAddTable}
            disabled={!dbConfig}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create DB Table</span>
          </button>
          {!dbConfig && (
            <span className="text-[10px] text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
              ⚠️ Please configure a DB connection in the left sidebar first.
            </span>
          )}
        </div>

        {/* Database Node Cards */}
        {dbTables.map((table) => (
          <div
            key={table.id}
            style={{ left: `${table.x}px`, top: `${table.y}px`, zIndex: draggingTableId === table.id ? 50 : 20 }}
            className="absolute w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col z-20"
          >
            {/* Table Header (Draggable) */}
            <div
              onMouseDown={(e) => handleTableDragStart(e, table.id, table.x, table.y)}
              className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between cursor-move"
            >
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" />
                <input
                  type="text"
                  value={table.name}
                  onChange={(e) => updateDbTable(table.id, { name: e.target.value })}
                  className="bg-transparent border-b border-transparent hover:border-slate-800 focus:border-blue-500 focus:outline-none text-xs font-bold text-white w-32"
                />
              </div>
              <button
                onClick={() => deleteDbTable(table.id)}
                className="p-1 hover:bg-red-500/10 rounded text-slate-500 hover:text-red-400 transition-colors"
                title="Delete Table"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Table Schema Columns List */}
            <div className="p-3 space-y-2 max-h-60 overflow-y-auto">
              {table.columns.map((col, idx) => (
                <div key={idx} className="flex items-center gap-1.5 justify-between text-xs bg-slate-950/40 p-1.5 rounded border border-slate-950 relative group/col">
                  <div className="flex items-center gap-1">
                    {col.primaryKey && <Key className="w-3 h-3 text-amber-500 shrink-0" />}
                    <input
                      type="text"
                      value={col.name}
                      onChange={(e) => handleUpdateColumn(table.id, idx, { name: e.target.value })}
                      className="bg-transparent border-b border-transparent hover:border-slate-800 focus:border-blue-500 focus:outline-none text-[11px] font-mono text-slate-300 w-16"
                    />
                  </div>

                  <select
                    value={col.type}
                    onChange={(e) => handleUpdateColumn(table.id, idx, { type: e.target.value as DatabaseFieldType })}
                    className="bg-slate-900 border border-slate-800 rounded px-1 text-[10px] text-slate-400 focus:outline-none w-16"
                  >
                    <option value="string">str</option>
                    <option value="number">num</option>
                    <option value="boolean">bool</option>
                    <option value="date">date</option>
                  </select>

                  <button
                    onClick={() => handleDeleteColumn(table.id, idx)}
                    className="p-0.5 hover:bg-slate-800 text-slate-600 hover:text-red-400 rounded shrink-0 opacity-0 group-hover/col:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>

                  {/* Field Connection Handle (Dot) */}
                  <div
                    id={`handle-${table.id}-${col.name}`}
                    onMouseDown={(e) => handleConnectStart(e, table.id, col.name)}
                    className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500 hover:scale-150 border border-slate-900 cursor-crosshair z-30 transition-all"
                    title="Drag connection to UI elements"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={() => handleAddColumn(table.id)}
              className="py-1.5 px-3 bg-slate-950 hover:bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Column</span>
            </button>
          </div>
        ))}

        {/* Connection Drawing SVG Overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
            </marker>
          </defs>

          {/* Persistent Connection bezier lines */}
          {dbBindings.map((binding) => {
            const sourceId = `handle-${binding.tableId}-${binding.columnName}`;
            const targetId = `target-${binding.nodeId}-${binding.bindType}`;
            
            const sourceCoords = getCoordinates(sourceId);
            const targetCoords = getCoordinates(targetId);
            
            if (!sourceCoords || !targetCoords) return null;
            
            const dx = Math.abs(targetCoords.x - sourceCoords.x) * 0.4;
            const pathData = `M ${sourceCoords.x} ${sourceCoords.y} C ${sourceCoords.x + dx} ${sourceCoords.y}, ${targetCoords.x - dx} ${targetCoords.y}, ${targetCoords.x} ${targetCoords.y}`;
            
            return (
              <g key={binding.id}>
                <path
                  d={pathData}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  className="opacity-80"
                  markerEnd="url(#arrow)"
                />
                <circle cx={sourceCoords.x} cy={sourceCoords.y} r="3" fill="#3b82f6" />
                <circle cx={targetCoords.x} cy={targetCoords.y} r="3" fill="#3b82f6" />
                
                {/* Delete binding trigger button */}
                <foreignObject
                  x={(sourceCoords.x + targetCoords.x) / 2 - 8}
                  y={(sourceCoords.y + targetCoords.y) / 2 - 8}
                  width="16"
                  height="16"
                  className="pointer-events-auto"
                >
                  <button
                    onClick={() => deleteDataBinding(binding.id)}
                    className="w-4 h-4 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] shadow border border-slate-900 transition-all font-bold cursor-pointer"
                    title="Remove connection"
                  >
                    ×
                  </button>
                </foreignObject>
              </g>
            );
          })}

          {/* Active Drawing Line */}
          {activeConnectionSource && (
            (() => {
              const sourceId = `handle-${activeConnectionSource.tableId}-${activeConnectionSource.columnName}`;
              const sourceCoords = getCoordinates(sourceId);
              if (!sourceCoords) return null;
              
              const dx = Math.abs(cursorPosition.x - sourceCoords.x) * 0.4;
              const pathData = `M ${sourceCoords.x} ${sourceCoords.y} C ${sourceCoords.x + dx} ${sourceCoords.y}, ${cursorPosition.x - dx} ${cursorPosition.y}, ${cursorPosition.x} ${cursorPosition.y}`;
              
              return (
                <path
                  d={pathData}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeDasharray="5,5"
                  className="animate-pulse"
                />
              );
            })()
          )}
        </svg>
      </div>

      {/* Right panel: UI Element target mapping connections list */}
      <div className="w-80 border-l border-slate-900 bg-slate-950 flex flex-col h-full overflow-y-auto select-none p-4 space-y-6">
        <div>
          <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest font-bold">
            Website Binding Mapper
          </span>
          <h2 className="text-xs font-bold text-white mt-0.5">
            Page Element Targets
          </h2>
          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
            Drag columns from tables to the handles next to elements to bind data values or button form triggers.
          </p>
        </div>

        <div className="space-y-4">
          {bindableNodes.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-900/50 text-center text-[10px] text-slate-500">
              No bindable elements (text blocks or buttons) found on this page. Switch to design mode and drop some.
            </div>
          ) : (
            bindableNodes.map((n) => {
              let ElementIcon = Type;
              if (n.type === 'Button') ElementIcon = MousePointerSquareDashed;
              else if (n.type === 'ImageBlock') ElementIcon = ImageIcon;

              const isBound = !!n.props.dataBinding;
              const boundInfo = n.props.dataBinding;

              return (
                <div key={n.id} className="bg-slate-900/50 border border-slate-900 p-3 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <ElementIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="text-[11px] font-bold text-white truncate max-w-[120px]" title={n.id}>
                        {n.props.layerName || n.id}
                      </span>
                    </div>
                    <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono uppercase">
                      {n.type === 'TextBlock' ? 'Text' : n.type === 'Button' ? 'Btn' : 'Img'}
                    </span>
                  </div>

                  {isBound && boundInfo && (
                    <div className="text-[9px] bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg p-1.5 flex items-center justify-between font-mono">
                      <span>🔗 Linked to: {boundInfo.columnName}</span>
                    </div>
                  )}

                  {/* Connect target nodes columns */}
                  <div className="space-y-1.5">
                    {/* Read Binder Target handle (For mapping text content / img urls) */}
                    <div 
                      id={`target-${n.id}-read`}
                      onMouseUp={() => handleConnectEnd(n.id, 'read')}
                      className={`flex items-center justify-between px-2 py-1.5 rounded-lg border text-[10px] transition-all relative ${
                        activeConnectionSource 
                          ? 'border-blue-500/30 hover:border-blue-500 hover:bg-blue-500/5 cursor-pointer bg-slate-950/20' 
                          : 'border-slate-800/80 bg-slate-950/40 text-slate-400'
                      }`}
                    >
                      {/* Left Target Connection dot handle */}
                      <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-550 border border-slate-900 z-30" />
                      
                      <span>Bind Content (Read)</span>
                      <span className="text-[8px] text-slate-500 font-mono">Input</span>
                    </div>

                    {/* Write Binder Target handle (For button action forms submit trigger) */}
                    {n.type === 'Button' && (
                      <div 
                        id={`target-${n.id}-write`}
                        onMouseUp={() => handleConnectEnd(n.id, 'write')}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-lg border text-[10px] transition-all relative ${
                          activeConnectionSource 
                            ? 'border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-500/5 cursor-pointer bg-slate-950/20' 
                            : 'border-slate-800/80 bg-slate-950/40 text-slate-400'
                        }`}
                      >
                        {/* Left Target Connection dot handle */}
                        <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-500 border border-slate-900 z-30" />
                        
                        <span>Bind Form Submit (Write)</span>
                        <span className="text-[8px] text-slate-500 font-mono">Submit</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
