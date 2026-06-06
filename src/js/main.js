    // 波纹效果
    const RippleEffect = (() => {
      const canvas = document.getElementById('rippleCanvas');
      const ctx = canvas.getContext('2d');
      const ripples = [];

      function init() {
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        animate();
        scheduleNextRipple();
      }

      function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      function createRipple(x, y) {
        ripples.push({
          x,
          y,
          radius: 0,
          maxRadius: Math.max(canvas.width, canvas.height) * 0.8,
          opacity: 0.2,
          lineWidth: 3
        });
      }

      function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 更新和绘制波纹
        for (let i = ripples.length - 1; i >= 0; i--) {
          const ripple = ripples[i];
          
          // 增加半径
          ripple.radius += 2;
          
          // 随着半径增大，线条变细
          ripple.lineWidth = Math.max(0.5, 3 - (ripple.radius / ripple.maxRadius) * 2.5);
          
          // 透明度逐渐降低
          ripple.opacity = 0.2 * (1 - ripple.radius / ripple.maxRadius);

          // 绘制同心圆
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${ripple.opacity})`;
          ctx.lineWidth = ripple.lineWidth;
          ctx.stroke();

          // 移除消失的波纹
          if (ripple.radius >= ripple.maxRadius) {
            ripples.splice(i, 1);
          }
        }

        requestAnimationFrame(animate);
      }

      function scheduleNextRipple() {
        // 随机间隔 3000ms 到 8000ms
        const delay = Math.random() * 5000 + 3000;
        
        setTimeout(() => {
          // 随机位置
          const x = Math.random() * canvas.width;
          const y = Math.random() * canvas.height;
          createRipple(x, y);
          
          // 继续调度下一个
          scheduleNextRipple();
        }, delay);
      }

      return { init };
    })();

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

    const Toast = (() => {
      const notifications = [];
      let container = null;

      const getContainer = () => {
        if (!container) {
          container = document.getElementById('notification-container');
        }
        return container;
      };

      const removeNotification = (index) => {
        const notification = notifications[index];
        if (notification) {
          clearTimeout(notification.timeout);
          notification.element.classList.remove('notification-enter');
          notification.element.classList.add('notification-exit');
          setTimeout(() => {
            notification.element.remove();
          }, 500);
          notifications.splice(index, 1);
          updateNotificationPositions();
        }
      };

      const updateNotificationPositions = () => {
        notifications.forEach((notif, index) => {
          notif.element.classList.remove('notification-current', 'notification-previous', 'notification-previous2');
          if (index === 0) {
            notif.element.classList.add('notification-current');
          } else if (index === 1) {
            notif.element.classList.add('notification-previous');
          } else if (index === 2) {
            notif.element.classList.add('notification-previous2');
          }
        });
      };

      return {
        show(message, type = 'success') {
          const notificationContainer = getContainer();
          if (!notificationContainer) {
            console.error('Notification container not found');
            return;
          }

          const notificationElement = document.createElement('div');
          notificationElement.textContent = message;
          notificationElement.classList.add('notification-current', 'notification-enter');

          notificationElement.addEventListener('click', () => {
            const index = notifications.findIndex(n => n.element === notificationElement);
            if (index !== -1) {
              removeNotification(index);
            }
          });

          notificationContainer.appendChild(notificationElement);

          const timeout = setTimeout(() => {
            const index = notifications.findIndex(n => n.element === notificationElement);
            if (index !== -1) {
              removeNotification(index);
            }
          }, 4700);

          notifications.unshift({ element: notificationElement, timeout });

          if (notifications.length > 3) {
            removeNotification(3);
          }

          updateNotificationPositions();
        }
      };
    })();

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

    function WeatherService() {
      return {
        async query(locationStr) {
          if (!locationStr) {
            Toast.show('请先在设置中填写所在城市', 'error');
            return null;
          }

          try {
            console.log('正在查询位置:', locationStr);

            let geocodeResponse = await fetch(
              `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationStr)}&count=5&language=zh&format=json`
            );

            if (!geocodeResponse.ok) {
              const errorText = await geocodeResponse.text();
              console.error('地理编码请求失败:', errorText);
              throw new Error('地理编码请求失败: ' + geocodeResponse.status);
            }

            let geocodeData = await geocodeResponse.json();
            console.log('地理编码返回结果:', geocodeData);

            let foundLocation = null;

            if (geocodeData.results && geocodeData.results.length > 0) {
              foundLocation = geocodeData.results[0];
            } else {
              const simpleCity = locationStr.split(/\s/)[0];
              console.log('尝试搜索简化城市名:', simpleCity);

              const fallbackResponse = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(simpleCity)}&count=1&language=zh&format=json`
              );

              const fallbackData = await fallbackResponse.json();
              console.log('简化城市名搜索结果:', fallbackData);

              if (fallbackData.results && fallbackData.results.length > 0) {
                foundLocation = fallbackData.results[0];
              }
            }

            if (!foundLocation) {
              Toast.show('未找到该地区，请尝试更简单的城市名', 'error');
              return null;
            }

            const location = foundLocation;
            const lat = location.latitude;
            const lon = location.longitude;
            const locationName = location.name || location.admin1 || location.country;
            console.log('找到位置:', locationName, lat, lon);

            const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`;
            console.log('天气请求URL:', forecastUrl);

            const forecastResponse = await fetch(forecastUrl);

            if (!forecastResponse.ok) {
              const errorText = await forecastResponse.text();
              console.error('天气请求失败:', errorText);
              throw new Error('天气请求失败: ' + forecastResponse.status);
            }

            const forecastData = await forecastResponse.json();
            console.log('天气数据:', forecastData);

            const current = forecastData.current;
            const daily = forecastData.daily;

            const description = this.getWeatherDescription(current.weather_code);
            const tempLow = daily.temperature_2m_min[0];
            const tempHigh = daily.temperature_2m_max[0];

            return {
              description,
              tempLow: Math.round(tempLow),
              tempHigh: Math.round(tempHigh)
            };
          } catch (err) {
            console.error('Weather query error:', err);
            return null;
          }
        },

        getWeatherDescription(code) {
          const weatherCodes = {
            0: '晴',
            1: '晴间多云',
            2: '多云',
            3: '阴',
            45: '雾',
            48: '雾凇',
            51: '小雨', 53: '中雨', 55: '大雨',
            56: '冻雨', 57: '大冻雨',
            61: '小雨', 63: '中雨', 65: '大雨',
            66: '冻雨', 67: '大冻雨',
            71: '小雪', 73: '中雪', 75: '大雪', 77: '雪粒',
            81: '阵雨', 82: '强阵雨',
            85: '阵雪', 86: '强阵雪',
            95: '雷阵雨', 96: '雷阵雨伴小冰雹', 99: '雷阵雨伴大冰雹'
          };
          return weatherCodes[code] || '多云';
        }
      };
    }

    function Parser() {
      return {
        parseWeather(text) {
          if (!text || text === '，-℃') {
            return { description: '', tempLow: null, tempHigh: null, note: '' };
          }
          const match = text.match(REGEX.weather);
          if (match) {
            return {
              description: match[1],
              tempLow: parseInt(match[2]),
              tempHigh: parseInt(match[3]),
              note: match[4] || ''
            };
          }
          return { description: text, tempLow: null, tempHigh: null, note: '' };
        },

        parseSleep(text) {
          if (!text) {
            return { sleepTime: '', wakeTime: '', wakeType: '', note: '' };
          }

          const normalized = text.replace(/：/g, ':');
          const match = normalized.match(REGEX.sleep);
          if (match) {
            return {
              sleepTime: `${match[1]}:${match[2]}`,
              wakeTime: `${match[3]}:${match[4]}`,
              wakeType: match[5],
              note: match[6] || ''
            };
          }

          const noteMatch = text.match(/（(.+?)）/);
          return {
            sleepTime: '',
            wakeTime: '',
            wakeType: '',
            note: noteMatch ? noteMatch[1] : ''
          };
        },

        parseDiet(text) {
          if (!text || text === '午饭：、晚饭：') {
            return { breakfast: '', lunch: '', dinner: '' };
          }
          const textWithoutNewlines = text.replace(/\n/g, '、');
          const match = textWithoutNewlines.match(REGEX.diet);
          if (match) {
            return { breakfast: match[1] || '', lunch: match[2], dinner: match[3] };
          }
          return { breakfast: '', lunch: '', dinner: text };
        },

        parse(text) {
          const entries = [];
          const datePattern = /^(\d{4}\.\d{1,2}\.\d{1,2})$/;
          const lines = text.split('\n');

          let currentEntry = null;

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            if (datePattern.test(line)) {
              if (currentEntry) {
                entries.push(currentEntry);
              }
              currentEntry = {
                date: line,
                weather: { description: '', tempLow: null, tempHigh: null, note: '' },
                sleep: { sleepTime: '', wakeTime: '', wakeType: '', note: '' },
                diet: { breakfast: '', lunch: '', dinner: '' },
                exercise: '',
                note: '',
                specialNotes: []
              };
            } else if (currentEntry) {
              if (line.startsWith('Weather:')) {
                currentEntry.weather = this.parseWeather(line.replace('Weather:', '').trim());
              } else if (line.startsWith('Sleep:')) {
                currentEntry.sleep = this.parseSleep(line.replace('Sleep:', '').trim());
              } else if (line.startsWith('Diet:')) {
                currentEntry.diet = this.parseDiet(line.replace('Diet:', '').trim());
              } else if (line.startsWith('Exercise:')) {
                currentEntry.exercise = line.replace('Exercise:', '').trim();
              } else if (line.startsWith('Note:')) {
                currentEntry.note = line.replace('Note:', '').trim();
              } else if (line.startsWith('[!]')) {
                currentEntry.specialNotes.push({ type: '!', text: line.substring(4).trim() });
              } else if (line.startsWith('[?]')) {
                currentEntry.specialNotes.push({ type: '?', text: line.substring(4).trim() });
              } else if (line.startsWith('[+]')) {
                currentEntry.specialNotes.push({ type: '+', text: line.substring(4).trim() });
              }
            }
          }

          if (currentEntry) {
            entries.push(currentEntry);
          }

          return entries;
        }
      };
    }

    function Stringifier() {
      return {
        stringifyWeather(weather) {
          let result = weather.description;
          if (weather.tempLow !== null && weather.tempHigh !== null) {
            result += `，${weather.tempLow}-${weather.tempHigh}℃`;
          }
          if (weather.note) {
            result += ` （${weather.note}）`;
          }
          return `Weather: ${result}`;
        },

        stringifySleep(sleep) {
          if (!sleep.sleepTime && !sleep.wakeTime) {
            if (sleep.note) {
              return `Sleep: : 睡着，: 苏醒/闹钟（${sleep.note}）`;
            }
            return 'Sleep: : 睡着，: 苏醒/闹钟';
          }
          let result = `${sleep.sleepTime} 睡着，${sleep.wakeTime} ${sleep.wakeType}`;
          if (sleep.note) {
            result += `（${sleep.note}）`;
          }
          return `Sleep: ${result}`;
        },

        stringifyDiet(diet) {
          let result = '';
          if (diet.breakfast) {
            result += `早饭：${diet.breakfast}、`;
          }
          result += `午饭：${diet.lunch || ''}、晚饭：${diet.dinner || ''}`;
          return `Diet: ${result}`;
        },

        stringifyDateEntry(entry) {
          const lines = [
            entry.date,
            this.stringifyWeather(entry.weather),
            this.stringifySleep(entry.sleep),
            this.stringifyDiet(entry.diet),
            `Exercise: ${entry.exercise || ''}`,
            `Note: ${entry.note || ''}`
          ];

          entry.specialNotes.forEach(note => {
            lines.push(`[${note.type}] ${note.text}`);
          });

          return lines.join('\n');
        },

        stringifyAll(entries) {
          return entries.map(e => this.stringifyDateEntry(e)).join('\n\n');
        }
      };
    }

    function Renderer() {
      const parser = Parser();
      const stringifier = Stringifier();

      return {
        renderCards(entries) {
          const container = document.getElementById('cardsContainer');
          container.innerHTML = '';

          const sortedEntries = [...entries].sort((a, b) => {
            const dateA = a.date.split('.').map(Number);
            const dateB = b.date.split('.').map(Number);
            if (dateA[0] !== dateB[0]) return dateB[0] - dateA[0];
            if (dateA[1] !== dateB[1]) return dateB[1] - dateA[1];
            return dateB[2] - dateA[2];
          });

          const totalPages = Math.ceil(sortedEntries.length / state.pageSize);
          if (state.currentPage > totalPages && totalPages > 0) {
            state.currentPage = totalPages;
          }

          const startIndex = (state.currentPage - 1) * state.pageSize;
          const endIndex = startIndex + state.pageSize;
          const pageEntries = sortedEntries.slice(startIndex, endIndex);

          pageEntries.forEach((entry, index) => {
            const globalIndex = startIndex + index;
            const card = this.createCard(entry, globalIndex);
            // 添加淡入上滑动画，按顺序延迟
            card.classList.add('card-animation');
            card.style.animationDelay = `${index * 0.1}s`;
            container.appendChild(card);
          });

          document.getElementById('emptyState').classList.toggle('hidden', entries.length > 0);
          this.renderPagination(sortedEntries.length);
        },

        renderPagination(totalItems) {
          const container = document.getElementById('paginationContainer');
          const totalPages = Math.ceil(totalItems / state.pageSize);

          if (totalPages <= 1) {
            container.innerHTML = '';
            return;
          }

          let html = '';

          if (state.currentPage > 1) {
            html += `<button class="pagination-prev"></button>`;
          } else {
            html += `<button class="pagination-prev pagination-disabled"></button>`;
          }

          const maxVisible = 5;
          let startPage = Math.max(1, state.currentPage - Math.floor(maxVisible / 2));
          let endPage = Math.min(totalPages, startPage + maxVisible - 1);

          if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
          }

          if (startPage > 1) {
            html += `<button class="pagination-page ${state.currentPage === 1 ? 'current' : ''}" data-page="1"></button>`;
            if (startPage > 2) {
              html += `<span class="px-2 text-gray-400">...</span>`;
            }
          }

          for (let i = startPage; i <= endPage; i++) {
            if (i === state.currentPage) {
              html += `<button class="pagination-page current" data-page="${i}"></button>`;
            } else {
              html += `<button class="pagination-page" data-page="${i}"></button>`;
            }
          }

          if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
              html += `<span class="px-2 text-gray-400">...</span>`;
            }
            html += `<button class="pagination-page ${state.currentPage === totalPages ? 'current' : ''}" data-page="${totalPages}"></button>`;
          }

          if (state.currentPage < totalPages) {
            html += `<button class="pagination-next"></button>`;
          } else {
            html += `<button class="pagination-next pagination-disabled"></button>`;
          }

          container.innerHTML = html;

          container.querySelectorAll('.pagination-page').forEach(btn => {
            btn.addEventListener('click', (e) => {
              const page = parseInt(e.target.dataset.page);
              const wasLastPage = state.currentPage === totalPages;
              state.currentPage = page;
              this.renderCards(state.entries);
              if (wasLastPage && page < totalPages) {
                requestAnimationFrame(() => {
                  window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
                });
              }
            });
          });

          const prevBtn = container.querySelector('.pagination-prev');
          if (prevBtn) {
            prevBtn.addEventListener('click', () => {
              if (state.currentPage > 1) {
                const wasLastPage = state.currentPage === totalPages;
                state.currentPage--;
                this.renderCards(state.entries);
                if (wasLastPage) {
                  requestAnimationFrame(() => {
                    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
                  });
                }
              }
            });
          }

          const nextBtn = container.querySelector('.pagination-next');
          if (nextBtn) {
            nextBtn.addEventListener('click', () => {
              if (state.currentPage < totalPages) {
                state.currentPage++;
                this.renderCards(state.entries);
              }
            });
          }
        },

        createCard(entry, index) {
          const card = document.createElement('div');
          card.className = 'glass-window';
          card.id = `card-${index}`;

          const weatherDisplay = this.formatWeather(entry.weather);
          const sleepDisplay = this.formatSleep(entry.sleep);
          const dietDisplay = this.formatDiet(entry.diet);

          card.innerHTML = `
            <div class="card-shadow-wrapper"></div>
            <div class="glass-border-outer"></div>
            <div class="glass-border-middle"></div>
            <div class="glass-border-inner"></div>
            <div class="card-container">
              <div class="card-header">
                <div class="flex items-center gap-2">
                  <span class="card-title font-bold text-lg text-white">📅 ${entry.date}</span>
                  <button class="delete-btn card-btn hidden"><span>删除</span></button>
                </div>
                <div class="flex gap-2">
                  <button class="card-btn edit-btn"><span>编辑</span></button>
                  <button class="card-btn save-btn hidden"><span>保存</span></button>
                  <button class="card-btn cancel-btn hidden"><span>取消</span></button>
                </div>
              </div>
              <div class="card-divider"></div>
              <div class="card-content">
                <div class="view-mode">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="section-icon text-xl">🌤️</span>
                    <span class="section-label text-sm font-medium">Weather</span>
                  </div>
                  <div class="section-value text-sm pl-8">${weatherDisplay}</div>
                </div>
                <div class="edit-mode hidden">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="section-icon text-xl">🌤️</span>
                    <span class="section-label text-sm font-medium">Weather</span>
                  </div>
                  <input type="text" class="form-input weather-input w-full px-3 py-2 rounded-lg text-sm outline-none" value="${this.reconstructWeather(entry.weather)}">
                </div>

                <div class="view-mode">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="section-icon text-xl">😴</span>
                    <span class="section-label text-sm font-medium">Sleep</span>
                  </div>
                  <div class="section-value text-sm pl-8">${sleepDisplay}</div>
                </div>
                <div class="edit-mode hidden">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="section-icon text-xl">😴</span>
                    <span class="section-label text-sm font-medium">Sleep</span>
                  </div>
                  <input type="text" class="form-input sleep-input w-full px-3 py-2 rounded-lg text-sm outline-none" value="${this.reconstructSleep(entry.sleep)}">
                </div>

                <div class="view-mode">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="section-icon text-xl">🍽️</span>
                    <span class="section-label text-sm font-medium">Diet</span>
                  </div>
                  <div class="section-value text-sm pl-8 whitespace-pre-wrap">${dietDisplay}</div>
                </div>
                <div class="edit-mode hidden">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="section-icon text-xl">🍽️</span>
                    <span class="section-label text-sm font-medium">Diet</span>
                  </div>
                  <textarea class="form-textarea diet-input w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" rows="2">${this.reconstructDiet(entry.diet)}</textarea>
                </div>

                <div class="view-mode">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="section-icon text-xl">🏃</span>
                    <span class="section-label text-sm font-medium">Exercise</span>
                  </div>
                  <div class="section-value text-sm pl-8">${entry.exercise || '-'}</div>
                </div>
                <div class="edit-mode hidden">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="section-icon text-xl">🏃</span>
                    <span class="section-label text-sm font-medium">Exercise</span>
                  </div>
                  <input type="text" class="form-input exercise-input w-full px-3 py-2 rounded-lg text-sm outline-none" value="${entry.exercise || ''}">
                </div>

                <div class="view-mode">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="section-icon text-xl">📝</span>
                    <span class="section-label text-sm font-medium">Note</span>
                  </div>
                  <div class="section-value text-sm pl-8">${entry.note || '-'}</div>
                </div>
                <div class="edit-mode hidden">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="section-icon text-xl">📝</span>
                    <span class="section-label text-sm font-medium">Note</span>
                  </div>
                  <textarea class="form-textarea note-input w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" rows="2">${entry.note || ''}</textarea>
                </div>

                <div class="view-mode">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="section-icon text-xl">💡</span>
                    <span class="section-label text-sm font-medium">特殊标注</span>
                  </div>
                  <div class="pl-8 space-y-2">
                    ${entry.specialNotes.length > 0 ? entry.specialNotes.map(n => `
                      <span class="special-tag inline-block px-2 py-1 rounded text-sm mr-1 mb-1">
                        [${n.type}] ${n.text}
                      </span>
                    `).join('') : '-'}
                  </div>
                </div>
                <div class="edit-mode hidden">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="section-icon text-xl">💡</span>
                    <span class="section-label text-sm font-medium">特殊标注</span>
                  </div>
                  <div class="flex gap-2 mb-2">
                    <button type="button" class="add-special-btn" data-type="?"><span>[?]</span></button>
                    <button type="button" class="add-special-btn" data-type="!"><span>[!]</span></button>
                    <button type="button" class="add-special-btn" data-type="+"><span>[+]</span></button>
                  </div>
                  <textarea class="form-textarea special-notes-input w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" rows="3" placeholder="每行一个标注，格式：[!]/[?]/[+] 内容">${entry.specialNotes.map(n => `[${n.type}] ${n.text}`).join('\n')}</textarea>
                </div>
              </div>
            </div>
          `;

          this.bindCardEvents(card, entry, index);
          return card;
        },

        bindCardEvents(card, entry, index) {
          const editBtn = card.querySelector('.edit-btn');
          const saveBtn = card.querySelector('.save-btn');
          const cancelBtn = card.querySelector('.cancel-btn');
          const deleteBtn = card.querySelector('.delete-btn');

          editBtn.addEventListener('click', () => {
            this.setEditMode(card, true);
          });

          cancelBtn.addEventListener('click', () => {
            this.setEditMode(card, false);
            this.renderCards(state.entries);
          });

          deleteBtn.addEventListener('click', () => {
            window.currentEntryToDelete = entry;
            document.getElementById('deleteConfirmText').textContent =
              `确定要删除 ${entry.date} 的记录吗？此操作不可恢复。`;
            document.getElementById('deleteConfirmOverlay').classList.add('active');
          });

          card.querySelectorAll('.add-special-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
              const type = e.target.dataset.type;
              const textarea = card.querySelector('.special-notes-input');
              const prefix = `[${type}] `;
              const currentValue = textarea.value;
              if (currentValue && !currentValue.endsWith('\n')) {
                textarea.value = currentValue + '\n' + prefix;
              } else {
                textarea.value = currentValue + prefix;
              }
              textarea.focus();
              textarea.setSelectionRange(textarea.value.length, textarea.value.length);
            });
          });

          saveBtn.addEventListener('click', async () => {
            const updatedEntry = this.collectEntryFromCard(card, entry);
            const originalIndex = state.entries.findIndex(e => e.date === entry.date);
            state.entries[originalIndex] = updatedEntry;
            this.setEditMode(card, false);

            try {
              const content = stringifier.stringifyAll(state.entries);
              const result = await Api().putFile(content, `更新健康日志 - ${updatedEntry.date}`);
              Storage().saveSha(result.content.sha);
              Toast.show('已保存到 GitHub');
              this.renderCards(state.entries);
            } catch (err) {
              Toast.show(`保存失败: ${err.message}`, 'error');
              this.renderCards(state.entries);
            }
          });
        },

        setEditMode(card, isEdit) {
          const viewModes = card.querySelectorAll('.view-mode');
          const editModes = card.querySelectorAll('.edit-mode');
          const editBtn = card.querySelector('.edit-btn');
          const saveBtn = card.querySelector('.save-btn');
          const cancelBtn = card.querySelector('.cancel-btn');
          const deleteBtn = card.querySelector('.delete-btn');

          viewModes.forEach(el => el.classList.toggle('hidden', isEdit));
          editModes.forEach(el => el.classList.toggle('hidden', !isEdit));
          editBtn.classList.toggle('hidden', isEdit);
          saveBtn.classList.toggle('hidden', !isEdit);
          cancelBtn.classList.toggle('hidden', !isEdit);
          deleteBtn.classList.toggle('hidden', !isEdit);
        },

        collectEntryFromCard(card, originalEntry) {
          const weatherInput = card.querySelector('.weather-input').value;
          const sleepInput = card.querySelector('.sleep-input').value;
          const dietInput = card.querySelector('.diet-input').value;
          const exerciseInput = card.querySelector('.exercise-input').value;
          const noteInput = card.querySelector('.note-input').value;
          const specialNotesInput = card.querySelector('.special-notes-input').value;

          const specialNotes = [];
          specialNotesInput.split('\n').forEach(line => {
            const trimLine = line.trim();
            if (trimLine.startsWith('[!]')) {
              specialNotes.push({ type: '!', text: trimLine.substring(4).trim() });
            } else if (trimLine.startsWith('[?]')) {
              specialNotes.push({ type: '?', text: trimLine.substring(4).trim() });
            } else if (trimLine.startsWith('[+]')) {
              specialNotes.push({ type: '+', text: trimLine.substring(4).trim() });
            }
          });

          return {
            date: originalEntry.date,
            weather: Parser().parseWeather(weatherInput),
            sleep: Parser().parseSleep(sleepInput),
            diet: Parser().parseDiet(dietInput),
            exercise: exerciseInput,
            note: noteInput,
            specialNotes
          };
        },

        buildWeatherString(weather, options = {}) {
          let result = weather.description || '';
          if (weather.tempLow !== null && weather.tempHigh !== null) {
            result += `，${weather.tempLow}-${weather.tempHigh}℃`;
          }
          if (weather.note) {
            result += ` （${weather.note}）`;
          }
          if (options.forDisplay && (!result || (!weather.description && weather.tempLow === null))) {
            return '-';
          }
          return result;
        },

        buildSleepString(sleep, options = {}) {
          if (!sleep.sleepTime && !sleep.wakeTime) {
            if (options.forEdit) {
              return sleep.note ? `: 睡着，: 苏醒/闹钟（${sleep.note}）` : ': 睡着，: 苏醒/闹钟';
            }
            return sleep.note ? `（${sleep.note}）` : '-';
          }
          const separator = options.forEdit ? '，' : ' → ';
          let result = `${sleep.sleepTime} 睡着${separator}${sleep.wakeTime} ${sleep.wakeType}`;
          if (sleep.note) {
            result += `（${sleep.note}）`;
          }
          return result;
        },

        buildDietString(diet, options = {}) {
          if (options.forEdit) {
            let result = '';
            if (diet.breakfast) {
              result += `早饭：${diet.breakfast}、`;
            }
            result += `午饭：${diet.lunch || ''}、晚饭：${diet.dinner || ''}`;
            return result;
          }
          if (!diet.breakfast && !diet.lunch && !diet.dinner) {
            return '-';
          }
          const parts = [];
          if (diet.breakfast) {
            parts.push(`早饭：${diet.breakfast}`);
          }
          if (diet.lunch) {
            parts.push(`午饭：${diet.lunch}`);
          }
          parts.push(`晚饭：${diet.dinner || '-'}`);
          return parts.join('\n');
        },

        formatWeather(weather) {
          return this.buildWeatherString(weather, { forDisplay: true });
        },

        formatSleep(sleep) {
          return this.buildSleepString(sleep, { forDisplay: true });
        },

        formatDiet(diet) {
          return this.buildDietString(diet, { forDisplay: true });
        },

        reconstructWeather(weather) {
          return this.buildWeatherString(weather);
        },

        reconstructSleep(sleep) {
          return this.buildSleepString(sleep, { forEdit: true });
        },

        reconstructDiet(diet) {
          return this.buildDietString(diet, { forEdit: true });
        }
      };
    }

    function updateProgressBar(progress) {
      const progressBar = document.getElementById('progressBar');
      if (!progressBar) return;

      // 确保进度在合理范围内
      progress = Math.max(0, Math.min(100, progress));

      let gradient;
      if (progress <= 0) {
        // 0% 状态：全灰色
        gradient = `linear-gradient(180deg, rgba(255,255,255,0.4) 33.17%, rgba(204,204,204,0) 50%, rgba(153,153,153,0) 100%), linear-gradient(90deg, 
          rgba(83,140,98,0.85) 0%, 
          rgba(0,183,49,0.85) 0%, 
          rgba(123,214,147,0.85) 0%, 
          rgba(0,183,49,0.85) 0%, 
          rgba(83,140,98,0.85) 0%, 
          rgba(200,200,200,0.6) 0%, 
          rgba(200,200,200,0.6) 100%)`;
      } else if (progress <= 25) {
        gradient = `linear-gradient(180deg, rgba(255,255,255,0.4) 33.17%, rgba(204,204,204,0) 50%, rgba(153,153,153,0) 100%), linear-gradient(90deg, 
          rgba(83,140,98,0.85) 0%, 
          rgba(0,183,49,0.85) ${progress * 0.98}%, 
          rgba(200,200,200,0.6) ${progress}%, 
          rgba(200,200,200,0.6) 100%)`;
      } else if (progress <= 50) {
        gradient = `linear-gradient(180deg, rgba(255,255,255,0.4) 33.17%, rgba(204,204,204,0) 50%, rgba(153,153,153,0) 100%), linear-gradient(90deg, 
          rgba(83,140,98,0.85) 0%, 
          rgba(0,183,49,0.85) 24.52%, 
          rgba(123,214,147,0.85) ${progress * 0.98}%, 
          rgba(200,200,200,0.6) ${progress}%, 
          rgba(200,200,200,0.6) 100%)`;
      } else if (progress <= 75) {
        gradient = `linear-gradient(180deg, rgba(255,255,255,0.4) 33.17%, rgba(204,204,204,0) 50%, rgba(153,153,153,0) 100%), linear-gradient(90deg, 
          rgba(83,140,98,0.85) 0%, 
          rgba(0,183,49,0.85) 24.52%, 
          rgba(123,214,147,0.85) 50%, 
          rgba(0,183,49,0.85) ${progress * 0.98}%, 
          rgba(200,200,200,0.6) ${progress}%, 
          rgba(200,200,200,0.6) 100%)`;
      } else {
        gradient = `linear-gradient(180deg, rgba(255,255,255,0.4) 33.17%, rgba(204,204,204,0) 50%, rgba(153,153,153,0) 100%), linear-gradient(90deg, 
          rgba(83,140,98,0.85) 0%, 
          rgba(0,183,49,0.85) 24.52%, 
          rgba(123,214,147,0.85) 50%, 
          rgba(0,183,49,0.85) 75%, 
          rgba(83,140,98,0.85) ${progress * 0.98}%, 
          rgba(200,200,200,0.6) ${progress}%, 
          rgba(200,200,200,0.6) 100%)`;
      }
      progressBar.style.background = gradient;
    }

    function fadeOutProgressBar(callback) {
      const loadingState = document.getElementById('loadingState');
      const cardsContainer = document.getElementById('cardsContainer');
      const paginationContainer = document.getElementById('paginationContainer');
      let opacity = 1;
      const fadeInterval = setInterval(() => {
        opacity -= 0.05;
        loadingState.style.opacity = opacity;
        if (opacity <= 0) {
          clearInterval(fadeInterval);
          loadingState.style.opacity = 1;
          loadingState.classList.add('hidden');
          // 进度条完全消失后才显示卡片和翻页组件
          cardsContainer.style.visibility = 'visible';
          paginationContainer.style.visibility = 'visible';
          // 重新触发卡片动画
          const cards = cardsContainer.querySelectorAll('.glass-window');
          cards.forEach((card, index) => {
            card.classList.remove('card-animation');
            void card.offsetWidth; // 触发重绘，让动画重新开始
            card.classList.add('card-animation');
            card.style.animationDelay = `${index * 0.1}s`;
          });
          callback();
        }
      }, 30);
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

      // 重置进度条
      updateProgressBar(0);

      const startTime = Date.now();
      let loadComplete = false;
      let loadError = null;
      let animationComplete = false;

      // 进度条动画（至少2秒），确保从0%开始并完整播放
      const animateProgress = async () => {
        // 先确保显示0%的状态
        updateProgressBar(0);
        await new Promise(resolve => setTimeout(resolve, 50));

        // 从0%开始完整播放
        for (let i = 0; i <= 100; i += 1) {
          await new Promise(resolve => setTimeout(resolve, 20));
          updateProgressBar(i);
        }
        animationComplete = true;
      };

      // 实际加载数据
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

      // 同时开始两个任务
      const animationPromise = animateProgress();
      const loadPromise = doLoadData();

      // 等待数据加载完成
      await loadPromise;

      // 确保进度条播放完至少2秒
      const elapsed = Date.now() - startTime;
      if (elapsed < 2000) {
        await new Promise(resolve => setTimeout(resolve, 2000 - elapsed));
      }

      // 等待动画完成
      await animationPromise;

      // 处理错误和显示状态
      if (loadError) {
        Toast.show(`加载失败: ${loadError.message}`, 'error');
        document.getElementById('emptyState').classList.remove('hidden');
      }

      // 进度条慢慢透明消失后再显示卡片
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
      RippleEffect.init();

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
        // 如果控制台刚刚被触发，不执行添加记录
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

      // 删除确认弹窗事件
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

          // 保存日期字符串，用最简单的方式
          const dateStr = String(entryToDelete.date);
          window.currentEntryToDelete = null;

          try {
            const content = Stringifier().stringifyAll(state.entries);
            const result = await Api().putFile(content, '删除健康日志');
            Storage().saveSha(result.content.sha);

            // 最简单直接的方式：字符串拼接
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