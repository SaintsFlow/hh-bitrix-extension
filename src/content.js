(function() {
  const API_URL = document.getElementById("apiRoot").value.trim();

  function getApiKey() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['apiKey'], (result) => {
        resolve(result.apiKey || null);
      });
    });
  }

  function findPdfLink() {
    const link = document.querySelector('a[href$=".pdf"]');
    return link ? link.href : null;
  }

  async function collectResumeData() {
    const nameEl = document.querySelector('[data-qa="resume-personal-name"] h2');
    const genderEl = document.querySelector('[data-qa="resume-personal-gender"]');
    const ageEl = document.querySelector('[data-qa="resume-personal-age"]');
    const birthdayEl = document.querySelector('[data-qa="resume-personal-birthday"]');
    const phoneEl = document.querySelector('a[href^="tel:"]');
    const emailEl = document.querySelector('a[href^="mailto:"]');

    return {
      fullName: nameEl ? nameEl.textContent.trim() : '',
      gender: genderEl ? genderEl.textContent.trim() : '',
      age: ageEl ? ageEl.textContent.trim() : '',
      birthday: birthdayEl ? birthdayEl.textContent.trim() : '',
      phone: phoneEl ? phoneEl.textContent.trim() : '',
      email: emailEl ? emailEl.textContent.trim() : '',
      pdf: findPdfLink()
    };
  }

  async function sendResume() {
    const apiKey = await getApiKey();
    if (!apiKey) {
      alert('API ключ не установлен');
      return;
    }

    const data = await collectResumeData();

    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(data)
      });
      alert('Resume sent successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to send resume');
    }
  }

  function injectButton() {
    if (document.getElementById('hh-export-btn')) return;
    const container = document.querySelector('[data-qa="resume-personal-name"]');
    if (!container) return;

    const btn = document.createElement('button');
    btn.id = 'hh-export-btn';
    btn.textContent = 'Выгрузить!';

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
    btn.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

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
    container.appendChild(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectButton);
  } else {
    injectButton();
  }
})();
