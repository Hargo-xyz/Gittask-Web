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

    // Inisialisasi Terminal XTerm
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

    // Menangani Input Keyboard
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

  return (
    <div className="w-full h-full bg-[#0d1117] p-2 overflow-hidden" ref={terminalRef} />
  );
}