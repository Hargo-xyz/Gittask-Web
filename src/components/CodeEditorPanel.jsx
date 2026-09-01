// src/components/CodeEditorPanel.jsx
'use client';

import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import TerminalPanel from './TerminalPanel';

export default function CodeEditorPanel({
  width,
  showMaterial,
  isEditorMaximized,
  setIsEditorMaximized,
  setIsMaterialMaximized,
  setShowEditor,
  openFiles,
  activeFilePath,
  setActiveFilePath,
  closeFileTab,
  openFileTab,
  quizzesList,
  filesContentMap,
  handleCodeChange,
  setShowCreateFileModal,
  showTerminal,
  setIsDraggingTerminal,
  isContainerReady,
  executeContainerCommand,
  isPushing,
  setShowPushModal,
  terminalHeight,
  terminalOutput,
  terminalBottomRef,
  handleTerminalSubmit,
  terminalInput,
  setTerminalInput,
  handleKeyDownTerminal,
  isReadOnly,
  onDeleteFile
}) {
  const [isFileTreeDropdownOpen, setIsFileTreeDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Tutup dropdown jika mengeklik area di luar dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsFileTreeDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div 
      style={{ width: (showMaterial && !isEditorMaximized) ? `${100 - width}%` : '100%' }} 
      className="flex flex-col bg-[#0d1117] flex-grow min-w-[250px] transition-all duration-75 relative"
    >
      {/* TABS BAR (z-30 agar dropdown melayang di atas editor) */}
      <div className="h-9 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between px-2 select-none relative z-30">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          
          {/* FILE EXPLORER DROPDOWN BUTTON + FLOATING MENU */}
          <div className="relative flex-shrink-0" ref={dropdownRef}>
            <button 
              onClick={() => setIsFileTreeDropdownOpen(!isFileTreeDropdownOpen)}
              className="flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs px-2.5 py-1 rounded text-[#c9d1d9] font-mono transition-colors cursor-pointer"
              title="Daftar Berkas Repo"
            >
              <svg className="w-3.5 h-3.5 text-[#58a6ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="text-[10px] text-[#8b949e]">▼</span>
            </button>

            {/* DROPDOWN MENU FLOATING (z-50) */}
            {isFileTreeDropdownOpen && (
              <div className="absolute top-9 left-0 w-64 bg-[#161b22] border border-[#30363d] rounded-md shadow-2xl z-50 py-1 font-mono text-xs">
                <div className="px-3 py-1.5 border-b border-[#30363d] text-[10px] text-[#8b949e] uppercase font-semibold flex justify-between items-center">
                  <span>Files ({quizzesList.length})</span>
                  <button onClick={() => setIsFileTreeDropdownOpen(false)} className="text-[#8b949e] hover:text-white cursor-pointer">✕</button>
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {!quizzesList.length ? (
                    <div className="px-3 py-2 text-[11px] text-[#8b949e]">Tidak ada file code</div>
                  ) : (
                    quizzesList.map((fileItem, idx) => (
                      <div 
                        key={idx}
                        className={`px-3 py-1.5 hover:bg-[#21262d] flex items-center justify-between transition-colors group ${
                          activeFilePath === fileItem.path ? 'bg-[#21262d] text-[#58a6ff] font-medium' : 'text-[#c9d1d9]'
                        }`}
                      >
                        <span 
                          onClick={() => { openFileTab(fileItem.path); setIsFileTreeDropdownOpen(false); }}
                          className="truncate cursor-pointer flex-grow hover:text-[#58a6ff]"
                        >
                          {fileItem.path}
                        </span>

                        {!isReadOnly && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteFile(fileItem.path); }}
                            className="opacity-0 group-hover:opacity-100 text-[#8b949e] hover:text-[#f85149] p-1 cursor-pointer transition-opacity ml-2"
                            title="Hapus File"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* OPEN FILE TABS CONTAINER (DIPISAHKAN DARI DROPDOWN BUTTON) */}
          <div className="flex items-center overflow-x-auto flex-1 min-w-0">
            {openFiles.map((filePath) => (
              <div 
                key={filePath}
                onClick={() => setActiveFilePath(filePath)}
                className={`flex items-center gap-2 px-3 py-1 text-xs font-mono cursor-pointer border-r border-[#30363d] transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeFilePath === filePath ? 'bg-[#0d1117] text-[#58a6ff] font-medium border-t-2 border-t-[#58a6ff]' : 'bg-[#161b22] text-[#8b949e] hover:bg-[#21262d]'
                }`}
              >
                <span>{filePath}</span>
                <button onClick={(e) => closeFileTab(e, filePath)} className="hover:text-white text-[10px] ml-1 font-mono cursor-pointer">✕</button>
              </div>
            ))}
          </div>

          {!isReadOnly && (
            <button 
              onClick={() => setShowCreateFileModal(true)}
              className="bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white px-2 py-1 rounded text-xs font-mono border border-[#30363d] transition-colors cursor-pointer flex-shrink-0 whitespace-nowrap"
              title="Buat File Baru"
            >
              + File
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          <button 
            onClick={() => { setIsEditorMaximized(!isEditorMaximized); setIsMaterialMaximized(false); }}
            className="text-[10px] text-[#8b949e] hover:text-white px-1 font-mono cursor-pointer"
          >
            [ ]
          </button>
          <button 
            onClick={() => setShowEditor(false)}
            className="text-[10px] text-[#8b949e] hover:text-[#f85149] px-1 font-mono cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>

      {/* MONACO CODE EDITOR (z-10) */}
      <div className="flex-grow min-h-0 relative z-10">
        <Editor 
          height="100%" 
          defaultLanguage={activeFilePath.endsWith('.json') ? 'json' : 'javascript'} 
          theme="vs-dark" 
          value={filesContentMap[activeFilePath] || ""} 
          onChange={handleCodeChange} 
          options={{ readOnly: isReadOnly, minimap: { enabled: false }, fontSize: 13, padding: { top: 10 } }} 
        />
      </div>

      {/* TERMINAL PANEL */}
      <TerminalPanel 
        showTerminal={showTerminal}
        terminalHeight={terminalHeight}
        terminalOutput={terminalOutput}
        terminalBottomRef={terminalBottomRef}
        terminalInput={terminalInput}
        setTerminalInput={setTerminalInput}
        handleTerminalSubmit={handleTerminalSubmit}
        handleKeyDownTerminal={handleKeyDownTerminal}
        isContainerReady={isContainerReady}
        activeFilePath={activeFilePath}
        executeContainerCommand={executeContainerCommand}
        isPushing={isPushing}
        setShowPushModal={setShowPushModal}
        setIsDraggingTerminal={setIsDraggingTerminal}
        isReadOnly={isReadOnly}
      />
    </div>
  );
}