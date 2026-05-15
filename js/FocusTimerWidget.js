import UIComponent from './UIComponent.js';

export default class FocusTimerWidget extends UIComponent {
  constructor(config = {}) {
    super({
      ...config,
      title: config.title || 'Фокус-таймер',
      icon: config.icon || '⏱',
      type: 'focus'
    });

    this.initialSeconds = config.initialSeconds || 25 * 60;
    this.remainingSeconds = this.initialSeconds;
    this.intervalId = null;
    this.isRunning = false;

    this.timeElement = null;
    this.progressElement = null;

    this.handleStart = this.handleStart.bind(this);
    this.handlePause = this.handlePause.bind(this);
    this.handleReset = this.handleReset.bind(this);
  }

  renderContent() {
    const content = document.createElement('div');
    content.className = 'focus-widget';
    content.innerHTML = `
      <div class="timer-ring" aria-label="Таймер фокус-сессии">
        <svg viewBox="0 0 120 120" role="img" aria-hidden="true">
          <circle cx="60" cy="60" r="54" class="timer-ring__track"></circle>
          <circle cx="60" cy="60" r="54" class="timer-ring__progress"></circle>
        </svg>
        <strong class="timer-value">25:00</strong>
      </div>
      <div class="timer-actions">
        <button class="soft-button" type="button" data-timer="start">Старт</button>
        <button class="soft-button" type="button" data-timer="pause">Пауза</button>
        <button class="soft-button" type="button" data-timer="reset">Сброс</button>
      </div>
      <p class="timer-hint">25 минут глубокой работы без внешних API — независимое состояние экземпляра.</p>
    `;

    this.timeElement = content.querySelector('.timer-value');
    this.progressElement = content.querySelector('.timer-ring__progress');

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

  renderTimer() {
    if (!this.timeElement || !this.progressElement) return;

    const minutes = String(Math.floor(this.remainingSeconds / 60)).padStart(2, '0');
    const seconds = String(this.remainingSeconds % 60).padStart(2, '0');
    const progress = 1 - this.remainingSeconds / this.initialSeconds;
    const circumference = 2 * Math.PI * 54;

    this.timeElement.textContent = `${minutes}:${seconds}`;
    this.progressElement.style.strokeDasharray = `${circumference}`;
    this.progressElement.style.strokeDashoffset = `${circumference * (1 - progress)}`;
  }

  destroy() {
    this.handlePause();
    super.destroy();
  }
}
