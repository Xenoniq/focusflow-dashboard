export default class Dashboard {
  constructor(config = {}) {
    this.container = config.container;
    this.counterElement = config.counterElement || null;
    this.emptyElement = config.emptyElement || null;
    this.feedbackElement = config.feedbackElement || null;
    this.registry = config.registry || {};
    this.widgetLabels = config.widgetLabels || {};
    this.widgets = new Map();
    this.feedbackTimer = null;

    if (!this.container) {
      throw new Error('Dashboard container is required.');
    }
  }

  registerWidget(type, WidgetClass) {
    this.registry[type] = WidgetClass;
  }

  addWidget(widgetType, config = {}) {
    const WidgetClass = this.registry[widgetType];

    if (!WidgetClass) {
      throw new Error(`Unknown widget type: ${widgetType}`);
    }

    if (this.hasWidgetType(widgetType)) {
      const label = this.widgetLabels[widgetType] || widgetType;
      this.showFeedback(`Виджет «${label}» уже добавлен на панель.`, 'warning');
      return null;
    }

    const widget = new WidgetClass({
      ...config,
      onClose: (widgetId) => this.removeWidget(widgetId)
    });

    this.widgets.set(widget.id, widget);
    this.container.append(widget.render());
    this.updateState();

    if (!config.silent) {
      this.showFeedback(`Виджет «${widget.title}» добавлен.`, 'success');
    }

    return widget;
  }

  removeWidget(widgetId) {
    const widget = this.widgets.get(widgetId);

    if (!widget) return;

    widget.destroy();
    this.widgets.delete(widgetId);
    this.updateState();
  }

  reset() {
    [...this.widgets.keys()].forEach((widgetId) => this.removeWidget(widgetId));
    this.showFeedback('Панель очищена. Можно добавить новые виджеты.', 'info');
  }

  getActiveWidgets() {
    return [...this.widgets.values()];
  }

  hasWidgetType(widgetType) {
    return this.getActiveWidgets().some((widget) => widget.type === widgetType);
  }

  showFeedback(message, type = 'info') {
    if (!this.feedbackElement) return;

    window.clearTimeout(this.feedbackTimer);
    this.feedbackElement.textContent = message;
    this.feedbackElement.dataset.type = type;
    this.feedbackElement.hidden = false;

    this.feedbackTimer = window.setTimeout(() => {
      if (this.feedbackElement) {
        this.feedbackElement.hidden = true;
      }
    }, 3600);
  }

  updateState() {
    const count = this.widgets.size;

    if (this.counterElement) {
      this.counterElement.textContent = count;
    }

    if (this.emptyElement) {
      this.emptyElement.hidden = count > 0;
    }
  }
}
