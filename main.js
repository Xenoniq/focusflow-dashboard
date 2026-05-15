import Dashboard from './js/Dashboard.js';
import ToDoWidget from './js/ToDoWidget.js';
import QuoteWidget from './js/QuoteWidget.js';
import WeatherWidget from './js/WeatherWidget.js';
import CurrencyWidget from './js/CurrencyWidget.js';
import FocusTimerWidget from './js/FocusTimerWidget.js';

const dashboard = new Dashboard({
  container: document.querySelector('#dashboard-grid'),
  counterElement: document.querySelector('#widget-counter'),
  emptyElement: document.querySelector('#empty-state')
});

dashboard.registerWidget('todo', ToDoWidget);
dashboard.registerWidget('quote', QuoteWidget);
dashboard.registerWidget('weather', WeatherWidget);
dashboard.registerWidget('currency', CurrencyWidget);
dashboard.registerWidget('focus', FocusTimerWidget);

const actionButtons = document.querySelectorAll('[data-widget]');
const resetButton = document.querySelector('#reset-dashboard');
const todayLabel = document.querySelector('#today-label');

if (todayLabel) {
  todayLabel.textContent = new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date());
}

actionButtons.forEach((button) => {
  button.addEventListener('click', () => {
    dashboard.addWidget(button.dataset.widget);
  });
});

resetButton.addEventListener('click', () => {
  dashboard.reset();
});

// Стартовое состояние: панель сразу показывает разные типы компонентов,
// включая два виджета с данными из сторонних API.
dashboard.addWidget('todo', {
  tasks: [
    { id: 'demo-1', text: 'Проверить требования задания', completed: true },
    { id: 'demo-2', text: 'Добавить минимум два API-виджета', completed: false },
    { id: 'demo-3', text: 'Выгрузить проект на GitHub Pages', completed: false }
  ]
});
dashboard.addWidget('weather', { city: 'Prague' });
dashboard.addWidget('currency', { baseCurrency: 'EUR', amount: 100 });
dashboard.addWidget('quote');
dashboard.addWidget('focus');
