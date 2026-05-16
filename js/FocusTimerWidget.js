import UIComponent from './UIComponent.js';

export default class FocusTimerWidget extends UIComponent {
  constructor(config = {}) {
    super({
      ...config,
      title: config.title || 'Фокус-таймер',
      icon: config.icon || '⏱',
      type: 'focus'
    });

    this.initialSeconds = this.getInitialSeconds(config);
    this.initialMinutes = Math.round(this.initialSeconds / 60);
    this.remainingSeconds = this.initialSeconds;
    this.intervalId = null;
    this.isRunning = false;

    this.timeElement = null;
    this.progressElement = null;
    this.durationInput = null;
    this.durationLabelElement = null;
    this.durationWordElement = null;

    this.handleStart = this.handleStart.bind(this);
    this.handlePause = this.handlePause.bind(this);
    this.handleReset = this.handleReset.bind(this);
    this.handleDurationSubmit = this.handleDurationSubmit.bind(this);
  }

  renderContent() {
    const content = document.createElement('div');
    content.className = 'focus-widget';
    content.innerHTML = `
      <form class="timer-settings" data-timer-settings aria-label="Настройка фокус-таймера">
        <label>
          <span>Минуты</span>
          <input
            type="number"
            min="1"
            max="180"
            step="1"
            value="${this.initialMinutes}"
            data-timer-minutes
            aria-label="Количество минут для фокус-таймера"
          />
        </label>
        <button class="soft-button" type="submit">Настроить</button>
      </form>
      <div class="timer-ring" aria-label="Таймер фокус-сессии">
        <svg viewBox="0 0 120 120" role="img" aria-hidden="true">
          <circle cx="60" cy="60" r="54" class="timer-ring__track"></circle>
          <circle cx="60" cy="60" r="54" class="timer-ring__progress"></circle>
        </svg>
        <strong class="timer-value">${this.formatTime(this.remainingSeconds)}</strong>
      </div>
      <div class="timer-actions">
        <button class="soft-button" type="button" data-timer="start">Старт</button>
        <button class="soft-button" type="button" data-timer="pause">Пауза</button>
        <button class="soft-button" type="button" data-timer="reset">Сброс</button>
      </div>
      <p class="timer-hint">
        Выберите длительность фокус-сессии и нажмите «Настроить». Сейчас установлено
        <span data-timer-duration>${this.initialMinutes}</span> <span data-timer-duration-word>${this.getMinuteWord(this.initialMinutes)}</span>.
      </p>
    `;

    this.timeElement = content.querySelector('.timer-value');
    this.progressElement = content.querySelector('.timer-ring__progress');
    this.durationInput = content.querySelector('[data-timer-minutes]');
    this.durationLabelElement = content.querySelector('[data-timer-duration]');
    this.durationWordElement = content.querySelector('[data-timer-duration-word]');

    this.addListener(content.querySelector('[data-timer-settings]'), 'submit', this.handleDurationSubmit);
    this.addListener(content.querySelector('[data-timer="start"]'), 'click', this.handleStart);
    this.addListener(content.querySelector('[data-timer="pause"]'), 'click', this.handlePause);
    this.addListener(content.querySelector('[data-timer="reset"]'), 'click', this.handleReset);

    this.renderTimer();
    return content;
  }

  handleStart() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.intervalId = window.setInterval(() => {
      this.remainingSeconds = Math.max(0, this.remainingSeconds - 1);
      this.renderTimer();

      if (this.remainingSeconds === 0) {
        this.handlePause();
        this.showMessage('Сессия завершена. Можно сделать короткий перерыв.', 'success');
      }
    }, 1000);
  }

  handlePause() {
    this.isRunning = false;
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  handleReset() {
    this.handlePause();
    this.clearMessage();
    this.remainingSeconds = this.initialSeconds;
    this.renderTimer();
  }

  handleDurationSubmit(event) {
    event.preventDefault();

    const minutes = this.normalizeMinutes(this.durationInput?.value);
    this.handlePause();
    this.clearMessage();

    this.initialMinutes = minutes;
    this.initialSeconds = minutes * 60;
    this.remainingSeconds = this.initialSeconds;

    if (this.durationInput) {
      this.durationInput.value = String(minutes);
    }

    this.renderTimer();
    this.showMessage(`Таймер настроен на ${minutes} ${this.getMinuteWord(minutes)}.`, 'success');
  }

  renderTimer() {
    if (!this.timeElement || !this.progressElement) return;

    const progress = 1 - this.remainingSeconds / this.initialSeconds;
    const circumference = 2 * Math.PI * 54;

    this.timeElement.textContent = this.formatTime(this.remainingSeconds);
    this.progressElement.style.strokeDasharray = `${circumference}`;
    this.progressElement.style.strokeDashoffset = `${circumference * (1 - progress)}`;

    if (this.durationLabelElement) {
      this.durationLabelElement.textContent = String(this.initialMinutes);
    }

    if (this.durationWordElement) {
      this.durationWordElement.textContent = this.getMinuteWord(this.initialMinutes);
    }
  }

  getInitialSeconds(config) {
    if (Number.isFinite(Number(config.initialSeconds)) && Number(config.initialSeconds) > 0) {
      return Math.round(Number(config.initialSeconds));
    }

    return this.normalizeMinutes(config.minutes ?? config.initialMinutes ?? 25) * 60;
  }

  normalizeMinutes(value) {
    const minutes = Number.parseInt(value, 10);

    if (!Number.isFinite(minutes)) {
      return 25;
    }

    return Math.min(180, Math.max(1, minutes));
  }

  formatTime(totalSeconds) {
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');

    return `${minutes}:${seconds}`;
  }

  getMinuteWord(value) {
    const lastTwoDigits = Math.abs(value) % 100;
    const lastDigit = Math.abs(value) % 10;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
      return 'минут';
    }

    if (lastDigit === 1) {
      return 'минута';
    }

    if (lastDigit >= 2 && lastDigit <= 4) {
      return 'минуты';
    }

    return 'минут';
  }

  destroy() {
    this.handlePause();
    super.destroy();
  }
}
