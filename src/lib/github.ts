export async function fetchGithubRepoReadme(repoUrl: string): Promise<string | null> {
  try {
    const u = new URL(repoUrl);
    if (!u.hostname.includes('github.com')) return null;
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    const owner = parts[0];
    const repo = parts[1];

    const tryPaths = [
      `https://raw.githubusercontent.com/${owner}/${repo}/main/README.md`,
      `https://raw.githubusercontent.com/${owner}/${repo}/master/README.md`,
    ];

    for (const url of tryPaths) {
      try {
        const resp = await fetch(url, { next: { revalidate: 60 } });
        if (!resp.ok) continue;
        const text = await resp.text();
        if (text && text.trim().length) return text;
      } catch (e) {
        // continue to next
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

export function isGithubRepoLink(link: string) {
  try {
    const u = new URL(link);
    return u.hostname.includes('github.com') && u.pathname.split('/').filter(Boolean).length >= 2;
  } catch {
    return false;
  }
}
