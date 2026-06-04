const DB = 'https://suisse-public-2026-default-rtdb.firebaseio.com/state';

function save(key, value) {
  fetch(`${DB}/${key}.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value)
  });
}

function updateProgress() {
  const allChecks = [...document.querySelectorAll('input[type="checkbox"]')];
  const done = allChecks.filter(item => item.checked).length;
  const percent = allChecks.length ? Math.round((done / allChecks.length) * 100) : 0;
  const progressValue = document.getElementById('progressValue');
  const progressBar = document.getElementById('progressBar');
  if (progressValue) progressValue.textContent = percent;
  if (progressBar) progressBar.style.width = `${percent}%`;
}

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

// Make all machine-table columns editable (Bezeichnung, Artikel-Nr., Kategorie, Bemerkung)
// Make material-table name + kategorie columns editable (Anzahl + Bemerkung already are)
function makeTablesEditable() {
  document.querySelectorAll('.machine-table div:not(.table-head)').forEach(row => {
    const checkbox = row.querySelector('input[type="checkbox"]');
    if (!checkbox) return;
    const base = checkbox.dataset.check;
    const spans = [...row.querySelectorAll('span')].slice(1);
    ['name', 'artnr', 'kat', 'bem'].forEach((prefix, i) => {
      const span = spans[i];
      if (span && !span.dataset.field) {
        span.contentEditable = 'true';
        span.dataset.field = `${prefix}-${base}`;
      }
    });
  });

  document.querySelectorAll('.material-table div:not(.table-head)').forEach(row => {
    const checkbox = row.querySelector('input[type="checkbox"]');
    if (!checkbox) return;
    const base = checkbox.dataset.check;
    const spans = [...row.querySelectorAll('span')].slice(1);
    if (spans[0] && !spans[0].dataset.field) {
      spans[0].contentEditable = 'true';
      spans[0].dataset.field = `matname-${base}`;
    }
    if (spans[2] && !spans[2].dataset.field) {
      spans[2].contentEditable = 'true';
      spans[2].dataset.field = `matkat-${base}`;
    }
  });
}

// Must run before setting up listeners so all fields are registered
makeTablesEditable();

// Firebase real-time sync
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

// Contenteditable listeners — runs after makeTablesEditable so all fields are included
document.querySelectorAll('[contenteditable="true"]').forEach(field => {
  const key = field.dataset.field;
  if (!key) return;
  field.addEventListener('input', () => {
    save(key, field.textContent.trim());
  });
});

updateProgress();
