let alertCount = 0;
const MAX_ALERTS = 3;

async function saveKey() {
  const apiRoot = document.getElementById("apiRoot").value.trim();
  const key = document.getElementById("apiKey").value.trim();

  if (!apiRoot || !key) {
    showError("Заполните все поля!");
    return;
  }

  if (!isValidUrl(apiRoot)) {
    return showError("API Root — некорректный URL.");
  }

  if (key.length < 20) {
    return showError("API-ключ выглядит слишком коротким.");
  }

  await chrome.storage.local.set({ apiKey: key, apiRoot: apiRoot });
  loadKey();
}

async function loadKey() {
  const result = await chrome.storage.local.get([
    "apiKey",
    "apiRoot",
    "alertShown",
  ]);

  document.getElementById("apiKey").value = result.apiKey || "";
  document.getElementById("apiRoot").value = result.apiRoot || "";

  const hasKey = result.apiKey && result.apiRoot;

  // Показать/скрыть кнопки и настроить поля
  if (hasKey) {
    document.getElementById("save").style.display = "none";
    document.getElementById("logout").style.display = "block";
    document.getElementById("apiKey").readOnly = true;
    document.getElementById("apiRoot").readOnly = true;
    showInfo();
  } else {
    document.getElementById("save").style.display = "block";
    document.getElementById("logout").style.display = "none";
    document.getElementById("apiKey").readOnly = false;
    document.getElementById("apiRoot").readOnly = false;
    hideInfo();
  }
}

async function logout() {
  await chrome.storage.local.remove(["apiKey", "apiRoot", "alertShown"]);
  document.getElementById("apiKey").value = "";
  document.getElementById("apiRoot").value = "";
  document.getElementById("apiKey").readOnly = false;
  document.getElementById("apiRoot").readOnly = false;

  document.getElementById("save").style.display = "block";
  document.getElementById("logout").style.display = "none";
  hideInfo();
}

async function showInfo() {
  const result = await chrome.storage.local.get(["apiKey", "apiRoot"]);
  const key = result.apiKey;
  const apiRoot = result.apiRoot;

  if (!key || !apiRoot) {
    showError("Ключ или API root не указан!");
    return;
  }

  try {
    const resp = await fetch(`${apiRoot}/employee/data`, {
      headers: { Authorization: `Bearer ${key}` },
    });

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }

    const response = await resp.json();

    if (!response.success) {
      throw new Error("API returned error");
    }

    const { employee, client, token_info } = response.data;
    const infoDiv = document.getElementById("info");
    
    const subscriptionEndDate = new Date(client.subscription_end_date);
    const now = new Date();
    const daysLeft = Math.ceil((subscriptionEndDate - now) / (1000 * 60 * 60 * 24));

    let expiresClass = "expires-normal";
    if (daysLeft <= 7) {
      expiresClass = "expires-soon";
      checkAndShowAlert(daysLeft);
    }

    infoDiv.innerHTML = `
      <div><strong>Сотрудник:</strong> ${employee.name}</div>
      <div><strong>Email:</strong> ${employee.email}</div>
      <div><strong>Должность:</strong> ${employee.position || 'Не указана'}</div>
      <div><strong>Телефон:</strong> ${employee.phone || 'Не указан'}</div>
      <hr style="margin: 12px 0; border: none; border-top: 1px solid #e1e5e9;">
      <div><strong>Компания:</strong> ${client.name}</div>
      <div><strong>Подписка до:</strong> <span class="${expiresClass}">${formatDate(subscriptionEndDate)} (${daysLeft} дней)</span></div>
      <div><strong>Сотрудников:</strong> ${client.current_employees_count}/${client.max_employees}</div>
      <div><strong>Статус:</strong> ${client.is_active ? 'Активна' : 'Неактивна'}</div>
      <hr style="margin: 12px 0; border: none; border-top: 1px solid #e1e5e9;">
      <div><strong>Токен создан:</strong> ${formatDate(new Date(token_info.created_at))}</div>
      <div><strong>Последнее использование:</strong> ${token_info.last_used_at ? formatDate(new Date(token_info.last_used_at)) : 'Никогда'}</div>
    `;

    infoDiv.className = "info-block user-info";
    infoDiv.style.display = "block";
  } catch (err) {
    console.error(err);
    showError("Ошибка проверки ключа! Проверьте API root и ключ.");
  }
}

function isValidUrl(str) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

function showError(message) {
  const infoDiv = document.getElementById("info");
  infoDiv.textContent = message;
  infoDiv.className = "info-block error-info";
  infoDiv.style.display = "block";

  document.getElementById("logout").style.display = "none";
  document.getElementById("save").style.display = "block";
  document.getElementById("apiKey").readOnly = false;
  document.getElementById("apiRoot").readOnly = false;
}

function hideInfo() {
  document.getElementById("info").style.display = "none";
}

function formatDate(date) {
  return date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function checkAndShowAlert(daysLeft) {
  const result = await chrome.storage.local.get(["alertShown"]);
  const alertShown = result.alertShown || 0;

  if (alertShown < MAX_ALERTS && daysLeft <= 7) {
    showAlert(daysLeft);
    await chrome.storage.local.set({ alertShown: alertShown + 1 });
  }
}

function showAlert(daysLeft) {
  const overlay = document.createElement("div");
  overlay.className = "alert-overlay";

  const alertBox = document.createElement("div");
  alertBox.className = "alert-box";

  alertBox.innerHTML = `
        <div class="alert-title">⚠️ Внимание!</div>
        <div class="alert-message">
          Ваша подписка истекает через ${daysLeft} ${getDaysWord(daysLeft)}!<br>
          Обновите подписку, чтобы продолжить использование.
        </div>
        <button class="alert-button" onclick="this.closest('.alert-overlay').remove()">Понятно</button>
      `;

  overlay.appendChild(alertBox);
  document.body.appendChild(overlay);

  // Автоматически закрыть через 10 секунд
  setTimeout(() => {
    if (overlay.parentNode) {
      overlay.remove();
    }
  }, 10000);
}

function getDaysWord(days) {
  if (days === 1) return "день";
  if (days >= 2 && days <= 4) return "дня";
  return "дней";
}

document.getElementById("save").addEventListener("click", saveKey);
document.getElementById("logout").addEventListener("click", logout);
document.addEventListener("DOMContentLoaded", loadKey);
