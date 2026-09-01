// src/utils/webcontainer.js
import { WebContainer } from '@webcontainer/api';

let webcontainerInstancePromise = null;

export async function getWebContainerInstance() {
  if (typeof window === 'undefined') return null;
  if (!webcontainerInstancePromise) {
    webcontainerInstancePromise = WebContainer.boot();
  }
  return webcontainerInstancePromise;
}

export function buildFileSystemTree(filesMap) {
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