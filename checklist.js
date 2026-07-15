const checklistInputs = [...document.querySelectorAll("[data-task]")];
const eventDateInput = document.querySelector("#event-date");
let checklistSaveTimer;

function checklistState() {
  return { eventDate: eventDateInput.value, tasks: Object.fromEntries(checklistInputs.map(input => [input.dataset.task, input.checked])) };
}

function currentPhase(days) {
  if (days > 90) return 0;
  if (days > 60) return 1;
  if (days > 40) return 2;
  if (days > 20) return 3;
  if (days > 7) return 4;
  return 5;
}

function renderChecklist() {
  const completed = checklistInputs.filter(input => input.checked).length;
  const percent = Math.round(completed / checklistInputs.length * 100);
  document.querySelector("#progress-label").textContent = `${percent}% 완료 · ${completed}/${checklistInputs.length}`;
  document.querySelector("#progress-bar").style.width = `${percent}%`;
  document.querySelectorAll("[data-phase]").forEach(card => card.classList.remove("is-current"));
  if (!eventDateInput.value) {
    document.querySelector("#d-day-label").textContent = "행사일을 입력해주세요";
    document.querySelector("#today-guide").textContent = "입력하면 지금 해야 할 준비를 알려드립니다.";
    return;
  }
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const eventDate = new Date(`${eventDateInput.value}T00:00:00`);
  const days = Math.ceil((eventDate - today) / 86400000);
  const label = days > 0 ? `D-${days}` : days === 0 ? "오늘이 행사일입니다" : `행사일로부터 ${Math.abs(days)}일 지남`;
  document.querySelector("#d-day-label").textContent = label;
  const phase = currentPhase(days);
  const currentCard = document.querySelector(`[data-phase="${phase}"]`);
  currentCard.classList.add("is-current");
  document.querySelector("#today-guide").textContent = days < 0 ? "완료하지 못한 항목이 있는지 마지막으로 확인해보세요." : `현재는 ‘${currentCard.querySelector("h3").textContent}’ 준비 구간입니다.`;
}

async function saveChecklist() {
  const state = checklistState();
  localStorage.setItem("sonpum-checklist", JSON.stringify(state));
  const account = window.SonpumAuth.getAccount();
  if (!account) {
    document.querySelector("#checklist-save-status").textContent = "현재 브라우저에 임시 저장 중";
    return;
  }
  try {
    await window.SonpumAuth.api("/api/member/state/checklist", { method: "PUT", body: JSON.stringify({ state }) });
    document.querySelector("#checklist-save-status").textContent = "계정에 자동 저장됨";
  } catch (_) {
    document.querySelector("#checklist-save-status").textContent = "저장 연결을 확인해주세요";
  }
}

function scheduleChecklistSave() { clearTimeout(checklistSaveTimer); checklistSaveTimer = setTimeout(saveChecklist, 400); }
function applyChecklistState(state) {
  eventDateInput.value = state.eventDate || "";
  checklistInputs.forEach(input => { input.checked = Boolean(state.tasks?.[input.dataset.task]); });
  renderChecklist();
}

checklistInputs.forEach(input => input.addEventListener("change", () => { renderChecklist(); scheduleChecklistSave(); }));
eventDateInput.addEventListener("change", () => { renderChecklist(); scheduleChecklistSave(); });
document.querySelector("#checklist-reset").addEventListener("click", () => { checklistInputs.forEach(input => { input.checked = false; }); renderChecklist(); scheduleChecklistSave(); });

(async function initializeChecklist() {
  const account = await window.SonpumAuth.ready;
  document.querySelector("#checklist-login-link").hidden = Boolean(account);
  document.querySelector(".checklist-login-cta").hidden = Boolean(account);
  if (account) {
    try {
      const saved = await window.SonpumAuth.api("/api/member/state/checklist");
      applyChecklistState(saved.state);
      document.querySelector("#checklist-save-status").textContent = "계정에 자동 저장됨";
      return;
    } catch (_) {}
  }
  try { applyChecklistState(JSON.parse(localStorage.getItem("sonpum-checklist") || "{}")); } catch (_) { applyChecklistState({}); }
  document.querySelector("#checklist-save-status").textContent = "현재 브라우저에 임시 저장 중";
})();
