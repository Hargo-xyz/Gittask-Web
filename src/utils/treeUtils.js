// src/utils/treeUtils.js

/**
 * Membangun struktur folder bertingkat (Tree) dari filesContentMap.
 * Menyembunyikan file `.gitkeep` dari tampilan UI.
 */
export function buildFolderTree(filesMap) {
  const root = [];

  Object.keys(filesMap || {}).forEach((filePath) => {
    if (filePath === '.gitkeep') return;

    const parts = filePath.split('/').filter(Boolean);
    let currentLevel = root;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      const isGitkeep = isFile && part === '.gitkeep';
      if (isGitkeep) return;

      const currentPath = parts.slice(0, index + 1).join('/');
      let existingNode = currentLevel.find((item) => item.name === part);

      if (!existingNode) {
        existingNode = {
          name: part,
          path: currentPath,
          type: isFile ? 'file' : 'folder',
          children: isFile ? null : []
        };
        currentLevel.push(existingNode);
      }

      if (!isFile) {
        currentLevel = existingNode.children;
      }
    });
  });

  const sortNodes = (nodes) => {
    nodes.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'folder' ? -1 : 1;
    });
    nodes.forEach((node) => {
      if (node.children) sortNodes(node.children);
    });
  };

  sortNodes(root);
  return root;
}

/**
 * Membangun struktur folder bertingkat dari array materi & kuis (materials & quizzes list)
 */
export function buildFolderTreeFromList(itemsList) {
  const root = [];

  (itemsList || []).forEach((item) => {
    const filePath = typeof item === 'string' ? item : item?.path;
    if (!filePath || filePath.endsWith('.gitkeep')) return;

    const parts = filePath.split('/').filter(Boolean);
    let currentLevel = root;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      const isGitkeep = isFile && part === '.gitkeep';
      if (isGitkeep) return;

      const currentPath = parts.slice(0, index + 1).join('/');
      let existingNode = currentLevel.find((n) => n.name === part);

      if (!existingNode) {
        existingNode = {
          name: part,
          path: currentPath,
          type: isFile ? 'file' : 'folder',
          children: isFile ? null : []
        };
        currentLevel.push(existingNode);
      }

      if (!isFile) {
        currentLevel = existingNode.children;
      }
    });
  });

  const sortNodes = (nodes) => {
    nodes.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'folder' ? -1 : 1;
    });
    nodes.forEach((node) => {
      if (node.children) sortNodes(node.children);
    });
  };

  sortNodes(root);
  return root;
}

/**
 * Helper untuk menghitung path absolut navigasi `cd` terminal
 */
export function resolvePath(currentCwd, targetPath) {
  if (!targetPath || targetPath === '~' || targetPath === '/') return '/';
  
  let parts = [];
  if (targetPath.startsWith('/')) {
    parts = targetPath.split('/').filter(Boolean);
  } else {
    parts = (currentCwd + '/' + targetPath).split('/').filter(Boolean);
  }

  const stack = [];
  for (const p of parts) {
    if (p === '.') continue;
    if (p === '..') {
      stack.pop();
    } else {
      stack.push(p);
    }
  }

  return '/' + stack.join('/');
}