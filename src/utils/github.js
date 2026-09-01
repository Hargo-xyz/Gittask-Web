// src/utils/github.js

export function normalizeName(str = '') {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Ambil hingga 200 repositori user secara paralel (Page 1 & 2)
export async function getUserRepos(accessToken) {
  try {
    const [p1, p2] = await Promise.all([
      fetch('https://api.github.com/user/repos?per_page=100&page=1&sort=updated&type=all', {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github.v3+json' },
      }),
      fetch('https://api.github.com/user/repos?per_page=100&page=2&sort=updated&type=all', {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github.v3+json' },
      }),
    ]);

    const d1 = p1.ok ? await p1.json() : [];
    const d2 = p2.ok ? await p2.json() : [];

    const allRepos = [...(Array.isArray(d1) ? d1 : []), ...(Array.isArray(d2) ? d2 : [])];
    return { success: true, repos: allRepos };
  } catch (err) {
    return { success: false, repos: [] };
  }
}

// Verifikasi Seluruh Repositori Kurikulum secara PARALEL (Super Cepat < 1 detik)
export async function verifyCurriculumStatus(accessToken, username, targetWeeks, userRepos = []) {
  const statusMap = {};
  const lowerUser = (username || '').toLowerCase();
  const mentorOrg = "Ethereum-Jakarta";

  await Promise.all(
    targetWeeks.map(async (week) => {
      const targetRepo = week.repoName;
      const normTarget = normalizeName(targetRepo);

      // 1. Pencocokan Cepat dari Array User Repos
      const localMatch = userRepos.find(r => {
        const rNorm = normalizeName(r.name);
        if (rNorm === normTarget) return true;
        
        // Cek jika mengandung nama repo target & nomor week cocok
        if (rNorm.includes(normTarget) || normTarget.includes(rNorm)) {
          const wId = week.id; // contoh "p1-w2"
          const parts = wId.split('-');
          const wNum = parts[1]?.replace('w', '');
          const rLower = r.name.toLowerCase();
          if (wNum && (rLower.includes(`week${wNum}`) || rLower.includes(`w${wNum}`))) {
            return true;
          }
        }
        return false;
      });

      if (localMatch) {
        statusMap[targetRepo] = { isForked: true, repoName: localMatch.name };
        return;
      }

      // 2. Direct API Check paralel (Pengecekan langsung ke akun user)
      try {
        const directRes = await fetch(`https://api.github.com/repos/${username}/${targetRepo}`, {
          headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github.v3+json' },
        });
        if (directRes.status === 200) {
          statusMap[targetRepo] = { isForked: true, repoName: targetRepo };
          return;
        }
      } catch (e) {}

      // 3. Direct API Check paralel ke Daftar Fork Repo Mentor
      try {
        const forksRes = await fetch(`https://api.github.com/repos/${mentorOrg}/${targetRepo}/forks?per_page=100`, {
          headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github.v3+json' },
        });
        if (forksRes.ok) {
          const forksData = await forksRes.json();
          if (Array.isArray(forksData)) {
            const userFork = forksData.find(f => f.owner && f.owner.login.toLowerCase() === lowerUser);
            if (userFork) {
              statusMap[targetRepo] = { isForked: true, repoName: userFork.name };
              return;
            }
          }
        }
      } catch (e) {}

      statusMap[targetRepo] = { isForked: false, repoName: targetRepo };
    })
  );

  return statusMap;
}

export async function fetchRepoTree(accessToken, owner, repo) {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github.v3+json' },
    });
    let data = await res.json();

    if (!res.ok) {
      const fallback = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`, {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github.v3+json' },
      });
      data = await fallback.json();
      if (!fallback.ok) return { success: false, message: data.message };
    }

    const materials = [];
    const quizzes = [];

    (data.tree || []).forEach((item) => {
      if (item.type === 'blob') {
        if (item.path.endsWith('.md')) materials.push({ path: item.path, label: item.path });
        else if (item.path.endsWith('.js') || item.path.endsWith('.json')) quizzes.push({ path: item.path, label: item.path });
      }
    });

    return { success: true, materials, quizzes };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function fetchFileContent(accessToken, owner, repo, path) {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github.v3+json' },
    });
    const data = await res.json();
    if (res.ok) {
      const content = decodeURIComponent(escape(atob(data.content.replace(/\s/g, ''))));
      return { success: true, content, sha: data.sha };
    }
    return { success: false, message: data.message };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function pushCodeToGitHub(accessToken, owner, repo, path, content, commitMessage) {
  try {
    const currentFile = await fetchFileContent(accessToken, owner, repo, path);
    const sha = currentFile.success ? currentFile.sha : undefined;

    const body = {
      message: commitMessage || `update ${path}`,
      content: btoa(unescape(encodeURIComponent(content))),
      ...(sha && { sha }),
    };

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return res.ok ? { success: true, data } : { success: false, message: data.message };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function createPullRequest(accessToken, username, repoName, note) {
  try {
    const mentorOrg = "Ethereum-Jakarta";
    const body = {
      title: `[TUGAS] ${repoName} - @${username}`,
      head: `${username}:main`,
      base: 'main',
      body: note || `Tugas ${repoName} diselesaikan oleh @${username}.`,
    };

    const res = await fetch(`https://api.github.com/repos/${mentorOrg}/${repoName}/pulls`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return res.ok ? { success: true, url: data.html_url, mentor: mentorOrg } : { success: false, message: data.message };
  } catch (err) {
    return { success: false, message: err.message };
  }
}