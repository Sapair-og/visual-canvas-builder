'use client';

import React, { useState, useEffect } from 'react';
import { useEditor } from '../context/EditorContext';
import { CanvasNode } from '../types/canvas';
import { Terminal, Code, Settings, Save, Play, BookOpen, Layers, Check } from 'lucide-react';

interface ScriptTemplate {
  name: string;
  description: string;
  code: string;
}

const TEMPLATES: Record<string, ScriptTemplate> = {
  ecommerce: {
    name: '🛒 E-Commerce Cart Logic',
    description: 'Binds product button click to add items to a local storage cart state and updates cart badge count.',
    code: `// E-Commerce Add-to-Cart Script
// Triggered on button click to update shopping cart count
const currentCartCount = parseInt(localStorage.getItem('cart_count') || '0');
const newCount = currentCartCount + 1;
localStorage.setItem('cart_count', newCount.toString());

// Update cart counter display element (make sure to set this ID on a text element)
const counterElement = document.getElementById('textblock-cart-counter');
if (counterElement) {
  counterElement.innerText = \`🛒 Cart (\${newCount})\`;
}

// Display visual alert toast
alert('Product added to shopping cart! Cart count updated successfully.');
`
  },
  netflix: {
    name: '▶ Netflix Video Player',
    description: 'Toggle simulated media trailer streams, overlay play filters, and update button states.',
    code: `// Netflix Media Player Controller
// Toggle trailer streaming status on cover frame
const videoEl = document.getElementById('imageblock-movie-player');
const playBtn = document.getElementById('button-play-trailer');

if (videoEl) {
  const isPlaying = videoEl.getAttribute('data-playing') === 'true';
  if (!isPlaying) {
    videoEl.setAttribute('data-playing', 'true');
    videoEl.style.opacity = '1';
    videoEl.style.filter = 'brightness(1.15)';
    if (playBtn) playBtn.innerText = '⏸ Pause Trailer';
    console.log('Simulating Netflix trailer stream: PLAYING');
  } else {
    videoEl.setAttribute('data-playing', 'false');
    videoEl.style.opacity = '0.8';
    videoEl.style.filter = 'none';
    if (playBtn) playBtn.innerText = '▶ Play Trailer';
    console.log('Simulating Netflix trailer stream: PAUSED');
  }
}
`
  },
  spotify: {
    name: '🟢 Spotify Audio Player',
    description: 'Stream music, update active artist/track titles, and toggle spotify green active states.',
    code: `// Spotify Audio Player Controls
// Binds audio source playback status
const spotifyTrack = {
  title: "Blinding Lights",
  artist: "The Weeknd"
};

const artistLabel = document.getElementById('textblock-spotify-artist');
const titleLabel = document.getElementById('textblock-spotify-title');
const playBtn = document.getElementById('button-spotify-play');

if (titleLabel && artistLabel) {
  titleLabel.innerText = spotifyTrack.title;
  artistLabel.innerText = spotifyTrack.artist;
}

if (playBtn) {
  const isPlaying = playBtn.getAttribute('data-active') === 'true';
  if (!isPlaying) {
    playBtn.setAttribute('data-active', 'true');
    playBtn.innerText = '🟢 Playing (Blinding Lights)';
    playBtn.style.backgroundColor = '#1ed760'; // Spotify Green
    alert(\`Now streaming: \${spotifyTrack.title} by \${spotifyTrack.artist}\`);
  } else {
    playBtn.setAttribute('data-active', 'false');
    playBtn.innerText = '▶ Stream Track';
    playBtn.style.backgroundColor = '#1e293b';
  }
}
`
  },
  calculator: {
    name: '🧮 Pricing Calculator',
    description: 'Collect numeric parameters dynamically, apply bulk discounts, and calculate pricing aggregates.',
    code: `// Custom Pricing Calculator
// Dynamically calculates totals based on selected quantity
const quantity = 3; // quantity variable
const basePrice = 29.99; // price per license
const discount = quantity > 5 ? 0.9 : 1.0; // 10% off for bulk buy

const totalCost = (quantity * basePrice * discount).toFixed(2);

const costDisplay = document.getElementById('textblock-total-price');
if (costDisplay) {
  costDisplay.innerText = \`Total Cost: $\${totalCost} (\${quantity} licenses)\`;
  costDisplay.style.color = '#3b82f6';
}
console.log('Calculated Pricing:', totalCost);
`
  },
  contact: {
    name: '✉️ Recruiter Contact Form',
    description: 'Simulates secure SMTP email dispatches when users hit contact/portfolio request buttons.',
    code: `// Secure Recruiter Form submit logic
const recruiterEmail = "hire-me@developers.com";
console.log(\`Provisioning visual email gateway to dispatcher: \${recruiterEmail}\`);

// Simulate AJAX backend endpoint send
setTimeout(() => {
  alert('Secure message successfully dispatched to developer portfolio mailbox!');
}, 500);
`
  }
};

export default function LogicEditor() {
  const { canvasState, customScripts, updateCustomScript } = useEditor();
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [activeCode, setActiveCode] = useState<string>('');
  const [activeTemplate, setActiveTemplate] = useState<string>('');
  const [runSuccess, setRunSuccess] = useState(false);

  // Flatten nodes recursively to build elements directory list
  const getFlattenedNodes = (node: CanvasNode | null): CanvasNode[] => {
    if (!node) return [];
    const list = [node];
    node.children.forEach(c => {
      list.push(...getFlattenedNodes(c));
    });
    return list.filter(n => n.id !== 'root'); // Hide root node from scripting list
  };

  const elements = getFlattenedNodes(canvasState);

  // Sync active code when selected node changes
  useEffect(() => {
    if (selectedNodeId) {
      setActiveCode(customScripts[selectedNodeId] || '');
      setActiveTemplate('');
    } else if (elements.length > 0) {
      setSelectedNodeId(elements[0].id);
    }
  }, [selectedNodeId, customScripts]);

  const handleApplyTemplate = (key: string) => {
    const tpl = TEMPLATES[key];
    if (tpl) {
      setActiveTemplate(key);
      setActiveCode(tpl.code);
    }
  };

  const handleSave = () => {
    if (!selectedNodeId) return;
    updateCustomScript(selectedNodeId, activeCode);
  };

  const handleTestScript = () => {
    try {
      const runFn = new Function(activeCode);
      runFn();
      setRunSuccess(true);
      setTimeout(() => setRunSuccess(false), 2000);
    } catch (err: any) {
      alert('JavaScript Script Syntax Error: ' + err.message);
    }
  };

  return (
    <div className="flex-1 bg-slate-955 flex select-none text-slate-200 min-h-0 overflow-hidden">
      
      {/* Left panel: Elements Directory list */}
      <div className="w-64 border-r border-slate-900 bg-slate-950 flex flex-col h-full shrink-0">
        <div className="p-4 border-b border-slate-900 bg-slate-955/40">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 font-sans">
            <Layers className="w-3.5 h-3.5 text-blue-450" />
            <span>Select Script Target</span>
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5 font-sans">Choose which design element to attach scripting logic to.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
          {elements.length === 0 ? (
            <div className="p-4 text-center text-slate-600 text-[11px] italic font-sans">
              No canvas elements available to script. Add TextBlocks, Containers, or Buttons first.
            </div>
          ) : (
            elements.map(el => {
              const hasScript = !!customScripts[el.id];
              const isSelected = selectedNodeId === el.id;
              return (
                <button
                  key={el.id}
                  onClick={() => setSelectedNodeId(el.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-all border ${
                    isSelected
                      ? 'bg-slate-900 border-slate-800 text-white font-medium font-sans'
                      : 'hover:bg-slate-900 border-transparent text-slate-400 hover:text-slate-250 font-sans'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Code className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                    <span className="truncate font-mono text-[11px]">{el.props.layerName || el.id}</span>
                  </div>
                  {hasScript && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" title="Script attached" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Center panel: Code Scripting Workspace */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-slate-950">
        {selectedNodeId ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-900 bg-slate-950/40 flex items-center justify-between shrink-0 font-sans">
              <div>
                <span className="text-[9px] font-mono text-blue-455 uppercase tracking-widest font-bold">Script Attached to:</span>
                <h3 className="text-xs font-bold text-white font-mono">{selectedNodeId}</h3>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTestScript}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                  title="Run code simulation on this page"
                >
                  {runSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      <span className="text-emerald-400">Simulation Executed!</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Simulate Script</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-lg shadow-md transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Attach Logic Script</span>
                </button>
              </div>
            </div>

            {/* Presets and templates list bar */}
            <div className="px-6 py-2.5 bg-slate-900/40 border-b border-slate-900 flex items-center gap-2.5 overflow-x-auto text-[10px] shrink-0 font-sans">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                <span>Script Presets:</span>
              </span>
              {Object.entries(TEMPLATES).map(([key, tpl]) => (
                <button
                  key={key}
                  onClick={() => handleApplyTemplate(key)}
                  className={`px-2.5 py-1 rounded transition-all border font-bold ${
                    activeTemplate === key
                      ? 'bg-slate-800 text-emerald-450 border-slate-705 font-semibold'
                      : 'text-slate-400 border-slate-850 hover:border-slate-700 bg-slate-950/40 hover:text-slate-200'
                  }`}
                >
                  {tpl.name}
                </button>
              ))}
            </div>

            {/* Code editor pane */}
            <div className="flex-1 flex min-h-0 relative">
              {/* Preset Description Banner */}
              {activeTemplate && TEMPLATES[activeTemplate] && (
                <div className="absolute top-4 left-4 right-4 z-10 bg-slate-900/90 border border-slate-800/80 p-3 rounded-lg text-[10px] text-slate-450 max-w-xl shadow-lg backdrop-blur font-sans">
                  <strong className="text-white block mb-0.5">Preset: {TEMPLATES[activeTemplate].name}</strong>
                  {TEMPLATES[activeTemplate].description}
                </div>
              )}

              {/* Textarea dark code block */}
              <div className="flex-1 flex overflow-hidden font-mono text-xs select-text relative">
                {/* Simulated Line numbers column */}
                <div className="w-10 bg-slate-955/80 border-r border-slate-900 text-right pr-2 py-4 select-none text-[10px] text-slate-600 leading-relaxed font-mono shrink-0">
                  {Array.from({ length: 25 }, (_, i) => i + 1).map(n => (
                    <div key={n} className="h-5">{n}</div>
                  ))}
                </div>
                
                <textarea
                  value={activeCode}
                  onChange={(e) => setActiveCode(e.target.value)}
                  placeholder="// Attach Unity-style scripts to expand component features...&#10;// Write custom JavaScript logic directly here.&#10;// Example:&#10;// const el = document.getElementById('textblock-id');&#10;// if (el) el.innerText = 'Hello visual scripting!';"
                  className="flex-1 bg-transparent p-4 py-4 focus:outline-none text-slate-300 placeholder-slate-650 resize-none font-mono text-[11px] leading-relaxed border-none h-full"
                  spellCheck="false"
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none bg-slate-950 font-sans">
            <div className="w-12 h-12 rounded-full bg-slate-900/80 border border-slate-800 flex items-center justify-center mb-4 text-slate-500">
              <Terminal className="w-5 h-5 animate-pulse" />
            </div>
            <h3 className="text-xs font-bold text-slate-350">No Script Target Selected</h3>
            <p className="text-[10px] text-slate-550 max-w-xs mt-1 leading-relaxed">
              Select any elements on the left outline lists to attach custom scripts or load visual presets.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
