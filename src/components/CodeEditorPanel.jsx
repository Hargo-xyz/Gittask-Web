// src/components/CodeEditorPanel.jsx
'use client';

import Editor from '@monaco-editor/react';
import TerminalPanel from './TerminalPanel';

export default function CodeEditorPanel({
  width,
  showMaterial,
  isEditorMaximized,
  setIsEditorMaximized,
  setIsMaterialMaximized,
  openFiles,
  activeFilePath,
  setActiveFilePath,
  closeFileTab,
  filesContentMap,
  handleCodeChange,
  setShowCreateFileModal,
  showTerminal,
  setIsDraggingTerminal,
  isPushing,
  setShowPushModal,
  terminalHeight,
  isReadOnly,
  webcontainerRef,
  isContainerReady
}) {
  return (
    <div 
      style={{ width: isEditorMaximized ? '100%' : showMaterial ? `${100 - width}%` : '100%' }}
      className="bg-[#0d1117] flex flex-col h-full overflow-hidden transition-all duration-150 font-sans"
    >
      {/* EDITOR TAB BAR */}
      <div className="h-10 bg-[#161b22] border-b border-[#30363d] px-2 flex items-center justify-between select-none shrink-0">
        <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none py-1">
          {openFiles.map((path) => (
            <div
              key={path}
              onClick={() => setActiveFilePath(path)}
              className={`group text-xs px-3 py-1 font-mono flex items-center gap-2 cursor-pointer transition-colors border-b-2 ${
                activeFilePath === path
                  ? 'bg-[#0d1117] text-white border-[#58a6ff] font-semibold'
                  : 'bg-[#161b22] text-[#8b949e] hover:text-white border-transparent'
              }`}
            >
              <span>{path.split('/').pop()}</span>
              <button 
                onClick={(e) => closeFileTab(e, path)}
                className="text-[#8b949e] hover:text-white text-[10px] p-0.5 rounded hover:bg-[#21262d]"
              >
                ✕
              </button>
            </div>
          ))}

          {!isReadOnly && (
            <button 
              onClick={() => setShowCreateFileModal(true)}
              className="text-xs text-[#58a6ff] hover:text-white font-mono bg-[#21262d] hover:bg-[#30363d] px-2 py-0.5 rounded border border-[#30363d] cursor-pointer ml-1 transition-colors"
            >
              + File
            </button>
          )}
        </div>

        {/* CONTROLS */}
        <div className="flex items-center gap-2 shrink-0">
          {!isReadOnly && activeFilePath && (
            <button 
              onClick={() => setShowPushModal(true)}
              disabled={isPushing}
              className="bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#3fb950] hover:text-white text-xs font-mono font-medium px-2.5 py-0.5 rounded transition-colors cursor-pointer"
            >
              Commit Push
            </button>
          )}

          <button 
            onClick={() => {
              setIsEditorMaximized(!isEditorMaximized);
              setIsMaterialMaximized(false);
            }}
            className="text-[#8b949e] hover:text-white text-xs font-mono p-1 rounded hover:bg-[#21262d] cursor-pointer"
            title="Maximize Editor"
          >
            {isEditorMaximized ? '❐' : '□'}
          </button>
        </div>
      </div>

      {/* MONACO CODE EDITOR */}
      <div className="flex-grow bg-[#0d1117] relative">
        {activeFilePath ? (
          <Editor
            height="100%"
            theme="vs-dark"
            defaultLanguage="javascript"
            path={activeFilePath}
            value={filesContentMap[activeFilePath] || ''}
            onChange={handleCodeChange}
            options={{
              fontSize: 13,
              fontFamily: "'Fira Code', 'Cascadia Code', monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              readOnly: isReadOnly,
              padding: { top: 8, bottom: 8 }
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-[#8b949e] font-mono text-xs italic">
            Pilih atau buat berkas untuk mulai menulis kode.
          </div>
        )}
      </div>

      {/* TERMINAL XTERM */}
      {showTerminal && (
        <div 
          style={{ height: `${terminalHeight}px` }}
          className="bg-[#0d1117] border-t border-[#30363d] flex flex-col shrink-0 overflow-hidden"
        >
          {/* DRAG HANDLE */}
          <div 
            onMouseDown={() => setIsDraggingTerminal(true)}
            className="h-1 bg-[#161b22] hover:bg-[#58a6ff] cursor-row-resize shrink-0"
          />

          <div className="flex-grow w-full h-full overflow-hidden">
            <TerminalPanel 
              webcontainerRef={webcontainerRef} 
              isContainerReady={isContainerReady} 
            />
          </div>
        </div>
      )}
    </div>
  );
}