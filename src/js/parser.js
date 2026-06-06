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
