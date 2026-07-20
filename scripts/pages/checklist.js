(function () {
  "use strict";

  const eventSelect = document.getElementById("checklist-event");
  const dateInput = document.getElementById("checklist-date");
  const statusSelect = document.getElementById("checklist-status");
  const guestsInput = document.getElementById("checklist-guests");
  const regionInput = document.getElementById("checklist-region");
  const list = document.getElementById("checklist-list");
  const params = new URLSearchParams(location.search);
  const actionLinks = {
    calculator: ["예산 계산", "calculator.html"],
    venues: ["업체 찾기", "venues.html"],
    compare: ["비교함", "compare.html"],
    inquiry: ["견적 문의", "compare.html"],
    guide: ["준비 가이드", "articles.html"]
  };

  function key() { return `checklist:${eventSelect.value}`; }
  function checked() {
    try { return new Set(JSON.parse(window.TaranStorage.get(key(), "[]") || "[]")); }
    catch (_error) { return new Set(); }
  }
  function save(set) { window.TaranStorage.set(key(), JSON.stringify([...set])); }

  function context() {
    return {
      event: eventSelect.value,
      province: regionInput.value.trim(),
      guests: guestsInput.value,
      date: dateInput.value
    };
  }

  function contextUrl(path) {
    const query = window.TaranSearchContext?.toParams?.(context()) || new URLSearchParams();
    return `${path}${query.size ? `?${query}` : ""}`;
  }

  function saveSettings() {
    const settings = { status: statusSelect.value, guests: guestsInput.value, region: regionInput.value.trim(), date: dateInput.value };
    window.TaranStorage.set("checklist-settings", JSON.stringify(settings));
    window.TaranSearchContext?.save?.(context());
  }

  function remainingDays() {
    if (!dateInput.value) return null;
    return Math.ceil((new Date(`${dateInput.value}T00:00:00`) - new Date()) / 86400000);
  }

  function updateSummary() {
    const template = window.TaranChecklistTemplates.getTemplate(eventSelect.value);
    const selected = checked();
    const pending = template.tasks.filter((task) => !selected.has(task.id));
    const dday = remainingDays();
    const today = dday === null ? 0 : pending.filter((task) => Number(task.days || 0) >= dday).length;
    const week = dday === null ? 0 : pending.filter((task) => Number(task.days || 0) < dday && Number(task.days || 0) >= dday - 7).length;
    const percent = template.tasks.length ? Math.round(selected.size / template.tasks.length * 100) : 0;
    document.getElementById("checklist-today-count").textContent = `${today}개`;
    document.getElementById("checklist-week-count").textContent = `${week}개`;
    document.getElementById("checklist-summary-progress").textContent = `${percent}%`;
    const nextTask = pending[0];
    const action = nextTask && actionLinks[nextTask.action] ? actionLinks[nextTask.action] : ["업체 찾기", "venues.html"];
    const nextLink = document.getElementById("checklist-next-action");
    nextLink.textContent = nextTask ? `다음: ${nextTask.title} · ${action[0]} →` : "준비 완료 · 업체 다시 보기 →";
    nextLink.href = contextUrl(action[1]);
  }

  function updateProgress() {
    const all = list.querySelectorAll('input[type="checkbox"]');
    const done = list.querySelectorAll('input[type="checkbox"]:checked');
    const percent = all.length ? Math.round(done.length / all.length * 100) : 0;
    document.getElementById("checklist-progress-label").textContent = `${percent}% 완료 · ${done.length}/${all.length}`;
    document.getElementById("checklist-progress-bar").style.width = `${percent}%`;
    updateSummary();
  }

  function updateDday() {
    if (!dateInput.value) { document.getElementById("checklist-dday").textContent = "행사일을 선택해 주세요."; return; }
    const diff = Math.ceil((new Date(`${dateInput.value}T00:00:00`) - new Date()) / 86400000);
    document.getElementById("checklist-dday").textContent = diff >= 0 ? `행사일까지 D-${diff}` : `행사일이 ${Math.abs(diff)}일 지났습니다.`;
    window.TaranStorage.set("checklist-date", dateInput.value);
    saveSettings();
    updateSummary();
  }

  function render() {
    const template = window.TaranChecklistTemplates.getTemplate(eventSelect.value);
    const selected = checked();
    document.getElementById("checklist-title").textContent = `${template.label} 준비 순서`;
    list.replaceChildren(...template.tasks.map((task) => {
      const row = document.createElement("article");
      row.className = `checklist-item${selected.has(task.id) ? " is-done" : ""}`;
      const box = document.createElement("input");
      box.type = "checkbox";
      box.checked = selected.has(task.id);
      box.setAttribute("aria-label", `${task.title} 완료`);
      const copy = document.createElement("div");
      const title = document.createElement("strong"); title.textContent = task.title;
      const timing = document.createElement("span"); timing.textContent = task.days ? `권장 시점 D-${task.days}` : "행사 전 확인";
      copy.append(title, timing);
      row.append(box, copy);
      if (actionLinks[task.action]) {
        const link = document.createElement("a");
        link.textContent = `${actionLinks[task.action][0]} →`;
        link.href = contextUrl(actionLinks[task.action][1]);
        link.addEventListener("click", () => {
          const eventName = task.action === "venues" ? "checklist_to_venues" : task.action === "calculator" ? "checklist_to_calculator" : "checklist_action";
          window.TaranAnalytics?.track(eventName, "checklist.html", { eventType: eventSelect.value, taskId: task.id }).catch(() => {});
        });
        row.append(link);
      }
      box.addEventListener("change", () => {
        box.checked ? selected.add(task.id) : selected.delete(task.id);
        row.classList.toggle("is-done", box.checked);
        save(selected);
        updateProgress();
        if (box.checked) {
          window.TaranAnalytics?.track("checklist_task_completed", "checklist.html", { eventType: eventSelect.value, taskId: task.id }).catch(() => {});
        }
      });
      return row;
    }));
    updateProgress();
  }

  eventSelect.value = window.TaranChecklistTemplates.labels[params.get("event")] ? params.get("event") : "kids";
  const storedSettings = (() => {
    try { return JSON.parse(window.TaranStorage.get("checklist-settings", "{}") || "{}"); }
    catch (_error) { return {}; }
  })();
  dateInput.value = params.get("date") || storedSettings.date || window.TaranStorage.get("checklist-date", "");
  guestsInput.value = params.get("guests") || storedSettings.guests || "";
  regionInput.value = params.get("province") || storedSettings.region || "";
  statusSelect.value = storedSettings.status || "start";
  eventSelect.addEventListener("change", () => { saveSettings(); render(); });
  dateInput.addEventListener("change", updateDday);
  [statusSelect, guestsInput, regionInput].forEach((element) => element.addEventListener("change", () => { saveSettings(); render(); }));
  document.getElementById("checklist-reset").addEventListener("click", () => { window.TaranStorage.remove(key()); render(); });
  updateDday();
  render();
})();
