// src/components/Modals.jsx
'use client';

export default function Modals({
  showCreateFileModal,
  setShowCreateFileModal,
  newFilePathInput,
  setNewFilePathInput,
  handleCreateFileSubmit,
  showCreateFolderModal,
  setShowCreateFolderModal,
  newFolderPathInput,
  setNewFolderPathInput,
  handleCreateFolderSubmit,
  targetFolderContext,
  showPushModal,
  setShowPushModal,
  activeFilePath,
  commitMessageInput,
  setCommitMessageInput,
  executePush,
  showPRModal,
  setShowPRModal,
  prNoteInput,
  setPrNoteInput,
  executePullRequest,
  previewImage,
  setPreviewImage
}) {
  return (
    <>
      {/* MODAL CREATE FILE */}
      {showCreateFileModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#161b22] border border-[#30363d] p-5 rounded-lg max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-semibold text-white">
              Buat File Baru {targetFolderContext && <span className="text-[#58a6ff]">di {targetFolderContext}/</span>}
            </h3>
            <form onSubmit={handleCreateFileSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-[#8b949e] block mb-1">Nama File</label>
                <input 
                  type="text" 
                  value={newFilePathInput}
                  onChange={(e) => setNewFilePathInput(e.target.value)}
                  placeholder="index.js atau app/page.js"
                  className="w-full bg-[#0d1117] border border-[#30363d] px-3 py-1.5 rounded text-xs text-white outline-none focus:border-[#58a6ff] font-mono"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <button 
                  type="button"
                  onClick={() => setShowCreateFileModal(false)}
                  className="px-3 py-1.5 rounded text-xs text-[#8b949e] hover:text-white bg-[#21262d] border border-[#30363d]"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-3 py-1.5 rounded text-xs text-white bg-[#238636] hover:bg-[#2ea043] font-medium"
                >
                  Buat File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREATE FOLDER */}
      {showCreateFolderModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#161b22] border border-[#30363d] p-5 rounded-lg max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-semibold text-white">
              Buat Folder Baru {targetFolderContext && <span className="text-[#3fb950]">di {targetFolderContext}/</span>}
            </h3>
            <form onSubmit={handleCreateFolderSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-[#8b949e] block mb-1">Nama Folder</label>
                <input 
                  type="text" 
                  value={newFolderPathInput}
                  onChange={(e) => setNewFolderPathInput(e.target.value)}
                  placeholder="components"
                  className="w-full bg-[#0d1117] border border-[#30363d] px-3 py-1.5 rounded text-xs text-white outline-none focus:border-[#3fb950] font-mono"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <button 
                  type="button"
                  onClick={() => setShowCreateFolderModal(false)}
                  className="px-3 py-1.5 rounded text-xs text-[#8b949e] hover:text-white bg-[#21262d] border border-[#30363d]"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-3 py-1.5 rounded text-xs text-white bg-[#238636] hover:bg-[#2ea043] font-medium"
                >
                  Buat Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL COMMIT PUSH */}
      {showPushModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#161b22] border border-[#30363d] p-5 rounded-lg max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-semibold text-white">Commit & Push ke GitHub</h3>
            <div className="space-y-3">
              <p className="text-xs text-[#8b949e]">
                Menyimpan perubahan file <span className="text-[#58a6ff] font-mono">{activeFilePath}</span> ke repositori GitHub kamu.
              </p>
              <div>
                <label className="text-xs text-[#8b949e] block mb-1">Pesan Commit</label>
                <input 
                  type="text" 
                  value={commitMessageInput}
                  onChange={(e) => setCommitMessageInput(e.target.value)}
                  placeholder={`Update ${activeFilePath}`}
                  className="w-full bg-[#0d1117] border border-[#30363d] px-3 py-1.5 rounded text-xs text-white outline-none focus:border-[#58a6ff] font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  onClick={() => setShowPushModal(false)}
                  className="px-3 py-1.5 rounded text-xs text-[#8b949e] hover:text-white bg-[#21262d] border border-[#30363d]"
                >
                  Batal
                </button>
                <button 
                  onClick={executePush}
                  className="px-3 py-1.5 rounded text-xs text-white bg-[#238636] hover:bg-[#2ea043] font-medium"
                >
                  Push Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PULL REQUEST */}
      {showPRModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#161b22] border border-[#30363d] p-5 rounded-lg max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-semibold text-white">Kirim Pull Request ke Mentor</h3>
            <div className="space-y-3">
              <p className="text-xs text-[#8b949e]">
                Kirimkan hasil pekerjaan kamu untuk direview oleh mentor.
              </p>
              <div>
                <label className="text-xs text-[#8b949e] block mb-1">Catatan Tambahan (Opsional)</label>
                <textarea 
                  value={prNoteInput}
                  onChange={(e) => setPrNoteInput(e.target.value)}
                  placeholder="Saya telah menyelesaikan tugas ini..."
                  className="w-full bg-[#0d1117] border border-[#30363d] px-3 py-1.5 rounded text-xs text-white outline-none focus:border-[#58a6ff] font-mono h-20 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  onClick={() => setShowPRModal(false)}
                  className="px-3 py-1.5 rounded text-xs text-[#8b949e] hover:text-white bg-[#21262d] border border-[#30363d]"
                >
                  Batal
                </button>
                <button 
                  onClick={executePullRequest}
                  className="px-3 py-1.5 rounded text-xs text-white bg-[#238636] hover:bg-[#2ea043] font-medium"
                >
                  Kirim PR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW IMAGE MODAL */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 cursor-pointer"
        >
          <img 
            src={previewImage} 
            alt="Preview" 
            className="max-w-full max-h-full rounded-lg shadow-2xl object-contain border border-[#30363d]" 
          />
        </div>
      )}
    </>
  );
}