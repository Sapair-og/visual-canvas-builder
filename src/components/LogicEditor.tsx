'use client';

import React, { useState } from 'react';
import { useEditor } from '../context/EditorContext';
import { CanvasNode, LogicFlow } from '../types/canvas';
import { Terminal, Code, Layers, Database, ArrowRight, Trash2, Plus, Sparkles, Link2, Play, Check } from 'lucide-react';

export default function LogicEditor() {
  const { 
    canvasState, 
    dbTables, 
    pages, 
    logicFlows, 
    addLogicFlow, 
    deleteLogicFlow,
    showToast
  } = useEditor();

  // Local creation form states
  const [triggerNodeId, setTriggerNodeId] = useState('');
  const [triggerEvent, setTriggerEvent] = useState<'click' | 'hover' | 'change' | 'submit'>('click');
  const [actionType, setActionType] = useState<'db-select' | 'db-insert' | 'set-text' | 'set-image' | 'toast' | 'navigate' | 'custom-code'>('set-text');
  
  const [targetNodeId, setTargetNodeId] = useState('');
  const [targetTextVal, setTargetTextVal] = useState('');
  const [dbTable, setDbTable] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [routePath, setRoutePath] = useState('index');

  const [testRunId, setTestRunId] = useState<string | null>(null);

  // Flatten nodes recursively to list elements in dropdowns
  const getFlattenedNodes = (node: CanvasNode | null): CanvasNode[] => {
    if (!node) return [];
    const list = [node];
    node.children.forEach(c => {
      list.push(...getFlattenedNodes(c));
    });
    return list.filter(n => n.id !== 'root'); // Hide root node
  };

  const elements = getFlattenedNodes(canvasState);

  const handleCreateFlow = () => {
    if (!triggerNodeId) {
      alert('Please select a trigger source element.');
      return;
    }

    let dataMapping = '';
    if (actionType === 'set-text' || actionType === 'set-image' || actionType === 'toast') {
      dataMapping = targetTextVal;
    } else if (actionType === 'navigate') {
      dataMapping = routePath;
    }

    addLogicFlow({
      triggerNodeId,
      triggerEvent,
      actionType,
      targetNodeId: (actionType === 'set-text' || actionType === 'set-image') ? targetNodeId : undefined,
      targetProperty: (actionType === 'set-text') ? 'text' : (actionType === 'set-image') ? 'imageUrl' : undefined,
      dbTable: (actionType === 'db-select' || actionType === 'db-insert') ? dbTable : undefined,
      dbAction: (actionType === 'db-select') ? 'select' : (actionType === 'db-insert') ? 'insert' : undefined,
      customCode: (actionType === 'custom-code') ? customCode : undefined,
      dataMapping
    });

    // Reset form
    setTriggerNodeId('');
    setTargetNodeId('');
    setTargetTextVal('');
    setCustomCode('');
  };

  const simulateFlow = (flowId: string) => {
    setTestRunId(flowId);
    setTimeout(() => {
      setTestRunId(null);
      showToast('Visual Script simulation finished!', 'success');
    }, 1500);
  };

  return (
    <div className="flex-1 bg-slate-955 flex select-none text-slate-200 min-h-0 overflow-hidden">
      {/* 1. Left sidebar: Configure connections */}
      <div className="w-80 border-r border-slate-900 bg-slate-950 flex flex-col h-full shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-slate-900 bg-slate-955/40">
          <h2 className="text-xs font-bold text-slate-350 uppercase tracking-wider flex items-center gap-1.5 font-sans">
            <Link2 className="w-3.5 h-3.5 text-blue-450" />
            <span>Connect Visual Logic</span>
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5 font-sans">Wire user events to actions and database inputs.</p>
        </div>

        <div className="p-4 space-y-4 text-xs font-sans text-slate-300">
          {/* Step 1: Trigger Setup */}
          <div className="space-y-2 bg-slate-900/30 border border-slate-900 p-3 rounded-xl">
            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">⚡ 1. Choose Event Trigger</div>
            
            <div className="space-y-2">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Source Element</label>
                <select
                  value={triggerNodeId}
                  onChange={(e) => setTriggerNodeId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-900 rounded-lg text-xs text-white focus:outline-none"
                >
                  <option value="">-- Choose Element --</option>
                  {elements.map(el => (
                    <option key={el.id} value={el.id}>{el.props.layerName || `${el.type} (${el.id})`}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Event Action</label>
                <select
                  value={triggerEvent}
                  onChange={(e) => setTriggerEvent(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-900 rounded-lg text-xs text-white focus:outline-none"
                >
                  <option value="click">On Click (Triggered on click)</option>
                  <option value="hover">On Hover (Mouse over)</option>
                  <option value="change">On Input Change (Value changed)</option>
                  <option value="submit">On Form Submit</option>
                </select>
              </div>
            </div>
          </div>

          {/* Step 2: Action Setup */}
          <div className="space-y-3 bg-slate-900/30 border border-slate-900 p-3 rounded-xl">
            <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">⚙ 2. Choose Response Action</div>
            
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Action Type</label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-900 rounded-lg text-xs text-white focus:outline-none"
              >
                <option value="set-text">Update Text Content</option>
                <option value="set-image">Update Image URL</option>
                <option value="db-select">Query Database Table</option>
                <option value="db-insert">Write Row to Database</option>
                <option value="toast">Display Popup Notification</option>
                <option value="navigate">Navigate to Page</option>
                <option value="custom-code">Execute Custom Javascript</option>
              </select>
            </div>

            {/* Dynamic settings based on selected action type */}
            {actionType === 'set-text' && (
              <div className="space-y-2 pt-1 border-t border-slate-900">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Target Element</label>
                  <select
                    value={targetNodeId}
                    onChange={(e) => setTargetNodeId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-900 rounded-lg text-xs text-white focus:outline-none"
                  >
                    <option value="">-- Choose Text Block --</option>
                    {elements.filter(el => el.type === 'TextBlock' || el.type === 'Button').map(el => (
                      <option key={el.id} value={el.id}>{el.props.layerName || `${el.type} (${el.id})`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Text Value</label>
                  <input
                    type="text"
                    placeholder="e.g. Added to cart!"
                    value={targetTextVal}
                    onChange={(e) => setTargetTextVal(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-900 rounded-lg text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            {actionType === 'set-image' && (
              <div className="space-y-2 pt-1 border-t border-slate-900">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Target Image block</label>
                  <select
                    value={targetNodeId}
                    onChange={(e) => setTargetNodeId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-900 rounded-lg text-xs text-white focus:outline-none"
                  >
                    <option value="">-- Choose Image --</option>
                    {elements.filter(el => el.type === 'ImageBlock').map(el => (
                      <option key={el.id} value={el.id}>{el.props.layerName || `${el.type} (${el.id})`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Image URL</label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={targetTextVal}
                    onChange={(e) => setTargetTextVal(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-900 rounded-lg text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            {(actionType === 'db-select' || actionType === 'db-insert') && (
              <div className="space-y-2 pt-1 border-t border-slate-900">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Database Table</label>
                  <select
                    value={dbTable}
                    onChange={(e) => setDbTable(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-900 rounded-lg text-xs text-white focus:outline-none"
                  >
                    <option value="">-- Choose Table --</option>
                    {dbTables.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {actionType === 'toast' && (
              <div className="space-y-2 pt-1 border-t border-slate-900">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Popup Alert Message</label>
                  <input
                    type="text"
                    placeholder="e.g. Recruiter message sent!"
                    value={targetTextVal}
                    onChange={(e) => setTargetTextVal(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-900 rounded-lg text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            {actionType === 'navigate' && (
              <div className="space-y-2 pt-1 border-t border-slate-900">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Go to Route File</label>
                  <select
                    value={routePath}
                    onChange={(e) => setRoutePath(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-900 rounded-lg text-xs text-white focus:outline-none"
                  >
                    {Object.keys(pages).map(pId => (
                      <option key={pId} value={pId}>/{pId}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {actionType === 'custom-code' && (
              <div className="space-y-2 pt-1 border-t border-slate-900">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1 font-mono">Custom Javascript</label>
                  <textarea
                    placeholder="// Write script runs here...&#10;console.log('Script loaded!');"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                    className="w-full h-24 px-2 py-1.5 bg-slate-950 border border-slate-900 rounded-lg text-[10px] text-slate-300 font-mono focus:outline-none resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Connect Button */}
          <button
            onClick={handleCreateFlow}
            disabled={!triggerNodeId}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-500 hover:to-indigo-550 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed border border-blue-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Attach Logic Flow</span>
          </button>
        </div>
      </div>

      {/* 2. Right Panel: Interactive Node Canvas flowchart */}
      <div className="flex-1 bg-slate-950 p-6 flex flex-col h-full overflow-y-auto select-none">
        <div className="flex items-center justify-between pb-4 border-b border-slate-900 shrink-0">
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <Terminal className="w-3.5 h-3.5 text-blue-450 animate-pulse" />
              <span>Logic flowchart board</span>
            </h2>
            <p className="text-[10px] text-slate-550 font-sans mt-0.5">Visualize interactive links and custom actions mapping.</p>
          </div>
          <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded-full">
            {logicFlows.length} flows active
          </span>
        </div>

        {/* List flows */}
        <div className="flex-1 py-8 space-y-12">
          {logicFlows.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-950/20 rounded-2xl border border-dashed border-slate-900 font-sans max-w-lg mx-auto mt-12">
              <div className="w-12 h-12 rounded-full bg-slate-900/60 border border-slate-850 flex items-center justify-center mb-4 text-slate-500">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold text-slate-400">No Logic Flows Created</h3>
              <p className="text-[10px] text-slate-650 mt-1 leading-relaxed">
                Connect canvas elements to event-actions on the left sidebar to visualize flowchart connections.
              </p>
            </div>
          ) : (
            logicFlows.map((flow) => {
              const triggerName = elements.find(el => el.id === flow.triggerNodeId)?.props.layerName || flow.triggerNodeId;
              const targetName = flow.targetNodeId ? (elements.find(el => el.id === flow.targetNodeId)?.props.layerName || flow.targetNodeId) : '';
              const isTesting = testRunId === flow.id;
              
              return (
                <div key={flow.id} className="relative flex items-center justify-center max-w-3xl mx-auto group">
                  {/* Trigger Card (Left) */}
                  <div className="w-72 bg-slate-900/50 border border-blue-500/20 p-4 rounded-xl shadow-lg relative flex flex-col gap-1.5 shrink-0 z-10 hover:border-blue-500/40 transition-all">
                    <div className="absolute top-[-8px] left-3 bg-blue-600 text-white font-mono text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                      Trigger Event
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono font-bold">ELEMENT: <span className="text-white">{triggerName}</span></div>
                    <div className="text-[11px] text-blue-400 font-bold flex items-center gap-1">
                      <span>⚡ On {flow.triggerEvent}</span>
                    </div>
                  </div>

                  {/* SVG Connection track */}
                  <div className="flex-1 h-8 relative select-none shrink-0 pointer-events-none">
                    <svg className="w-full h-full absolute inset-0 overflow-visible" style={{ zIndex: 1 }}>
                      <defs>
                        <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                          <path d="M 0 2 L 10 5 L 0 8 z" fill="#3b82f6" />
                        </marker>
                      </defs>
                      <line 
                        x1="0" 
                        y1="16" 
                        x2="100%" 
                        y2="16" 
                        stroke={isTesting ? "#10b981" : "#1e293b"} 
                        strokeWidth={isTesting ? "3" : "2"} 
                        strokeDasharray={isTesting ? "none" : "4 4"}
                        className={isTesting ? "animate-pulse" : ""}
                        markerEnd="url(#arrow)" 
                      />
                    </svg>
                    
                    {/* Delete button positioned absolute in the center of connection line */}
                    <div className="absolute inset-0 flex items-center justify-center z-15 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        <button
                          onClick={() => simulateFlow(flow.id)}
                          className="p-1 bg-slate-900 hover:bg-slate-800 text-[9px] font-bold text-emerald-450 hover:text-emerald-400 border border-slate-800 rounded-md shadow cursor-pointer transition-all"
                          title="Simulate Event connection"
                        >
                          Simulate
                        </button>
                        <button
                          onClick={() => deleteLogicFlow(flow.id)}
                          className="p-1 bg-slate-900 hover:bg-red-950 hover:text-red-400 text-red-500 border border-slate-800 rounded-md shadow cursor-pointer transition-all"
                          title="Delete connection"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Action Card (Right) */}
                  <div className={`w-72 border p-4 rounded-xl shadow-lg relative flex flex-col gap-1.5 shrink-0 z-10 transition-all ${
                    isTesting
                      ? 'bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                      : 'bg-slate-900/50 border-purple-500/20 hover:border-purple-500/40'
                  }`}>
                    <div className="absolute top-[-8px] left-3 bg-purple-600 text-white font-mono text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                      Response Action
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono font-bold">TYPE: <span className="text-white uppercase font-sans">{flow.actionType}</span></div>
                    
                    <div className="text-[11px] text-purple-400 font-bold flex items-center gap-1">
                      <span>⚙ </span>
                      {flow.actionType === 'set-text' && (
                        <span>Set text of <span className="text-white">{targetName}</span> to <span className="text-white">"{flow.dataMapping}"</span></span>
                      )}
                      {flow.actionType === 'set-image' && (
                        <span>Set image URL of <span className="text-white">{targetName}</span> to <span className="text-white truncate max-w-[120px]" title={flow.dataMapping}>"{flow.dataMapping}"</span></span>
                      )}
                      {flow.actionType === 'db-select' && (
                        <span className="text-pink-400">Query & fetch list from table <span className="text-white">"{flow.dbTable}"</span></span>
                      )}
                      {flow.actionType === 'db-insert' && (
                        <span className="text-pink-400">Submit form data into table <span className="text-white">"{flow.dbTable}"</span></span>
                      )}
                      {flow.actionType === 'toast' && (
                        <span>Show toast popup: <span className="text-white">"{flow.dataMapping}"</span></span>
                      )}
                      {flow.actionType === 'navigate' && (
                        <span>Go to page route: <span className="text-white">/{flow.dataMapping}</span></span>
                      )}
                      {flow.actionType === 'custom-code' && (
                        <span>Run custom javascript script snippet</span>
                      )}
                    </div>
                    
                    {flow.actionType === 'custom-code' && flow.customCode && (
                      <pre className="mt-1 bg-slate-950 p-2 rounded text-[8px] font-mono text-slate-400 overflow-x-auto max-h-[50px]">
                        {flow.customCode}
                      </pre>
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
