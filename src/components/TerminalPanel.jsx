// src/components/TerminalPanel.jsx
'use client';

import { useRef } from 'react';
import Convert from 'ansi-to-html';

export default function TerminalPanel({
  showTerminal,
  terminalHeight,
  terminalOutput,
  terminalBottomRef,
  terminalInput,
  setTerminalInput,
  handleTerminalSubmit,
  handleKeyDownTerminal,
  isContainerReady,
  activeFilePath,
  executeContainerCommand,
  isPushing,
  setShowPushModal,
  setIsDraggingTerminal,
  isReadOnly,
  cwd = '/'
}) {
  const inputRef = useRef(null);

  const convertAnsi = new Convert({
    fg: '#c9d1d9',
    bg: '#0d1117',
    newline: true,
    escapeXML: true
  });

  if (!showTerminal) return null;

  const formattedCwd = cwd === '/' ? 'C:\\workspace' : `C:\\workspace${cwd.replace(/\//g, '\\')}`;

  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div data-tour="terminal" className="flex flex-col border-t border-[#30363d] select-none bg-[#0d1117] shrink-0 w-full font-mono">
      {/* DRAG HANDLE & HEADER TOOLBAR */}
      <div 
        onMouseDown={(e) => {
          e.preventDefault();
          setIsDraggingTerminal(true);
        }}
        className="h-8 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between px-3 cursor-row-resize hover:bg-[#21262d] transition-colors select-none shrink-0"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isContainerReady ? 'bg-[#3fb950]' : 'bg-[#f85149]'}`} />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#c9d1d9]">Terminal</span>
          </div>
          {activeFilePath && (
            <span className="text-[11px] text-[#8b949e]">
              — <span className="text-[#58a6ff]">{activeFilePath}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2" onMouseDown={(e) => e.stopPropagation()}>
          <button 
            onClick={() => executeContainerCommand(`node ${activeFilePath}`)} 
            disabled={!activeFilePath}
            className="bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-white px-2.5 py-0.5 rounded text-[11px] transition-colors cursor-pointer disabled:opacity-40"
          >
            Run
          </button>

          <button 
            onClick={() => executeContainerCommand('clear')}
            className="text-[#8b949e] hover:text-white px-2 py-0.5 text-[11px] transition-colors cursor-pointer"
            title="Clear Console"
          >
            Clear
          </button>
          
          <button 
            onClick={() => setShowPushModal(true)} 
            disabled={isPushing || !activeFilePath || isReadOnly} 
            className="bg-[#238636] hover:bg-[#2ea043] text-white px-2.5 py-0.5 rounded text-[11px] transition-colors cursor-pointer disabled:opacity-40"
          >
            {isPushing ? 'Pushing...' : 'Push'}
          </button>
        </div>
      </div>

      {/* INLINE TERMINAL STREAM */}
      <div 
        onClick={handleTerminalClick}
        style={{ height: `${terminalHeight}px` }} 
        className="bg-[#0d1117] p-3 text-xs select-text cursor-text flex flex-col overflow-y-auto shrink-0 leading-relaxed font-mono"
      >
        <div className="space-y-1">
          {terminalOutput.map((log, i) => {
            if (log.type === 'command') {
              return (
                <div key={i} className="flex items-start gap-1 text-[#3fb950] font-bold">
                  <span>{log.text}</span>
                </div>
              );
            }
            if (log.type === 'output') {
              return (
                <div 
                  key={i} 
                  className="whitespace-pre-wrap break-all text-[#c9d1d9]"
                  dangerouslySetInnerHTML={{ __html: convertAnsi.toHtml(log.text) }}
                />
              );
            }
            return (
              <div 
                key={i} 
                className={`whitespace-pre-wrap break-all ${
                  log.type === 'error' ? 'text-[#f85149]' : 
                  log.type === 'success' ? 'text-[#3fb950]' : 'text-[#c9d1d9]'
                }`}
              >
                {log.text}
              </div>
            );
          })}

          <form onSubmit={handleTerminalSubmit} className="flex items-center gap-1.5 pt-0.5">
            <span className="text-[#3fb950] font-bold select-none shrink-0">
              PS <span className="text-[#58a6ff]">{formattedCwd}</span>&gt;
            </span>
            <input 
              ref={inputRef}
              type="text"
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              onKeyDown={handleKeyDownTerminal}
              className="flex-grow bg-transparent text-white outline-none font-mono text-xs border-none p-0 focus:ring-0"
              autoFocus
            />
          </form>

          <div ref={terminalBottomRef} />
        </div>
      </div>
    </div>
  );
}