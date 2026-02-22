// --------------------------------------------------------------------
// eventFormView.js
// Formular zum Erstellen / Bearbeiten eines Events
// - Web Component + ShadowRoot
// - lädt globales CSS in den ShadowRoot (damit SCSS/CSS wirkt)
// - Edit-Modus: startEdit / stopEdit
// - Auswahl: Tags + Teilnehmer (Mehrfachauswahl via Checkboxen)
//
// Exports:
// - EventFormView (<event-form-view>)
// - renderEventFormView(container, data)
// - bindEventFormView(container, onSubmit, onCancelEdit)
// - startEdit(container, event)
// - stopEdit(container)
// - getEditingId(container)
// --------------------------------------------------------------------

function clearContainer(container) {
    while (container.firstChild) container.removeChild(container.firstChild);
}

// ------------------------------------------------------------
// <event-form-view> Web Component
// ------------------------------------------------------------
export class EventFormView extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({ mode: "open" });

        // Globales CSS im Shadow DOM verfügbar machen
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "./styles/main.css";
        this.shadowRoot.appendChild(link);

        this.root = document.createElement("div");
        this.shadowRoot.appendChild(this.root);

        this._data = { tags: [], participants: [] };
    }

    setData(data) {
        this._data = data || this._data;
        this.render();
    }

    render() {
        clearContainer(this.root);

        const data = this._data || {};
        const tags = (data && data.tags) ? data.tags : [];
        const participants = (data && data.participants) ? data.participants : [];

        const page = document.createElement("div");
        page.className = "event-form-page";

        const card = document.createElement("div");
        card.className = "card event-form-card";

        const h = document.createElement("h3");
        h.textContent = "Event";
        card.appendChild(h);

        const form = document.createElement("form");
        form.id = "eventForm";

        // Titel *
        form.appendChild(makeInputRow("Titel", "text", "eventTitle", true));

        // Datum/Uhrzeit *
        form.appendChild(
            makeInputRow("Datum / Uhrzeit", "datetime-local", "eventDateTime", true)
        );

        // Ort
        form.appendChild(makeInputRow("Ort", "text", "eventLocation", false));

        // Status
        const statusRow = document.createElement("label");

        const statusText = document.createElement("span");
        statusText.textContent = "Status";
        statusRow.appendChild(statusText);

        const statusSelect = document.createElement("select");
        statusSelect.id = "eventStatus";
        addStatusOptions(statusSelect, "offen");
        statusRow.appendChild(statusSelect);

        form.appendChild(statusRow);

        // Beschreibung
        const descLabel = document.createElement("label");

        const descText = document.createElement("span");
        descText.textContent = "Beschreibung";
        descLabel.appendChild(descText);

        const textarea = document.createElement("textarea");
        textarea.id = "eventDescription";
        textarea.rows = 4;

        descLabel.appendChild(textarea);
        form.appendChild(descLabel);

        // Teilnehmer (Mehrfachauswahl)
        form.appendChild(
            makeCheckboxGroup("Teilnehmer", "eventParticipants", participants, "name")
        );

        // Tags (Mehrfachauswahl)
        form.appendChild(
            makeCheckboxGroup("Tags", "eventTags", tags, "label")
        );

        // Buttons
        const btnRow = document.createElement("div");
        btnRow.className = "form-actions";

        const submitBtn = document.createElement("button");
        submitBtn.type = "submit";
        submitBtn.id = "eventSubmitBtn";
        submitBtn.textContent = "Event erstellen";
        btnRow.appendChild(submitBtn);

        const cancelEditBtn = document.createElement("button");
        cancelEditBtn.type = "button";
        cancelEditBtn.id = "eventCancelEditBtn";
        cancelEditBtn.textContent = "Bearbeiten abbrechen";
        cancelEditBtn.style.display = "none";
        btnRow.appendChild(cancelEditBtn);

        form.appendChild(btnRow);

        // Submit -> nach außen melden
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const payload = readForm(this.root);

            this.dispatchEvent(
                new CustomEvent("submit-form", {
                    detail: payload,
                    bubbles: true,
                    composed: true
                })
            );
        });

        // Edit abbrechen
        cancelEditBtn.addEventListener("click", () => {
            this.stopEdit();

            this.dispatchEvent(
                new CustomEvent("cancel-edit", {
                    detail: null,
                    bubbles: true,
                    composed: true
                })
            );
        });

        card.appendChild(form);
        page.appendChild(card);
        this.root.appendChild(page);
    }

    // --------------------------------------------------------
    // Edit-Modus
    // --------------------------------------------------------
    startEdit(event) {
        const id = Number(event && event.id);
        if (isNaN(id)) return;

        this.setAttribute("data-editing-id", String(id));

        const title = this.root.querySelector("#eventTitle");
        const dateTime = this.root.querySelector("#eventDateTime");
        const location = this.root.querySelector("#eventLocation");
        const status = this.root.querySelector("#eventStatus");
        const desc = this.root.querySelector("#eventDescription");

        if (title) title.value = String(event.title || "");
        if (dateTime) dateTime.value = String(event.dateTime || "");
        if (location) location.value = String(event.location || "");
        if (status) status.value = String(event.status || "offen");
        if (desc) desc.value = String(event.description || "");

        setCheckedIds(this.root, "eventParticipants", event.participantIds);
        setCheckedIds(this.root, "eventTags", event.tagIds);

        const submitBtn = this.root.querySelector("#eventSubmitBtn");
        if (submitBtn) submitBtn.textContent = "Änderungen speichern";

        const cancelBtn = this.root.querySelector("#eventCancelEditBtn");
        if (cancelBtn) cancelBtn.style.display = "inline-block";
    }

    stopEdit() {
        this.removeAttribute("data-editing-id");

        const form = this.root.querySelector("#eventForm");
        if (form) form.reset();

        const submitBtn = this.root.querySelector("#eventSubmitBtn");
        if (submitBtn) submitBtn.textContent = "Event erstellen";

        const cancelBtn = this.root.querySelector("#eventCancelEditBtn");
        if (cancelBtn) cancelBtn.style.display = "none";
    }

    getEditingId() {
        const v = this.getAttribute("data-editing-id");
        const id = Number(v);
        return isNaN(id) ? null : id;
    }
}

if (!customElements.get("event-form-view")) {
    customElements.define("event-form-view", EventFormView);
}

// ------------------------------------------------------------
// Helfer-Funktionen: wie bisher im Controller verwendbar
// ------------------------------------------------------------
export function renderEventFormView(container, data) {
    clearContainer(container);

    const el = document.createElement("event-form-view");
    container.appendChild(el);

    el.setData(data);
}

export function bindEventFormView(container, onSubmit, onCancelEdit) {
    const el = container.querySelector("event-form-view");
    if (!el) return;

    el.addEventListener("submit-form", (e) => {
        if (onSubmit) onSubmit(e.detail);
    });

    el.addEventListener("cancel-edit", () => {
        if (onCancelEdit) onCancelEdit();
    });
}

// Wrapper wie bisher
export function startEdit(container, event) {
    const el = container.querySelector("event-form-view");
    if (!el) return;
    el.startEdit(event);
}

export function stopEdit(container) {
    const el = container.querySelector("event-form-view");
    if (!el) return;
    el.stopEdit();
}

export function getEditingId(container) {
    const el = container.querySelector("event-form-view");
    if (!el) return null;
    return el.getEditingId();
}

// --------------------------------------------------------------------
// Helper (nur für diese Datei)
// --------------------------------------------------------------------

function makeInputRow(labelText, type, id, required) {
    const label = document.createElement("label");

    const text = document.createElement("span");
    text.textContent = labelText;
    label.appendChild(text);

    if (required) {
        const star = document.createElement("span");
        star.textContent = " *";
        star.className = "required-star";
        label.appendChild(star);
    }

    const input = document.createElement("input");
    input.type = type;
    input.id = id;
    if (required) input.required = true;

    label.appendChild(input);
    return label;
}

function addStatusOptions(select, active) {
    const values = ["offen", "geplant", "erledigt"];

    for (let i = 0; i < values.length; i++) {
        const v = values[i];

        const opt = document.createElement("option");
        opt.value = v;
        opt.textContent = v;

        if (String(v) === String(active)) opt.selected = true;
        select.appendChild(opt);
    }
}

function makeCheckboxGroup(title, groupId, list, textKey) {
    const wrap = document.createElement("div");
    wrap.className = "checkbox-group";
    wrap.id = groupId;

    const head = document.createElement("h4");
    head.textContent = title;
    wrap.appendChild(head);

    if (!list || list.length === 0) {
        const p = document.createElement("p");
        p.textContent = "Keine Einträge vorhanden.";
        wrap.appendChild(p);
        return wrap;
    }

    for (let i = 0; i < list.length; i++) {
        const item = list[i];

        const row = document.createElement("label");
        row.className = "checkbox-row";

        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.setAttribute("data-id", String(item.id));

        const txt = document.createElement("span");
        txt.textContent = String(item[textKey] || "");

        row.appendChild(cb);
        row.appendChild(txt);
        wrap.appendChild(row);
    }

    return wrap;
}

function getCheckedIds(scopeEl, groupId) {
    const group = scopeEl.querySelector("#" + groupId);
    if (!group) return [];

    const checks = group.querySelectorAll('input[type="checkbox"][data-id]');
    const ids = [];

    for (let i = 0; i < checks.length; i++) {
        if (checks[i].checked) {
            const id = Number(checks[i].getAttribute("data-id"));
            if (!isNaN(id)) ids.push(id);
        }
    }

    return ids;
}

function setCheckedIds(scopeEl, groupId, ids) {
    const group = scopeEl.querySelector("#" + groupId);
    if (!group) return;

    const list = Array.isArray(ids) ? ids.map(Number) : [];
    const checks = group.querySelectorAll('input[type="checkbox"][data-id]');

    for (let i = 0; i < checks.length; i++) {
        const id = Number(checks[i].getAttribute("data-id"));
        checks[i].checked = list.includes(id);
    }
}

function readForm(scopeEl) {
    const title = scopeEl.querySelector("#eventTitle");
    const dateTime = scopeEl.querySelector("#eventDateTime");
    const location = scopeEl.querySelector("#eventLocation");
    const status = scopeEl.querySelector("#eventStatus");
    const desc = scopeEl.querySelector("#eventDescription");

    const data = {
        title: title ? String(title.value || "").trim() : "",
        dateTime: dateTime ? String(dateTime.value || "").trim() : "",
        location: location ? String(location.value || "").trim() : "",
        status: status ? String(status.value || "").trim() : "offen",
        description: desc ? String(desc.value || "").trim() : "",
        participantIds: getCheckedIds(scopeEl, "eventParticipants"),
        tagIds: getCheckedIds(scopeEl, "eventTags")
    };

    // Edit-ID aus dem Host-Element
    const host = scopeEl.closest("event-form-view");
    if (host) {
        const v = host.getAttribute("data-editing-id");
        const id = Number(v);
        if (!isNaN(id)) data.id = id;
    }

    return data;
}