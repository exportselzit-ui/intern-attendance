// GitHub configuration
const GITHUB_CONFIG = {
    owner: 'exportstafft-ui',
    repo: 'intern-attendance',
    branch: 'main',
    token: ''
};

// GitHub API base URL
const GITHUB_API_BASE = 'https://api.github.com';

// Get file content from GitHub
async function getFileFromGitHub(filePath) {
    try {
        const url = `${GITHUB_API_BASE}/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${filePath}?ref=${GITHUB_CONFIG.branch}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch file');
        
        const data = await response.json();
        return JSON.parse(atob(data.content));
    } catch (error) {
        console.error('Error fetching file:', error);
        if (filePath === 'data/attendance.json') {
            return { records: [], interns: [] };
        }
        return null;
    }
}

// Save file to GitHub
async function saveFileToGitHub(filePath, content, commitMessage) {
    try {
        let currentSha = null;
        try {
            const currentFile = await getFileFromGitHub(filePath);
            if (currentFile && currentFile.sha) {
                currentSha = currentFile.sha;
            }
        } catch (e) {
        }
        
        const url = `${GITHUB_API_BASE}/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${filePath}`;
        
        const payload = {
            message: commitMessage,
            content: btoa(JSON.stringify(content, null, 2)),
            branch: GITHUB_CONFIG.branch
        };
        
        if (currentSha) {
            payload.sha = currentSha;
        }
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save file');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error saving file to GitHub:', error);
        return saveToLocalStorage(filePath, content);
    }
}

// Local storage fallback
function saveToLocalStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
    return { success: true, source: 'localStorage' };
}

function getFromLocalStorage(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

// Initialize GitHub info
function initGitHubInfo() {
    document.getElementById('repoInfo').textContent = `${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}`;
    document.getElementById('repoLink').href = `https://github.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}`;
}
