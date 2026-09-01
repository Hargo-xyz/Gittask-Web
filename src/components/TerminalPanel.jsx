// src/components/TerminalPanel.jsx
'use client';

import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export default function TerminalPanel({ webcontainerRef, isContainerReady }) {
  const terminalRef = useRef(null);
  const xtermInstance = useRef(null);
  const inputBuffer = useRef('');

  useEffect(() => {
    if (!terminalRef.current || xtermInstance.current) return;

    const term = new Terminal({
      theme: {
        background: '#0d1117',
        foreground: '#c9d1d9',
        cursor: '#58a6ff',
        black: '#484f58',
        red: '#ff7b72',
        green: '#3fb950',
        yellow: '#d29922',
        blue: '#58a6ff',
        magenta: '#bc8cff',
        cyan: '#39c5bb',
        white: '#b1bac4',
      },
      fontSize: 12,
      fontFamily: "'Fira Code', 'Cascadia Code', monospace",
      cursorBlink: true,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermInstance.current = term;
    term.write('\x1b[32m$ \x1b[0m');

    term.onData(async (data) => {
      const code = data.charCodeAt(0);

      if (code === 13) { // Enter
        term.write('\r\n');
        const command = inputBuffer.current.trim();
        inputBuffer.current = '';

        if (command) {
          if (command === 'clear' || command === 'cls') {
            term.clear();
          } else if (webcontainerRef.current && isContainerReady) {
            await executeCommand(command, term);
          } else {
            term.write('\x1b[31mWebContainer belum siap...\x1b[0m\r\n');
          }
        }
        term.write('\x1b[32m$ \x1b[0m');
      } else if (code === 127) { // Backspace
        if (inputBuffer.current.length > 0) {
          inputBuffer.current = inputBuffer.current.slice(0, -1);
          term.write('\b \b');
        }
      } else {
        inputBuffer.current += data;
        term.write(data);
      }
    });

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
      xtermInstance.current = null;
    };
  }, [isContainerReady]);

  const executeCommand = async (commandLine, term) => {
    const args = commandLine.trim().split(/\s+/);
    const cmd = args.shift();
    if (!cmd) return;

    try {
      const process = await webcontainerRef.current.spawn(cmd, args);
      await process.output.pipeTo(
        new WritableStream({
          write(chunk) {
            term.write(chunk);
          },
        })
      );
    } catch (err) {
      term.write(`\x1b[31mSpawn Error: ${err.message}\x1b[0m\r\n`);
    }
  };

  const handleClear = () => {
    if (xtermInstance.current) {
      xtermInstance.current.clear();
      xtermInstance.current.write('\x1b[32m$ \x1b[0m');
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0d1117] overflow-hidden">
      {/* HEADER BAR TERMINAL */}
      <div className="h-7 bg-[#161b22] px-3 flex items-center justify-between text-[#8b949e] border-b border-[#30363d] select-none shrink-0 font-mono">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[10px] uppercase tracking-wider text-white">Terminal Runtime</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950]" />
        </div>
        <button 
          onClick={handleClear}
          className="hover:text-white text-[10px] cursor-pointer transition-colors"
        >
          Clear
        </button>
      </div>

      {/* CANVAS TERMINAL XTERM */}
      <div className="flex-grow w-full h-full p-1 overflow-hidden" ref={terminalRef} />
    </div>
  );
}