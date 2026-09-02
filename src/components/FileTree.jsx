// src/components/FileTree.jsx
'use client';

import { useState } from 'react';

// Ikon SVG Profesional (Gaya VS Code)
function FolderIcon({ isOpen }) {
  return (
    <svg className="w-3.5 h-3.5 text-[#58a6ff] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      {isOpen ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      )}
    </svg>
  );
}

function FileIcon({ fileName }) {
  let color = "text-[#8b949e]";
  if (fileName.endsWith('.js') || fileName.endsWith('.jsx')) color = "text-[#f1e05a]";
  else if (fileName.endsWith('.json')) color = "text-[#7ee787]";
  else if (fileName.endsWith('.html')) color = "text-[#e34c26]";
  else if (fileName.endsWith('.css')) color = "text-[#56b6c2]";
  else if (fileName.endsWith('.md')) color = "text-[#58a6ff]";

  return (
    <svg className={`w-3.5 h-3.5 ${color} shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function ChevronIcon({ isOpen }) {
  return (
    <svg className={`w-3 h-3 text-[#8b949e] transition-transform shrink-0 ${isOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function TreeNode({ 
  item, 
  activeFilePath, 
  onOpenFile, 
  onDeleteFile, 
  onOpenCreateFileModal, 
  onOpenCreateFolderModal, 
  isReadOnly 
}) {
  const [isOpen, setIsOpen] = useState(true);
  const isFolder = item.type === 'folder';
  const isActive = activeFilePath === item.path;

  return (
    <div className="select-none font-mono text-xs">
      <div 
        onClick={() => {
          if (isFolder) setIsOpen(!isOpen);
          else onOpenFile(item.path);
        }}
        className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer transition-colors group ${
          isActive 
            ? 'bg-[#1f6beb]/20 text-[#58a6ff] font-semibold' 
            : 'hover:bg-[#21262d] text-[#c9d1d9]'
        }`}
      >
        <div className="flex items-center gap-1.5 overflow-hidden truncate">
          {isFolder ? <ChevronIcon isOpen={isOpen} /> : <span className="w-3" />}
          {isFolder ? <FolderIcon isOpen={isOpen} /> : <FileIcon fileName={item.name} />}
          <span className="truncate">{item.name}</span>
        </div>

        {!isReadOnly && (
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
            {isFolder ? (
              <>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenCreateFileModal(item.path);
                  }}
                  className="text-[#8b949e] hover:text-[#3fb950] px-1 text-[11px] font-sans"
                  title="Buat File"
                >
                  +File
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenCreateFolderModal(item.path);
                  }}
                  className="text-[#8b949e] hover:text-[#58a6ff] px-1 text-[11px] font-sans"
                  title="Buat Folder"
                >
                  +Folder
                </button>
              </>
            ) : (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteFile(item.path);
                }}
                className="text-[#8b949e] hover:text-[#f85149] px-1 text-[10px]"
                title="Hapus File"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>

      {isFolder && isOpen && item.children && (
        <div className="pl-3 border-l border-[#30363d]/40 ml-2 mt-0.5 space-y-0.5">
          {item.children.map((child) => (
            <TreeNode
              key={child.path}
              item={child}
              activeFilePath={activeFilePath}
              onOpenFile={onOpenFile}
              onDeleteFile={onDeleteFile}
              onOpenCreateFileModal={onOpenCreateFileModal}
              onOpenCreateFolderModal={onOpenCreateFolderModal}
              isReadOnly={isReadOnly}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FileTree({ 
  treeData, 
  activeFilePath, 
  onOpenFile, 
  onDeleteFile, 
  onOpenCreateFileModal, 
  onOpenCreateFolderModal, 
  isReadOnly 
}) {
  if (!treeData || treeData.length === 0) {
    return (
      <div className="text-[#8b949e] italic text-xs p-3 font-mono">
        Belum ada berkas proyek.
      </div>
    );
  }

  return (
    <div className="space-y-0.5 p-1">
      {treeData.map((item) => (
        <TreeNode
          key={item.path}
          item={item}
          activeFilePath={activeFilePath}
          onOpenFile={onOpenFile}
          onDeleteFile={onDeleteFile}
          onOpenCreateFileModal={onOpenCreateFileModal}
          onOpenCreateFolderModal={onOpenCreateFolderModal}
          isReadOnly={isReadOnly}
        />
      ))}
    </div>
  );
}