# HH Resume Exporter

Расширение для браузера, которое позволяет экспортировать резюме с hh.kz в вашу CRM систему.

## 🚀 Ключевые возможности

- **📤 Автоматический экспорт** резюме с hh.kz в CRM систему
- **🔍 Интеллектуальный поиск данных** - автоматическое извлечение имени, контактов и должности
- **📱 Поддержка динамических попапов** - работа с PDF ссылками в модальных окнах
- **🔄 SPA совместимость** - поддержка одностраничных приложений
- **⚡ Множественные селекторы** - надежная работа с различными версиями hh.kz
- **🎯 Адаптивная кнопка** - автоматическое размещение в подходящем месте на странице
- **🛡️ Продвинутая обработка ошибок** - детальное логирование и обработка исключений
- **📋 Multipart загрузка файлов** - корректная отправка PDF резюме через API

## Возможности

- 🔐 Авторизация через API токен
- 👤 Отображение информации о сотруднике и компании
- 📄 Экспорт резюме с hh.kz одним кликом
- 📎 Автоматическая загрузка PDF файлов резюме
- 📊 Мониторинг статуса подписки

## API Endpoints

Расширение работает с следующими API endpoints:

### 1. Получение данных сотрудника

```
GET /api/employee/data
Authorization: Bearer {token}
```

Ответ:

```json
{
  "success": true,
  "data": {
    "employee": {
      "id": 1,
      "name": "Имя сотрудника",
      "email": "email@company.com",
      "position": "Должность",
      "phone": "+7123456789",
      "is_active": true,
      "created_at": "2025-06-08T06:17:27.000000Z",
      "last_login_at": "2025-06-08T07:22:24.000000Z"
    },
    "client": {
      "id": 1,
      "name": "Название компании",
      "subscription_start_date": "2025-06-08T00:00:00.000000Z",
      "subscription_end_date": "2026-06-08T00:00:00.000000Z",
      "is_active": true,
      "subscription_expires_in_days": 365,
      "max_employees": 2,
      "current_employees_count": 1
    },
    "token_info": {
      "name": "employee-token",
      "created_at": "2025-06-08T06:17:29.000000Z",
      "last_used_at": "2025-06-08T07:22:24.000000Z"
    }
  }
}
```

### 2. Отправка резюме

```
POST /api/employee/submit-resume
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

Параметры:

- `candidate_name` - Имя кандидата
- `candidate_phone` - Телефон кандидата
- `candidate_email` - Email кандидата
- `position` - Должность
- `resume_file` - PDF файл резюме (опционально)

## Установка

1. Откройте Chrome/Edge и перейдите в `chrome://extensions/`
2. Включите "Режим разработчика"
3. Нажмите "Загрузить распакованное расширение"
4. Выберите папку `src` этого проекта

## Настройка

1. Нажмите на иконку расширения в панели инструментов
2. Введите API Root: `http://localhost:8000/api`
3. Введите ваш токен авторизации
4. Нажмите "Сохранить и войти"

## Использование

1. Откройте страницу резюме на hh.kz (например: `https://hh.kz/resume/12345`)
2. На странице резюме появится кнопка "Выгрузить!"
3. Нажмите на кнопку для отправки резюме в вашу систему

## Функции

### Панель настроек

- Отображение информации о сотруднике
- Информация о компании и подписке
- Статистика использования токена
- Уведомления об истечении подписки

### Экспорт резюме

- Автоматическое извлечение данных кандидата
- Загрузка PDF файла резюме
- Отправка в формате multipart/form-data
- Визуальная обратная связь о статусе отправки

## Техническая информация

- Manifest V3
- Поддержка Chrome, Edge, Firefox
- Безопасное хранение токенов в browser storage
- Обработка ошибок и пользовательские уведомления

## Разработка

Структура проекта:

```
src/
├── manifest.json      # Манифест расширения
├── options.html       # Интерфейс настроек
├── options.js         # Логика настроек
├── content.js         # Скрипт для страниц hh.kz
└── background.js      # Фоновый скрипт
```

## 📚 Дополнительная документация

- **[TESTING_ENHANCED.md](TESTING_ENHANCED.md)** - Подробные инструкции по тестированию улучшенной версии
- **[ENHANCED_POPUP_SUPPORT.md](ENHANCED_POPUP_SUPPORT.md)** - Техническая документация по поддержке динамических попапов
- **[POPUP_SUPPORT.md](POPUP_SUPPORT.md)** - Базовая документация по работе с попапами
- **[TESTING.md](TESTING.md)** - Общие инструкции по тестированию

## 🧪 Тестовые файлы

- **`test-page-improved.html`** - Улучшенная тестовая страница с реалистичными попапами
- **`test-page.html`** - Базовая тестовая страница

## ⚡ Быстрый старт

1. **Клонируйте репозиторий**
2. **Запустите локальный сервер**: `python3 -m http.server 3000`
3. **Установите расширение** в Chrome (папка `src/`)
4. **Откройте тест**: http://localhost:3000/test-page-improved.html
5. **Настройте API** в опциях расширения
6. **Протестируйте экспорт** резюме

---

_Версия: 2.0 Enhanced - Полная поддержка динамических попапов и SPA навигации_
