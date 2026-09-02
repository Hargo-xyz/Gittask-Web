// src/components/SidebarPanel.jsx
'use client';

import { useState } from 'react';
import FileTree from './FileTree';
import MarkdownViewer from './MarkdownViewer';
import { buildFolderTree, buildFolderTreeFromList } from '../utils/treeUtils';

function RepoTreeNode({ node, selectedPath, onSelectFile, openFileTab }) {
  const [isOpen, setIsOpen] = useState(false);
  const isFolder = node.type === 'folder';
  const isSelected = selectedPath === node.path;

  const handleItemClick = () => {
    if (isFolder) {
      setIsOpen(!isOpen);
    } else {
      if (node.path.endsWith('.md') || node.path.endsWith('.txt')) {
        onSelectFile(node.path);
      } else {
        onSelectFile(node.path);
        if (openFileTab) openFileTab(node.path);
      }
    }
  };

  return (
    <div className="font-mono text-xs select-none">
      <div 
        onClick={handleItemClick}
        className={`flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer transition-colors ${
          isSelected 
            ? 'bg-[#1f6beb]/20 text-[#58a6ff] font-semibold border-l-2 border-[#58a6ff]' 
            : 'hover:bg-[#21262d] text-[#c9d1d9]'
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden truncate">
          {isFolder ? (
            <svg 
              className={`w-3 h-3 text-[#8b949e] transition-transform duration-150 ${isOpen ? 'rotate-90' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <span className="w-3" />
          )}

          {isFolder ? (
            <svg className="w-4 h-4 text-[#58a6ff] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-[#8b949e] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}

          <span className="truncate">{node.name}</span>
        </div>

        {isSelected && !isFolder && (
          <span className="text-[10px] bg-[#1f6beb]/30 text-[#58a6ff] px-1.5 py-0.5 rounded border border-[#1f6beb]/50 shrink-0 font-sans">
            Aktif
          </span>
        )}
      </div>

      {isFolder && isOpen && node.children && (
        <div className="pl-3 border-l border-[#30363d]/50 ml-2.5 my-0.5 space-y-0.5">
          {node.children.map((child) => (
            <RepoTreeNode 
              key={child.path} 
              node={child} 
              selectedPath={selectedPath} 
              onSelectFile={onSelectFile}
              openFileTab={openFileTab}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SidebarPanel({
  activeTab,
  setActiveTab,
  width,
  filesContentMap,
  activeFilePath,
  openFileTab,
  onDeleteFile,
  onOpenCreateFileModal,
  onOpenCreateFolderModal,
  isReadOnly,
  materialsList,
  quizzesList,
  selectedMaterialPath,
  onSelectMaterial,
  isLoadingMaterial,
  materialText,
  session,
  selectedRepo,
  setPreviewImage
}) {
  const folderTreeData = buildFolderTree(filesContentMap);
  const ownerName = isReadOnly ? 'MENTOR_ORG' : (session?.user?.name || 'user');

  const rawRepoItems = [
    ...(materialsList || []),
    ...(quizzesList || [])
  ];
  
  const repoTreeData = buildFolderTreeFromList(rawRepoItems);

  return (
    <div 
      className="flex h-full bg-[#161b22] border-r border-[#30363d] shrink-0 select-none overflow-hidden" 
      style={{ width: `${width}%` }}
    >
      {/* ACTIVITY BAR SLIM */}
      <div data-tour="activity-bar" className="w-12 bg-[#0d1117] border-r border-[#30363d] flex flex-col items-center py-3 gap-3 shrink-0">
        <button
          onClick={() => setActiveTab('explorer')}
          className={`p-2 rounded-md transition-colors cursor-pointer ${
            activeTab === 'explorer' 
              ? 'bg-[#21262d] text-[#58a6ff] border-l-2 border-[#58a6ff]' 
              : 'text-[#8b949e] hover:text-white'
          }`}
          title="File Explorer (Workspace)"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </button>

        <button
          onClick={() => setActiveTab('material')}
          className={`p-2 rounded-md transition-colors cursor-pointer ${
            activeTab === 'material' 
              ? 'bg-[#21262d] text-[#58a6ff] border-l-2 border-[#58a6ff]' 
              : 'text-[#8b949e] hover:text-white'
          }`}
          title="Repositori Kurikulum & Materi"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </button>
      </div>

      {/* SIDEBAR CONTENT AREA */}
      <div data-tour="sidebar-content" className="flex-1 flex flex-col min-w-0 bg-[#161b22]/40 overflow-hidden">
        
        {/* TAB FILE EXPLORER WORKSPACE */}
        {activeTab === 'explorer' && (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="px-3 py-2.5 text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider border-b border-[#30363d] flex items-center justify-between shrink-0 font-mono">
              <span>Explorer</span>
              {!isReadOnly && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onOpenCreateFileModal('')}
                    className="text-[#8b949e] hover:text-white text-xs font-mono cursor-pointer"
                    title="Buat File"
                  >
                    +File
                  </button>
                  <button 
                    onClick={() => onOpenCreateFolderModal('')}
                    className="text-[#8b949e] hover:text-white text-xs font-mono cursor-pointer"
                    title="Buat Folder"
                  >
                    +Folder
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-1">
              <FileTree 
                treeData={folderTreeData}
                activeFilePath={activeFilePath}
                onOpenFile={openFileTab}
                onDeleteFile={onDeleteFile}
                onOpenCreateFileModal={onOpenCreateFileModal}
                onOpenCreateFolderModal={onOpenCreateFolderModal}
                isReadOnly={isReadOnly}
              />
            </div>
          </div>
        )}

        {/* TAB MATERI PEMBELAJARAN (GITHUB REPOSITORY UX) */}
        {activeTab === 'material' && (
          <div className="flex flex-col h-full overflow-hidden p-3 gap-3">
            
            {/* HEADER REPOSITORI GITHUB */}
            <div className="flex items-center justify-between bg-[#0d1117] border border-[#30363d] rounded-md p-2.5 text-xs font-mono shrink-0">
              <div className="flex items-center gap-1.5 text-[#58a6ff] truncate">
                <span>{ownerName}</span>
                <span className="text-[#8b949e]">/</span>
                <span className="font-semibold text-white truncate">{selectedRepo || 'repository'}</span>
              </div>
              <span className="bg-[#21262d] text-[#8b949e] text-[10px] px-2 py-0.5 rounded border border-[#30363d] shrink-0 font-sans">
                main
              </span>
            </div>

            {/* POHON NAVIGASI FOLDER REPOSITORI */}
            <div className="border border-[#30363d] rounded-md bg-[#0d1117] overflow-hidden shrink-0 flex flex-col">
              <div className="bg-[#161b22] px-3 py-2 border-b border-[#30363d] text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider font-mono">
                Struktur Repositori
              </div>

              <div className="p-1.5 max-h-48 overflow-y-auto space-y-0.5">
                {repoTreeData.length === 0 ? (
                  <div className="p-2 text-xs text-[#8b949e] italic font-mono">
                    Memuat struktur repositori...
                  </div>
                ) : (
                  repoTreeData.map((node) => (
                    <RepoTreeNode
                      key={node.path}
                      node={node}
                      selectedPath={selectedMaterialPath}
                      onSelectFile={onSelectMaterial}
                      openFileTab={openFileTab}
                    />
                  ))
                )}
              </div>
            </div>

            {/* VIEWER CONTENT MARKDOWN MATERI */}
            <div className="flex-1 border border-[#30363d] rounded-md bg-[#0d1117] flex flex-col overflow-hidden shadow-lg">
              <div className="bg-[#161b22] px-3 py-2 border-b border-[#30363d] flex items-center justify-between text-xs font-mono shrink-0 select-none">
                <span className="text-white font-semibold truncate">
                  {selectedMaterialPath || 'Pilih berkas materi'}
                </span>
                <span className="text-[10px] text-[#8b949e] bg-[#21262d] px-2 py-0.5 rounded border border-[#30363d]">
                  Pratinjau
                </span>
              </div>

              <div className="flex-1 p-4 overflow-y-auto">
                {isLoadingMaterial ? (
                  <div className="text-[#8b949e] italic text-xs font-mono p-2">
                    Memuat materi dari GitHub...
                  </div>
                ) : (
                  <MarkdownViewer 
                    content={materialText}
                    owner={ownerName}
                    repo={selectedRepo}
                    setPreviewImage={setPreviewImage}
                  />
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}