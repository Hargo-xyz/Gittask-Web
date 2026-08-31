// src/app/page.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { SessionProvider, signIn, signOut, useSession } from "next-auth/react";
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import { WebContainer } from '@webcontainer/api';
import { getUserRepos, fetchRepoTree, fetchFileContent, pushCodeToGitHub, createPullRequest } from '../utils/github';

let webcontainerInstancePromise = null;

async function getWebContainerInstance() {
  if (typeof window === 'undefined') return null;
  if (!webcontainerInstancePromise) {
    webcontainerInstancePromise = WebContainer.boot();
  }
  return webcontainerInstancePromise;
}

function buildFileSystemTree(filesMap) {
  const tree = {};

  Object.keys(filesMap).forEach((filePath) => {
    const parts = filePath.split('/');
    let current = tree;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      if (isFile) {
        current[part] = {
          file: {
            contents: filesMap[filePath] || '',
          },
        };
      } else {
        if (!current[part]) {
          current[part] = {
            directory: {},
          };
        }
        current = current[part].directory;
      }
    });
  });

  return tree;
}

function Workspace() {
  const { data: session } = useSession();

  // WebContainer State
  const webcontainerRef = useRef(null);
  const [isContainerReady, setIsContainerReady] = useState(false);
  const [activePortUrl, setActivePortUrl] = useState(null);

  // Layout States
  const [showMaterial, setShowMaterial] = useState(true);
  const [showEditor, setShowEditor] = useState(true);
  const [showTerminal, setShowTerminal] = useState(true);
  const [isMaterialMaximized, setIsMaterialMaximized] = useState(false);
  const [isEditorMaximized, setIsEditorMaximized] = useState(false);

  // Resizable Panes State
  const [leftWidth, setLeftWidth] = useState(40);
  const [isDraggingWidth, setIsDraggingWidth] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(200);
  const [isDraggingTerminal, setIsDraggingTerminal] = useState(false);

  // Data States
  const [userRepos, setUserRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [materialsList, setMaterialsList] = useState([]);
  const [selectedMaterialPath, setSelectedMaterialPath] = useState("");
  const [quizzesList, setQuizzesList] = useState([]);
  
  // Tabs & File Tree
  const [openFiles, setOpenFiles] = useState([]);
  const [activeFilePath, setActiveFilePath] = useState("");
  const [filesContentMap, setFilesContentMap] = useState({});
  const [isFileTreeDropdownOpen, setIsFileTreeDropdownOpen] = useState(false);

  // Material & Lightbox
  const [materialText, setMaterialText] = useState("# Selamat Datang di GitTask\nPilih repository dari menu di atas untuk mulai.");
  const [previewImage, setPreviewImage] = useState(null);

  // Terminal State
  const [terminalInput, setTerminalInput] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [terminalOutput, setTerminalOutput] = useState([
    { type: 'info', text: 'GitTask WebContainer Environment v3.4' }
  ]);
  const terminalBottomRef = useRef(null);

  // Modals & Toast State
  const [toast, setToast] = useState(null);
  const [showPushModal, setShowPushModal] = useState(false);
  const [commitMessageInput, setCommitMessageInput] = useState("");
  const [showPRModal, setShowPRModal] = useState(false);
  const [prNoteInput, setPrNoteInput] = useState("");
  
  // Create File Modal State
  const [showCreateFileModal, setShowCreateFileModal] = useState(false);
  const [newFilePathInput, setNewFilePathInput] = useState("");

  // Loaders
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [isLoadingMaterial, setIsLoadingMaterial] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPullRequesting, setIsPullRequesting] = useState(false);

  // Inisialisasi WebContainer Engine
  useEffect(() => {
    let isMounted = true;

    async function initContainer() {
      try {
        appendTerminalOutput('info', 'Menginisialisasi Node.js WebAssembly Container...');
        const instance = await getWebContainerInstance();
        if (!instance) return;

        webcontainerRef.current = instance;

        if (isMounted) {
          setIsContainerReady(true);
          appendTerminalOutput('success', '[WEBCONTAINER] Node.js Runtime Siap!');

          instance.on('server-ready', (port, url) => {
            setActivePortUrl(url);
            appendTerminalOutput('success', `[PORT FORWARD] Express Server aktif di: ${url} (Port ${port})`);
            showToastNotification(`Server backend berjalan di Port ${port}`, 'success');
          });
        }
      } catch (err) {
        if (isMounted) {
          appendTerminalOutput('error', `[CONTAINER ERROR] Gagal boot WebContainer: ${err.message}`);
        }
      }
    }

    initContainer();

    return () => {
      isMounted = false;
    };
  }, []);

  // Auto Scroll Terminal
  useEffect(() => {
    if (showTerminal) {
      terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalOutput, showTerminal]);

  // Toast Auto-Dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (session?.accessToken) {
      loadUserRepos();
    }
  }, [session]);

  const showToastNotification = (message, type = 'info') => {
    setToast({ message, type });
  };

  const appendTerminalOutput = (type, text) => {
    setTerminalOutput(prev => [...prev, { type, text }]);
  };

  // Fix Auto Resolve Raw URL Gambar GitHub
  const resolveGitHubImageUrl = (src) => {
    if (!src) return '';
    if (src.startsWith('http://') || src.startsWith('https://')) {
      return src;
    }
    // Hapus ./ atau / di awal path
    const cleanSrc = src.replace(/^\.\//, '').replace(/^\//, '');

    // Cari repo owner dari session atau default
    const repoOwner = session?.user?.name || "Ethereum-Jakarta";
    const repoName = selectedRepo || "phase-1-week2-backend-fundamental";

    return `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/${cleanSrc}`;
  };

  // Resize Panes Handlers
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingWidth) {
        const newWidth = (e.clientX / window.innerWidth) * 100;
        if (newWidth > 15 && newWidth < 85) setLeftWidth(newWidth);
      }
      if (isDraggingTerminal) {
        const calculatedHeight = window.innerHeight - e.clientY - 24;
        if (calculatedHeight >= 50 && calculatedHeight <= window.innerHeight - 100) {
          setTerminalHeight(calculatedHeight);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingWidth(false);
      setIsDraggingTerminal(false);
    };

    if (isDraggingWidth || isDraggingTerminal) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingWidth, isDraggingTerminal]);

  const loadUserRepos = async () => {
    setIsLoadingRepos(true);
    const res = await getUserRepos(session.accessToken);
    if (res.success && res.repos.length > 0) {
      setUserRepos(res.repos);
      const savedRepo = localStorage.getItem('gittask_saved_repo');
      const targetRepo = (savedRepo && res.repos.some(r => r.name === savedRepo)) ? savedRepo : res.repos[0].name;
      setSelectedRepo(targetRepo);
      handleSelectRepo(targetRepo);
    }
    setIsLoadingRepos(false);
  };

  const handleSelectRepo = async (repoName) => {
    setSelectedRepo(repoName);
    localStorage.setItem('gittask_saved_repo', repoName);
    appendTerminalOutput('info', `[INFO] Memindai file repository ${repoName}...`);
    
    const treeRes = await fetchRepoTree(session.accessToken, session.user.name, repoName);
    if (treeRes.success) {
      setMaterialsList(treeRes.materials);

      const savedMat = localStorage.getItem(`gittask_mat_${repoName}`);
      const targetMatPath = (savedMat && treeRes.materials.some(m => m.path === savedMat)) ? savedMat : (treeRes.materials[0]?.path || "");

      if (targetMatPath) {
        setSelectedMaterialPath(targetMatPath);
        loadMaterial(repoName, targetMatPath);
      } else {
        setMaterialText("# Tidak ada file materi ditemukan.");
      }

      const loadedFilesMap = {};
      if (treeRes.quizzes.length > 0) {
        for (const quiz of treeRes.quizzes) {
          const fileRes = await fetchFileContent(session.accessToken, session.user.name, repoName, quiz.path);
          if (fileRes.success) {
            loadedFilesMap[quiz.path] = fileRes.content;
          }
        }
        setQuizzesList(treeRes.quizzes);
      } else {
        setQuizzesList([]);
        appendTerminalOutput('info', '[NOTE] Repository ini belum berisi file code. Klik "+ New File" untuk membuat file baru.');
      }

      setFilesContentMap(loadedFilesMap);

      const firstFilePath = Object.keys(loadedFilesMap)[0] || "";
      if (firstFilePath) {
        setOpenFiles([firstFilePath]);
        setActiveFilePath(firstFilePath);
      } else {
        setOpenFiles([]);
        setActiveFilePath("");
      }

      if (webcontainerRef.current && Object.keys(loadedFilesMap).length > 0) {
        try {
          const fileTree = buildFileSystemTree(loadedFilesMap);
          await webcontainerRef.current.mount(fileTree);
          appendTerminalOutput('success', `[WEBCONTAINER] Multi-file repo ${repoName} berhasil di-mount.`);
        } catch (mErr) {
          appendTerminalOutput('error', `[MOUNT ERROR] ${mErr.message}`);
        }
      }

    } else {
      appendTerminalOutput('error', `[ERROR] Gagal memuat repo: ${treeRes.message}`);
    }
  };

  const loadMaterial = async (repoName, path) => {
    setIsLoadingMaterial(true);
    localStorage.setItem(`gittask_mat_${repoName}`, path);
    const res = await fetchFileContent(session.accessToken, session.user.name, repoName, path);
    if (res.success) setMaterialText(res.content);
    setIsLoadingMaterial(false);
  };

  const handleCreateFileSubmit = async (e) => {
    e.preventDefault();
    const cleanPath = newFilePathInput.trim();

    if (!cleanPath) return;

    if (filesContentMap[cleanPath] !== undefined) {
      showToastNotification(`File ${cleanPath} sudah ada.`, 'error');
      return;
    }

    const defaultContent = cleanPath.endsWith('.json') 
      ? '{\n  \n}' 
      : cleanPath.endsWith('.js') 
      ? '// File JavaScript Baru\n' 
      : '';

    setFilesContentMap(prev => ({ ...prev, [cleanPath]: defaultContent }));
    setQuizzesList(prev => [...prev, { path: cleanPath, label: cleanPath }]);

    if (webcontainerRef.current) {
      try {
        if (cleanPath.includes('/')) {
          const dirPath = cleanPath.substring(0, cleanPath.lastIndexOf('/'));
          await webcontainerRef.current.fs.mkdir(dirPath, { recursive: true });
        }
        await webcontainerRef.current.fs.writeFile(cleanPath, defaultContent);
        appendTerminalOutput('success', `[FS] File '${cleanPath}' berhasil dibuat.`);
      } catch (err) {
        appendTerminalOutput('error', `[FS ERROR] Gagal membuat file: ${err.message}`);
      }
    }

    openFileTab(cleanPath);
    setShowCreateFileModal(false);
    setNewFilePathInput('');
    showToastNotification(`File '${cleanPath}' berhasil dibuat.`, 'success');
  };

  const handleCodeChange = async (newContent) => {
    const content = newContent || "";
    setFilesContentMap(prev => ({ ...prev, [activeFilePath]: content }));

    if (webcontainerRef.current && activeFilePath) {
      try {
        await webcontainerRef.current.fs.writeFile(activeFilePath, content);
      } catch (err) {
        console.error('Failed to sync file to WebContainer:', err);
      }
    }
  };

  const openFileTab = (path) => {
    if (!openFiles.includes(path)) {
      setOpenFiles([...openFiles, path]);
    }
    setActiveFilePath(path);
    setIsFileTreeDropdownOpen(false);
  };

  const closeFileTab = (e, path) => {
    e.stopPropagation();
    const filtered = openFiles.filter(p => p !== path);
    setOpenFiles(filtered);
    if (activeFilePath === path) {
      setActiveFilePath(filtered[filtered.length - 1] || "");
    }
  };

  const executeContainerCommand = async (commandLine) => {
    if (!webcontainerRef.current || !isContainerReady) {
      appendTerminalOutput('error', '[CONTAINER] WebContainer belum siap. Mohon tunggu...');
      return;
    }

    const args = commandLine.trim().split(/\s+/);
    const cmd = args.shift();

    if (!cmd) return;

    appendTerminalOutput('command', `$ ${commandLine}`);

    if (cmd === 'clear' || cmd === 'cls') {
      setTerminalOutput([]);
      return;
    }

    try {
      const process = await webcontainerRef.current.spawn(cmd, args);

      process.output.pipeTo(
        new WritableStream({
          write(data) {
            appendTerminalOutput('output', data);
          },
        })
      );

      const exitCode = await process.exit;
      if (exitCode !== 0) {
        appendTerminalOutput('error', `[PROCESS] Exited with code ${exitCode}`);
      }
    } catch (err) {
      appendTerminalOutput('error', `[SPAWN ERROR] ${err.message}`);
    }
  };

  const handleTerminalSubmit = (e) => {
    e.preventDefault();
    const rawCmd = terminalInput.trim();
    if (!rawCmd) return;

    setCommandHistory(prev => [...prev, rawCmd]);
    setHistoryIndex(-1);
    setTerminalInput('');

    executeContainerCommand(rawCmd);
  };

  const handleKeyDownTerminal = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIdx = historyIndex + 1 < commandHistory.length ? historyIndex + 1 : historyIndex;
        setHistoryIndex(nextIdx);
        setTerminalInput(commandHistory[commandHistory.length - 1 - nextIdx] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setTerminalInput(commandHistory[commandHistory.length - 1 - nextIdx] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setTerminalInput('');
      }
    }
  };

  const executePush = async () => {
    if (!activeFilePath) return;
    setShowPushModal(false);
    setIsPushing(true);
    
    const msg = commitMessageInput.trim() || `update ${activeFilePath}`;
    appendTerminalOutput('info', `[GIT] Commit & Push file ${activeFilePath}...`);
    
    try {
      const codeToPush = filesContentMap[activeFilePath] || "";
      const pushResult = await pushCodeToGitHub(session.accessToken, session.user.name, selectedRepo, activeFilePath, codeToPush, msg);
      if (pushResult.success) {
        appendTerminalOutput('success', `[SUCCESS] Push berhasil. Commit: "${msg}"`);
        showToastNotification(`Commit "${msg}" berhasil di-push.`, 'success');
      } else {
        appendTerminalOutput('error', `[ERROR] Push gagal: ${pushResult.message}`);
        showToastNotification(`Push gagal: ${pushResult.message}`, 'error');
      }
    } catch (err) {
       appendTerminalOutput('error', `[ERROR] ${err.message}`);
       showToastNotification(`Error: ${err.message}`, 'error');
    }
    setIsPushing(false);
    setCommitMessageInput("");
  };

  const executePullRequest = async () => {
    setShowPRModal(false);
    setIsPullRequesting(true);
    appendTerminalOutput('info', '[GIT] Mengirim Pull Request ke mentor...');
    
    try {
      const prResult = await createPullRequest(session.accessToken, session.user.name, selectedRepo, prNoteInput.trim());
      if (prResult.success) {
        const actionType = prResult.isUpdate ? 'diperbarui' : 'dibuat';
        const msg = `Pull Request berhasil ${actionType} ke mentor @${prResult.mentor}.`;
        appendTerminalOutput('success', `[SUCCESS] ${msg}`);
        appendTerminalOutput('info', `URL PR: ${prResult.url}`);
        showToastNotification(msg, 'success');
      } else {
        appendTerminalOutput('error', `[ERROR] Gagal PR: ${prResult.message}`);
        showToastNotification(`Gagal PR: ${prResult.message}`, 'error');
      }
    } catch (err) {
       appendTerminalOutput('error', `[ERROR] ${err.message}`);
       showToastNotification(`Error: ${err.message}`, 'error');
    }
    setIsPullRequesting(false);
    setPrNoteInput("");
  };

  const resetLayout = () => {
    setShowMaterial(true);
    setShowEditor(true);
    setShowTerminal(true);
    setIsMaterialMaximized(false);
    setIsEditorMaximized(false);
    setLeftWidth(40);
    showToastNotification("Layout berhasil di-reset.", 'info');
  };

  if (!session) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#181818] text-[#cccccc] font-sans">
        <div className="w-full max-w-sm p-8 bg-[#252526] rounded-lg border border-[#3c3c3c] shadow-2xl space-y-6 text-center transform transition-all duration-300 hover:border-[#0e639c]/60">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-xl bg-[#0e639c]/20 border border-[#0e639c]/40 flex items-center justify-center text-[#9cdcfe]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-white tracking-wide">GitTask Web IDE</h1>
            <p className="text-xs text-[#858585]">Node.js Multi-File WebContainer Environment</p>
          </div>
          <button 
            onClick={() => signIn('github')} 
            className="w-full bg-[#0e639c] hover:bg-[#1177bb] active:scale-[0.98] text-white py-2.5 px-4 rounded font-medium text-xs flex items-center justify-center gap-2 transition-all duration-150 shadow-md"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            Lanjutkan dengan GitHub
          </button>
        </div>
      </div>
    );
  }

  const isAnyDragging = isDraggingWidth || isDraggingTerminal;

  return (
    <div className={`flex flex-col h-screen bg-[#1e1e1e] text-[#cccccc] font-sans ${isAnyDragging ? 'select-none' : ''}`}>
      
      {isAnyDragging && (
        <div className={`fixed inset-0 z-50 ${isDraggingWidth ? 'cursor-col-resize' : 'cursor-row-resize'}`} />
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-[#252526] border border-[#3c3c3c] text-xs px-4 py-2.5 rounded shadow-xl transition-all duration-300 transform opacity-100">
          <span className={`w-2 h-2 rounded-full ${toast.type === 'error' ? 'bg-[#f14c4c]' : toast.type === 'success' ? 'bg-[#4ec9b0]' : 'bg-[#0e639c]'}`} />
          <span className="text-white font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-[#858585] hover:text-white ml-2 font-mono transition-colors">✕</button>
        </div>
      )}

      {/* TOP HEADER TOOLBAR */}
      <div className="flex flex-wrap justify-between items-center h-10 px-3 bg-[#252526] border-b border-[#3c3c3c] gap-2 z-20">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-white tracking-wider">GitTask IDE</span>
          
          <div className="flex items-center bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2 py-0.5 hover:border-[#0e639c] transition-colors">
            <span className="text-[#858585] text-xs font-medium mr-1.5">Repo:</span>
            <select 
              value={selectedRepo} 
              onChange={(e) => handleSelectRepo(e.target.value)}
              disabled={isLoadingRepos}
              className="bg-transparent outline-none text-xs text-[#9cdcfe] cursor-pointer max-w-[160px]"
            >
              {userRepos.map((repo) => (
                <option key={repo.id} value={repo.name} className="bg-[#252526] text-[#cccccc]">{repo.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-[#1e1e1e] border border-[#3c3c3c] rounded p-0.5 gap-0.5">
            <button 
              onClick={() => { setShowMaterial(!showMaterial); setIsMaterialMaximized(false); }} 
              className={`px-2 py-0.5 rounded text-xs transition-all duration-150 ${showMaterial && !isEditorMaximized ? 'bg-[#37373d] text-white shadow-sm' : 'text-[#858585] hover:text-[#cccccc]'}`}
            >
              Materi
            </button>
            <button 
              onClick={() => { setShowEditor(!showEditor); setIsEditorMaximized(false); }} 
              className={`px-2 py-0.5 rounded text-xs transition-all duration-150 ${showEditor && !isMaterialMaximized ? 'bg-[#37373d] text-white shadow-sm' : 'text-[#858585] hover:text-[#cccccc]'}`}
            >
              Editor
            </button>
            <button 
              onClick={() => setShowTerminal(!showTerminal)} 
              className={`px-2 py-0.5 rounded text-xs transition-all duration-150 ${showTerminal ? 'bg-[#37373d] text-white shadow-sm' : 'text-[#858585] hover:text-[#cccccc]'}`}
            >
              Terminal
            </button>
            <button 
              onClick={resetLayout}
              title="Reset Layout"
              className="px-2 py-0.5 rounded text-xs text-[#858585] hover:text-white transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activePortUrl && (
            <a 
              href={activePortUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="bg-[#4ec9b0]/20 border border-[#4ec9b0]/40 text-[#4ec9b0] text-xs px-2.5 py-0.5 rounded hover:bg-[#4ec9b0]/30 transition-colors"
            >
              Open Web Server ↗
            </a>
          )}
          <button 
            onClick={() => setShowPRModal(true)} 
            disabled={isPullRequesting} 
            className="bg-[#0e639c] hover:bg-[#1177bb] active:scale-[0.98] text-white text-xs px-3 py-1 rounded transition-all duration-150 disabled:bg-[#3c3c3c] shadow-sm"
          >
            {isPullRequesting ? 'Mengirim...' : 'Kumpulkan Tugas (PR)'}
          </button>
          
          <div className="flex items-center gap-2 border-l border-[#3c3c3c] pl-3">
            <img src={session.user.image} alt="Avatar" className="w-5 h-5 rounded-full border border-[#3c3c3c]" />
            <span className="text-xs text-[#cccccc]">{session.user.name}</span>
            <button onClick={() => signOut()} className="text-xs text-[#f14c4c] hover:underline ml-1">Logout</button>
          </div>
        </div>
      </div>

      {/* WORKSPACE AREA */}
      <div className="flex flex-col md:flex-row flex-grow overflow-hidden relative">
        
        {/* PANEL MATERI (GITHUB DARK NATIVE STYLE) */}
        {showMaterial && !isEditorMaximized && (
          <div 
            style={{ width: (showEditor && !isMaterialMaximized) ? `${leftWidth}%` : '100%' }} 
            className="flex flex-col border-r border-[#30363d] bg-[#0d1117] min-w-[200px] relative transition-all duration-75"
          >
            <div className="h-9 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between px-3 select-none">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#c9d1d9]">Materi Pembelajaran</span>
                <div className="flex items-center gap-1 ml-2">
                  <button 
                    onClick={() => { setIsMaterialMaximized(!isMaterialMaximized); setIsEditorMaximized(false); }}
                    className="text-[10px] text-[#8b949e] hover:text-white px-1 font-mono transition-colors"
                    title="Maximize / Restore"
                  >
                    [ ]
                  </button>
                  <button 
                    onClick={() => setShowMaterial(false)}
                    className="text-[10px] text-[#8b949e] hover:text-[#f85149] px-1 font-mono transition-colors"
                    title="Tutup Panel"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="flex items-center bg-[#0d1117] border border-[#30363d] rounded px-2 py-0.5 hover:border-[#58a6ff] transition-colors">
                <select 
                  value={selectedMaterialPath} 
                  onChange={(e) => { setSelectedMaterialPath(e.target.value); loadMaterial(selectedRepo, e.target.value); }}
                  disabled={isLoadingMaterial || materialsList.length === 0}
                  className="bg-transparent outline-none text-xs text-[#58a6ff] cursor-pointer max-w-[170px]"
                >
                  {materialsList.map((mat, i) => (
                    <option key={i} value={mat.path} className="bg-[#161b22] text-[#c9d1d9]">{mat.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* GITHUB MARKDOWN RENDERER */}
            <div className="p-5 overflow-y-auto flex-grow text-[#c9d1d9] space-y-4 font-sans text-xs leading-relaxed">
               <ReactMarkdown
                 components={{
                   h1: ({node, ...props}) => <h1 className="text-xl font-semibold text-[#c9d1d9] mb-4 border-b border-[#30363d] pb-2 font-sans" {...props} />,
                   h2: ({node, ...props}) => <h2 className="text-base font-semibold text-[#c9d1d9] mt-6 mb-3 border-b border-[#30363d]/50 pb-1" {...props} />,
                   h3: ({node, ...props}) => <h3 className="text-sm font-semibold text-[#58a6ff] mt-4 mb-2" {...props} />,
                   p: ({node, ...props}) => <p className="mb-3 leading-relaxed text-[#c9d1d9]" {...props} />,
                   strong: ({node, ...props}) => <strong className="font-semibold text-white" {...props} />,
                   ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1 my-2 pl-2" {...props} />,
                   ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-1 my-2 pl-2" {...props} />,
                   li: ({node, ...props}) => <li className="text-[#c9d1d9]" {...props} />,
                   blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-[#30363d] pl-3 py-1 text-[#8b949e] my-3 italic bg-[#161b22]/50 rounded-r" {...props} />,
                   img: ({node, ...props}) => {
                     const resolvedUrl = resolveGitHubImageUrl(props.src);
                     return (
                       <span className="relative group block my-3 text-center">
                         <img 
                           {...props} 
                           src={resolvedUrl}
                           alt={props.alt || "Gambar Materi"}
                           crossOrigin="anonymous"
                           onClick={() => setPreviewImage(resolvedUrl)}
                           className="rounded-md border border-[#30363d] hover:border-[#58a6ff] cursor-pointer transition-all duration-200 max-h-96 mx-auto object-contain shadow-lg bg-[#161b22]"
                         />
                       </span>
                     );
                   },
                   code: ({node, inline, ...props}) => inline ? (
                     <code className="bg-[#161b22] text-[#58a6ff] px-1.5 py-0.5 rounded text-[11px] font-mono border border-[#30363d]" {...props} />
                   ) : (
                     <code className="block bg-[#161b22] p-3 rounded-md overflow-x-auto text-[11px] font-mono text-[#c9d1d9] border border-[#30363d] my-3 leading-normal" {...props} />
                   )
                 }}
               >
                 {materialText}
               </ReactMarkdown>
            </div>
          </div>
        )}

        {/* HORIZONTAL RESIZER */}
        {showMaterial && showEditor && !isMaterialMaximized && !isEditorMaximized && (
          <div 
            onMouseDown={() => setIsDraggingWidth(true)}
            className={`hidden md:block w-1 hover:w-1.5 bg-[#252526] hover:bg-[#0e639c] cursor-col-resize transition-all z-10 ${isDraggingWidth ? 'bg-[#0e639c] w-1.5' : ''}`}
          />
        )}

        {/* PANEL CODE EDITOR */}
        {showEditor && !isMaterialMaximized && (
          <div 
            style={{ width: (showMaterial && !isEditorMaximized) ? `${100 - leftWidth}%` : '100%' }} 
            className="flex flex-col bg-[#1e1e1e] flex-grow min-w-[250px] transition-all duration-75"
          >
            {/* TABS BAR (DENGAN DROPDOWN OVERFLOW RAPI) */}
            <div className="h-9 bg-[#252526] border-b border-[#3c3c3c] flex items-center justify-between px-2 select-none relative z-30">
              <div className="flex items-center gap-1">
                
                {/* FILE TREE SELECTOR DROPDOWN */}
                <div className="relative">
                  <button 
                    onClick={() => setIsFileTreeDropdownOpen(!isFileTreeDropdownOpen)}
                    className="flex items-center gap-1.5 bg-[#1e1e1e] hover:bg-[#333333] border border-[#3c3c3c] text-xs px-2.5 py-1 rounded text-[#cccccc] font-mono transition-colors mr-1"
                    title="Buka File Tree Repo"
                  >
                    <svg className="w-3.5 h-3.5 text-[#58a6ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                    <span className="text-[10px] text-[#858585]">▼</span>
                  </button>

                  {/* POPUP DROPDOWN (Z-INDEX 50 BIAR GAK MENDELEP) */}
                  {isFileTreeDropdownOpen && (
                    <div className="absolute top-8 left-0 w-64 bg-[#252526] border border-[#3c3c3c] rounded-md shadow-2xl z-50 py-1 font-mono text-xs">
                      <div className="px-3 py-1.5 border-b border-[#3c3c3c] text-[10px] text-[#858585] uppercase tracking-wider font-semibold flex justify-between items-center">
                        <span>Repository Files</span>
                        <span>{quizzesList.length} Files</span>
                      </div>
                      <div className="max-h-60 overflow-y-auto py-1">
                        {quizzesList.length === 0 ? (
                          <div className="px-3 py-2 text-[11px] text-[#858585] italic">Tidak ada file code</div>
                        ) : (
                          quizzesList.map((fileItem, idx) => (
                            <div 
                              key={idx}
                              onClick={() => openFileTab(fileItem.path)}
                              className={`px-3 py-1.5 hover:bg-[#37373d] cursor-pointer flex items-center justify-between transition-colors ${
                                activeFilePath === fileItem.path ? 'bg-[#0e639c]/20 text-[#9cdcfe] font-medium' : 'text-[#cccccc]'
                              }`}
                            >
                              <span className="truncate">{fileItem.path}</span>
                              <span className="text-[10px] text-[#858585]">
                                {fileItem.path.endsWith('.js') ? 'JS' : fileItem.path.endsWith('.json') ? 'JSON' : 'FILE'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* FILE TABS */}
                <div className="flex items-center overflow-x-auto max-w-[500px]">
                  {openFiles.map((filePath) => (
                    <div 
                      key={filePath}
                      onClick={() => setActiveFilePath(filePath)}
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono cursor-pointer border-r border-[#3c3c3c] transition-colors whitespace-nowrap ${
                        activeFilePath === filePath ? 'bg-[#1e1e1e] text-[#9cdcfe] font-medium border-t-2 border-t-[#0e639c]' : 'bg-[#2d2d2d] text-[#858585] hover:bg-[#252526]'
                      }`}
                    >
                      <span>{filePath}</span>
                      <button 
                        onClick={(e) => closeFileTab(e, filePath)}
                        className="hover:text-white text-[10px] ml-1 font-mono"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* CREATE NEW FILE BUTTON */}
                <button 
                  onClick={() => setShowCreateFileModal(true)}
                  className="bg-[#1e1e1e] hover:bg-[#0e639c] text-[#858585] hover:text-white px-2 py-1 rounded text-xs font-mono border border-[#3c3c3c] transition-colors ml-1 whitespace-nowrap"
                  title="Buat File Baru"
                >
                  + New File
                </button>
              </div>

              <div className="flex items-center gap-1 ml-2">
                <button 
                  onClick={() => { setIsEditorMaximized(!isEditorMaximized); setIsMaterialMaximized(false); }}
                  className="text-[10px] text-[#858585] hover:text-white px-1 font-mono"
                >
                  [ ]
                </button>
                <button 
                  onClick={() => setShowEditor(false)}
                  className="text-[10px] text-[#858585] hover:text-[#f14c4c] px-1 font-mono"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* MONACO EDITOR */}
            <div className="flex-grow pt-1 min-h-0">
              <Editor 
                height="100%" 
                defaultLanguage={activeFilePath.endsWith('.json') ? 'json' : 'javascript'} 
                theme="vs-dark" 
                value={filesContentMap[activeFilePath] || ""} 
                onChange={handleCodeChange} 
                options={{ minimap: { enabled: false }, fontSize: 13, padding: { top: 10 } }} 
              />
            </div>

            {/* TERMINAL DRAG BAR */}
            {showTerminal && (
              <div 
                onMouseDown={() => setIsDraggingTerminal(true)}
                className="h-9 bg-[#252526] border-t border-b border-[#3c3c3c] flex items-center justify-between px-3 cursor-row-resize select-none hover:bg-[#2a2d2e] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isContainerReady ? 'bg-[#4ec9b0] animate-pulse' : 'bg-[#f14c4c]'}`} />
                  <span className="text-[11px] font-mono text-[#858585]">
                    Active File: <span className="text-[#9cdcfe]">{activeFilePath || 'None'}</span>
                  </span>
                </div>

                <div className="flex gap-2" onMouseDown={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => executeContainerCommand(`node ${activeFilePath}`)} 
                    disabled={!activeFilePath}
                    className="bg-[#3c3c3c] hover:bg-[#4c4c4c] active:scale-95 text-white px-3 py-0.5 rounded text-xs font-medium transition-all disabled:opacity-50"
                  >
                    Run File
                  </button>
                  <button 
                    onClick={() => setShowPushModal(true)} 
                    disabled={isPushing || !activeFilePath} 
                    className={`px-3 py-0.5 rounded text-xs font-medium transition-all ${isPushing || !activeFilePath ? 'bg-[#3c3c3c]' : 'bg-[#0e639c] hover:bg-[#1177bb] text-white'}`}
                  >
                    {isPushing ? 'Pushing...' : 'Push'}
                  </button>
                </div>
              </div>
            )}

            {/* WEBCONTAINER TERMINAL */}
            {showTerminal && (
              <div 
                style={{ height: `${terminalHeight}px` }} 
                className="bg-[#1e1e1e] p-3 font-mono text-xs overflow-y-auto select-text cursor-text selection:bg-[#264f78] selection:text-white flex flex-col"
              >
                <div className="flex-grow space-y-1">
                  {terminalOutput.map((log, i) => (
                    <div 
                      key={i} 
                      className={`whitespace-pre-wrap break-all select-text ${
                        log.type === 'error' ? 'text-[#f14c4c]' : 
                        log.type === 'success' ? 'text-[#4ec9b0]' : 
                        log.type === 'info' ? 'text-[#858585] italic' : 
                        log.type === 'command' ? 'text-white font-bold' : 'text-[#cccccc]'
                      }`}
                    >
                      {log.type === 'output' ? `> ${log.text}` : log.text}
                    </div>
                  ))}
                  <div ref={terminalBottomRef} />
                </div>

                {/* TERMINAL CLI INPUT */}
                <form onSubmit={handleTerminalSubmit} className="flex items-center gap-2 pt-2 border-t border-[#2d2d2d] mt-2">
                  <span className="text-[#4ec9b0] font-bold select-none">webcontainer@node:~$</span>
                  <input 
                    type="text"
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    onKeyDown={handleKeyDownTerminal}
                    placeholder="Ketik command (misal: npm install, node app.js, ls)..."
                    className="flex-grow bg-transparent text-[#9cdcfe] outline-none font-mono text-xs placeholder-[#555555]"
                  />
                </form>
              </div>
            )}
          </div>
        )}

      </div>

      {/* BOTTOM STATUS BAR */}
      <div className="h-6 bg-[#007acc] text-white flex items-center justify-between px-3 text-[11px] font-mono select-none z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => setShowPRModal(true)} className="flex items-center gap-1 hover:underline">
            main* (Pull Request)
          </button>
          <span>WebContainer Engine: {isContainerReady ? 'Active' : 'Initializing'}</span>
          <span>Repo: {selectedRepo || 'None'}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>JavaScript (Node.js)</span>
          <span>UTF-8</span>
          <span>Ln 1, Col 1</span>
        </div>
      </div>

      {/* LIGHTBOX PREVIEW */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[85vh]">
            <img 
              src={previewImage} 
              alt="Preview" 
              className="max-w-full max-h-[80vh] rounded border border-[#3c3c3c] object-contain shadow-2xl"
            />
            <button 
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 bg-[#252526] hover:bg-[#f14c4c] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs border border-[#3c3c3c] font-mono"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* MODAL CREATE NEW FILE */}
      {showCreateFileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateFileSubmit} className="bg-[#252526] border border-[#3c3c3c] rounded max-w-sm w-full p-4 space-y-3 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#3c3c3c] pb-2">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Buat File Baru</h3>
              <button type="button" onClick={() => setShowCreateFileModal(false)} className="text-[#858585] hover:text-white text-xs font-mono">✕</button>
            </div>
            <p className="text-xs text-[#858585]">Masukkan path file (misal: <code className="text-[#9cdcfe]">app.js</code> atau <code className="text-[#9cdcfe]">routes/users.js</code>):</p>
            <input 
              type="text" 
              value={newFilePathInput}
              onChange={(e) => setNewFilePathInput(e.target.value)}
              placeholder="contoh: app.js"
              className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded p-2 text-xs text-[#cccccc] outline-none focus:border-[#0e639c] font-mono"
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowCreateFileModal(false)} className="px-3 py-1 rounded text-xs bg-[#3c3c3c] hover:bg-[#4c4c4c] text-white font-medium">Batal</button>
              <button type="submit" className="px-3 py-1 rounded text-xs bg-[#0e639c] hover:bg-[#1177bb] text-white font-medium">Buat File</button>
            </div>
          </form>
        </div>
      )}

      {/* PUSH MODAL */}
      {showPushModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#252526] border border-[#3c3c3c] rounded max-w-sm w-full p-4 space-y-3 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#3c3c3c] pb-2">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Push ke GitHub</h3>
              <button onClick={() => setShowPushModal(false)} className="text-[#858585] hover:text-white text-xs font-mono">✕</button>
            </div>
            <p className="text-xs text-[#858585]">Pesan commit untuk file <code className="text-[#9cdcfe] font-mono">{activeFilePath}</code>:</p>
            <input 
              type="text" 
              value={commitMessageInput}
              onChange={(e) => setCommitMessageInput(e.target.value)}
              placeholder={`update ${activeFilePath}`}
              className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded p-2 text-xs text-[#cccccc] outline-none focus:border-[#0e639c] font-mono"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setShowPushModal(false)} className="px-3 py-1 rounded text-xs bg-[#3c3c3c] hover:bg-[#4c4c4c] text-white font-medium">Batal</button>
              <button onClick={executePush} className="px-3 py-1 rounded text-xs bg-[#0e639c] hover:bg-[#1177bb] text-white font-medium">Push</button>
            </div>
          </div>
        </div>
      )}

      {/* PR MODAL */}
      {showPRModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#252526] border border-[#3c3c3c] rounded max-w-sm w-full p-4 space-y-3 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#3c3c3c] pb-2">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Kumpulkan Tugas (PR)</h3>
              <button onClick={() => setShowPRModal(false)} className="text-[#858585] hover:text-white text-xs font-mono">✕</button>
            </div>
            <p className="text-xs text-[#858585]">Catatan untuk mentor:</p>
            <textarea 
              rows={3}
              value={prNoteInput}
              onChange={(e) => setPrNoteInput(e.target.value)}
              placeholder="Contoh: Selesai mengerjakan Backend Fundamental Node.js."
              className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded p-2 text-xs text-[#cccccc] outline-none focus:border-[#0e639c] resize-none font-mono"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setShowPRModal(false)} className="px-3 py-1 rounded text-xs bg-[#3c3c3c] hover:bg-[#4c4c4c] text-white font-medium">Batal</button>
              <button onClick={executePullRequest} className="px-3 py-1 rounded text-xs bg-[#0e639c] hover:bg-[#1177bb] text-white font-medium">Kirim PR</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function App() {
  return <SessionProvider><Workspace /></SessionProvider>;
}