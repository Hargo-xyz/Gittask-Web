// src/app/page.js
"use client";

import { useState, useEffect, useRef } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import {
  getWebContainerInstance,
  buildFileSystemTree,
} from "../utils/webcontainer";
import {
  fetchRepoTree,
  fetchFileContent,
  pushCodeToGitHub,
  createPullRequest,
  getUserRepos,
  verifyCurriculumStatus,
} from "../utils/github";
import { CURRICULUM_DATA, MENTOR_ORG } from "../data/curriculumData";
import { resolvePath } from "../utils/treeUtils";

import CurriculumDashboard from "../components/CurriculumDashboard";
import WorkspaceHeader from "../components/WorkspaceHeader";
import SidebarPanel from "../components/SidebarPanel";
import CodeEditorPanel from "../components/CodeEditorPanel";
import Modals from "../components/Modals";
import LoginPage from "../components/LoginPage";
import OnboardingTour from "../components/OnboardingTour";

function Workspace() {
  const { data: session } = useSession();

  const [currentView, setCurrentView] = useState("dashboard");
  const [selectedWeekInfo, setSelectedWeekInfo] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  const webcontainerRef = useRef(null);
  const [isContainerReady, setIsContainerReady] = useState(false);
  const [activePortUrl, setActivePortUrl] = useState(null);
  const [cwd, setCwd] = useState("/");

  // Layout Panels State
  const [sidebarTab, setSidebarTab] = useState("explorer");
  const [showSidebar, setShowSidebar] = useState(true);
  const [showEditor, setShowEditor] = useState(true);
  const [showTerminal, setShowTerminal] = useState(true);
  const [isEditorMaximized, setIsEditorMaximized] = useState(false);

  const [sidebarWidth, setSidebarWidth] = useState(25);
  const [isDraggingWidth, setIsDraggingWidth] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(200);
  const [isDraggingTerminal, setIsDraggingTerminal] = useState(false);

  const [statusMap, setStatusMap] = useState({});
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const hasInitialSyncedRef = useRef(false);

  const [selectedRepo, setSelectedRepo] = useState("");
  const [materialsList, setMaterialsList] = useState([]);
  const [selectedMaterialPath, setSelectedMaterialPath] = useState("");
  const [quizzesList, setQuizzesList] = useState([]);

  const [openFiles, setOpenFiles] = useState([]);
  const [activeFilePath, setActiveFilePath] = useState("");
  const [filesContentMap, setFilesContentMap] = useState({});

  const [materialText, setMaterialText] = useState(
    "# Welcome\nPilih minggu kurikulum untuk mulai.",
  );
  const [previewImage, setPreviewImage] = useState(null);

  const [terminalInput, setTerminalInput] = useState("");
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [terminalOutput, setTerminalOutput] = useState([]);
  const terminalBottomRef = useRef(null);

  const [toast, setToast] = useState(null);
  const [showPushModal, setShowPushModal] = useState(false);
  const [commitMessageInput, setCommitMessageInput] = useState("");
  const [showPRModal, setShowPRModal] = useState(false);
  const [prNoteInput, setPrNoteInput] = useState("");

  const [showCreateFileModal, setShowCreateFileModal] = useState(false);
  const [newFilePathInput, setNewFilePathInput] = useState("");
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderPathInput, setNewFolderPathInput] = useState("");
  const [targetFolderContext, setTargetFolderContext] = useState("");

  // STATE ONBOARDING TOUR (DEFAULT FALSE)
  const [isTourOpen, setIsTourOpen] = useState(false);

  const [isLoadingMaterial, setIsLoadingMaterial] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPullRequesting, setIsPullRequesting] = useState(false);

  const saveTimeoutRef = useRef(null);

  const showToastNotification = (message, type = "info") =>
    setToast({ message, type });

  const appendTerminalOutput = (type, text) =>
    setTerminalOutput((prev) => [...prev, { type, text }]);

  const fixMarkdownImageUrls = (content, owner, repo) => {
    if (!content) return "";
    const rawBaseUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/`;
    return content.replace(
      /!\[(.*?)\]\(((?!\/|http).+?)\)/g,
      (match, alt, src) => {
        const cleanSrc = src.replace(/^\.\//, "");
        return `![${alt}](${rawBaseUrl}${cleanSrc})`;
      },
    );
  };

  useEffect(() => {
    let isMounted = true;
    async function initContainer() {
      try {
        const instance = await getWebContainerInstance();
        if (!instance) return;
        webcontainerRef.current = instance;
        if (isMounted) {
          setIsContainerReady(true);
          showToastNotification("Runtime Engine Ready", "success");
          instance.on("server-ready", (port, url) => {
            setActivePortUrl(url);
            showToastNotification(`Server running di Port ${port}`, "success");
          });
        }
      } catch (err) {
        if (isMounted)
          showToastNotification(`Boot Error: ${err.message}`, "error");
      }
    }
    initContainer();
    return () => {
      isMounted = false;
    };
  }, []);

  // CEK TOUR DASHBOARD (HANYA MUNCUL 1X SAAT LOGIN PERTAMA KALI)
  useEffect(() => {
    if (
      session?.accessToken &&
      session?.user?.name &&
      !hasInitialSyncedRef.current
    ) {
      hasInitialSyncedRef.current = true;
      loadStatusFromDatabase();

      const dashboardTourKey = `gittask_tour_dashboard_${session.user.name.toLowerCase()}`;
      const hasSeenDashboardTour = localStorage.getItem(dashboardTourKey);

      if (!hasSeenDashboardTour) {
        setIsTourOpen(true);
        localStorage.setItem(dashboardTourKey, "true");
      }
    }
  }, [session]);

  const loadStatusFromDatabase = async () => {
    setIsLoadingRepos(true);
    try {
      const res = await fetch("/api/user/status");
      const data = await res.json();

      if (
        data.success &&
        data.statusMap &&
        Object.keys(data.statusMap).length > 0
      ) {
        setStatusMap(data.statusMap);
        setIsLoadingRepos(false);
      } else {
        await syncWithGitHubAndSave();
      }
    } catch (err) {
      console.error("Gagal membaca dari Supabase:", err);
      await syncWithGitHubAndSave();
    }
  };

  const syncWithGitHubAndSave = async () => {
    if (!session?.accessToken || !session?.user?.name) return;
    setIsLoadingRepos(true);
    showToastNotification("Menyingkronkan data dengan GitHub…", "info");

    const userReposRes = await getUserRepos(session.accessToken);
    const userRepos = userReposRes.repos || [];

    const allWeeks = [];
    CURRICULUM_DATA.forEach((group) =>
      group.weeks.forEach((w) => allWeeks.push(w)),
    );

    const verifiedMap = await verifyCurriculumStatus(
      session.accessToken,
      session.user.name,
      allWeeks,
      userRepos,
    );

    setStatusMap(verifiedMap);
    setIsLoadingRepos(false);

    try {
      await fetch("/api/user/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusMap: verifiedMap }),
      });
      showToastNotification(
        "Status kurikulum tersimpan di Supabase!",
        "success",
      );
    } catch (err) {
      console.error("Gagal menyimpan ke Supabase:", err);
    }
  };

  useEffect(() => {
    if (showTerminal)
      terminalBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalOutput, showTerminal]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingWidth) {
        const newWidth = (e.clientX / window.innerWidth) * 100;
        if (newWidth > 15 && newWidth < 50) setSidebarWidth(newWidth);
      }
      if (isDraggingTerminal) {
        const calculatedHeight = window.innerHeight - e.clientY - 32;
        if (
          calculatedHeight >= 60 &&
          calculatedHeight <= window.innerHeight - 120
        )
          setTerminalHeight(calculatedHeight);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingWidth(false);
      setIsDraggingTerminal(false);
    };

    if (isDraggingWidth || isDraggingTerminal) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingWidth, isDraggingTerminal]);

  const handleDeleteFile = async (filePath) => {
    if (isReadOnly) {
      showToastNotification(
        "Read-Only mode tidak dapat menghapus file.",
        "error",
      );
      return;
    }
    if (!filePath || !confirm(`Hapus file '${filePath}'?`)) return;

    setFilesContentMap((prev) => {
      const next = { ...prev };
      delete next[filePath];
      return next;
    });

    setQuizzesList((prev) => prev.filter((q) => q.path !== filePath));

    const remainingOpen = openFiles.filter((p) => p !== filePath);
    setOpenFiles(remainingOpen);
    if (activeFilePath === filePath) {
      setActiveFilePath(remainingOpen[remainingOpen.length - 1] || "");
    }

    if (webcontainerRef.current) {
      try {
        await webcontainerRef.current.fs.rm(filePath, { recursive: true });
      } catch (err) {
        console.error("WebContainer RM Error:", err);
      }
    }

    showToastNotification(`File '${filePath}' dihapus.`, "success");
  };

  const handleSelectWeekRepo = async (
    weekItem,
    readOnlyMode = false,
    overrideRepoName = "",
  ) => {
    setSelectedWeekInfo(weekItem);
    setIsReadOnly(readOnlyMode);

    const repoName = overrideRepoName || weekItem.repoName;
    setSelectedRepo(repoName);
    setCurrentView("workspace");
    setCwd("/");

    // CEK TOUR WORKSPACE (HANYA MUNCUL 1X SAAT PERTAMA KALI MASUK REPO WORKSPACE)
    const workspaceTourKey = `gittask_tour_workspace_${session?.user?.name?.toLowerCase()}`;
    const hasSeenWorkspaceTour = localStorage.getItem(workspaceTourKey);

    if (!hasSeenWorkspaceTour) {
      setIsTourOpen(true);
      localStorage.setItem(workspaceTourKey, "true");
    } else {
      setIsTourOpen(false);
    }

    const targetOwner = readOnlyMode ? MENTOR_ORG : session.user.name;
    showToastNotification(`Memuat repo ${targetOwner}/${repoName}…`, "info");

    const treeRes = await fetchRepoTree(
      session.accessToken,
      targetOwner,
      repoName,
    );

    if (treeRes.success) {
      setMaterialsList(treeRes.materials);
      const targetMatPath = treeRes.materials[0]?.path || "";
      if (targetMatPath) {
        setSelectedMaterialPath(targetMatPath);
        loadMaterial(targetOwner, repoName, targetMatPath);
      } else {
        setMaterialText("# Readme belum tersedia.");
      }

      setQuizzesList(treeRes.quizzes || []);

      const loadedFilesMap = {};
      if (treeRes.quizzes && treeRes.quizzes.length > 0) {
        await Promise.all(
          treeRes.quizzes.map(async (quiz) => {
            const fileRes = await fetchFileContent(
              session.accessToken,
              targetOwner,
              repoName,
              quiz.path,
            );
            if (fileRes.success) loadedFilesMap[quiz.path] = fileRes.content;
          }),
        );
      }

      setFilesContentMap(loadedFilesMap);
      const firstFilePath =
        treeRes.quizzes[0]?.path || Object.keys(loadedFilesMap)[0] || "";

      if (firstFilePath) {
        setOpenFiles([firstFilePath]);
        setActiveFilePath(firstFilePath);
      }

      if (webcontainerRef.current && Object.keys(loadedFilesMap).length > 0) {
        try {
          const fileTree = buildFileSystemTree(loadedFilesMap);
          await webcontainerRef.current.mount(fileTree);
          showToastNotification(
            `Files ${repoName} berhasil di-mount`,
            "success",
          );
        } catch (mErr) {
          showToastNotification(`Mount Error: ${mErr.message}`, "error");
        }
      }
    } else {
      showToastNotification(`Gagal memuat repo: ${treeRes.message}`, "error");
    }
  };

  const loadMaterial = async (owner, repoName, path) => {
    setIsLoadingMaterial(true);
    const res = await fetchFileContent(
      session.accessToken,
      owner,
      repoName,
      path,
    );
    if (res.success) {
      const processedText = fixMarkdownImageUrls(res.content, owner, repoName);
      setMaterialText(processedText);
    }
    setIsLoadingMaterial(false);
  };

  const handleSelectMaterial = (path) => {
    setSelectedMaterialPath(path);
    const owner = isReadOnly ? MENTOR_ORG : session.user.name;
    loadMaterial(owner, selectedRepo, path);
  };

  const openCreateFileModal = (targetFolder = "") => {
    setTargetFolderContext(targetFolder);
    setNewFilePathInput("");
    setShowCreateFileModal(true);
  };

  const openCreateFolderModal = (targetFolder = "") => {
    setTargetFolderContext(targetFolder);
    setNewFolderPathInput("");
    setShowCreateFolderModal(true);
  };

  const handleCreateFileSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;

    let cleanInput = newFilePathInput.trim().replace(/^\//, "");
    if (!cleanInput) return;

    const fullPath = targetFolderContext
      ? `${targetFolderContext}/${cleanInput}`
      : cleanInput;

    if (filesContentMap[fullPath] !== undefined) {
      showToastNotification(`File '${fullPath}' sudah ada.`, "error");
      return;
    }

    const defaultContent = fullPath.endsWith(".json")
      ? "{\n  \n}"
      : "// JavaScript File\n";
    setFilesContentMap((prev) => ({ ...prev, [fullPath]: defaultContent }));
    setQuizzesList((prev) => [...prev, { path: fullPath, label: fullPath }]);

    if (webcontainerRef.current) {
      try {
        if (fullPath.includes("/")) {
          const dirPath = fullPath.substring(0, fullPath.lastIndexOf("/"));
          await webcontainerRef.current.fs.mkdir(dirPath, { recursive: true });
        }
        await webcontainerRef.current.fs.writeFile(fullPath, defaultContent);
      } catch (err) {
        showToastNotification(`FS Error: ${err.message}`, "error");
      }
    }

    openFileTab(fullPath);
    setShowCreateFileModal(false);
    setNewFilePathInput("");
    showToastNotification(`File '${fullPath}' dibuat.`, "success");
  };

  const handleCreateFolderSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;

    let cleanInput = newFolderPathInput
      .trim()
      .replace(/^\//, "")
      .replace(/\/$/, "");
    if (!cleanInput) return;

    const fullFolder = targetFolderContext
      ? `${targetFolderContext}/${cleanInput}`
      : cleanInput;

    const gitkeepPath = `${fullFolder}/.gitkeep`;

    if (filesContentMap[gitkeepPath] !== undefined) {
      showToastNotification(`Folder '${fullFolder}' sudah ada.`, "error");
      return;
    }

    setFilesContentMap((prev) => ({ ...prev, [gitkeepPath]: "" }));
    setQuizzesList((prev) => [
      ...prev,
      { path: gitkeepPath, label: gitkeepPath },
    ]);

    if (webcontainerRef.current) {
      try {
        await webcontainerRef.current.fs.mkdir(fullFolder, { recursive: true });
        await webcontainerRef.current.fs.writeFile(gitkeepPath, "");
      } catch (err) {
        showToastNotification(`FS Error: ${err.message}`, "error");
      }
    }

    setShowCreateFolderModal(false);
    setNewFolderPathInput("");
    showToastNotification(`Folder '${fullFolder}' dibuat.`, "success");
  };

  const handleCodeChange = (newContent) => {
    const content = newContent || "";

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setFilesContentMap((prev) => ({ ...prev, [activeFilePath]: content }));
      if (webcontainerRef.current && activeFilePath) {
        try {
          await webcontainerRef.current.fs.writeFile(activeFilePath, content);
        } catch (err) {
          console.error("File sync error:", err);
        }
      }
    }, 300);
  };

  const openFileTab = (path) => {
    if (path.endsWith(".gitkeep")) return;
    if (!openFiles.includes(path)) setOpenFiles([...openFiles, path]);
    setActiveFilePath(path);
  };

  const closeFileTab = (e, path) => {
    e.stopPropagation();
    const filtered = openFiles.filter((p) => p !== path);
    setOpenFiles(filtered);
    if (activeFilePath === path)
      setActiveFilePath(filtered[filtered.length - 1] || "");
  };

  const executeContainerCommand = async (commandLine) => {
    if (!webcontainerRef.current || !isContainerReady) {
      showToastNotification("WebContainer engine belum siap…", "info");
      return;
    }

    const rawTrimmed = commandLine.trim();
    if (!rawTrimmed) return;

    appendTerminalOutput("command", `$ ${rawTrimmed}`);

    const args = rawTrimmed.split(/\s+/);
    const cmd = args.shift();

    if (cmd === "clear" || cmd === "cls") {
      setTerminalOutput([]);
      return;
    }

    if (cmd === "cd") {
      const targetDir = args[0] || "/";
      const resolved = resolvePath(cwd, targetDir);

      try {
        const checkPath = resolved === "/" ? "." : resolved.replace(/^\//, "");
        await webcontainerRef.current.fs.readdir(checkPath);
        setCwd(resolved);
      } catch (err) {
        appendTerminalOutput(
          "error",
          `bash: cd: ${targetDir}: No such file or directory`,
        );
      }
      return;
    }

    try {
      const spawnCwd = cwd === "/" ? "." : cwd.replace(/^\//, "");
      const process = await webcontainerRef.current.spawn(cmd, args, {
        cwd: spawnCwd,
      });

      process.output.pipeTo(
        new WritableStream({
          write(data) {
            appendTerminalOutput("output", data);
          },
        }),
      );
      const exitCode = await process.exit;
      if (exitCode !== 0)
        appendTerminalOutput("error", `Exited with code ${exitCode}`);
    } catch (err) {
      appendTerminalOutput("error", `Spawn Error: ${err.message}`);
    }
  };

  const handleTerminalSubmit = (e) => {
    e.preventDefault();
    const rawCmd = terminalInput.trim();
    if (!rawCmd) return;
    setCommandHistory((prev) => [...prev, rawCmd]);
    setHistoryIndex(-1);
    setTerminalInput("");
    executeContainerCommand(rawCmd);
  };

  const handleKeyDownTerminal = (e) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIdx =
          historyIndex + 1 < commandHistory.length
            ? historyIndex + 1
            : historyIndex;
        setHistoryIndex(nextIdx);
        setTerminalInput(
          commandHistory[commandHistory.length - 1 - nextIdx] || "",
        );
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setTerminalInput(
          commandHistory[commandHistory.length - 1 - nextIdx] || "",
        );
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setTerminalInput("");
      }
    }
  };

  const executePush = async () => {
    if (isReadOnly) {
      showToastNotification("Fork repo dulu sebelum push.", "error");
      return;
    }
    if (!activeFilePath) return;
    setShowPushModal(false);
    setIsPushing(true);
    const msg = commitMessageInput.trim() || `update ${activeFilePath}`;
    showToastNotification(`Pushing commit "${msg}"…`, "info");
    try {
      const codeToPush = filesContentMap[activeFilePath] || "";
      const pushResult = await pushCodeToGitHub(
        session.accessToken,
        session.user.name,
        selectedRepo,
        activeFilePath,
        codeToPush,
        msg,
      );
      if (pushResult.success) {
        showToastNotification(`Commit berhasil di-push ke GitHub.`, "success");
      } else {
        showToastNotification(`Push gagal: ${pushResult.message}`, "error");
      }
    } catch (err) {
      showToastNotification(`Error: ${err.message}`, "error");
    }
    setIsPushing(false);
    setCommitMessageInput("");
  };

  const executePullRequest = async () => {
    if (isReadOnly) {
      showToastNotification("Fork repo dulu sebelum PR.", "error");
      return;
    }
    setShowPRModal(false);
    setIsPullRequesting(true);
    showToastNotification("Mengirim Pull Request…", "info");
    try {
      const prResult = await createPullRequest(
        session.accessToken,
        session.user.name,
        selectedRepo,
        prNoteInput.trim(),
      );
      if (prResult.success) {
        showToastNotification(
          `Pull Request terkirim ke @${prResult.mentor}.`,
          "success",
        );
      } else {
        showToastNotification(`PR gagal: ${prResult.message}`, "error");
      }
    } catch (err) {
      showToastNotification(`Error: ${err.message}`, "error");
    }
    setIsPullRequesting(false);
    setPrNoteInput("");
  };

  if (!session) {
    return <LoginPage />;
  }

  const isAnyDragging = isDraggingWidth || isDraggingTerminal;

  return (
    <div
      className={`flex flex-col h-screen bg-[#0d1117] text-[#c9d1d9] font-sans ${
        isAnyDragging ? "select-none" : ""
      }`}
    >
      {isAnyDragging && (
        <div
          className={`fixed inset-0 z-[9999] bg-transparent ${
            isDraggingWidth ? "cursor-col-resize" : "cursor-row-resize"
          }`}
        />
      )}

      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2.5 bg-[#161b22] border border-[#30363d] text-xs px-3.5 py-2.5 rounded-md shadow-2xl select-none">
          <span
            className={`w-2 h-2 rounded-full ${
              toast.type === "error"
                ? "bg-[#f85149]"
                : toast.type === "success"
                  ? "bg-[#3fb950]"
                  : "bg-[#58a6ff]"
            }`}
          />
          <span className="text-white font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="text-[#8b949e] hover:text-white ml-2 cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* DASHBOARD VS WORKSPACE VIEW */}
      {currentView === "dashboard" ? (
        <CurriculumDashboard
          session={session}
          statusMap={statusMap}
          isLoadingRepos={isLoadingRepos}
          onSelectWeekRepo={handleSelectWeekRepo}
          onRefreshRepos={syncWithGitHubAndSave}
        />
      ) : (
        <>
          <WorkspaceHeader
            selectedWeekInfo={selectedWeekInfo}
            selectedRepo={selectedRepo}
            isReadOnly={isReadOnly}
            activePortUrl={activePortUrl}
            isPullRequesting={isPullRequesting}
            onBackToCurriculum={() => {
              setCurrentView("dashboard");
              setIsTourOpen(false);
            }}
            onOpenPRModal={() => setShowPRModal(true)}
            session={session}
            showMaterial={showSidebar}
            setShowMaterial={setShowSidebar}
            showEditor={showEditor}
            setShowEditor={setShowEditor}
            showTerminal={showTerminal}
            setShowTerminal={setShowTerminal}
          />

          <div className="flex flex-1 overflow-hidden relative">
            {showSidebar && !isEditorMaximized && (
              <SidebarPanel
                activeTab={sidebarTab}
                setActiveTab={setSidebarTab}
                width={sidebarWidth}
                filesContentMap={filesContentMap}
                activeFilePath={activeFilePath}
                openFileTab={openFileTab}
                onDeleteFile={handleDeleteFile}
                onOpenCreateFileModal={openCreateFileModal}
                onOpenCreateFolderModal={openCreateFolderModal}
                isReadOnly={isReadOnly}
                materialsList={materialsList}
                quizzesList={quizzesList}
                selectedMaterialPath={selectedMaterialPath}
                onSelectMaterial={handleSelectMaterial}
                isLoadingMaterial={isLoadingMaterial}
                materialText={materialText}
                session={session}
                selectedRepo={selectedRepo}
                setPreviewImage={setPreviewImage}
              />
            )}

            {showSidebar && !isEditorMaximized && (
              <div
                onMouseDown={() => setIsDraggingWidth(true)}
                className="w-1 bg-[#161b22] hover:bg-[#58a6ff] cursor-col-resize z-10 shrink-0 transition-colors"
              />
            )}

            <CodeEditorPanel
              isEditorMaximized={isEditorMaximized}
              setIsEditorMaximized={setIsEditorMaximized}
              openFiles={openFiles}
              activeFilePath={activeFilePath}
              setActiveFilePath={setActiveFilePath}
              closeFileTab={closeFileTab}
              filesContentMap={filesContentMap}
              handleCodeChange={handleCodeChange}
              showTerminal={showTerminal}
              setIsDraggingTerminal={setIsDraggingTerminal}
              executeContainerCommand={executeContainerCommand}
              isPushing={isPushing}
              setShowPushModal={setShowPushModal}
              terminalHeight={terminalHeight}
              terminalOutput={terminalOutput}
              terminalBottomRef={terminalBottomRef}
              handleTerminalSubmit={handleTerminalSubmit}
              setTerminalInput={setTerminalInput}
              terminalInput={terminalInput}
              handleKeyDownTerminal={handleKeyDownTerminal}
              isReadOnly={isReadOnly}
              isContainerReady={isContainerReady}
              cwd={cwd}
            />
          </div>
        </>
      )}

      {/* MODALS */}
      <Modals
        showCreateFileModal={showCreateFileModal}
        setShowCreateFileModal={setShowCreateFileModal}
        newFilePathInput={newFilePathInput}
        setNewFilePathInput={setNewFilePathInput}
        handleCreateFileSubmit={handleCreateFileSubmit}
        showCreateFolderModal={showCreateFolderModal}
        setShowCreateFolderModal={setShowCreateFolderModal}
        newFolderPathInput={newFolderPathInput}
        setNewFolderPathInput={setNewFolderPathInput}
        handleCreateFolderSubmit={handleCreateFolderSubmit}
        targetFolderContext={targetFolderContext}
        showPushModal={showPushModal}
        setShowPushModal={setShowPushModal}
        activeFilePath={activeFilePath}
        commitMessageInput={commitMessageInput}
        setCommitMessageInput={setCommitMessageInput}
        executePush={executePush}
        showPRModal={showPRModal}
        setShowPRModal={setShowPRModal}
        prNoteInput={prNoteInput}
        setPrNoteInput={setPrNoteInput}
        executePullRequest={executePullRequest}
        previewImage={previewImage}
        setPreviewImage={setPreviewImage}
      />

      {/* ONBOARDING TOUR */}
      <OnboardingTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        currentView={currentView}
      />
    </div>
  );
}

export default function App() {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <Workspace />
    </SessionProvider>
  );
}