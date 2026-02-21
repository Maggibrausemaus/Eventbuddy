// --------------------------------------------------------------------
// eventFormView.js
//
// Diese View erzeugt das Formular zum Erstellen und Bearbeiten
// eines Events komplett dynamisch mit createElement().
//
// Funktionen:
// - renderEventFormView() → erzeugt das Formular
// - bindEventFormView()   → verbindet Events (submit / cancel)
// - startEdit()           → aktiviert Bearbeitungsmodus
// - stopEdit()            → beendet Bearbeitungsmodus
// - readForm()            → liest aktuelle Formularwerte aus
// --------------------------------------------------------------------


// Entfernt alle vorhandenen Elemente aus einem Container
function clearContainer(container) {
    while (container.firstChild)
        container.removeChild(container.firstChild);
}


// --------------------------------------------------------------------
// Formular rendern
//
// Baut das komplette Event-Formular neu auf.
// data.tags und data.participants werden für die Checkbox-Gruppen benötigt.
// --------------------------------------------------------------------
export function renderEventFormView(container, data) {
    clearContainer(container);

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

    // Pflichtfelder sind mit required markiert
    form.appendChild(makeInputRow("Titel", "text", "eventTitle", true));
    form.appendChild(
        makeInputRow("Datum / Uhrzeit", "datetime-local", "eventDateTime", true)
    );
    form.appendChild(makeInputRow("Ort", "text", "eventLocation"));

    // -------------------------
    // Status-Auswahl (Select)
    // -------------------------
    const statusRow = document.createElement("label");

    const statusText = document.createElement("span");
    statusText.textContent = "Status";
    statusRow.appendChild(statusText);

    const statusSelect = document.createElement("select");
    statusSelect.id = "eventStatus";

    // Standardwert ist "offen"
    addStatusOptions(statusSelect, "offen");

    statusRow.appendChild(statusSelect);
    form.appendChild(statusRow);

    // -------------------------
    // Beschreibung (Textarea)
    // -------------------------
    const descLabel = document.createElement("label");

    const descText = document.createElement("span");
    descText.textContent = "Beschreibung";
    descLabel.appendChild(descText);

    const textarea = document.createElement("textarea");
    textarea.id = "eventDescription";
    textarea.rows = 4;

    descLabel.appendChild(textarea);
    form.appendChild(descLabel);

    // Mehrfachauswahl (Checkboxen)
    form.appendChild(
        makeCheckboxGroup("Teilnehmer", "eventParticipants", participants, "name")
    );

    form.appendChild(
        makeCheckboxGroup("Tags", "eventTags", tags, "label")
    );

    // -------------------------
    // Buttons
    // -------------------------
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

    card.appendChild(form);
    page.appendChild(card);
    container.appendChild(page);
}


// --------------------------------------------------------------------
// Event-Handler binden
//
// onSubmit bekommt die ausgelesenen Formulardaten.
// onCancelEdit wird bei Abbruch im Edit-Modus aufgerufen.
// --------------------------------------------------------------------
export function bindEventFormView(container, onSubmit, onCancelEdit) {
    const form = container.querySelector("#eventForm");
    const cancelEditBtn = container.querySelector("#eventCancelEditBtn");

    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();

            const payload = readForm(container);

            if (onSubmit) onSubmit(payload);
        });
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener("click", () => {
            stopEdit(container);

            if (onCancelEdit) onCancelEdit();
        });
    }
}


// --------------------------------------------------------------------
// Edit-Modus API
//
// startEdit()   → Formular mit Event-Daten füllen
// stopEdit()    → Formular zurücksetzen
// getEditingId()→ Aktuelle Edit-ID abrufen
// --------------------------------------------------------------------

export function startEdit(container, event) {
    const id = Number(event && event.id);
    if (isNaN(id)) return;

    // Edit-Zustand im Container speichern
    container.setAttribute("data-editing-id", String(id));

    const title = container.querySelector("#eventTitle");
    const dateTime = container.querySelector("#eventDateTime");
    const location = container.querySelector("#eventLocation");
    const status = container.querySelector("#eventStatus");
    const desc = container.querySelector("#eventDescription");

    if (title) title.value = String(event.title || "");
    if (dateTime) dateTime.value = String(event.dateTime || "");
    if (location) location.value = String(event.location || "");
    if (status) status.value = String(event.status || "offen");
    if (desc) desc.value = String(event.description || "");

    // Checkboxen entsprechend der gespeicherten IDs aktivieren
    setCheckedIds(container, "eventParticipants", event.participantIds);
    setCheckedIds(container, "eventTags", event.tagIds);

    const submitBtn = container.querySelector("#eventSubmitBtn");
    if (submitBtn) submitBtn.textContent = "Änderungen speichern";

    const cancelBtn = container.querySelector("#eventCancelEditBtn");
    if (cancelBtn) cancelBtn.style.display = "inline-block";
}

export function stopEdit(container) {
    container.removeAttribute("data-editing-id");

    const form = container.querySelector("#eventForm");
    if (form) form.reset();

    const submitBtn = container.querySelector("#eventSubmitBtn");
    if (submitBtn) submitBtn.textContent = "Event erstellen";

    const cancelBtn = container.querySelector("#eventCancelEditBtn");
    if (cancelBtn) cancelBtn.style.display = "none";
}

export function getEditingId(container) {
    const v = container.getAttribute("data-editing-id");
    const id = Number(v);

    return isNaN(id) ? null : id;
}


// --------------------------------------------------------------------
// Helper-Funktionen
// --------------------------------------------------------------------

// Baut eine Input-Zeile mit optionalem Pflichtstern
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


// Fügt Status-Optionen in das Select ein
function addStatusOptions(select, active) {
    const values = ["offen", "geplant", "erledigt"];

    for (let i = 0; i < values.length; i++) {
        const v = values[i];

        const opt = document.createElement("option");
        opt.value = v;
        opt.textContent = v;

        if (String(v) === String(active))
            opt.selected = true;

        select.appendChild(opt);
    }
}


// Baut eine Checkbox-Gruppe (für Tags oder Teilnehmer)
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


// Liest alle angehakten Checkboxen aus
function getCheckedIds(container, groupId) {
    const group = container.querySelector("#" + groupId);
    if (!group) return [];

    const checks = group.querySelectorAll(
        'input[type="checkbox"][data-id]'
    );

    const ids = [];

    for (let i = 0; i < checks.length; i++) {
        if (checks[i].checked) {
            const id = Number(checks[i].getAttribute("data-id"));
            if (!isNaN(id)) ids.push(id);
        }
    }

    return ids;
}


// Setzt Checkboxen basierend auf einer ID-Liste
function setCheckedIds(container, groupId, ids) {
    const group = container.querySelector("#" + groupId);
    if (!group) return;

    const list = Array.isArray(ids) ? ids.map(Number) : [];

    const checks = group.querySelectorAll(
        'input[type="checkbox"][data-id]'
    );

    for (let i = 0; i < checks.length; i++) {
        const id = Number(checks[i].getAttribute("data-id"));

        // includes() prüft, ob ID in der Liste enthalten ist
        checks[i].checked = list.includes(id);
    }
}


// Liest alle Formularwerte aus und gibt ein Datenobjekt zurück
function readForm(container) {
    const title = container.querySelector("#eventTitle");
    const dateTime = container.querySelector("#eventDateTime");
    const location = container.querySelector("#eventLocation");
    const status = container.querySelector("#eventStatus");
    const desc = container.querySelector("#eventDescription");

    const data = {
        title: title ? String(title.value || "").trim() : "",
        dateTime: dateTime ? String(dateTime.value || "").trim() : "",
        location: location ? String(location.value || "").trim() : "",
        status: status ? String(status.value || "").trim() : "offen",
        description: desc ? String(desc.value || "").trim() : "",
        participantIds: getCheckedIds(container, "eventParticipants"),
        tagIds: getCheckedIds(container, "eventTags")
    };

    // Falls Edit-Modus aktiv → ID hinzufügen
    const id = getEditingId(container);
    if (id !== null) data.id = id;

    return data;
}