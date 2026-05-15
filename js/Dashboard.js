export default class Dashboard {
  constructor(config = {}) {
    this.container = config.container;
    this.counterElement = config.counterElement || null;
    this.emptyElement = config.emptyElement || null;
    this.registry = config.registry || {};
    this.widgets = new Map();

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

    const widget = new WidgetClass({
      ...config,
      onClose: (widgetId) => this.removeWidget(widgetId)
    });

    this.widgets.set(widget.id, widget);
    this.container.append(widget.render());
    this.updateState();

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
  }

  getActiveWidgets() {
    return [...this.widgets.values()];
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
