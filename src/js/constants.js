const STORAGE_KEYS = {
  token: 'github_token',
  username: 'github_username',
  repo: 'github_repo',
  path: 'github_path',
  fileSha: 'github_file_sha',
  postalCode: 'postal_code'
};

const CONFIG = {
  apiBase: 'https://api.github.com/repos'
};

const REGEX = {
  weather: /^(.+?)，(\d+)-(\d+)℃(?:\s*（(.+?)）)?$/,
  sleep: /^(\d{1,2}):(\d{2})\s*睡着，(\d{1,2}):(\d{2})\s*(苏醒|闹钟|自然醒)(?:\s*（(.+?)）)?$/,
  diet: /^(?:早饭：(.*?)、)?午饭：(.*?)、晚饭：(.*)$/
};
