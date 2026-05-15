import UIComponent from './UIComponent.js';

export default class ToDoWidget extends UIComponent {
  constructor(config = {}) {
    super({
      ...config,
      title: config.title || 'Список задач',
      icon: config.icon || '✓',
      type: 'todo'
    });

    this.tasks = [...(config.tasks || [])];
    this.formElement = null;
    this.inputElement = null;
    this.listElement = null;
    this.statsElement = null;

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleTaskAction = this.handleTaskAction.bind(this);
  }

  renderContent() {
    const content = document.createElement('div');
    content.className = 'todo-widget';
    content.innerHTML = `
      <form class="inline-form" autocomplete="off">
        <label class="sr-only" for="task-${this.id}">Новая задача</label>
        <input id="task-${this.id}" type="text" placeholder="Например: сверстать hero-блок" maxlength="80" />
        <button type="submit">Добавить</button>
      </form>
      <ul class="todo-list" aria-label="Список задач"></ul>
      <div class="widget-stats" aria-live="polite"></div>
    `;

    this.formElement = content.querySelector('.inline-form');
    this.inputElement = content.querySelector('input');
    this.listElement = content.querySelector('.todo-list');
    this.statsElement = content.querySelector('.widget-stats');

    this.addListener(this.formElement, 'submit', this.handleSubmit);
    this.addListener(this.listElement, 'click', this.handleTaskAction);

    this.renderTasks();
    return content;
  }

  handleSubmit(event) {
    event.preventDefault();

    const text = this.inputElement.value.trim();
    if (!text) {
      this.showMessage('Введите текст задачи.', 'warning');
      return;
    }

    this.clearMessage();
    this.addTask(text);
    this.inputElement.value = '';
    this.inputElement.focus();
  }

  handleTaskAction(event) {
    const target = event.target;
    const item = target.closest('[data-task-id]');
    if (!item) return;

    const taskId = item.dataset.taskId;

    if (target.matches('[data-action="toggle"]')) {
      this.toggleTask(taskId);
    }

    if (target.matches('[data-action="remove"]')) {
      this.removeTask(taskId);
    }
  }

  addTask(text) {
    this.tasks.unshift({
      id: `task-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      text,
      completed: false
    });

    this.renderTasks();
  }

  toggleTask(taskId) {
    this.tasks = this.tasks.map((task) => (
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));

    this.renderTasks();
  }

  removeTask(taskId) {
    this.tasks = this.tasks.filter((task) => task.id !== taskId);
    this.renderTasks();
  }

  renderTasks() {
    if (!this.listElement || !this.statsElement) return;

    if (this.tasks.length === 0) {
      this.listElement.innerHTML = '<li class="todo-empty">Пока задач нет. Добавьте первую.</li>';
    } else {
      this.listElement.innerHTML = this.tasks.map((task) => `
        <li class="todo-item ${task.completed ? 'todo-item--done' : ''}" data-task-id="${task.id}">
          <button class="todo-check" type="button" data-action="toggle" aria-label="Изменить статус задачи">
            ${task.completed ? '✓' : ''}
          </button>
          <span>${this.escapeHTML(task.text)}</span>
          <button class="todo-remove" type="button" data-action="remove" aria-label="Удалить задачу">×</button>
        </li>
      `).join('');
    }

    const completed = this.tasks.filter((task) => task.completed).length;
    this.statsElement.innerHTML = `
      <span>${this.tasks.length} всего</span>
      <span>${completed} выполнено</span>
      <span>${this.tasks.length - completed} активно</span>
    `;
  }
}
