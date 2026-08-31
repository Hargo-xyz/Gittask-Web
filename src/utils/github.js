// src/utils/github.js
import { Octokit } from "octokit";

export const getUserRepos = async (accessToken) => {
  const octokit = new Octokit({ auth: accessToken });
  try {
    const res = await octokit.rest.repos.listForAuthenticatedUser({ sort: 'updated', per_page: 50 });
    return { success: true, repos: res.data };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const fetchRepoTree = async (accessToken, repoOwner, repoName) => {
  const octokit = new Octokit({ auth: accessToken });
  try {
    const repoInfo = await octokit.rest.repos.get({ owner: repoOwner, repo: repoName });
    const defaultBranch = repoInfo.data.default_branch;

    const treeRes = await octokit.rest.git.getTree({
      owner: repoOwner,
      repo: repoName,
      tree_sha: defaultBranch,
      recursive: "true",
    });

    const materials = [];
    const quizzes = [];

    treeRes.data.tree.forEach((item) => {
      if (item.type === "blob") {
        const lowerPath = item.path.toLowerCase();
        if (lowerPath.endsWith(".md")) {
          materials.push({
            name: item.path,
            path: item.path,
            label: item.path.replace(/\/README\.md$/i, '').replace(/README\.md$/i, 'Utama (Root)'),
          });
        } 
        else if (lowerPath.endsWith(".js") && !lowerPath.includes("node_modules")) {
          quizzes.push({
            name: item.path.split('/').pop(),
            path: item.path,
            label: item.path,
          });
        }
      }
    });

    return { success: true, materials, quizzes };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const fetchFileContent = async (accessToken, repoOwner, repoName, filePath) => {
  const octokit = new Octokit({ auth: accessToken });
  try {
    const res = await octokit.rest.repos.getContent({
      owner: repoOwner,
      repo: repoName,
      path: filePath,
    });
    const content = decodeURIComponent(escape(atob(res.data.content)));
    return { success: true, content };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Push dengan Custom Commit Message
export const pushCodeToGitHub = async (accessToken, repoOwner, repoName, fullFilePath, codeContent, customCommitMsg) => {
  const octokit = new Octokit({ auth: accessToken });
  try {
    let fileSha = undefined;
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner: repoOwner,
        repo: repoName,
        path: fullFilePath,
      });
      fileSha = data.sha;
    } catch (error) {
      console.log("File baru akan dibuat:", fullFilePath);
    }

    const commitMessage = customCommitMsg || `feat: update ${fullFilePath} via GitTask`;

    const response = await octokit.rest.repos.createOrUpdateFileContents({
      owner: repoOwner,
      repo: repoName,
      path: fullFilePath,
      message: commitMessage,
      content: btoa(codeContent),
      sha: fileSha,
    });

    return { success: true, url: response.data.content.html_url };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Pull Request dengan Custom Catatan Siswa
export const createPullRequest = async (accessToken, studentUsername, repoName, prNote = "") => {
  const octokit = new Octokit({ auth: accessToken });

  try {
    const repoInfo = await octokit.rest.repos.get({
      owner: studentUsername,
      repo: repoName,
    });

    if (!repoInfo.data.fork || !repoInfo.data.parent) {
      return { 
        success: false, 
        message: "Repository ini bukan hasil fork. Tidak dapat mengirim Pull Request ke mentor." 
      };
    }

    const mentorUsername = repoInfo.data.parent.owner.login;
    const mentorRepoName = repoInfo.data.parent.name; 
    const mentorDefaultBranch = repoInfo.data.parent.default_branch || 'main';
    const studentBranch = repoInfo.data.default_branch || 'main';

    let existingPR = null;
    try {
      const existingPulls = await octokit.rest.pulls.list({
        owner: mentorUsername,
        repo: mentorRepoName,
        head: `${studentUsername}:${studentBranch}`,
        state: 'open',
      });
      if (existingPulls.data.length > 0) {
        existingPR = existingPulls.data[0];
      }
    } catch (e) {
      console.warn("Mencoba membuat PR baru...", e);
    }

    const timeStamp = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
    const noteText = prNote ? `\n\n**Catatan Siswa:**\n> ${prNote}` : '';

    if (existingPR) {
      const updatedPR = await octokit.rest.pulls.update({
        owner: mentorUsername,
        repo: mentorRepoName,
        pull_number: existingPR.number,
        title: `[UPDATED] Tugas Selesai: ${studentUsername}`,
        body: `Tugas diperbarui oleh @${studentUsername} via GitTask Web pada ${timeStamp}.${noteText}`
      });

      return { 
        success: true, 
        isUpdate: true, 
        mentor: mentorUsername,
        prNumber: existingPR.number,
        url: updatedPR.data.html_url 
      };
    } 

    const response = await octokit.rest.pulls.create({
      owner: mentorUsername,
      repo: mentorRepoName,
      title: `Tugas Selesai: ${studentUsername}`,
      head: `${studentUsername}:${studentBranch}`,
      base: mentorDefaultBranch,
      body: `Tugas diselesaikan oleh @${studentUsername} melalui GitTask Web.${noteText}`
    });

    return { 
      success: true, 
      isUpdate: false, 
      mentor: mentorUsername,
      url: response.data.html_url 
    };

  } catch (error) {
    console.error("Gagal buat/update PR:", error);
    return { success: false, message: error.message };
  }
};