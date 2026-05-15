import UIComponent from './UIComponent.js';

export default class QuoteWidget extends UIComponent {
  constructor(config = {}) {
    super({
      ...config,
      title: config.title || 'Цитата для фокуса',
      icon: config.icon || '“',
      type: 'quote'
    });

    this.quotes = [
      { text: 'Сложность — это цена профессионального результата.', author: 'Design principle' },
      { text: 'Хороший интерфейс экономит внимание пользователя.', author: 'UX rule' },
      { text: 'Сначала структура, потом красота. И только потом эффекты.', author: 'Product design' },
      { text: 'Чистый код — это дизайн, который читают разработчики.', author: 'Engineering note' },
      { text: 'Лучший дашборд показывает действие, а не просто данные.', author: 'Analytics UX' }
    ];

    this.currentQuote = this.getRandomQuote();
    this.quoteTextElement = null;
    this.quoteAuthorElement = null;
    this.handleRefresh = this.handleRefresh.bind(this);
  }

  renderContent() {
    const content = document.createElement('div');
    content.className = 'quote-widget';
    content.innerHTML = `
      <blockquote>
        <p></p>
        <cite></cite>
      </blockquote>
      <button class="soft-button" type="button">Обновить цитату</button>
    `;

    this.quoteTextElement = content.querySelector('p');
    this.quoteAuthorElement = content.querySelector('cite');

    const button = content.querySelector('button');
    this.addListener(button, 'click', this.handleRefresh);

    this.renderQuote();
    return content;
  }

  handleRefresh() {
    this.currentQuote = this.getRandomQuote();
    this.renderQuote();
  }

  getRandomQuote() {
    if (this.quotes.length === 1) return this.quotes[0];

    let nextQuote = this.quotes[Math.floor(Math.random() * this.quotes.length)];
    while (this.currentQuote && nextQuote.text === this.currentQuote.text) {
      nextQuote = this.quotes[Math.floor(Math.random() * this.quotes.length)];
    }

    return nextQuote;
  }

  renderQuote() {
    if (!this.quoteTextElement || !this.quoteAuthorElement) return;

    this.quoteTextElement.textContent = `«${this.currentQuote.text}»`;
    this.quoteAuthorElement.textContent = this.currentQuote.author;
  }
}
