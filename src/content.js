(function() {
  const API_URL = 'https://example.com/api/resume'; // change to your API

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
      alert('API key is not set in extension options.');
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
    btn.textContent = 'Export Resume';
    btn.style.marginLeft = '8px';
    btn.addEventListener('click', sendResume);
    container.appendChild(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectButton);
  } else {
    injectButton();
  }
})();
