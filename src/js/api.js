function Api() {
  const storage = Storage();

  const getBaseUrl = () => {
    const { username, repo, path } = state.config;
    return `${CONFIG.apiBase}/${username}/${repo}/contents/${path}`;
  };

  const getBaseHeaders = () => ({
    'Authorization': `Bearer ${state.config.token}`,
    'Accept': 'application/vnd.github+json'
  });

  const handleResponse = async (response) => {
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || `HTTP ${response.status}`);
    }
    return await response.json();
  };

  return {
    async getFile() {
      const response = await fetch(getBaseUrl(), {
        headers: getBaseHeaders()
      });
      return handleResponse(response);
    },

    async putFile(content, message) {
      const encodedContent = btoa(unescape(encodeURIComponent(content)));
      const body = {
        message,
        content: encodedContent,
        sha: state.fileSha
      };
      const response = await fetch(getBaseUrl(), {
        method: 'PUT',
        headers: { ...getBaseHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return handleResponse(response);
    }
  };
}
