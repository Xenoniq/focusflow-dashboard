import UIComponent from './UIComponent.js';

export default class CurrencyWidget extends UIComponent {
  constructor(config = {}) {
    super({
      ...config,
      title: config.title || 'Курсы валют',
      icon: config.icon || '₿',
      type: 'currency'
    });

    this.baseCurrency = config.baseCurrency || 'EUR';
    this.amount = config.amount || 100;
    this.currencies = ['RUB', 'EUR', 'USD', 'GBP', 'CZK', 'JPY', 'CHF'];
    this.ratesData = null;

    this.formElement = null;
    this.baseElement = null;
    this.amountElement = null;
    this.resultElement = null;
    this.abortController = null;

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  renderContent() {
    const content = document.createElement('div');
    content.className = 'api-widget currency-widget';
    content.innerHTML = `
      <form class="currency-form" autocomplete="off">
        <label>
          <span>Сумма</span>
          <input type="number" min="1" step="1" value="${this.amount}" />
        </label>
        <label>
          <span>База</span>
          <select>
            ${this.currencies.map((currency) => `
              <option value="${currency}" ${currency === this.baseCurrency ? 'selected' : ''}>${currency}</option>
            `).join('')}
          </select>
        </label>
        <button type="submit">Обновить</button>
      </form>
      <div class="api-note">Источник: Open ExchangeRate API</div>
      <div class="currency-result"></div>
    `;

    this.formElement = content.querySelector('form');
    this.amountElement = content.querySelector('input');
    this.baseElement = content.querySelector('select');
    this.resultElement = content.querySelector('.currency-result');

    this.addListener(this.formElement, 'submit', this.handleSubmit);
    this.fetchRates();

    return content;
  }

  handleSubmit(event) {
    event.preventDefault();

    const amount = Number(this.amountElement.value);
    if (!Number.isFinite(amount) || amount <= 0) {
      this.showMessage('Введите положительную сумму.', 'warning');
      return;
    }

    this.amount = amount;
    this.baseCurrency = this.baseElement.value;
    this.fetchRates();
  }

  async fetchRates() {
    this.clearMessage();

    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();
    const { signal } = this.abortController;

    this.setLoading(true, 'Получаем курсы…');

    try {
      const url = `https://open.er-api.com/v6/latest/${this.baseCurrency}`;
      const response = await fetch(url, { signal });

      if (!response.ok) {
        throw new Error('Не удалось получить валютные курсы.');
      }

      const data = await response.json();

      if (data.result && data.result !== 'success') {
        throw new Error('API вернул ошибку при получении курсов.');
      }

      this.ratesData = {
        date: data.time_last_update_utc
          ? new Date(data.time_last_update_utc).toLocaleDateString('ru-RU')
          : '—',
        rates: Object.fromEntries(
          this.currencies
            .filter((currency) => currency !== this.baseCurrency)
            .map((currency) => [currency, data.rates?.[currency]])
            .filter(([, rate]) => Number.isFinite(rate))
        )
      };

      this.renderRates();
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

  destroy() {
    if (this.abortController) {
      this.abortController.abort();
    }

    super.destroy();
  }

  renderRates() {
    if (!this.resultElement || !this.ratesData) return;

    const rates = Object.entries(this.ratesData.rates || {});
    const date = this.ratesData.date || '—';

    this.resultElement.innerHTML = `
      <div class="rate-summary">
        <span class="metric-label">Актуальная дата курса</span>
        <strong>${this.escapeHTML(date)}</strong>
      </div>
      <div class="rate-list">
        ${rates.map(([currency, rate]) => `
          <div class="rate-row">
            <span>${this.amount} ${this.baseCurrency} → ${currency}</span>
            <strong>${(this.amount * rate).toLocaleString('ru-RU', { maximumFractionDigits: 2 })}</strong>
          </div>
        `).join('')}
      </div>
    `;
  }
}
