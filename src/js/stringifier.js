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
      const sortedEntries = [...entries].sort((a, b) => {
        const [aY, aM, aD] = a.date.split('.').map(Number);
        const [bY, bM, bD] = b.date.split('.').map(Number);
        if (aY !== bY) return aY - bY;
        if (aM !== bM) return aM - bM;
        return aD - bD;
      });
      return sortedEntries.map(e => this.stringifyDateEntry(e)).join('\n\n');
    }
  };
}
