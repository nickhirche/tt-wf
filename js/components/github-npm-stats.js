function initGithubNpmStats() {
  function formatNumber(num) {
    if (num < 1000) {
      return num.toString();
    }
    if (num < 1000000) {
      const rounded = Math.floor(num / 100) / 10;
      if (rounded % 1 === 0) {
        return Math.floor(rounded) + 'k';
      }
      return rounded.toFixed(1).replace('.', ',') + 'k';
    }
    const rounded = Math.floor(num / 100000) / 10;
    if (rounded % 1 === 0) {
      return Math.floor(rounded) + 'M';
    }
    return rounded.toFixed(1).replace('.', ',') + 'M';
  }

  async function fetchRepoStars(repoFullName) {
    const response = await fetch(`https://api.github.com/repos/${repoFullName}`);
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    const repoData = await response.json();
    return repoData.stargazers_count;
  }

  async function fetchNpmDownloads(packageName) {
    const response = await fetch(
      `https://api.npmjs.org/downloads/point/last-month/${packageName}`
    );
    if (!response.ok) {
      throw new Error(`NPM API error: ${response.status}`);
    }
    const data = await response.json();
    return data.downloads || 0;
  }

  const githubElements = document.querySelectorAll('[data-github-stars="true"]');
  if (githubElements.length > 0) {
    fetchRepoStars('ueberdosis/tiptap')
      .then((starCount) => {
        githubElements.forEach((element) => {
          element.textContent = formatNumber(starCount);
        });
      })
      .catch((error) => {
        console.error('Error fetching repo stars:', error);
        githubElements.forEach((element) => {
          element.textContent = 'Error';
        });
      });
  }

  const npmElements = document.querySelectorAll('[data-npm-downloads="true"]');
  if (npmElements.length > 0) {
    const packageName = '@tiptap/core';
    fetchNpmDownloads(packageName)
      .then((downloadCount) => {
        npmElements.forEach((element) => {
          element.textContent = formatNumber(downloadCount);
        });
      })
      .catch((error) => {
        console.error('Error fetching NPM downloads:', error);
        npmElements.forEach((element) => {
          element.textContent = 'Error';
        });
      });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGithubNpmStats);
} else {
  initGithubNpmStats();
}
