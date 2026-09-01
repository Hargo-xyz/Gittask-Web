// src/components/MaterialPanel.jsx
'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { MENTOR_ORG } from '../data/curriculumData';

export default function MaterialPanel({
  width,
  showEditor,
  isMaterialMaximized,
  selectedMaterialPath,
  onSelectMaterial,
  materialsList,
  isLoadingMaterial,
  materialText,
  filesContentMap,
  session,
  selectedRepo,
  openFileTab,
  setPreviewImage,
  isReadOnly,
  setShowMaterial,
  onDeleteFile
}) {
  const [currentDirectoryPath, setCurrentDirectoryPath] = useState("");

  const resolveGitHubImageUrl = (src) => {
    if (!src) return '';
    if (src.startsWith('http://') || src.startsWith('https://')) return src;
    
    const cleanSrc = src.replace(/^\.\//, '').replace(/^\//, '');
    const repoOwner = isReadOnly ? MENTOR_ORG : (session?.user?.name || MENTOR_ORG);

    return `https://raw.githubusercontent.com/${repoOwner}/${selectedRepo}/main/${cleanSrc}`;
  };

  const renderExplorerNavigation = () => {
    const allPaths = Object.keys(filesContentMap || {});
    const directoryItems = new Set();
    const fileItems = [];

    allPaths.forEach(path => {
      if (currentDirectoryPath && !path.startsWith(currentDirectoryPath + '/')) return;
      
      const relativePath = currentDirectoryPath ? path.substring(currentDirectoryPath.length + 1) : path;
      const parts = relativePath.split('/');

      if (parts.length > 1) {
        directoryItems.add(parts[0]);
      } else if (parts[0]) {
        fileItems.push({ path, name: parts[0] });
      }
    });

    const folderList = Array.from(directoryItems);
    const breadcrumbParts = currentDirectoryPath.split('/').filter(Boolean);

    return (
      <div className="bg-[#0d1117] border border-[#30363d] rounded-md overflow-hidden text-xs font-sans my-3 shadow-sm">
        {/* BREADCRUMB NAVIGATION BAR */}
        <div className="bg-[#161b22] px-3.5 py-2 border-b border-[#30363d] flex items-center justify-between text-[#8b949e]">
          <div className="flex items-center gap-1.5 flex-wrap font-mono text-[11px]">
            <button 
              onClick={() => setCurrentDirectoryPath("")} 
              className="text-[#58a6ff] hover:underline font-semibold cursor-pointer"
            >
              root
            </button>
            {breadcrumbParts.map((part, idx) => {
              const subPath = breadcrumbParts.slice(0, idx + 1).join('/');
              return (
                <span key={subPath} className="flex items-center gap-1.5">
                  <span className="text-[#8b949e]">/</span>
                  <button 
                    onClick={() => setCurrentDirectoryPath(subPath)} 
                    className="text-[#58a6ff] hover:underline cursor-pointer"
                  >
                    {part}
                  </button>
                </span>
              );
            })}
          </div>
          <span className="text-[10px] text-[#8b949e] font-mono">{allPaths.length} items</span>
        </div>

        {/* FILE & FOLDER LIST */}
        <div className="divide-y divide-[#30363d]/50 font-mono text-[11px]">
          {currentDirectoryPath && (
            <div 
              onClick={() => {
                const parts = currentDirectoryPath.split('/');
                parts.pop();
                setCurrentDirectoryPath(parts.join('/'));
              }}
              className="px-3.5 py-1.5 hover:bg-[#161b22] cursor-pointer text-[#58a6ff] flex items-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4 text-[#58a6ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
              </svg>
              <span>.. (Ke Folder Atas)</span>
            </div>
          )}

          {folderList.map(folderName => {
            const fullFolderPath = currentDirectoryPath ? `${currentDirectoryPath}/${folderName}` : folderName;
            return (
              <div 
                key={fullFolderPath} 
                onClick={() => setCurrentDirectoryPath(fullFolderPath)} 
                className="px-3.5 py-2 hover:bg-[#161b22] cursor-pointer text-[#c9d1d9] hover:text-[#58a6ff] flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2 font-medium">
                  <svg className="w-4 h-4 text-[#58a6ff]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                  </svg>
                  <span>{folderName}</span>
                </div>
                <span className="text-[10px] text-[#8b949e]">Folder</span>
              </div>
            );
          })}

          {fileItems.map(fileObj => {
            const isMarkdown = fileObj.name.endsWith('.md');
            const isActive = selectedMaterialPath === fileObj.path;

            return (
              <div 
                key={fileObj.path} 
                className={`px-3.5 py-2 hover:bg-[#161b22] flex items-center justify-between transition-colors group ${
                  isActive ? 'bg-[#161b22] text-[#58a6ff] font-semibold' : 'text-[#c9d1d9]'
                }`}
              >
                <div 
                  onClick={() => {
                    if (isMarkdown) onSelectMaterial(fileObj.path);
                    else openFileTab(fileObj.path);
                  }}
                  className="flex items-center gap-2 truncate cursor-pointer flex-grow"
                >
                  <svg className={`w-4 h-4 ${isMarkdown ? 'text-[#58a6ff]' : 'text-[#8b949e]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="truncate hover:text-[#58a6ff]">{fileObj.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#8b949e]">
                    {isMarkdown ? 'Materi' : fileObj.name.endsWith('.js') ? 'Code' : 'File'}
                  </span>

                  {!isReadOnly && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteFile(fileObj.path); }}
                      className="opacity-0 group-hover:opacity-100 text-[#8b949e] hover:text-[#f85149] p-1 transition-opacity cursor-pointer"
                      title="Hapus file ini"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div 
      style={{ width: (showEditor && !isMaterialMaximized) ? `${width}%` : '100%' }} 
      className="flex flex-col border-r border-[#30363d] bg-[#0d1117] min-w-[200px] transition-all duration-75 flex-shrink-0"
    >
      {/* TOOLBAR & CLOSE BUTTON */}
      <div className="h-9 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between px-3 select-none">
        <span className="text-xs font-medium text-[#c9d1d9]">Material Explorer</span>
        
        <div className="flex items-center gap-2">
          <select 
            value={selectedMaterialPath} 
            onChange={(e) => onSelectMaterial(e.target.value)}
            disabled={isLoadingMaterial || !materialsList?.length}
            className="bg-[#0d1117] border border-[#30363d] rounded px-2 py-0.5 text-xs text-[#58a6ff] outline-none cursor-pointer hover:border-[#8b949e] transition-colors"
          >
            {materialsList?.map((mat, i) => (
              <option key={i} value={mat.path} className="bg-[#161b22] text-[#c9d1d9]">{mat.label}</option>
            ))}
          </select>

          <button 
            onClick={() => setShowMaterial(false)}
            className="text-[#8b949e] hover:text-[#f85149] text-xs font-mono cursor-pointer px-1"
            title="Tutup Panel Material"
          >
            ✕
          </button>
        </div>
      </div>

      {/* BODY CONTENT */}
      <div className="p-4 overflow-y-auto flex-grow text-[#c9d1d9] space-y-4 font-sans text-xs leading-relaxed">
         {isReadOnly && (
           <div className="bg-[#21262d] border border-[#30363d] rounded p-3 text-xs flex items-center justify-between gap-3">
             <span className="text-[#8b949e]">Preview mode ({MENTOR_ORG}/{selectedRepo})</span>
             <a 
               href={`https://github.com/${MENTOR_ORG}/${selectedRepo}/fork`}
               target="_blank"
               rel="noreferrer"
               className="bg-[#30363d] hover:bg-[#8b949e]/20 text-[#58a6ff] text-xs px-2.5 py-1 rounded cursor-pointer transition-colors"
             >
               Fork Repo ↗
             </a>
           </div>
         )}

         {renderExplorerNavigation()}

         {/* MARKDOWN VIEWER */}
         <div className="bg-[#0d1117] border border-[#30363d] rounded-md overflow-hidden mt-4">
           <div className="bg-[#161b22] border-b border-[#30363d] px-3.5 py-2 flex items-center justify-between text-xs font-mono text-[#8b949e]">
             <span>{selectedMaterialPath || 'README.md'}</span>
             <span>{isLoadingMaterial ? 'Memuat...' : 'Rendered'}</span>
           </div>

           <div className="p-5 text-[#c9d1d9] space-y-3">
             <ReactMarkdown
               components={{
                 h1: ({node, ...props}) => <h1 className="text-lg font-bold text-white mb-3 border-b border-[#30363d] pb-1.5" {...props} />,
                 h2: ({node, ...props}) => <h2 className="text-sm font-bold text-white mt-5 mb-2 border-b border-[#30363d]/50 pb-1" {...props} />,
                 h3: ({node, ...props}) => <h3 className="text-xs font-bold text-[#58a6ff] mt-3 mb-1" {...props} />,
                 p: ({node, ...props}) => <p className="mb-2.5 leading-relaxed text-[#c9d1d9]" {...props} />,
                 ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1 my-2 pl-1" {...props} />,
                 ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-1 my-2 pl-1" {...props} />,
                 img: ({node, ...props}) => {
                   const resolvedUrl = resolveGitHubImageUrl(props.src);
                   return (
                     <img 
                       {...props} 
                       src={resolvedUrl}
                       alt={props.alt || "Material Image"}
                       crossOrigin="anonymous"
                       onClick={() => setPreviewImage(resolvedUrl)}
                       className="rounded border border-[#30363d] cursor-pointer hover:border-[#58a6ff] transition-all max-h-80 my-3 mx-auto object-contain bg-[#161b22]"
                     />
                   );
                 },
                 code: ({node, inline, ...props}) => inline ? (
                   <code className="bg-[#161b22] text-[#58a6ff] px-1 py-0.5 rounded text-[11px] font-mono border border-[#30363d]" {...props} />
                 ) : (
                   <code className="block bg-[#161b22] p-3 rounded-md overflow-x-auto text-[11px] font-mono text-[#c9d1d9] border border-[#30363d] my-2 leading-normal" {...props} />
                 )
               }}
             >
               {materialText}
             </ReactMarkdown>
           </div>
         </div>
      </div>
    </div>
  );
}