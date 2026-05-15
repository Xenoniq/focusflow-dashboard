export default class UIComponent {
  constructor(config = {}) {
    if (new.target === UIComponent) {
      throw new Error('UIComponent is an abstract class and cannot be instantiated directly.');
    }

    const fallbackType = this.constructor.name.replace('Widget', '').toLowerCase();

    this.id = config.id || `${fallbackType}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    this.title = config.title || 'Untitled widget';
    this.icon = config.icon || '◇';
    this.type = config.type || fallbackType;
    this.onClose = typeof config.onClose === 'function' ? config.onClose : null;

    this.rootElement = null;
    this.bodyElement = null;
    this.listeners = [];
    this.isMinimized = false;
  }

  render() {
    if (this.rootElement) {
      return this.rootElement;
    }

    const wrapper = document.createElement('article');
    wrapper.className = `widget widget--${this.type}`;
    wrapper.dataset.widgetId = this.id;

    wrapper.innerHTML = `
      <header class="widget__header">
        <div class="widget__identity">
          <span class="widget__icon" aria-hidden="true">${this.icon}</span>
          <div>
            <h3>${this.escapeHTML(this.title)}</h3>
            <small>${this.escapeHTML(this.id)}</small>
          </div>
        </div>
        <div class="widget__controls">
          <button class="widget__control" type="button" data-action="minimize" aria-label="Свернуть виджет">−</button>
          <button class="widget__control widget__control--danger" type="button" data-action="close" aria-label="Закрыть виджет">×</button>
        </div>
      </header>
      <div class="widget__body"></div>
    `;

    this.rootElement = wrapper;
    this.bodyElement = wrapper.querySelector('.widget__body');
    this.bodyElement.append(this.renderContent());

    const minimizeButton = wrapper.querySelector('[data-action="minimize"]');
    const closeButton = wrapper.querySelector('[data-action="close"]');

    this.addListener(minimizeButton, 'click', () => this.minimize());
    this.addListener(closeButton, 'click', () => this.close());

    return wrapper;
  }

  renderContent() {
    const placeholder = document.createElement('p');
    placeholder.textContent = 'Override renderContent() in child classes.';
    return placeholder;
  }

  minimize() {
    if (!this.rootElement) return;

    this.isMinimized = !this.isMinimized;
    this.rootElement.classList.toggle('widget--minimized', this.isMinimized);

    const button = this.rootElement.querySelector('[data-action="minimize"]');
    if (button) {
      button.textContent = this.isMinimized ? '+' : '−';
      button.setAttribute('aria-label', this.isMinimized ? 'Развернуть виджет' : 'Свернуть виджет');
    }
  }

  close() {
    if (this.onClose) {
      this.onClose(this.id);
      return;
    }

    this.destroy();
  }

  addListener(element, eventName, handler, options = false) {
    if (!element || typeof handler !== 'function') return;

    element.addEventListener(eventName, handler, options);
    this.listeners.push({ element, eventName, handler, options });
  }

  destroy() {
    this.listeners.forEach(({ element, eventName, handler, options }) => {
      element.removeEventListener(eventName, handler, options);
    });

    this.listeners = [];

    if (this.rootElement) {
      this.rootElement.remove();
    }

    this.rootElement = null;
    this.bodyElement = null;
  }

  setLoading(isLoading, text = 'Загрузка данных…') {
    if (!this.bodyElement) return;

    this.bodyElement.classList.toggle('is-loading', isLoading);
    let loader = this.bodyElement.querySelector('.widget-loader');

    if (isLoading && !loader) {
      loader = document.createElement('div');
      loader.className = 'widget-loader';
      loader.innerHTML = `<span class="spinner"></span><span>${this.escapeHTML(text)}</span>`;
      this.bodyElement.append(loader);
    }

    if (!isLoading && loader) {
      loader.remove();
    }
  }

  showMessage(message, type = 'info') {
    if (!this.bodyElement) return;

    let box = this.bodyElement.querySelector('.widget-message');
    if (!box) {
      box = document.createElement('div');
      box.className = 'widget-message';
      this.bodyElement.prepend(box);
    }

    box.className = `widget-message widget-message--${type}`;
    box.textContent = message;
  }

  clearMessage() {
    const box = this.bodyElement?.querySelector('.widget-message');
    if (box) box.remove();
  }

  escapeHTML(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}
