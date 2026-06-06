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
