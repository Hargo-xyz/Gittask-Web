// src/components/Modals.jsx
'use client';

export default function Modals({
  showCreateFileModal,
  setShowCreateFileModal,
  newFilePathInput,
  setNewFilePathInput,
  handleCreateFileSubmit,
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
      {/* PREVIEW GAMBAR LIGHTBOX */}
      {previewImage && (
        <div onClick={() => setPreviewImage(null)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer">
          <div className="relative max-w-3xl max-h-[85vh]">
            <img src={previewImage} alt="Preview" className="max-w-full max-h-[80vh] rounded border border-[#3c3c3c] object-contain shadow-2xl" />
            <button onClick={() => setPreviewImage(null)} className="absolute -top-3 -right-3 bg-[#252526] hover:bg-[#f14c4c] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-mono">✕</button>
          </div>
        </div>
      )}

      {/* MODAL BUAT FILE BARU */}
      {showCreateFileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateFileSubmit} className="bg-[#252526] border border-[#3c3c3c] rounded max-w-sm w-full p-4 space-y-3 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#3c3c3c] pb-2">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Buat File Baru</h3>
              <button type="button" onClick={() => setShowCreateFileModal(false)} className="text-[#858585] hover:text-white text-xs font-mono">✕</button>
            </div>
            <p className="text-xs text-[#858585]">Masukkan path file (misal: <code className="text-[#9cdcfe]">app.js</code> atau <code className="text-[#9cdcfe]">routes/devs.js</code>):</p>
            <input 
              type="text" 
              value={newFilePathInput}
              onChange={(e) => setNewFilePathInput(e.target.value)}
              placeholder="contoh: app.js"
              className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded p-2 text-xs text-[#cccccc] outline-none font-mono"
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowCreateFileModal(false)} className="px-3 py-1 rounded text-xs bg-[#3c3c3c] text-white font-medium">Batal</button>
              <button type="submit" className="px-3 py-1 rounded text-xs bg-[#0e639c] text-white font-medium">Buat File</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL PUSH COMMIT */}
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
              className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded p-2 text-xs text-[#cccccc] outline-none font-mono"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setShowPushModal(false)} className="px-3 py-1 rounded text-xs bg-[#3c3c3c] text-white font-medium">Batal</button>
              <button onClick={executePush} className="px-3 py-1 rounded text-xs bg-[#0e639c] text-white font-medium">Push</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PULL REQUEST */}
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
              placeholder="Contoh: Selesai mengerjakan tugas minggu ini."
              className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded p-2 text-xs text-[#cccccc] outline-none resize-none font-mono"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setShowPRModal(false)} className="px-3 py-1 rounded text-xs bg-[#3c3c3c] text-white font-medium">Batal</button>
              <button onClick={executePullRequest} className="px-3 py-1 rounded text-xs bg-[#0e639c] text-white font-medium">Kirim PR</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}