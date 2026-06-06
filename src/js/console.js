// 控制台模块
const Console = (() => {
  let isActive = false;
  let keySequence = '';
  const expectedSequence = 'cmd';
  let consoleEl = null;
  let inputEl = null;

  // 移动端触发相关
  let mobileClickTimes = [];
  const mobileClickThreshold = 4; // 需要4次点击
  const mobileClickWindow = 4000; // 4秒时间窗口

  const getElements = () => {
    if (!consoleEl) {
      consoleEl = document.getElementById('console');
      inputEl = document.getElementById('consoleInput');
    }
    return { consoleEl, inputEl };
  };

  const show = () => {
    const { consoleEl, inputEl } = getElements();
    if (consoleEl && inputEl) {
      consoleEl.classList.add('active');
      inputEl.focus();
      setTimeout(() => {
        inputEl.value = '';
      }, 0);
      isActive = true;
    }
  };

  const hide = () => {
    const { consoleEl, inputEl } = getElements();
    if (consoleEl && inputEl) {
      consoleEl.classList.remove('active');
      inputEl.value = '';
      isActive = false;
      keySequence = '';
    }
  };

  const toggle = () => {
    if (isActive) {
      hide();
    } else {
      show();
    }
  };

  const executeCommand = (cmd) => {
    cmd = cmd.trim();
    if (!cmd) {
      return;
    }

    // create(yyyy.m.d) 命令
    const createMatch = cmd.match(/^create\((\d{4}\.\d{1,2}\.\d{1,2})\)$/);
    if (createMatch) {
      const date = createMatch[1];
      const [year, month, day] = date.split('.').map(Number);

      // 日期合法性校验
      if (month < 1 || month > 12) {
        Toast.show(`Invalid month: ${month}.`, 'error');
        return;
      }

      const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      // 闰年：能被4整除但不能被100整除，或者能被400整除
      if ((year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)) {
        daysInMonth[1] = 29;
      }
      if (day < 1 || day > daysInMonth[month - 1]) {
        Toast.show(`Invalid day: ${day} for month ${month}.`, 'error');
        return;
      }

      if (state.entries.some(entry => entry.date === date)) {
        Toast.show(`Card for ${date} already exists.`, 'error');
      } else {
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
        Toast.show(`Created card for ${date}`);
      }
      return;
    }

    // tp(yyyy.m.d) 命令 - 跳转到指定日期的页面
    const tpMatch = cmd.match(/^tp\((\d{4}\.\d{1,2}\.\d{1,2})\)$/);
    if (tpMatch) {
      const date = tpMatch[1];
      const sortedEntries = [...state.entries].sort((a, b) => {
        const dateA = a.date.split('.').map(Number);
        const dateB = b.date.split('.').map(Number);
        if (dateA[0] !== dateB[0]) return dateB[0] - dateA[0];
        if (dateA[1] !== dateB[1]) return dateB[1] - dateA[1];
        return dateB[2] - dateA[2];
      });
      const entryIndex = sortedEntries.findIndex(e => e.date === date);
      if (entryIndex === -1) {
        Toast.show(`Card for ${date} not found.`, 'error');
      } else {
        const targetPage = Math.floor(entryIndex / state.pageSize) + 1;
        state.currentPage = targetPage;
        Renderer().renderCards(state.entries);
        setTimeout(() => {
          const card = document.getElementById(`card-${entryIndex % state.pageSize}`);
          if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
        Toast.show(`Jumped to page ${targetPage}`);
      }
      return;
    }

    // dl 命令 - 下载配置项指定的 txt 文件
    if (cmd === 'dl') {
      if (!state.config.username || !state.config.repo || !state.config.path) {
        Toast.show('请先在设置中配置 GitHub 信息', 'error');
        return;
      }

      Toast.show('正在下载...');

      Api().getFile().then(data => {
        const content = decodeURIComponent(escape(atob(data.content)));
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (state.config.path.split('/').pop() || 'health.txt').replace(/%20/g, ' ');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        Toast.show('下载成功');
      }).catch(err => {
        Toast.show(`下载失败: ${err.message}`, 'error');
      });
      return;
    }

    // 未知命令
    Toast.show('unknown command.');
  };

  const handleKeyDown = (e) => {
    // 如果控制台已激活，忽略其他按键监听
    if (isActive) return;

    // 监听字母按键
    if (e.key.length === 1 && e.key.match(/[a-zA-Z]/)) {
      keySequence += e.key.toLowerCase();

      // 检查是否匹配序列
      if (keySequence.endsWith(expectedSequence)) {
        toggle();
        keySequence = '';
      } else if (!expectedSequence.startsWith(keySequence)) {
        // 序列不匹配，重置
        keySequence = '';
      }
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      const { inputEl } = getElements();
      const cmd = inputEl.value;
      hide();
      if (cmd) {
        executeCommand(cmd);
      }
    } else if (e.key === 'Escape') {
      hide();
    }
  };

  // 移动端点击处理
  const handleMobileClick = (e) => {
    const now = Date.now();
    // 过滤掉超过时间窗口的点击
    mobileClickTimes = mobileClickTimes.filter(t => now - t < mobileClickWindow);
    // 添加当前点击时间
    mobileClickTimes.push(now);

    // 检查是否达到阈值
    if (mobileClickTimes.length >= mobileClickThreshold) {
      mobileClickTimes = [];
      toggle();
      // 设置标志，阻止默认的添加记录行为
      window._consoleJustToggled = true;
      e.preventDefault();
      e.stopPropagation();
    } else {
      window._consoleJustToggled = false;
    }
  };

  const init = () => {
    document.addEventListener('keydown', handleKeyDown);
    const { inputEl } = getElements();
    if (inputEl) {
      inputEl.addEventListener('keydown', handleInputKeyDown);
    }
    // 移动端按钮点击监听（使用捕获阶段，确保先执行）
    const mobileBtn = document.getElementById('addRecordBtnMobile');
    if (mobileBtn) {
      mobileBtn.addEventListener('click', handleMobileClick, true);
    }
  };

  return { init };
})();
