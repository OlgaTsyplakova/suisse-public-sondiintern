const storageKey = "sondi-suisse-public-2026-v2";
const pageState = JSON.parse(localStorage.getItem(storageKey) || "{}");

const saveState = () => {
  localStorage.setItem(storageKey, JSON.stringify(pageState));
};

const updateProgress = () => {
  const allChecks = [...document.querySelectorAll('input[type="checkbox"]')];
  const done = allChecks.filter((item) => item.checked).length;
  const percent = allChecks.length ? Math.round((done / allChecks.length) * 100) : 0;

  const progressValue = document.getElementById("progressValue");
  const progressBar = document.getElementById("progressBar");

  if (progressValue) {
    progressValue.textContent = percent;
  }

  if (progressBar) {
    progressBar.style.width = `${percent}%`;
  }

  document.querySelectorAll(".checklist-card").forEach((card) => {
    const checks = [...card.querySelectorAll('input[type="checkbox"]')];
    const checked = checks.filter((item) => item.checked).length;
    const count = card.querySelector(".count");
    if (count) {
      count.textContent = `${checked}/${checks.length}`;
    }
  });
};

document.querySelectorAll('input[type="checkbox"]').forEach((checkbox, index) => {
  const key = checkbox.dataset.check || `check-${index}`;
  if (Object.hasOwn(pageState, key)) {
    checkbox.checked = Boolean(pageState[key]);
  }
  checkbox.addEventListener("change", () => {
    pageState[key] = checkbox.checked;
    saveState();
    updateProgress();
  });
});

document.querySelectorAll('[contenteditable="true"]').forEach((field) => {
  const key = field.dataset.field;
  if (pageState[key]) {
    field.textContent = pageState[key];
  }

  field.addEventListener("input", () => {
    pageState[key] = field.textContent.trim();
    saveState();
  });
});

const notes = document.getElementById("notes");
if (notes) {
  notes.value = pageState.notes || "";
  notes.addEventListener("input", () => {
    pageState.notes = notes.value;
    saveState();
  });
}

const resetChecks = document.getElementById("resetChecks");
if (resetChecks) {
  resetChecks.addEventListener("click", () => {
    document.querySelectorAll('input[type="checkbox"]').forEach((checkbox, index) => {
      const key = checkbox.dataset.check || `check-${index}`;
      checkbox.checked = false;
      pageState[key] = false;
    });
    saveState();
    updateProgress();
  });
}

const printPage = document.getElementById("printPage");
if (printPage) {
  printPage.addEventListener("click", () => {
    window.print();
  });
}

updateProgress();
