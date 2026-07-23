(function () {
  "use strict";

  const eventSelect = document.getElementById("checklist-event");
  const dateInput = document.getElementById("checklist-date");
  const memoInput = document.getElementById("checklist-memo");
  const customForm = document.getElementById("checklist-custom-form");
  const customInput = document.getElementById("checklist-custom-task");
  const list = document.getElementById("checklist-list");
  const storageNote = document.getElementById("checklist-storage-note");
  const params = new URLSearchParams(location.search);
  let accountChecklist = { events: {}, settings: {} };
  let storedSettings = {};
  let contextState = { guests: "", region: "" };
  const actionLinks = {
    calculator: ["예산 계산", "calculator.html"],
    venues: ["업체 찾기", "venues.html"],
    compare: ["비교하기", "compare.html"],
    inquiry: ["견적 문의", "compare.html"],
    guide: ["준비백과", "articles.html"]
  };

  const now = () => new Date().toISOString();
  const timestamp = (value) => new Date(value || 0).getTime() || 0;
  const emptyEventState = () => ({ items: {}, memo: { value: "", updatedAt: "" }, customTasks: [], updatedAt: "" });
  const representativeKey = () => `checklist:${eventSelect.value}`;
  const storageIds = () => window.SonpumEventTypes?.storageIds?.(eventSelect.value) || [eventSelect.value];
  const legacyMemoLabels = {
    meeting: "상견례·결혼 준비",
    smallWedding: "스몰웨딩",
    familyGathering: "가족모임",
    memorial: "추모 가족행사",
    other: "기타 가족행사",
    local: "이 기기",
    account: "계정"
  };

  function setStorageNote(message, state = "local") {
    storageNote.textContent = message;
    storageNote.dataset.state = state;
  }

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
      ? value.customTasks.filter((item) => item?.id && item?.title).map((item) => ({
        id: String(item.id),
        title: String(item.title).slice(0, 80),
        completed: Boolean(item.completed),
        updatedAt: item.updatedAt || value.updatedAt || "",
        deleted: Boolean(item.deleted)
      }))
      : [];
    state.updatedAt = value.updatedAt || "";
    return state;
  }

  function mergeEventStates(leftValue, rightValue) {
    const left = normalizeEventState(leftValue);
    const right = normalizeEventState(rightValue);
    const merged = emptyEventState();
    new Set([...Object.keys(left.items), ...Object.keys(right.items)]).forEach((id) => {
      const leftItem = left.items[id];
      const rightItem = right.items[id];
      if (!leftItem) merged.items[id] = rightItem;
      else if (!rightItem) merged.items[id] = leftItem;
      else if (timestamp(leftItem.updatedAt) === timestamp(rightItem.updatedAt)) {
        merged.items[id] = { completed: leftItem.completed || rightItem.completed, updatedAt: leftItem.updatedAt || rightItem.updatedAt };
      } else merged.items[id] = timestamp(leftItem.updatedAt) > timestamp(rightItem.updatedAt) ? leftItem : rightItem;
    });
    merged.memo = timestamp(left.memo.updatedAt) >= timestamp(right.memo.updatedAt) ? left.memo : right.memo;
    const custom = new Map();
    [...right.customTasks, ...left.customTasks].forEach((item) => {
      const previous = custom.get(item.id);
      if (!previous || timestamp(item.updatedAt) >= timestamp(previous.updatedAt)) custom.set(item.id, item);
    });
    merged.customTasks = [...custom.values()];
    merged.updatedAt = timestamp(left.updatedAt) >= timestamp(right.updatedAt) ? left.updatedAt : right.updatedAt;
    return merged;
  }

  function mergedMemo(entries) {
    const normalizedEntries = entries.map(({ id, value }) => ({ id, memo: normalizeEventState(value).memo }));
    const newest = normalizedEntries.reduce((latest, entry) => (
      timestamp(entry.memo.updatedAt) > timestamp(latest.memo.updatedAt) ? entry : latest
    ), { id: "", memo: emptyEventState().memo });
    if (timestamp(newest.memo.updatedAt) && !newest.memo.value.trim()) return newest.memo;
    const candidates = normalizedEntries.filter(({ memo }) => memo.value.trim());
    const unique = candidates.filter(({ memo }, index) => (
      candidates.findIndex((candidate) => candidate.memo.value.trim() === memo.value.trim()) === index
    ));
    const complete = unique.find(({ memo }) => unique.every((candidate) => (
      candidate.memo.value === memo.value || memo.value.includes(candidate.memo.value)
    )));
    if (complete) return complete.memo;
    if (unique.length <= 1) return unique[0]?.memo || emptyEventState().memo;
    return {
      value: unique.map(({ id, memo }) => `[${legacyMemoLabels[id] || id}] ${memo.value.trim()}`).join("\n\n"),
      updatedAt: unique.reduce((latest, { memo }) => (
        timestamp(memo.updatedAt) > timestamp(latest) ? memo.updatedAt : latest
      ), "")
    };
  }

  function mergeMany(entries) {
    const merged = entries.reduce((result, { value }) => mergeEventStates(result, value), emptyEventState());
    const memo = mergedMemo(entries);
    if (memo.value) merged.memo = memo;
    return merged;
  }

  function readStoredEvent(id) {
    try { return JSON.parse(window.TaranStorage.get(`checklist:${id}`, "{}") || "{}"); }
    catch (_error) { return {}; }
  }

  function readLocalState() {
    return mergeMany(storageIds().map((id) => ({ id, value: readStoredEvent(id) })));
  }

  function readAccountState() {
    return mergeMany(storageIds().map((id) => ({ id, value: accountChecklist.events?.[id] })));
  }

  function currentState() {
    return mergeMany([
      { id: "local", value: readLocalState() },
      { id: "account", value: readAccountState() }
    ]);
  }

  async function saveAccount() {
    if (!window.TaranAuth?.getAccount?.()) {
      setStorageNote("이 기기에 저장했습니다.", "local");
      return false;
    }
    try {
      await window.TaranAuth.api("/api/member/state/checklist", {
        method: "PUT",
        body: JSON.stringify({ state: accountChecklist })
      });
      setStorageNote("이 기기에 저장하고 계정 저장소와 동기화했습니다.", "synced");
      return true;
    } catch (_error) {
      setStorageNote("계정 동기화를 완료하지 못했지만 이 기기의 내용은 유지됩니다.", "warning");
      return false;
    }
  }

  function persist(state) {
    state.updatedAt = now();
    window.TaranStorage.set(representativeKey(), JSON.stringify(state));
    setStorageNote("이 기기에 저장했습니다.", "local");
    accountChecklist.events[eventSelect.value] = state;
    saveAccount();
  }

  function context() {
    return {
      event: eventSelect.value,
      province: contextState.region,
      guests: contextState.guests,
      date: dateInput.value
    };
  }

  function contextUrl(path) {
    const query = window.TaranSearchContext?.toParams?.(context()) || new URLSearchParams();
    return `${path}${query.size ? `?${query}` : ""}`;
  }

  function updateToolLinks() {
    document.querySelectorAll("[data-checklist-tool]").forEach((link) => {
      const action = actionLinks[link.dataset.checklistTool];
      if (action) link.href = contextUrl(action[1]);
    });
  }

  function saveSettings() {
    const settings = { ...storedSettings, date: dateInput.value, updatedAt: now() };
    storedSettings = settings;
    window.TaranStorage.set("checklist-settings", JSON.stringify(settings));
    setStorageNote("이 기기에 저장했습니다.", "local");
    accountChecklist.settings = { ...(accountChecklist.settings || {}), ...settings };
    saveAccount();
    window.TaranSearchContext?.save?.(context());
  }

  function remainingDays() {
    if (!dateInput.value) return null;
    return Math.ceil((new Date(`${dateInput.value}T00:00:00`) - new Date()) / 86400000);
  }

  function templateTasks() {
    return window.TaranChecklistTemplates.getTemplate(eventSelect.value).tasks;
  }

  function customTasks(state) {
    return state.customTasks
      .filter((item) => !item.deleted)
      .map((item) => ({ ...item, custom: true, days: 0, stage: "custom", stageLabel: "내가 추가한 할 일" }));
  }

  function allTasks(state) {
    return [...templateTasks(), ...customTasks(state)];
  }

  function progressTasks(state) {
    return allTasks(state).filter((item) => item.custom || !item.optional);
  }

  function isCompleted(task, state) {
    return task.custom ? task.completed : Boolean(state.items[task.id]?.completed);
  }

  function updateSummary(state = currentState()) {
    const tasks = progressTasks(state);
    const pending = tasks.filter((item) => !isCompleted(item, state));
    const dday = remainingDays();
    const today = dday === null ? 0 : pending.filter((item) => Number(item.days || 0) >= dday).length;
    const week = dday === null ? 0 : pending.filter((item) => Number(item.days || 0) < dday && Number(item.days || 0) >= dday - 7).length;
    const completedCount = tasks.length - pending.length;
    const percent = tasks.length ? Math.round(completedCount / tasks.length * 100) : 0;
    document.getElementById("checklist-today-count").textContent = `${today}개`;
    document.getElementById("checklist-week-count").textContent = `${week}개`;
    document.getElementById("checklist-summary-progress").textContent = `${percent}%`;
    const nextTask = pending[0];
    const action = nextTask && actionLinks[nextTask.action] ? actionLinks[nextTask.action] : ["업체 찾기", "venues.html"];
    const nextLink = document.getElementById("checklist-next-action");
    nextLink.textContent = nextTask ? `다음: ${nextTask.title} · ${action[0]} →` : "기본 준비 완료 · 선택 항목 확인하기 →";
    nextLink.href = contextUrl(action[1]);
    updateToolLinks();
    return percent;
  }

  function updateProgress(state = currentState()) {
    const tasks = progressTasks(state);
    const done = tasks.filter((item) => isCompleted(item, state)).length;
    const percent = updateSummary(state);
    document.getElementById("checklist-progress-label").textContent = `${percent}% 완료 · ${done}/${tasks.length}`;
    document.getElementById("checklist-progress-bar").style.width = `${percent}%`;
  }

  function updateDday({ save = true } = {}) {
    if (!dateInput.value) document.getElementById("checklist-dday").textContent = "행사일은 선택 사항입니다.";
    else {
      const diff = remainingDays();
      document.getElementById("checklist-dday").textContent = diff >= 0 ? `행사일까지 D-${diff}` : `행사일이 ${Math.abs(diff)}일 지났습니다.`;
    }
    window.TaranStorage.set("checklist-date", dateInput.value);
    if (save) saveSettings();
    updateSummary();
  }

  function taskCard(task, state) {
    const row = document.createElement("article");
    const completed = isCompleted(task, state);
    row.className = `checklist-item${completed ? " is-done" : ""}${task.optional ? " is-optional" : ""}`;
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = completed;
    box.setAttribute("aria-label", `${task.title} 완료`);
    const copy = document.createElement("div");
    copy.className = "checklist-item__copy";
    const titleRow = document.createElement("div");
    titleRow.className = "checklist-item__title";
    const title = document.createElement("strong");
    title.textContent = task.title;
    titleRow.append(title);
    if (task.optional) {
      const badge = document.createElement("span");
      badge.className = "checklist-item__optional";
      badge.textContent = `${task.optional} 선택`;
      titleRow.append(badge);
    }
    const timing = document.createElement("span");
    timing.className = "checklist-item__timing";
    timing.textContent = task.custom ? "사용자 추가 항목" : (task.days ? `권장 시점 D-${task.days}` : "행사 전 확인");
    copy.append(titleRow, timing);
    if (!task.custom) {
      const description = document.createElement("p");
      description.textContent = task.description;
      const check = document.createElement("p");
      check.className = "checklist-item__check";
      const checkLabel = document.createElement("b");
      checkLabel.textContent = "확인";
      check.append(checkLabel, document.createTextNode(task.check));
      copy.append(description, check);
    }
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
        if (target) {
          target.deleted = true;
          target.updatedAt = now();
          persist(state);
          render();
        }
      });
      actions.append(remove);
    }
    if (actions.children.length) row.append(actions);
    box.addEventListener("change", () => {
      if (task.custom) {
        const target = state.customTasks.find((item) => item.id === task.id);
        if (target) {
          target.completed = box.checked;
          target.updatedAt = now();
        }
      } else state.items[task.id] = { completed: box.checked, updatedAt: now() };
      row.classList.toggle("is-done", box.checked);
      persist(state);
      updateProgress(state);
      if (box.checked) window.TaranAnalytics?.track("checklist_task_completed", "checklist.html", { eventType: eventSelect.value, taskId: task.id }).catch(() => {});
    });
    return row;
  }

  function stageSection(stage, tasks, state) {
    const section = document.createElement("section");
    section.className = "checklist-stage";
    const header = document.createElement("header");
    const heading = document.createElement("div");
    const eyebrow = document.createElement("span");
    eyebrow.textContent = `준비 단계 ${stage.index}`;
    const title = document.createElement("h3");
    title.textContent = stage.label;
    const description = document.createElement("p");
    description.textContent = stage.description;
    heading.append(eyebrow, title, description);
    const count = document.createElement("small");
    count.textContent = `${tasks.length}개 항목`;
    header.append(heading, count);
    const cards = document.createElement("div");
    cards.className = "checklist-stage__items";
    cards.append(...tasks.map((item) => taskCard(item, state)));
    section.append(header, cards);
    return section;
  }

  function render() {
    const template = window.TaranChecklistTemplates.getTemplate(eventSelect.value);
    const state = currentState();
    document.getElementById("checklist-title").textContent = `${template.label} 준비 순서`;
    memoInput.value = state.memo.value;
    const stages = template.stages.map((stage, index) => stageSection({ ...stage, index: index + 1 }, stage.tasks, state));
    const custom = customTasks(state);
    if (custom.length) stages.push(stageSection({ index: "추가", label: "내가 추가한 할 일", description: "이 행사에만 필요한 일을 직접 관리합니다." }, custom, state));
    list.replaceChildren(...stages);
    updateProgress(state);
  }

  function resetCurrentEvent() {
    const state = currentState();
    const updatedAt = now();
    templateTasks().forEach((item) => { state.items[item.id] = { completed: false, updatedAt }; });
    state.memo = { value: "", updatedAt };
    state.customTasks = state.customTasks.map((item) => ({ ...item, deleted: true, updatedAt }));
    state.updatedAt = updatedAt;
    persist(state);
    render();
  }

  const requestedEvent = window.SonpumEventTypes?.normalize?.(params.get("event") || "kids") || "kids";
  eventSelect.value = window.TaranChecklistTemplates.labels[requestedEvent] ? requestedEvent : "kids";
  try { storedSettings = JSON.parse(window.TaranStorage.get("checklist-settings", "{}") || "{}"); }
  catch (_error) { storedSettings = {}; }
  dateInput.value = params.get("date") || storedSettings.date || window.TaranStorage.get("checklist-date", "");
  contextState = {
    guests: params.get("guests") || storedSettings.guests || "",
    region: params.get("province") || storedSettings.region || window.SonpumDisplayDefaults?.province || "서울특별시"
  };

  eventSelect.addEventListener("change", () => {
    eventSelect.value = window.SonpumEventTypes?.normalize?.(eventSelect.value) || "kids";
    saveSettings();
    render();
  });
  dateInput.addEventListener("change", () => updateDday());
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
    if (window.confirm("현재 행사에서 완료한 체크와 메모, 직접 추가한 할 일을 초기화할까요?")) resetCurrentEvent();
  });

  updateDday({ save: false });
  window.TaranStorage.set(representativeKey(), JSON.stringify(currentState()));
  render();
  (async () => {
    await window.TaranAuth?.ready;
    if (!window.TaranAuth?.getAccount?.()) {
      setStorageNote("이 기기에 저장해 사용할 수 있습니다.", "local");
      return;
    }
    try {
      const response = await window.TaranAuth.api("/api/member/state/checklist");
      const remote = response?.state || {};
      accountChecklist = { events: remote.events || {}, settings: remote.settings || {} };
      const merged = currentState();
      window.TaranStorage.set(representativeKey(), JSON.stringify(merged));
      accountChecklist.events[eventSelect.value] = merged;
      const remoteSettings = accountChecklist.settings || {};
      if (timestamp(remoteSettings.updatedAt) > timestamp(storedSettings.updatedAt)) {
        storedSettings = { ...storedSettings, ...remoteSettings };
        if (!params.get("date") && remoteSettings.date) dateInput.value = remoteSettings.date;
        if (!params.get("guests") && remoteSettings.guests) contextState.guests = remoteSettings.guests;
        if (!params.get("province") && remoteSettings.region) contextState.region = remoteSettings.region;
      }
      updateDday({ save: false });
      render();
      await saveAccount();
    } catch (_error) {
      setStorageNote("계정 동기화를 완료하지 못했지만 이 기기의 내용은 유지됩니다.", "warning");
    }
  })();
})();
