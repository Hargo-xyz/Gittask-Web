// src/components/CodeEditorPanel.jsx
'use client';

import Editor from '@monaco-editor/react';
import TerminalPanel from './TerminalPanel';

export default function CodeEditorPanel({
  isEditorMaximized,
  setIsEditorMaximized,
  openFiles,
  activeFilePath,
  setActiveFilePath,
  closeFileTab,
  filesContentMap,
  handleCodeChange,
  showTerminal,
  setIsDraggingTerminal,
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
  isContainerReady,
  cwd
}) {
  const visibleOpenFiles = openFiles.filter((path) => !path.endsWith('.gitkeep'));

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden font-sans relative bg-[#0d1117]">
      {/* EDITOR TAB BAR */}
      <div className="h-10 bg-[#161b22] border-b border-[#30363d] px-2 flex items-center justify-between select-none shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
          {visibleOpenFiles.map((path) => (
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
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => setIsEditorMaximized(!isEditorMaximized)}
            className="text-[#8b949e] hover:text-white text-xs font-mono p-1 rounded hover:bg-[#21262d] cursor-pointer"
            title="Maximize Editor"
          >
            {isEditorMaximized ? '❐' : '□'}
          </button>
        </div>
      </div>

      {/* MONACO CODE EDITOR CANVAS */}
      <div data-tour="editor" className="flex-1 min-h-0 bg-[#0d1117] relative w-full overflow-hidden">
        {activeFilePath && !activeFilePath.endsWith('.gitkeep') ? (
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
            Pilih atau buat berkas dari Explorer untuk mulai menulis kode.
          </div>
        )}
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
        cwd={cwd}
      />
    </div>
  );
}