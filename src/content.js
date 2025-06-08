(function() {
  function getApiSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['apiKey', 'apiRoot'], (result) => {
        resolve({
          apiKey: result.apiKey || null,
          apiRoot: result.apiRoot || null
        });
      });
    });
  }

  async function findPdfLink() {
    // Сначала ищем уже существующую ссылку
    let link = document.querySelector('a[href*="type=pdf"]');
    
    if (!link) {
      link = document.querySelector('a[data-qa="cell"][href*=".pdf"]');
    }
    
    if (!link) {
      link = document.querySelector('a[href$=".pdf"]');
    }
    
    if (!link) {
      link = document.querySelector('a[href*="/resume_converter/"]');
    }

    // Если ссылка найдена, возвращаем её
    if (link) {
      return link.href;
    }

    // Если ссылка не найдена, ищем кнопку для открытия попапа
    console.log('PDF link not found, looking for popup trigger button...');
    
    // Различные селекторы для кнопок, которые могут открывать попап с PDF
    const popupButtons = [
      '[data-qa="resume-download-pdf"]',
      '[data-qa="resume-actions-download"]',
      '[data-qa="resume-download"]',
      'button[title*="PDF"]',
      'button[title*="Скачать"]',
      'button[title*="Download"]',
      '[data-qa*="download"]',
      '[data-qa*="pdf"]',
      '.resume-download-button',
      '.pdf-download-button',
      '.download-btn',
      'button[class*="download"]',
      'a[class*="download"]',
      '[role="button"][data-qa*="download"]',
      'button:contains("PDF")',
      'button:contains("Скачать")',
      'button:contains("Download")',
      // Дополнительные селекторы для hh.kz
      '.bloko-button[data-qa*="download"]',
      '.resume-actions__item button',
      '.resume-header__actions button'
    ];

    for (const selector of popupButtons) {
      const button = document.querySelector(selector);
      if (button) {
        console.log('Found popup trigger button:', selector);
        return await triggerPopupAndGetPdfLink(button);
      }
    }

    // Ищем кнопки по тексту
    const buttons = document.querySelectorAll('button, a, [role="button"]');
    for (const button of buttons) {
      const text = button.textContent.toLowerCase().trim();
      const title = (button.title || '').toLowerCase();
      const ariaLabel = (button.getAttribute('aria-label') || '').toLowerCase();
      
      const searchText = `${text} ${title} ${ariaLabel}`;
      
      if (searchText.includes('pdf') || 
          searchText.includes('скачать') || 
          searchText.includes('download') ||
          searchText.includes('резюме') ||
          searchText.includes('выгрузить') ||
          searchText.includes('export')) {
        console.log('Found potential popup trigger by text:', text, 'title:', title, 'aria-label:', ariaLabel);
        return await triggerPopupAndGetPdfLink(button);
      }
    }

    console.log('No PDF link or popup trigger found');
    return null;
  }

  async function triggerPopupAndGetPdfLink(button) {
    return new Promise((resolve) => {
      console.log('Triggering popup...');
      
      // Создаем наблюдатель за изменениями DOM
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          // Проверяем добавленные узлы
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Расширенный поиск PDF ссылок в новых элементах
              const pdfSelectors = [
                'a[href*="type=pdf"]',
                'a[href*=".pdf"]',
                'a[href*="/resume_converter/"]',
                'a[href*="/download/"]',
                'a[href*="format=pdf"]',
                'a[data-qa*="pdf"]',
                'a[download]',
                '.download-link',
                '.pdf-link'
              ];
              
              for (const selector of pdfSelectors) {
                const pdfLink = node.querySelector ? node.querySelector(selector) : null;
                if (pdfLink && pdfLink.href) {
                  console.log('Found PDF link in popup:', pdfLink.href, 'selector:', selector);
                  observer.disconnect();
                  resolve(pdfLink.href);
                  return;
                }
              }

              // Проверяем, если сам узел является PDF ссылкой
              if (node.tagName === 'A' && node.href) {
                const href = node.href.toLowerCase();
                if (href.includes('type=pdf') || 
                    href.includes('.pdf') || 
                    href.includes('/resume_converter/') ||
                    href.includes('/download/') ||
                    href.includes('format=pdf') ||
                    node.hasAttribute('download')) {
                  console.log('Found PDF link (direct node):', node.href);
                  observer.disconnect();
                  resolve(node.href);
                  return;
                }
              }
              
              // Проверяем модальные окна и попапы
              if (node.classList && (
                  node.classList.contains('modal') ||
                  node.classList.contains('popup') ||
                  node.classList.contains('overlay') ||
                  node.classList.contains('dropdown') ||
                  node.hasAttribute('data-qa') && node.getAttribute('data-qa').includes('modal')
                )) {
                console.log('Found modal/popup container, searching for PDF links inside...');
                // Даем время модальному окну полностью загрузиться
                setTimeout(() => {
                  for (const selector of pdfSelectors) {
                    const modalPdfLink = node.querySelector(selector);
                    if (modalPdfLink && modalPdfLink.href) {
                      console.log('Found PDF link in modal:', modalPdfLink.href);
                      observer.disconnect();
                      resolve(modalPdfLink.href);
                      return;
                    }
                  }
                }, 500);
              }
            }
          }
        }
      });

      // Начинаем наблюдение
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style'] // Отслеживаем изменения видимости
      });

      // Кликаем по кнопке
      try {
        button.click();
        console.log('Button clicked, waiting for popup...');
      } catch (error) {
        console.error('Error clicking button:', error);
        observer.disconnect();
        resolve(null);
        return;
      }

      // Таймаут на случай, если попап не появится
      setTimeout(() => {
        console.log('Popup timeout, checking DOM manually...');
        observer.disconnect();
        
        // Финальная проверка DOM с расширенными селекторами
        const finalSelectors = [
          'a[href*="type=pdf"]',
          'a[href*=".pdf"]',
          'a[href*="/resume_converter/"]',
          'a[href*="/download/"]',
          'a[href*="format=pdf"]',
          'a[data-qa*="pdf"]',
          'a[download]'
        ];
        
        for (const selector of finalSelectors) {
          const finalLink = document.querySelector(selector);
          if (finalLink && finalLink.href) {
            console.log('Found PDF link in final check:', finalLink.href);
            resolve(finalLink.href);
            return;
          }
        }
        
        resolve(null);
      }, 5000); // Увеличил таймаут до 5 секунд
    });
  }

  async function collectResumeData() {
    // Улучшенный поиск имени кандидата
    let candidateName = '';
    const nameSelectors = [
      '[data-qa="resume-personal-name"] h2',
      '[data-qa="resume-personal-name"]',
      '.resume-block__title-text',
      '.resume-header__name',
      'h1[data-qa*="name"]',
      '.bloko-header-section-2'
    ];
    
    for (const selector of nameSelectors) {
      const nameEl = document.querySelector(selector);
      if (nameEl && nameEl.textContent.trim()) {
        candidateName = nameEl.textContent.trim();
        break;
      }
    }

    // Улучшенный поиск телефона
    let candidatePhone = '';
    const phoneSelectors = [
      'a[href^="tel:"]',
      '[data-qa="resume-contacts-phone"]',
      '.resume-contacts__item a[href^="tel:"]',
      '.bloko-link-switch[href^="tel:"]'
    ];
    
    for (const selector of phoneSelectors) {
      const phoneEl = document.querySelector(selector);
      if (phoneEl && phoneEl.textContent.trim()) {
        candidatePhone = phoneEl.textContent.trim();
        break;
      }
    }

    // Улучшенный поиск email
    let candidateEmail = '';
    const emailSelectors = [
      'a[href^="mailto:"]',
      '[data-qa="resume-contacts-email"]',
      '.resume-contacts__item a[href^="mailto:"]',
      '.bloko-link-switch[href^="mailto:"]'
    ];
    
    for (const selector of emailSelectors) {
      const emailEl = document.querySelector(selector);
      if (emailEl) {
        if (emailEl.href && emailEl.href.startsWith('mailto:')) {
          candidateEmail = emailEl.href.replace('mailto:', '');
        } else if (emailEl.textContent.trim()) {
          candidateEmail = emailEl.textContent.trim();
        }
        if (candidateEmail) break;
      }
    }
    
    // Получаем желаемую должность с расширенным поиском
    let position = '';
    const positionSelectors = [
      '[data-qa="resume-block-title-position"]',
      '.resume-block__title-text',
      '.resume-header__title',
      'h1[data-qa*="position"]',
      '.bloko-header-section-1',
      '.resume-profession'
    ];
    
    for (const selector of positionSelectors) {
      const positionEl = document.querySelector(selector);
      if (positionEl && positionEl.textContent.trim()) {
        position = positionEl.textContent.trim();
        break;
      }
    }
    
    // Если должность не найдена, ищем в заголовке страницы
    if (!position) {
      const titleEl = document.querySelector('title');
      if (titleEl && titleEl.textContent.trim()) {
        const titleText = titleEl.textContent.trim();
        // Извлекаем должность из заголовка (обычно в формате "Должность — Имя")
        const parts = titleText.split('—');
        if (parts.length > 1) {
          position = parts[0].trim();
        } else {
          position = titleText;
        }
      }
    }
    
    const pdfLink = await findPdfLink();
    
    const data = {
      candidate_name: candidateName,
      candidate_phone: candidatePhone,
      candidate_email: candidateEmail,
      position: position,
      resume_file: pdfLink
    };
    
    console.log('Collected resume data:', data);
    
    return data;
  }

  async function downloadFile(url) {
    try {
      console.log('Downloading file from:', url);
      
      // Если URL относительный, делаем его абсолютным
      const fileUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
      
      const response = await fetch(fileUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf,*/*',
        },
        credentials: 'include' // Включаем cookies для авторизации на hh.kz
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('File downloaded successfully, size:', blob.size, 'bytes');
      
      return blob;
    } catch (error) {
      console.error('Error downloading file:', error);
      return null;
    }
  }

  async function sendResume() {
    const { apiKey, apiRoot } = await getApiSettings();
    
    if (!apiKey || !apiRoot) {
      alert('API ключ или URL не установлены. Настройте расширение в опциях.');
      return;
    }

    const btn = document.getElementById('hh-export-btn');
    const originalText = btn.textContent;
    btn.textContent = 'Отправка...';
    btn.disabled = true;

    try {
      const data = await collectResumeData();
      
      if (!data.candidate_name || !data.candidate_email) {
        throw new Error('Не найдены обязательные данные кандидата (имя или email)');
      }

      const formData = new FormData();
      formData.append('candidate_name', data.candidate_name);
      formData.append('candidate_phone', data.candidate_phone);
      formData.append('candidate_email', data.candidate_email);
      formData.append('position', data.position);
      
      console.log('Sending resume data:', {
        candidate_name: data.candidate_name,
        candidate_phone: data.candidate_phone,
        candidate_email: data.candidate_email,
        position: data.position,
        has_pdf: !!data.resume_file
      });
      
      // Если есть PDF файл, скачиваем и прикрепляем его
      if (data.resume_file) {
        console.log('Downloading PDF file:', data.resume_file);
        btn.textContent = 'Загрузка PDF...';
        
        const fileBlob = await downloadFile(data.resume_file);
        if (fileBlob && fileBlob.size > 0) {
          console.log('PDF downloaded successfully, attaching to form');
          $filename = data.candidate_name === undefined ? 'resume.pdf' : data.candidate_name + '.pdf';
          formData.append('resume_file', fileBlob, $filename);
        } else {
          console.warn('Failed to download PDF file or file is empty, continuing without it');
        }
      } else {
        console.log('No PDF file found');
      }
      
      btn.textContent = 'Отправка на сервер...';

      const response = await fetch(`${apiRoot}/employee/submit-resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        alert('Резюме успешно отправлено!');
        btn.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
        btn.textContent = 'Отправлено ✓';
        setTimeout(() => {
          btn.style.background = 'linear-gradient(135deg, #4a90e2, #357abd)';
          btn.textContent = originalText;
          btn.disabled = false;
        }, 3000);
      } else {
        throw new Error(result.message || 'Ошибка на сервере');
      }
      
    } catch (err) {
      console.error('Error sending resume:', err);
      alert(`Ошибка отправки резюме: ${err.message}`);
      btn.textContent = originalText;
      btn.disabled = false;
    }
  }

  function injectButton() {
    if (document.getElementById('hh-export-btn')) return;
    
    // Ищем подходящее место для размещения кнопки
    const containerSelectors = [
      '[data-qa="resume-personal-name"]',
      '.resume-header__name',
      '.resume-block__title',
      '.bloko-header-section-2',
      '.resume-header',
      '.resume-actions',
      'h1'
    ];
    
    let container = null;
    for (const selector of containerSelectors) {
      container = document.querySelector(selector);
      if (container) {
        console.log('Found container for button:', selector);
        break;
      }
    }
    
    if (!container) {
      console.log('No suitable container found for button');
      return;
    }

    const btn = document.createElement('button');
    btn.id = 'hh-export-btn';
    btn.textContent = 'Выгрузить в CRM';

    // Применяем стили через JavaScript
    btn.style.background = 'linear-gradient(135deg, #4a90e2, #357abd)';
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.style.padding = '8px 16px';
    btn.style.borderRadius = '6px';
    btn.style.fontSize = '13px';
    btn.style.fontWeight = '500';
    btn.style.cursor = 'pointer';
    btn.style.transition = 'all 0.2s ease';
    btn.style.marginLeft = '8px';
    btn.style.marginTop = '4px';
    btn.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    btn.style.display = 'inline-block';
    btn.style.verticalAlign = 'middle';
    btn.style.zIndex = '1000';
    btn.style.position = 'relative';

    // Добавляем эффект hover
    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateY(-1px)';
      btn.style.boxShadow = '0 4px 12px rgba(74, 144, 226, 0.3)';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translateY(0)';
      btn.style.boxShadow = 'none';
    });

    btn.addEventListener('click', sendResume);
    
    // Размещаем кнопку в зависимости от типа контейнера
    if (container.tagName === 'H1' || container.tagName === 'H2') {
      // Если контейнер - заголовок, создаем wrapper
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.alignItems = 'center';
      wrapper.style.flexWrap = 'wrap';
      wrapper.style.gap = '8px';
      
      container.parentNode.insertBefore(wrapper, container);
      wrapper.appendChild(container);
      wrapper.appendChild(btn);
    } else {
      // Иначе просто добавляем в контейнер
      container.appendChild(btn);
    }
    
    console.log('Export button injected successfully');
  }

  // Функция инициализации с поддержкой SPA
  function initialize() {
    // Проверяем, что мы на странице резюме
    if (!window.location.href.includes('hh.') || 
        (!window.location.pathname.includes('/resume/') && !window.location.pathname.includes('/resumes/'))) {
      return;
    }
    
    console.log('HH Resume Export: Initializing on resume page');
    
    // Пытаемся добавить кнопку
    injectButton();
    
    // Если кнопка не добавилась, пробуем через небольшую задержку
    if (!document.getElementById('hh-export-btn')) {
      setTimeout(() => {
        injectButton();
      }, 1000);
    }
  }

  // Наблюдатель за изменениями URL (для SPA)
  let currentUrl = window.location.href;
  
  function checkUrlChange() {
    if (currentUrl !== window.location.href) {
      currentUrl = window.location.href;
      console.log('URL changed to:', currentUrl);
      
      // Удаляем старую кнопку если есть
      const oldBtn = document.getElementById('hh-export-btn');
      if (oldBtn) {
        oldBtn.remove();
      }
      
      // Пробуем инициализировать на новой странице
      setTimeout(initialize, 500);
    }
  }

  // Проверяем изменения URL каждые 500ms
  setInterval(checkUrlChange, 500);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
