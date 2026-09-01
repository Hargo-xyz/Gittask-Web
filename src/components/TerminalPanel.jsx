// src/components/TerminalPanel.jsx
'use client';

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
  isReadOnly
}) {
  if (!showTerminal) return null;

  return (
    <div className="flex flex-col border-t border-[#30363d] select-none bg-[#0d1117]">
      {/* DRAG HANDLE BAR */}
      <div 
        onMouseDown={() => setIsDraggingTerminal(true)}
        className="h-8 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between px-3 cursor-row-resize hover:bg-[#21262d] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isContainerReady ? 'bg-[#3fb950]' : 'bg-[#f85149]'}`} />
          <span className="text-[11px] font-mono text-[#8b949e]">
            Terminal {activeFilePath && <span className="text-[#58a6ff]">({activeFilePath})</span>}
          </span>
        </div>

        <div className="flex items-center gap-2" onMouseDown={(e) => e.stopPropagation()}>
          <button 
            onClick={() => executeContainerCommand(`node ${activeFilePath}`)} 
            disabled={!activeFilePath}
            className="bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-white px-2.5 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer disabled:opacity-40"
          >
            Run
          </button>
          
          <button 
            onClick={() => setShowPushModal(true)} 
            disabled={isPushing || !activeFilePath || isReadOnly} 
            className="bg-[#238636] hover:bg-[#2ea043] text-white px-2.5 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer disabled:opacity-40"
          >
            {isPushing ? 'Pushing...' : 'Push'}
          </button>
        </div>
      </div>

      {/* TERMINAL LOG OUTPUT + FORM INPUT LAMA */}
      <div 
        style={{ height: `${terminalHeight}px` }} 
        className="bg-[#0d1117] p-3 font-mono text-xs overflow-y-auto select-text cursor-text flex flex-col justify-between"
      >
        <div className="space-y-1 overflow-y-auto flex-grow">
          {terminalOutput.map((log, i) => (
            <div 
              key={i} 
              className={`whitespace-pre-wrap break-all ${
                log.type === 'error' ? 'text-[#f85149]' : 
                log.type === 'success' ? 'text-[#3fb950]' : 
                log.type === 'command' ? 'text-white font-bold' : 'text-[#c9d1d9]'
              }`}
            >
              {log.type === 'output' ? `> ${log.text}` : log.text}
            </div>
          ))}
          <div ref={terminalBottomRef} />
        </div>

        {/* INPUT FORM LAMA DI BAGIAN BAWAH */}
        <form onSubmit={handleTerminalSubmit} className="flex items-center gap-2 pt-2 border-t border-[#30363d]/60 mt-2">
          <span className="text-[#3fb950] font-bold select-none">webcontainer@node:~$</span>
          <input 
            type="text"
            value={terminalInput}
            onChange={(e) => setTerminalInput(e.target.value)}
            onKeyDown={handleKeyDownTerminal}
            placeholder="Ketik command (npm install, node app.js, ls)..."
            className="flex-grow bg-transparent text-[#58a6ff] outline-none font-mono text-xs placeholder-[#484f58]"
          />
        </form>
      </div>
    </div>
  );
}