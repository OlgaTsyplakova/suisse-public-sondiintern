const DB = 'https://suisse-public-2026-default-rtdb.firebaseio.com/state';

// Write a single value to Firebase
function save(key, value) {
  fetch(`${DB}/${key}.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value)
  });
}

// Update progress bar on current page
function updateProgress() {
  const allChecks = [...document.querySelectorAll('input[type="checkbox"]')];
  const done = allChecks.filter(item => item.checked).length;
  const percent = allChecks.length ? Math.round((done / allChecks.length) * 100) : 0;

  const progressValue = document.getElementById('progressValue');
  const progressBar = document.getElementById('progressBar');
  if (progressValue) progressValue.textContent = percent;
  if (progressBar) progressBar.style.width = `${percent}%`;
}

// Apply full state snapshot to the page
function applyState(data) {
  if (!data) return;

  document.querySelectorAll('input[type="checkbox"]').forEach((checkbox, i) => {
    const key = checkbox.dataset.check || `check-${i}`;
    if (key in data) checkbox.checked = Boolean(data[key]);
  });

  document.querySelectorAll('[contenteditable="true"]').forEach(field => {
    const key = field.dataset.field;
    if (key && key in data && document.activeElement !== field) {
      field.textContent = data[key];
    }
  });

  updateProgress();
}

// Apply a single key update
function applyKey(key, value) {
  const checkbox = document.querySelector(`input[data-check="${key}"]`);
  if (checkbox) {
    checkbox.checked = Boolean(value);
    updateProgress();
    return;
  }

  const field = document.querySelector(`[data-field="${key}"]`);
  if (field && document.activeElement !== field) {
    field.textContent = value || '';
  }
}

// Real-time listener via Firebase SSE
const eventSource = new EventSource(`${DB}.json`);

eventSource.addEventListener('put', e => {
  const { path, data } = JSON.parse(e.data);
  if (path === '/') {
    applyState(data);
  } else {
    applyKey(path.slice(1), data);
  }
});

eventSource.addEventListener('patch', e => {
  const { data } = JSON.parse(e.data);
  if (data) {
    Object.entries(data).forEach(([key, value]) => applyKey(key, value));
    updateProgress();
  }
});

// Checkbox listeners
document.querySelectorAll('input[type="checkbox"]').forEach((checkbox, i) => {
  const key = checkbox.dataset.check || `check-${i}`;
  checkbox.addEventListener('change', () => {
    save(key, checkbox.checked);
    updateProgress();
  });
});

// Contenteditable listeners
document.querySelectorAll('[contenteditable="true"]').forEach(field => {
  const key = field.dataset.field;
  if (!key) return;
  field.addEventListener('input', () => {
    save(key, field.textContent.trim());
  });
});

updateProgress();
