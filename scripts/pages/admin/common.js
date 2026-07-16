(function () {
  "use strict";

  function text(value) { return String(value ?? ""); }
  function element(tag, value, className) {
    const node = document.createElement(tag);
    if (value !== undefined) node.textContent = text(value);
    if (className) node.className = className;
    return node;
  }
  function readJson(name, fallback) {
    try { return JSON.parse(window.TaranStorage?.get(name, JSON.stringify(fallback)) ?? JSON.stringify(fallback)); }
    catch (_error) { return fallback; }
  }
  function reviewCount(item) {
    return (Array.isArray(item.reviews) ? item.reviews.length : 0) + (Array.isArray(item.externalReviews) ? item.externalReviews.length : 0);
  }
  function setEmptyState(empty, hasRows) {
    if (empty) empty.hidden = Boolean(hasRows);
  }

  function openEditor({ title, fields, initial = {}, submitLabel = "저장", onSubmit }) {
    const dialog = document.createElement("dialog");
    dialog.className = "admin-editor-dialog";
    const form = document.createElement("form");
    form.className = "admin-editor-form";
    form.method = "dialog";

    const head = element("div", undefined, "admin-editor-head");
    head.append(element("h2", title));
    const close = element("button", "닫기", "admin-editor-close");
    close.type = "button";
    close.addEventListener("click", () => dialog.close());
    head.append(close);
    form.append(head);

    const body = element("div", undefined, "admin-editor-body");
    fields.forEach(field => {
      const label = element("label", undefined, "admin-editor-field");
      const caption = element("span", field.label);
      let input;
      if (field.type === "textarea") {
        input = document.createElement("textarea");
        input.rows = field.rows || 5;
      } else if (field.type === "select") {
        input = document.createElement("select");
        (field.options || []).forEach(option => {
          const node = element("option", option.label);
          node.value = option.value;
          input.append(node);
        });
      } else {
        input = document.createElement("input");
        input.type = field.type || "text";
      }
      input.name = field.name;
      input.value = text(initial[field.name]);
      if (field.placeholder) input.placeholder = field.placeholder;
      if (field.required) input.required = true;
      if (field.readOnly) input.readOnly = true;
      if (field.help) input.setAttribute("aria-describedby", `help-${field.name}`);
      label.append(caption, input);
      if (field.help) {
        const help = element("small", field.help);
        help.id = `help-${field.name}`;
        label.append(help);
      }
      body.append(label);
    });
    form.append(body);

    const error = element("p", "", "admin-editor-error");
    error.hidden = true;
    form.append(error);
    const actions = element("div", undefined, "admin-editor-actions");
    const cancel = element("button", "취소", "button button--secondary");
    cancel.type = "button";
    cancel.addEventListener("click", () => dialog.close());
    const save = element("button", submitLabel, "button button--primary");
    save.type = "submit";
    actions.append(cancel, save);
    form.append(actions);
    dialog.append(form);
    document.body.append(dialog);

    form.addEventListener("submit", async event => {
      event.preventDefault();
      error.hidden = true;
      save.disabled = true;
      save.setAttribute("aria-busy", "true");
      try {
        const values = Object.fromEntries(new FormData(form).entries());
        await onSubmit(values);
        dialog.close();
      } catch (caught) {
        error.textContent = caught?.message || "저장하지 못했습니다. 입력 내용을 확인해 주세요.";
        error.hidden = false;
      } finally {
        save.disabled = false;
        save.removeAttribute("aria-busy");
      }
    });
    dialog.addEventListener("close", () => dialog.remove(), { once: true });
    dialog.showModal();
    form.querySelector("input, select, textarea")?.focus();
  }

  function addPageAction(label, handler) {
    const head = document.querySelector(".admin-page-head");
    if (!head || head.querySelector("[data-admin-primary-action]")) return null;
    const button = element("button", label, "button button--primary");
    button.type = "button";
    button.dataset.adminPrimaryAction = "true";
    button.addEventListener("click", handler);
    head.append(button);
    return button;
  }

  window.TaranAdmin = Object.freeze({ text, element, readJson, reviewCount, setEmptyState, openEditor, addPageAction });
})();
