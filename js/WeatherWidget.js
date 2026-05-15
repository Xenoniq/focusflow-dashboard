import UIComponent from './UIComponent.js';

export default class WeatherWidget extends UIComponent {
  constructor(config = {}) {
    super({
      ...config,
      title: config.title || 'Погода сейчас',
      icon: config.icon || '☁',
      type: 'weather'
    });

    this.city = config.city || 'Prague';
    this.weatherData = null;
    this.formElement = null;
    this.inputElement = null;
    this.resultElement = null;
    this.abortController = null;

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  renderContent() {
    const content = document.createElement('div');
    content.className = 'api-widget weather-widget';
    content.innerHTML = `
      <form class="inline-form" autocomplete="off">
        <label class="sr-only" for="city-${this.id}">Город</label>
        <input id="city-${this.id}" type="text" value="${this.escapeHTML(this.city)}" placeholder="Введите город" />
        <button type="submit">Показать</button>
      </form>
      <div class="api-note">Источник: Open-Meteo Weather API</div>
      <div class="weather-result"></div>
    `;

    this.formElement = content.querySelector('form');
    this.inputElement = content.querySelector('input');
    this.resultElement = content.querySelector('.weather-result');

    this.addListener(this.formElement, 'submit', this.handleSubmit);
    this.fetchWeather(this.city);

    return content;
  }

  handleSubmit(event) {
    event.preventDefault();
    const nextCity = this.inputElement.value.trim();

    if (!nextCity) {
      this.showMessage('Введите название города.', 'warning');
      return;
    }

    this.city = nextCity;
    this.fetchWeather(nextCity);
  }

  async fetchWeather(city) {
    this.clearMessage();

    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();
    const { signal } = this.abortController;

    this.setLoading(true, 'Получаем погоду…');

    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ru&format=json`;
      const geoResponse = await fetch(geoUrl, { signal });

      if (!geoResponse.ok) {
        throw new Error('Не удалось получить координаты города.');
      }

      const geoData = await geoResponse.json();
      const location = geoData.results?.[0];

      if (!location) {
        throw new Error('Город не найден. Проверьте написание.');
      }

      const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast');
      weatherUrl.search = new URLSearchParams({
        latitude: location.latitude,
        longitude: location.longitude,
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
        timezone: 'auto'
      });

      const weatherResponse = await fetch(weatherUrl, { signal });

      if (!weatherResponse.ok) {
        throw new Error('Сервис погоды временно недоступен.');
      }

      const data = await weatherResponse.json();
      this.weatherData = { location, current: data.current, units: data.current_units };
      this.renderWeather();
    } catch (error) {
      if (error.name === 'AbortError') return;

      if (this.resultElement) {
        this.resultElement.innerHTML = '';
      }
      this.showMessage(error.message, 'error');
    } finally {
      if (!signal.aborted) {
        this.setLoading(false);
      }
    }
  }

  renderWeather() {
    if (!this.resultElement || !this.weatherData) return;

    const { location, current, units } = this.weatherData;
    const weatherLabel = this.getWeatherLabel(current.weather_code);

    this.resultElement.innerHTML = `
      <div class="weather-main">
        <div>
          <span class="metric-label">${this.escapeHTML(location.name)}, ${this.escapeHTML(location.country_code)}</span>
          <strong>${Math.round(current.temperature_2m)}${units.temperature_2m}</strong>
          <small>${weatherLabel}</small>
        </div>
        <span class="weather-orb">${this.getWeatherIcon(current.weather_code)}</span>
      </div>
      <div class="metric-grid">
        <div class="metric-card">
          <span>Ощущается</span>
          <strong>${Math.round(current.apparent_temperature)}${units.apparent_temperature}</strong>
        </div>
        <div class="metric-card">
          <span>Влажность</span>
          <strong>${current.relative_humidity_2m}${units.relative_humidity_2m}</strong>
        </div>
        <div class="metric-card">
          <span>Ветер</span>
          <strong>${Math.round(current.wind_speed_10m)} ${units.wind_speed_10m}</strong>
        </div>
      </div>
    `;
  }

  destroy() {
    if (this.abortController) {
      this.abortController.abort();
    }

    super.destroy();
  }

  getWeatherLabel(code) {
    const labels = {
      0: 'Ясно',
      1: 'Преимущественно ясно',
      2: 'Переменная облачность',
      3: 'Пасмурно',
      45: 'Туман',
      48: 'Изморозь',
      51: 'Лёгкая морось',
      53: 'Морось',
      55: 'Сильная морось',
      61: 'Небольшой дождь',
      63: 'Дождь',
      65: 'Сильный дождь',
      71: 'Небольшой снег',
      73: 'Снег',
      75: 'Сильный снег',
      80: 'Ливень',
      81: 'Сильный ливень',
      82: 'Очень сильный ливень',
      95: 'Гроза',
      96: 'Гроза с градом',
      99: 'Сильная гроза с градом'
    };

    return labels[code] || 'Погодные условия';
  }

  getWeatherIcon(code) {
    if ([0, 1].includes(code)) return '☀';
    if ([2, 3, 45, 48].includes(code)) return '☁';
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return '☔';
    if ([71, 73, 75].includes(code)) return '❄';
    if ([95, 96, 99].includes(code)) return '⚡';
    return '◌';
  }
}
