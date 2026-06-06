function Storage() {
  return {
    get(key) {
      return localStorage.getItem(key) || '';
    },
    set(key, value) {
      localStorage.setItem(key, value);
    },
    loadConfig() {
      state.config.token = this.get(STORAGE_KEYS.token);
      state.config.username = this.get(STORAGE_KEYS.username);
      state.config.repo = this.get(STORAGE_KEYS.repo);
      state.config.path = this.get(STORAGE_KEYS.path);
      state.fileSha = this.get(STORAGE_KEYS.fileSha);
      state.postalCode = this.get(STORAGE_KEYS.postalCode) || '';
      document.getElementById('postalCode').value = state.postalCode;
    },
    saveConfig() {
      this.set(STORAGE_KEYS.token, state.config.token);
      this.set(STORAGE_KEYS.username, state.config.username);
      this.set(STORAGE_KEYS.repo, state.config.repo);
      this.set(STORAGE_KEYS.path, state.config.path);
    },
    saveLocation(locationStr) {
      state.postalCode = locationStr;
      this.set(STORAGE_KEYS.postalCode, locationStr);
    },
    saveSha(sha) {
      this.set(STORAGE_KEYS.fileSha, sha);
      state.fileSha = sha;
    },
    hasConfig() {
      return !!(state.config.token && state.config.username && state.config.repo && state.config.path);
    }
  };
}
