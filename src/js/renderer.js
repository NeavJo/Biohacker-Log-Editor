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
              <div class="pl-8">
                <div class="flex items-center gap-2 mb-3">
                  <span class="text-xs text-gray-400">睡着</span>
                  <input type="text" class="form-input sleep-hour-input w-12 px-2 py-1 rounded text-sm outline-none text-center" value="${entry.sleep.sleepTime ? entry.sleep.sleepTime.split(':')[0] : ''}" placeholder="时">
                  <span class="text-gray-400">:</span>
                  <input type="text" class="form-input sleep-minute-input w-12 px-2 py-1 rounded text-sm outline-none text-center" value="${entry.sleep.sleepTime ? entry.sleep.sleepTime.split(':')[1] : ''}" placeholder="分">
                </div>
                <div class="flex items-center gap-2 mb-3">
                  <span class="text-xs text-gray-400">醒来</span>
                  <input type="text" class="form-input wake-hour-input w-12 px-2 py-1 rounded text-sm outline-none text-center" value="${entry.sleep.wakeTime ? entry.sleep.wakeTime.split(':')[0] : ''}" placeholder="时">
                  <span class="text-gray-400">:</span>
                  <input type="text" class="form-input wake-minute-input w-12 px-2 py-1 rounded text-sm outline-none text-center" value="${entry.sleep.wakeTime ? entry.sleep.wakeTime.split(':')[1] : ''}" placeholder="分">
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-xs text-gray-400">醒来方式</span>
                  <div class="wake-type-toggle flex items-center gap-2">
                    <span class="wake-type-label text-sm ${entry.sleep.wakeType === '苏醒' ? 'text-blue-400 font-medium' : 'text-gray-400'}">苏醒</span>
                    <button type="button" class="wake-type-btn w-10 h-6 rounded-full relative transition-colors ${entry.sleep.wakeType === '闹钟' ? 'bg-orange-400' : 'bg-blue-400'}">
                      <span class="wake-type-thumb absolute w-5 h-5 bg-white rounded-full top-0.5 transition-all ${entry.sleep.wakeType === '闹钟' ? 'left-5' : 'left-0.5'}"></span>
                    </button>
                    <span class="wake-type-label text-sm ${entry.sleep.wakeType === '闹钟' ? 'text-orange-400 font-medium' : 'text-gray-400'}">闹钟</span>
                  </div>
                </div>
              </div>
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
              <div class="pl-8 space-y-2">
                <div>
                  <label class="text-xs text-gray-400 block mb-1">早饭（可选）</label>
                  <input type="text" class="form-input diet-breakfast-input w-full px-3 py-2 rounded-lg text-sm outline-none" value="${entry.diet.breakfast || ''}" placeholder="早饭">
                </div>
                <div>
                  <label class="text-xs text-gray-400 block mb-1">午饭</label>
                  <input type="text" class="form-input diet-lunch-input w-full px-3 py-2 rounded-lg text-sm outline-none" value="${entry.diet.lunch || ''}" placeholder="午饭">
                </div>
                <div>
                  <label class="text-xs text-gray-400 block mb-1">晚饭</label>
                  <input type="text" class="form-input diet-dinner-input w-full px-3 py-2 rounded-lg text-sm outline-none" value="${entry.diet.dinner || ''}" placeholder="晚饭">
                </div>
              </div>
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

      // 醒来方式切换按钮
      const wakeTypeBtn = card.querySelector('.wake-type-btn');
      if (wakeTypeBtn) {
        wakeTypeBtn.addEventListener('click', () => {
          const thumb = card.querySelector('.wake-type-thumb');
          const isAlarm = wakeTypeBtn.classList.contains('bg-orange-400');
          const labels = card.querySelectorAll('.wake-type-label');
          if (isAlarm) {
            // 切换到苏醒
            wakeTypeBtn.classList.remove('bg-orange-400');
            wakeTypeBtn.classList.add('bg-blue-400');
            thumb.classList.remove('left-5');
            thumb.classList.add('left-0.5');
            labels[0].className = 'wake-type-label text-sm text-blue-400 font-medium';
            labels[1].className = 'wake-type-label text-sm text-gray-400';
          } else {
            // 切换到闹钟
            wakeTypeBtn.classList.remove('bg-blue-400');
            wakeTypeBtn.classList.add('bg-orange-400');
            thumb.classList.remove('left-0.5');
            thumb.classList.add('left-5');
            labels[0].className = 'wake-type-label text-sm text-gray-400';
            labels[1].className = 'wake-type-label text-sm text-orange-400 font-medium';
          }
        });
      }

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
      const sleepHourInput = card.querySelector('.sleep-hour-input').value;
      const sleepMinuteInput = card.querySelector('.sleep-minute-input').value;
      const wakeHourInput = card.querySelector('.wake-hour-input').value;
      const wakeMinuteInput = card.querySelector('.wake-minute-input').value;
      const wakeTypeBtn = card.querySelector('.wake-type-btn');
      const wakeType = wakeTypeBtn.classList.contains('bg-orange-400') ? '闹钟' : '苏醒';
      const dietBreakfastInput = card.querySelector('.diet-breakfast-input').value;
      const dietLunchInput = card.querySelector('.diet-lunch-input').value;
      const dietDinnerInput = card.querySelector('.diet-dinner-input').value;
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

      // 构建睡眠时间字符串
      const sleepTime = sleepHourInput && sleepMinuteInput ? `${sleepHourInput}:${sleepMinuteInput}` : '';
      const wakeTime = wakeHourInput && wakeMinuteInput ? `${wakeHourInput}:${wakeMinuteInput}` : '';

      return {
        date: originalEntry.date,
        weather: Parser().parseWeather(weatherInput),
        sleep: {
          sleepTime,
          wakeTime,
          wakeType,
          note: originalEntry.sleep.note || ''
        },
        diet: {
          breakfast: dietBreakfastInput,
          lunch: dietLunchInput,
          dinner: dietDinnerInput
        },
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
      } else {
        parts.push('午饭：-');
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
