const state = {
  config: {
    token: '',
    username: '',
    repo: '',
    path: ''
  },
  fileSha: '',
  entries: [],
  wakeType: '苏醒',
  formSpecialNotes: [],
  postalCode: '',
  currentPage: 1,
  pageSize: 7
};

async function createNewEntry() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const date = `${year}.${month}.${day}`;

  if (state.entries.some(entry => entry.date === date)) {
    Toast.show('今天的记录已存在，请编辑现有记录');
    return;
  }

  const postalCode = state.postalCode || Storage().get(STORAGE_KEYS.postalCode) || '';

  const newEntry = {
    date,
    weather: { description: '', tempLow: null, tempHigh: null, note: '' },
    sleep: { sleepTime: '', wakeTime: '', wakeType: '', note: '' },
    diet: { breakfast: '', lunch: '', dinner: '' },
    exercise: '',
    note: '',
    specialNotes: []
  };

  state.entries.unshift(newEntry);
  state.currentPage = 1;

  Renderer().renderCards(state.entries);

  setTimeout(() => {
    const cards = document.querySelectorAll('.glass-window');
    if (cards.length > 0) {
      const newCard = cards[0];

      const editBtn = newCard.querySelector('.edit-btn');
      if (editBtn) {
        editBtn.click();

        if (postalCode) {
          queryWeatherAndFill(newCard, postalCode, date);
        }
      }
    }
  }, 200);
}

async function queryWeatherAndFill(card, location, date) {
  try {
    const weatherResult = await WeatherService().query(location);

    if (weatherResult) {
      const weatherInput = card.querySelector('.weather-input');
      if (weatherInput) {
        const weatherText = `${weatherResult.description}，${weatherResult.tempLow}-${weatherResult.tempHigh}℃`;
        weatherInput.value = weatherText;

        const entryIndex = state.entries.findIndex(e => e.date === date);
        if (entryIndex !== -1) {
          state.entries[entryIndex].weather = {
            description: weatherResult.description,
            tempLow: weatherResult.tempLow,
            tempHigh: weatherResult.tempHigh,
            note: ''
          };
        }

        Toast.show('天气填充成功 ' + location + ' 的天气');
      }
    } else {
      Toast.show('天气查询失败，请检查城市名称');
    }
  } catch (err) {
    Toast.show('天气查询失败: ' + err.message, 'error');
  }
}

async function loadData() {
  if (!Storage().hasConfig()) {
    document.getElementById('emptyState').classList.remove('hidden');
    return;
  }

  document.getElementById('loadingState').classList.remove('hidden');
  document.getElementById('emptyState').classList.add('hidden');
  document.getElementById('cardsContainer').innerHTML = '';
  document.getElementById('cardsContainer').style.visibility = 'hidden';
  document.getElementById('paginationContainer').style.visibility = 'hidden';

  updateProgressBar(0);

  const startTime = Date.now();
  let loadComplete = false;
  let loadError = null;
  let animationComplete = false;

  const animateProgress = async () => {
    updateProgressBar(0);
    await new Promise(resolve => setTimeout(resolve, 50));

    for (let i = 0; i <= 100; i += 1) {
      await new Promise(resolve => setTimeout(resolve, 20));
      updateProgressBar(i);
    }
    animationComplete = true;
  };

  const doLoadData = async () => {
    try {
      const data = await Api().getFile();
      Storage().saveSha(data.sha);

      const content = decodeURIComponent(escape(atob(data.content)));
      state.entries = Parser().parse(content);

      Renderer().renderCards(state.entries);
      loadComplete = true;
    } catch (err) {
      loadError = err;
      loadComplete = true;
    }
  };

  const animationPromise = animateProgress();
  const loadPromise = doLoadData();

  await loadPromise;

  const elapsed = Date.now() - startTime;
  if (elapsed < 2000) {
    await new Promise(resolve => setTimeout(resolve, 2000 - elapsed));
  }

  await animationPromise;

  if (loadError) {
    Toast.show(`加载失败: ${loadError.message}`, 'error');
    document.getElementById('emptyState').classList.remove('hidden');
  }

  fadeOutProgressBar(() => { });
}

async function saveAll() {
  if (state.entries.length === 0) {
    Toast.show('没有可保存的数据', 'error');
    return;
  }

  Toast.show('尝试保存中');

  try {
    const content = Stringifier().stringifyAll(state.entries);
    const result = await Api().putFile(content, '保存健康日志 - 全部更新');
    Storage().saveSha(result.content.sha);
    Toast.show('已保存到 GitHub');
  } catch (err) {
    Toast.show(`保存失败: ${err.message}`, 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  Storage().loadConfig();
  Console.init();

  const $ = (id) => document.getElementById(id);

  const addRecordBtn = $('addRecordBtn');
  const addRecordBtnMobile = $('addRecordBtnMobile');
  const settingsBtn = $('settingsBtn');
  const closeSettingsBtn = $('closeSettingsBtn');
  const settingsOverlay = $('settingsOverlay');
  const saveSettingsBtn = $('saveSettingsBtn');
  const refreshBtn = $('refreshBtn');
  const saveAllBtn = $('saveAllBtn');
  const cancelDeleteBtn = $('cancelDeleteBtn');
  const deleteConfirmOverlay = $('deleteConfirmOverlay');
  const confirmDeleteBtn = $('confirmDeleteBtn');
  const deleteConfirmText = $('deleteConfirmText');
  const tokenInput = $('tokenInput');
  const usernameInput = $('usernameInput');
  const repoInput = $('repoInput');
  const pathInput = $('pathInput');
  const postalCodeInput = $('postalCode');

  addRecordBtn.addEventListener('click', () => {
    createNewEntry();
  });

  addRecordBtnMobile.addEventListener('click', () => {
    if (window._consoleJustToggled) {
      window._consoleJustToggled = false;
      return;
    }
    createNewEntry();
  });

  settingsBtn.addEventListener('click', () => {
    tokenInput.value = state.config.token;
    usernameInput.value = state.config.username;
    repoInput.value = state.config.repo;
    pathInput.value = state.config.path;
    postalCodeInput.value = state.postalCode;
    settingsOverlay.classList.add('active');
  });

  closeSettingsBtn.addEventListener('click', () => {
    settingsOverlay.classList.remove('active');
  });

  settingsOverlay.addEventListener('click', (e) => {
    if (e.target === settingsOverlay) {
      settingsOverlay.classList.remove('active');
    }
  });

  saveSettingsBtn.addEventListener('click', () => {
    state.config.token = tokenInput.value.trim();
    state.config.username = usernameInput.value.trim();
    state.config.repo = repoInput.value.trim();
    state.config.path = pathInput.value.trim();
    const postalCode = postalCodeInput.value.trim();

    Storage().saveConfig();
    Storage().saveLocation(postalCode);
    settingsOverlay.classList.remove('active');
    Toast.show('设置已保存');
    loadData();
  });

  refreshBtn.addEventListener('click', () => {
    Toast.show('已刷新');
    loadData();
  });

  saveAllBtn.addEventListener('click', () => {
    saveAll();
  });

  cancelDeleteBtn.addEventListener('click', () => {
    deleteConfirmOverlay.classList.remove('active');
    window.currentEntryToDelete = null;
  });

  deleteConfirmOverlay.addEventListener('click', (e) => {
    if (e.target === deleteConfirmOverlay) {
      deleteConfirmOverlay.classList.remove('active');
      window.currentEntryToDelete = null;
    }
  });

  confirmDeleteBtn.addEventListener('click', async () => {
    if (!window.currentEntryToDelete) return;

    const entryToDelete = window.currentEntryToDelete;
    const originalIndex = state.entries.findIndex(e => e.date === entryToDelete.date);

    if (originalIndex !== -1) {
      state.entries.splice(originalIndex, 1);
      deleteConfirmOverlay.classList.remove('active');

      const dateStr = String(entryToDelete.date);
      window.currentEntryToDelete = null;

      try {
        const content = Stringifier().stringifyAll(state.entries);
        const result = await Api().putFile(content, '删除健康日志');
        Storage().saveSha(result.content.sha);

        const fullMsg = '已删除 ' + dateStr + ' 的记录';
        Toast.show(fullMsg);
        Renderer().renderCards(state.entries);
      } catch (err) {
        Toast.show('删除失败: ' + err.message, 'error');
        state.entries.splice(originalIndex, 0, entryToDelete);
        Renderer().renderCards(state.entries);
      }
    }
  });

  loadData();
});
