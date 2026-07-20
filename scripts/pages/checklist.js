(function () {
  "use strict";

  const eventSelect = document.getElementById("checklist-event");
  const dateInput = document.getElementById("checklist-date");
  const statusSelect = document.getElementById("checklist-status");
  const guestsInput = document.getElementById("checklist-guests");
  const regionInput = document.getElementById("checklist-region");
  const memoInput = document.getElementById("checklist-memo");
  const customForm = document.getElementById("checklist-custom-form");
  const customInput = document.getElementById("checklist-custom-task");
  const list = document.getElementById("checklist-list");
  const params = new URLSearchParams(location.search);
  let accountChecklist = { events: {}, settings: {} };
  const actionLinks = {
    calculator: ["예산 계산", "calculator.html"],
    venues: ["업체 찾기", "venues.html"],
    compare: ["비교하기", "compare.html"],
    inquiry: ["견적 문의", "compare.html"],
    guide: ["준비 가이드", "articles.html"]
  };

  const now = () => new Date().toISOString();
  const timestamp = (value) => new Date(value || 0).getTime() || 0;
  const emptyEventState = () => ({ items: {}, memo: { value: "", updatedAt: "" }, customTasks: [], updatedAt: "" });
  const key = () => `checklist:${eventSelect.value}`;

  function normalizeEventState(value) {
    const state = emptyEventState();
    if (Array.isArray(value)) {
      value.forEach((id) => { state.items[id] = { completed: true, updatedAt: "" }; });
      return state;
    }
    if (!value || typeof value !== "object") return state;
    if (Array.isArray(value.completed)) {
      value.completed.forEach((id) => { state.items[id] = { completed: true, updatedAt: value.updatedAt || "" }; });
    }
    Object.entries(value.items || {}).forEach(([id, item]) => {
      state.items[id] = typeof item === "boolean"
        ? { completed: item, updatedAt: value.updatedAt || "" }
        : { completed: Boolean(item?.completed), updatedAt: item?.updatedAt || "" };
    });
    state.memo = typeof value.memo === "string"
      ? { value: value.memo, updatedAt: value.updatedAt || "" }
      : { value: String(value.memo?.value || ""), updatedAt: value.memo?.updatedAt || "" };
    state.customTasks = Array.isArray(value.customTasks)
      ? value.customTasks.filter((task) => task?.id && task?.title).map((task) => ({
        id: String(task.id),
        title: String(task.title).slice(0, 80),
        completed: Boolean(task.completed),
        updatedAt: task.updatedAt || value.updatedAt || "",
        deleted: Boolean(task.deleted)
      }))
      : [];
    state.updatedAt = value.updatedAt || "";
    return state;
  }

  function mergeEventStates(localValue, remoteValue) {
    const local = normalizeEventState(localValue);
    const remote = normalizeEventState(remoteValue);
    const merged = emptyEventState();
    new Set([...Object.keys(local.items), ...Object.keys(remote.items)]).forEach((id) => {
      const left = local.items[id];
      const right = remote.items[id];
      if (!left) merged.items[id] = right;
      else if (!right) merged.items[id] = left;
      else if (timestamp(left.updatedAt) === timestamp(right.updatedAt)) {
        merged.items[id] = { completed: left.completed || right.completed, updatedAt: left.updatedAt || right.updatedAt };
      } else merged.items[id] = timestamp(left.updatedAt) > timestamp(right.updatedAt) ? left : right;
    });
    merged.memo = timestamp(local.memo.updatedAt) >= timestamp(remote.memo.updatedAt) ? local.memo : remote.memo;
    const custom = new Map();
    [...remote.customTasks, ...local.customTasks].forEach((task) => {
      const previous = custom.get(task.id);
      if (!previous || timestamp(task.updatedAt) >= timestamp(previous.updatedAt)) custom.set(task.id, task);
    });
    merged.customTasks = [...custom.values()];
    merged.updatedAt = timestamp(local.updatedAt) >= timestamp(remote.updatedAt) ? local.updatedAt : remote.updatedAt;
    return merged;
  }

  function readLocalState() {
    try { return normalizeEventState(JSON.parse(window.TaranStorage.get(key(), "{}") || "{}")); }
    catch (_error) { return emptyEventState(); }
  }

  function currentState() {
    return mergeEventStates(readLocalState(), accountChecklist.events?.[eventSelect.value]);
  }

  async function saveAccount() {
    if (!window.TaranAuth?.getAccount?.()) return;
    try {
      await window.TaranAuth.api("/api/member/state/checklist", {
        method: "PUT",
        body: JSON.stringify({ state: accountChecklist })
      });
    } catch (_error) { /* 네트워크가 없을 때도 로컬 데이터는 유지됩니다. */ }
  }

  function persist(state) {
    state.updatedAt = now();
    window.TaranStorage.set(key(), JSON.stringify(state));
    accountChecklist.events[eventSelect.value] = state;
    saveAccount();
  }

  function context() {
    return { event: eventSelect.value, province: regionInput.value.trim(), guests: guestsInput.value, date: dateInput.value };
  }

  function contextUrl(path) {
    const query = window.TaranSearchContext?.toParams?.(context()) || new URLSearchParams();
    return `${path}${query.size ? `?${query}` : ""}`;
  }

  function saveSettings() {
    const settings = { status: statusSelect.value, guests: guestsInput.value, region: regionInput.value.trim(), date: dateInput.value, updatedAt: now() };
    window.TaranStorage.set("checklist-settings", JSON.stringify(settings));
    accountChecklist.settings = settings;
    saveAccount();
    window.TaranSearchContext?.save?.(context());
  }

  function remainingDays() {
    if (!dateInput.value) return null;
    return Math.ceil((new Date(`${dateInput.value}T00:00:00`) - new Date()) / 86400000);
  }

  function allTasks(state) {
    const template = window.TaranChecklistTemplates.getTemplate(eventSelect.value);
    const custom = state.customTasks.filter((task) => !task.deleted).map((task) => ({ ...task, custom: true, days: 0 }));
    return [...template.tasks, ...custom];
  }

  function updateSummary(state = currentState()) {
    const tasks = allTasks(state);
    const pending = tasks.filter((task) => !(task.custom ? task.completed : state.items[task.id]?.completed));
    const dday = remainingDays();
    const today = dday === null ? 0 : pending.filter((task) => Number(task.days || 0) >= dday).length;
    const week = dday === null ? 0 : pending.filter((task) => Number(task.days || 0) < dday && Number(task.days || 0) >= dday - 7).length;
    const completedCount = tasks.length - pending.length;
    const percent = tasks.length ? Math.round(completedCount / tasks.length * 100) : 0;
    document.getElementById("checklist-today-count").textContent = `${today}개`;
    document.getElementById("checklist-week-count").textContent = `${week}개`;
    document.getElementById("checklist-summary-progress").textContent = `${percent}%`;
    const nextTask = pending[0];
    const action = nextTask && actionLinks[nextTask.action] ? actionLinks[nextTask.action] : ["업체 찾기", "venues.html"];
    const nextLink = document.getElementById("checklist-next-action");
    nextLink.textContent = nextTask ? `다음: ${nextTask.title} · ${action[0]} →` : "준비 완료 · 업체 다시 보기 →";
    nextLink.href = contextUrl(action[1]);
    return percent;
  }

  function updateProgress(state = currentState()) {
    const tasks = allTasks(state);
    const done = tasks.filter((task) => task.custom ? task.completed : state.items[task.id]?.completed).length;
    const percent = updateSummary(state);
    document.getElementById("checklist-progress-label").textContent = `${percent}% 완료 · ${done}/${tasks.length}`;
    document.getElementById("checklist-progress-bar").style.width = `${percent}%`;
  }

  function updateDday() {
    if (!dateInput.value) document.getElementById("checklist-dday").textContent = "행사일을 선택해 주세요.";
    else {
      const diff = remainingDays();
      document.getElementById("checklist-dday").textContent = diff >= 0 ? `행사일까지 D-${diff}` : `행사일이 ${Math.abs(diff)}일 지났습니다.`;
      window.TaranStorage.set("checklist-date", dateInput.value);
      saveSettings();
    }
    updateSummary();
  }

  function render() {
    const template = window.TaranChecklistTemplates.getTemplate(eventSelect.value);
    const state = currentState();
    document.getElementById("checklist-title").textContent = `${template.label} 준비 순서`;
    memoInput.value = state.memo.value;
    list.replaceChildren(...allTasks(state).map((task) => {
      const row = document.createElement("article");
      const completed = task.custom ? task.completed : Boolean(state.items[task.id]?.completed);
      row.className = `checklist-item${completed ? " is-done" : ""}`;
      const box = document.createElement("input");
      box.type = "checkbox";
      box.checked = completed;
      box.setAttribute("aria-label", `${task.title} 완료`);
      const copy = document.createElement("div");
      const title = document.createElement("strong"); title.textContent = task.title;
      const timing = document.createElement("span"); timing.textContent = task.custom ? "사용자 추가 항목" : (task.days ? `권장 시점 D-${task.days}` : "행사 전 확인");
      copy.append(title, timing);
      row.append(box, copy);
      const actions = document.createElement("div");
      actions.className = "checklist-item__actions";
      if (actionLinks[task.action]) {
        const link = document.createElement("a");
        link.textContent = `${actionLinks[task.action][0]} →`;
        link.href = contextUrl(actionLinks[task.action][1]);
        actions.append(link);
      }
      if (task.custom) {
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "checklist-item__remove";
        remove.textContent = "삭제";
        remove.addEventListener("click", () => {
          const target = state.customTasks.find((item) => item.id === task.id);
          if (target) { target.deleted = true; target.updatedAt = now(); persist(state); render(); }
        });
        actions.append(remove);
      }
      if (actions.children.length) row.append(actions);
      box.addEventListener("change", () => {
        if (task.custom) {
          const target = state.customTasks.find((item) => item.id === task.id);
          if (target) { target.completed = box.checked; target.updatedAt = now(); }
        } else state.items[task.id] = { completed: box.checked, updatedAt: now() };
        row.classList.toggle("is-done", box.checked);
        persist(state);
        updateProgress(state);
        if (box.checked) window.TaranAnalytics?.track("checklist_task_completed", "checklist.html", { eventType: eventSelect.value, taskId: task.id }).catch(() => {});
      });
      return row;
    }));
    updateProgress(state);
  }

  const requestedEvent = window.SonpumEventTypes?.normalize?.(params.get("event") || "kids") || "kids";
  eventSelect.value = window.TaranChecklistTemplates.labels[requestedEvent] ? requestedEvent : "kids";
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
  memoInput.addEventListener("change", () => {
    const state = currentState();
    state.memo = { value: memoInput.value.trim(), updatedAt: now() };
    persist(state);
  });
  customForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = customInput.value.trim();
    if (!title) return;
    const state = currentState();
    state.customTasks.push({ id: `custom-${Date.now()}`, title, completed: false, updatedAt: now(), deleted: false });
    persist(state);
    customInput.value = "";
    render();
  });
  document.getElementById("checklist-reset").addEventListener("click", () => {
    const state = emptyEventState();
    state.updatedAt = now();
    persist(state);
    render();
  });

  updateDday();
  render();
  (async () => {
    await window.TaranAuth?.ready;
    if (!window.TaranAuth?.getAccount?.()) return;
    try {
      const response = await window.TaranAuth.api("/api/member/state/checklist");
      const remote = response?.state || {};
      accountChecklist = { events: remote.events || {}, settings: remote.settings || {} };
      const merged = currentState();
      window.TaranStorage.set(key(), JSON.stringify(merged));
      accountChecklist.events[eventSelect.value] = merged;
      const remoteSettings = accountChecklist.settings || {};
      if (timestamp(remoteSettings.updatedAt) > timestamp(storedSettings.updatedAt)) {
        if (!params.get("date") && remoteSettings.date) dateInput.value = remoteSettings.date;
        if (!params.get("guests") && remoteSettings.guests) guestsInput.value = remoteSettings.guests;
        if (!params.get("province") && remoteSettings.region) regionInput.value = remoteSettings.region;
        if (remoteSettings.status) statusSelect.value = remoteSettings.status;
      }
      updateDday();
      render();
      saveAccount();
    } catch (_error) { /* 로컬 체크리스트는 계속 사용할 수 있습니다. */ }
  })();
})();
