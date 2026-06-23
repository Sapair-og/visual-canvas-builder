'use client';

import React, { useState, useEffect } from 'react';
import { X, Copy, Check, FileCode, Terminal } from 'lucide-react';
import { CanvasNode } from '../types/canvas';
import { generateReactCode, generateHtmlCode } from '../lib/codeGenerator';
import { useEditor } from '../context/EditorContext';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: Record<string, CanvasNode>;
  currentPageId: string;
}

export default function ExportModal({ isOpen, onClose, pages, currentPageId }: ExportModalProps) {
  const { showToast, dbConfig, dbTables, customScripts, backendServices, themeTokens, logicFlows } = useEditor();
  const [activeTab, setActiveTab] = useState<'react' | 'html'>('react');
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState('');
  const [selectedFile, setSelectedFile] = useState('');

  // Sync selected page inside modal when active page in editor changes
  useEffect(() => {
    if (isOpen) {
      const defaultPageFile = activeTab === 'react' 
        ? `/pages/${currentPageId}.tsx` 
        : `/${currentPageId}.html`;
      setSelectedFile(defaultPageFile);
    }
  }, [isOpen, currentPageId, activeTab]);

  // Compute compiled files on the fly
  const compiled = activeTab === 'react'
    ? generateReactCode(pages, dbConfig, dbTables, customScripts, backendServices, themeTokens, logicFlows)
    : generateHtmlCode(pages, dbConfig, dbTables, customScripts, backendServices, themeTokens, logicFlows);

  const fileKeys = Object.keys(compiled);

  // Update code content whenever selectedFile or compiled code changes
  useEffect(() => {
    if (!isOpen) return;
    
    // Ensure we fall back to a valid file key if selectedFile is not in compiled keys
    const fallbackFile = fileKeys.includes(selectedFile) 
      ? selectedFile 
      : (fileKeys[0] || '');
      
    setCode(compiled[fallbackFile] || '');
  }, [selectedFile, compiled, isOpen, fileKeys]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    showToast(`${activeTab === 'react' ? 'React (Next.js)' : 'HTML / Tailwind'} code copied!`, 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 select-none animate-fadeIn">
      {/* Modal Container */}
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-2xl relative max-h-[85vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-400">
            <FileCode className="w-5 h-5" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Export Production Code
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 hover:text-white text-slate-400 rounded-lg transition-all"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Tab Selector & Copy Action */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/20 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('react')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all border ${
                activeTab === 'react'
                  ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>React (Next.js)</span>
            </button>
            <button
              onClick={() => setActiveTab('html')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all border ${
                activeTab === 'html'
                  ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-205'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>HTML / Tailwind</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-all"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-400" />
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Page Selector Tabs */}
        <div className="px-6 py-2 bg-slate-950/40 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px] scrollbar-thin">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mr-2">File:</span>
          {fileKeys.map((fileName) => {
            const isSelected = selectedFile === fileName;
            return (
              <button
                key={fileName}
                onClick={() => setSelectedFile(fileName)}
                className={`px-2.5 py-1 rounded transition-all font-mono border whitespace-nowrap ${
                  isSelected 
                    ? 'bg-slate-800 text-blue-400 border-slate-700 font-semibold' 
                    : 'text-slate-500 border-transparent hover:text-slate-300'
                }`}
              >
                {fileName}
              </button>
            );
          })}
        </div>

        {/* Code Display Area */}
        <div className="flex-1 overflow-auto bg-slate-950 p-6 font-mono text-xs leading-relaxed text-slate-300 select-text select-all max-h-[50vh]">
          <pre className="whitespace-pre">{code}</pre>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/30 flex items-center justify-between text-[10px] text-slate-500">
          <span>Ready to copy directly into your workspace.</span>
          <span>No external build tools needed.</span>
        </div>

      </div>
    </div>
  );
}
