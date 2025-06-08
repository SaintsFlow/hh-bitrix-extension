# Поддержка динамических попапов - Расширенная версия

## Обзор улучшений

После анализа работы с hh.kz были внесены существенные улучшения в логику обработки динамических попапов и поиска PDF ссылок.

## Ключевые улучшения

### 1. Расширенные селекторы кнопок

```javascript
const popupButtons = [
  '[data-qa="resume-download-pdf"]',
  '[data-qa="resume-actions-download"]',
  '[data-qa="resume-download"]',
  'button[title*="PDF"]',
  'button[title*="Скачать"]',
  'button[title*="Download"]',
  '[data-qa*="download"]',
  '[data-qa*="pdf"]',
  ".resume-download-button",
  ".pdf-download-button",
  ".download-btn",
  'button[class*="download"]',
  'a[class*="download"]',
  '[role="button"][data-qa*="download"]',
  // Специфичные для hh.kz
  '.bloko-button[data-qa*="download"]',
  ".resume-actions__item button",
  ".resume-header__actions button",
];
```

### 2. Улучшенный поиск по тексту и атрибутам

Теперь функция анализирует не только текст кнопки, но и:

- `title` атрибут
- `aria-label` атрибут
- Комбинированный поиск по всем текстовым данным

```javascript
const text = button.textContent.toLowerCase().trim();
const title = (button.title || "").toLowerCase();
const ariaLabel = (button.getAttribute("aria-label") || "").toLowerCase();

const searchText = `${text} ${title} ${ariaLabel}`;

if (
  searchText.includes("pdf") ||
  searchText.includes("скачать") ||
  searchText.includes("download") ||
  searchText.includes("резюме") ||
  searchText.includes("выгрузить") ||
  searchText.includes("export")
) {
  // Обработка кнопки
}
```

### 3. Продвинутый MutationObserver

Улучшенная функция `triggerPopupAndGetPdfLink()` теперь:

#### Расширенные селекторы PDF ссылок:

```javascript
const pdfSelectors = [
  'a[href*="type=pdf"]',
  'a[href*=".pdf"]',
  'a[href*="/resume_converter/"]',
  'a[href*="/download/"]',
  'a[href*="format=pdf"]',
  'a[data-qa*="pdf"]',
  "a[download]",
  ".download-link",
  ".pdf-link",
];
```

#### Обнаружение модальных окон:

```javascript
if (
  node.classList &&
  (node.classList.contains("modal") ||
    node.classList.contains("popup") ||
    node.classList.contains("overlay") ||
    node.classList.contains("dropdown") ||
    (node.hasAttribute("data-qa") &&
      node.getAttribute("data-qa").includes("modal")))
) {
  // Обработка модального окна с задержкой для полной загрузки
  setTimeout(() => {
    // Поиск PDF ссылок внутри модального окна
  }, 500);
}
```

#### Расширенное наблюдение:

```javascript
observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ["class", "style"], // Отслеживание изменений видимости
});
```

### 4. Улучшенный сбор данных резюме

#### Множественные селекторы для каждого поля:

**Имя кандидата:**

```javascript
const nameSelectors = [
  '[data-qa="resume-personal-name"] h2',
  '[data-qa="resume-personal-name"]',
  ".resume-block__title-text",
  ".resume-header__name",
  'h1[data-qa*="name"]',
  ".bloko-header-section-2",
];
```

**Телефон:**

```javascript
const phoneSelectors = [
  'a[href^="tel:"]',
  '[data-qa="resume-contacts-phone"]',
  '.resume-contacts__item a[href^="tel:"]',
  '.bloko-link-switch[href^="tel:"]',
];
```

**Email:**

```javascript
const emailSelectors = [
  'a[href^="mailto:"]',
  '[data-qa="resume-contacts-email"]',
  '.resume-contacts__item a[href^="mailto:"]',
  '.bloko-link-switch[href^="mailto:"]',
];
```

**Должность:**

```javascript
const positionSelectors = [
  '[data-qa="resume-block-title-position"]',
  ".resume-block__title-text",
  ".resume-header__title",
  'h1[data-qa*="position"]',
  ".bloko-header-section-1",
  ".resume-profession",
];
```

### 5. Адаптивное размещение кнопки экспорта

Улучшенная функция `injectButton()` теперь:

#### Поиск подходящего контейнера:

```javascript
const containerSelectors = [
  '[data-qa="resume-personal-name"]',
  ".resume-header__name",
  ".resume-block__title",
  ".bloko-header-section-2",
  ".resume-header",
  ".resume-actions",
  "h1",
];
```

#### Адаптивное размещение:

```javascript
if (container.tagName === "H1" || container.tagName === "H2") {
  // Создаем wrapper для заголовков
  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.style.alignItems = "center";
  wrapper.style.flexWrap = "wrap";
  wrapper.style.gap = "8px";

  container.parentNode.insertBefore(wrapper, container);
  wrapper.appendChild(container);
  wrapper.appendChild(btn);
} else {
  // Просто добавляем в контейнер
  container.appendChild(btn);
}
```

### 6. Поддержка SPA навигации

#### Отслеживание изменений URL:

```javascript
let currentUrl = window.location.href;

function checkUrlChange() {
  if (currentUrl !== window.location.href) {
    currentUrl = window.location.href;
    console.log("URL changed to:", currentUrl);

    // Удаляем старую кнопку
    const oldBtn = document.getElementById("hh-export-btn");
    if (oldBtn) {
      oldBtn.remove();
    }

    // Инициализируем на новой странице
    setTimeout(initialize, 500);
  }
}

setInterval(checkUrlChange, 500);
```

#### Улучшенная инициализация:

```javascript
function initialize() {
  // Проверяем, что мы на странице резюме
  if (
    !window.location.href.includes("hh.") ||
    (!window.location.pathname.includes("/resume/") &&
      !window.location.pathname.includes("/resumes/"))
  ) {
    return;
  }

  injectButton();

  // Повторная попытка через секунду если не получилось
  if (!document.getElementById("hh-export-btn")) {
    setTimeout(() => {
      injectButton();
    }, 1000);
  }
}
```

## Тестовая страница

Создана улучшенная тестовая страница `test-page-improved.html` которая:

1. **Имитирует структуру hh.kz** с правильными селекторами
2. **Содержит динамический попап** с PDF ссылками
3. **Симулирует асинхронную загрузку** контента
4. **Включает отладочную информацию** для разработчика
5. **Поддерживает несколько сценариев** взаимодействия

### Особенности тестовой страницы:

- Модальное окно с задержкой загрузки PDF ссылок
- Динамическое добавление элементов через JavaScript
- Симуляция SPA поведения
- Консольные логи для отладки
- Проверка всех обязательных элементов

## Совместимость

Расширение теперь поддерживает:

- ✅ Статические PDF ссылки
- ✅ Динамические попапы
- ✅ Модальные окна
- ✅ SPA навигацию
- ✅ Асинхронную загрузку контента
- ✅ Различные CSS селекторы hh.kz
- ✅ Альтернативные размещения кнопки экспорта
- ✅ Множественные форматы данных

## Отладка

Для отладки добавлены детальные консольные логи:

```javascript
console.log("🧪 Enhanced test page loaded");
console.log("📥 Opening download modal...");
console.log("🔗 PDF link updated:", newHref);
console.log("✅ Content updated, new button added");
```

Используйте DevTools Console для мониторинга работы расширения.
