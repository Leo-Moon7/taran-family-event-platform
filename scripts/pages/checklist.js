(function () {
  "use strict";

  const eventSelect = document.getElementById("checklist-event");
  const dateInput = document.getElementById("checklist-date");
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

  function updateProgress() {
    const all = list.querySelectorAll('input[type="checkbox"]');
    const done = list.querySelectorAll('input[type="checkbox"]:checked');
    const percent = all.length ? Math.round(done.length / all.length * 100) : 0;
    document.getElementById("checklist-progress-label").textContent = `${percent}% 완료 · ${done.length}/${all.length}`;
    document.getElementById("checklist-progress-bar").style.width = `${percent}%`;
  }

  function updateDday() {
    if (!dateInput.value) { document.getElementById("checklist-dday").textContent = "행사일을 선택해 주세요."; return; }
    const diff = Math.ceil((new Date(`${dateInput.value}T00:00:00`) - new Date()) / 86400000);
    document.getElementById("checklist-dday").textContent = diff >= 0 ? `행사일까지 D-${diff}` : `행사일이 ${Math.abs(diff)}일 지났습니다.`;
    window.TaranStorage.set("checklist-date", dateInput.value);
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
        link.href = `${actionLinks[task.action][1]}?event=${encodeURIComponent(eventSelect.value)}`;
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
  dateInput.value = window.TaranStorage.get("checklist-date", "");
  eventSelect.addEventListener("change", render);
  dateInput.addEventListener("change", updateDday);
  document.getElementById("checklist-reset").addEventListener("click", () => { window.TaranStorage.remove(key()); render(); });
  updateDday();
  render();
})();
