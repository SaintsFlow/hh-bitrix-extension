async function saveKey() {
  const key = document.getElementById('apiKey').value;
  await chrome.storage.local.set({ apiKey: key });
  loadKey();
}

async function loadKey() {
  const result = await chrome.storage.local.get(['apiKey']);
  document.getElementById('apiKey').value = result.apiKey || '';
  showInfo();
}

async function logout() {
  await chrome.storage.local.remove(['apiKey']);
  document.getElementById('apiKey').value = '';
  document.getElementById('info').textContent = '';
}

async function showInfo() {
  const result = await chrome.storage.local.get(['apiKey']);
  const key = result.apiKey;
  if (!key) {
    document.getElementById('info').textContent = 'No API key set.';
    return;
  }
  try {
    const resp = await fetch('https://example.com/api/check', {
      headers: { 'Authorization': `Bearer ${key}` }
    });
    const data = await resp.json();
    document.getElementById('info').textContent =
      `User: ${data.user}\nSubscription until: ${data.expires}`;
  } catch (err) {
    console.error(err);
    document.getElementById('info').textContent = 'Failed to fetch info';
  }
}

document.getElementById('save').addEventListener('click', saveKey);
document.getElementById('logout').addEventListener('click', logout);

document.addEventListener('DOMContentLoaded', loadKey);
