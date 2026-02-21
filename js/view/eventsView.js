// --------------------------------------------------------------------
// eventsView.js
//
// View für die Events-Seite:
// - Filter (Status, Teilnehmer, Tag)
// - Liste der Events (klickbar)
// - Detailbereich zum ausgewählten Event
// - Aktionen: Bearbeiten / Löschen
// - Detail: Teilnehmer direkt ändern (Dropdown + Speichern)
//
// Rendern baut alles neu auf, bindEventsView verknüpft nur Events
// mit Callbacks aus dem Controller.
// --------------------------------------------------------------------

function clearContainer(container) {
    while (container.firstChild) container.removeChild(container.firstChild);
}

// --------------------------------------------------------------------
// renderEventsView(container, data)
//
// Baut die Seite neu auf.
// data enthält: filters, tags, participants, events, selected.
// Die ausgewählte Event-ID wird zusätzlich als data-selected-event-id
// im Container gespeichert (für spätere Klick-Handler).
// --------------------------------------------------------------------
export function renderEventsView(container, data) {
    clearContainer(container);

    const filters = data.filters || {};
    const tags = data.tags || [];
    const participants = data.participants || [];
    const events = data.events || [];
    const selected = data.selected || null;

    if (selected && selected.id !== undefined && selected.id !== null) {
        container.setAttribute("data-selected-event-id", String(selected.id));
    } else {
        container.removeAttribute("data-selected-event-id");
    }

    const page = document.createElement("div");
    page.className = "events-page";

    // -----------------------------
    // Filter Card
    // -----------------------------
    const filterCard = document.createElement("div");
    filterCard.className = "card filter-card";

    const hFilter = document.createElement("h3");
    hFilter.textContent = "Filter";
    filterCard.appendChild(hFilter);

    const filterRow = document.createElement("div");
    filterRow.className = "filter-row";

    // Status
    const statusLabel = document.createElement("label");
    const statusText = document.createElement("span");
    statusText.textContent = "Status";
    statusLabel.appendChild(statusText);

    const statusSelect = document.createElement("select");
    statusSelect.id = "filterStatus";
    addStatusOptions(statusSelect, String(filters.status || ""));
    statusLabel.appendChild(statusSelect);
    filterRow.appendChild(statusLabel);

    // Teilnehmer
    const participantLabel = document.createElement("label");
    const participantText = document.createElement("span");
    participantText.textContent = "Teilnehmer";
    participantLabel.appendChild(participantText);

    const participantSelect = document.createElement("select");
    participantSelect.id = "filterParticipant";
    addParticipantOptions(
        participantSelect,
        participants,
        String(filters.participantId || "")
    );
    participantLabel.appendChild(participantSelect);
    filterRow.appendChild(participantLabel);

    // Tag
    const tagLabel = document.createElement("label");
    const tagText = document.createElement("span");
    tagText.textContent = "Tag";
    tagLabel.appendChild(tagText);

    const tagSelect = document.createElement("select");
    tagSelect.id = "filterTag";
    addTagOptions(tagSelect, tags, String(filters.tagId || ""));
    tagLabel.appendChild(tagSelect);
    filterRow.appendChild(tagLabel);

    filterCard.appendChild(filterRow);
    page.appendChild(filterCard);

    // -----------------------------
    // Layout: Liste + Details
    // -----------------------------
    const layout = document.createElement("div");
    layout.className = "events-layout";

    // Liste
    const listCard = document.createElement("div");
    listCard.className = "card event-list";

    const hList = document.createElement("h3");
    hList.textContent = "Events";
    listCard.appendChild(hList);

    const ul = document.createElement("ul");

    if (events.length === 0) {
        const li = document.createElement("li");
        li.textContent = "Keine Events gefunden.";
        ul.appendChild(li);
    } else {
        for (let i = 0; i < events.length; i++) {
            const ev = events[i];

            const li = document.createElement("li");
            li.className = "event-item";
            li.setAttribute("data-event-id", ev.id);

            // Aktives Event markieren
            if (selected && Number(selected.id) === Number(ev.id)) {
                li.classList.add("event-item--active");
            }

            const strong = document.createElement("strong");
            strong.textContent = String(ev.title || "");
            li.appendChild(strong);

            li.appendChild(document.createElement("br"));

            const small = document.createElement("small");
            small.textContent = formatDateTime(ev.dateTime);
            li.appendChild(small);

            ul.appendChild(li);
        }
    }

    listCard.appendChild(ul);
    layout.appendChild(listCard);

    // Details
    const detailCard = document.createElement("div");
    detailCard.className = "card event-detail";

    if (!selected) {
        const p = document.createElement("p");
        p.textContent = "Kein Event ausgewählt.";
        detailCard.appendChild(p);
    } else {
        const hDetail = document.createElement("h3");
        hDetail.textContent = String(selected.title || "");
        detailCard.appendChild(hDetail);

        detailCard.appendChild(detailLine("Datum:", formatDateTime(selected.dateTime)));
        detailCard.appendChild(detailLine("Ort:", String(selected.location || "")));
        detailCard.appendChild(detailLine("Status:", String(selected.status || "")));

        const pDesc = document.createElement("p");
        pDesc.textContent = String(selected.description || "");
        detailCard.appendChild(pDesc);

        // Teilnehmer Dropdown (Checkboxen in <details>)
        const currentIds = Array.isArray(selected.participantIds)
            ? selected.participantIds.map(Number)
            : [];

        detailCard.appendChild(makeParticipantDropdown(participants, currentIds));

        const saveRow = document.createElement("div");
        saveRow.className = "event-detail-actions";

        const saveBtn = document.createElement("button");
        saveBtn.type = "button";
        saveBtn.id = "btnSaveParticipants";
        saveBtn.textContent = "Teilnehmer speichern";
        saveRow.appendChild(saveBtn);

        detailCard.appendChild(saveRow);

        // Aktionen
        const actions = document.createElement("div");
        actions.className = "event-detail-actions";

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.id = "btnEditEvent";
        editBtn.textContent = "Bearbeiten";
        actions.appendChild(editBtn);

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.id = "btnDeleteEvent";
        deleteBtn.textContent = "Löschen";
        actions.appendChild(deleteBtn);

        detailCard.appendChild(actions);
    }

    layout.appendChild(detailCard);
    page.appendChild(layout);
    container.appendChild(page);
}

// --------------------------------------------------------------------
// bindEventsView(...)
//
// Verknüpft UI-Elemente mit Controller-Callbacks:
// - Filter ändern -> onFilterChange(...)
// - Event auswählen -> onSelectEvent(id)
// - Bearbeiten/Löschen -> onEditEvent/onDeleteEvent(id)
// - Teilnehmer speichern -> onUpdateParticipants(eventId, ids)
// --------------------------------------------------------------------
export function bindEventsView(
    container,
    onFilterChange,
    onSelectEvent,
    onEditEvent,
    onDeleteEvent,
    onUpdateParticipants
) {
    const status = container.querySelector("#filterStatus");
    const participant = container.querySelector("#filterParticipant");
    const tag = container.querySelector("#filterTag");

    if (status) {
        status.addEventListener("change", () =>
            onFilterChange({ status: status.value })
        );
    }
    if (participant) {
        participant.addEventListener("change", () =>
            onFilterChange({ participantId: participant.value })
        );
    }
    if (tag) {
        tag.addEventListener("change", () =>
            onFilterChange({ tagId: tag.value })
        );
    }

    // Klick auf Listeneintrag -> Event auswählen
    const items = container.querySelectorAll("[data-event-id]");
    for (let i = 0; i < items.length; i++) {
        items[i].addEventListener("click", () => {
            const id = items[i].getAttribute("data-event-id");
            if (onSelectEvent) onSelectEvent(id);
        });
    }

    // Teilnehmer speichern (IDs aus Checkboxen lesen)
    const saveBtn = container.querySelector("#btnSaveParticipants");
    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            const evId = container.getAttribute("data-selected-event-id");
            if (!evId) return;

            const ids = getCheckedParticipantIds(container);
            if (onUpdateParticipants) onUpdateParticipants(evId, ids);
        });
    }

    // Bearbeiten
    const editBtn = container.querySelector("#btnEditEvent");
    if (editBtn) {
        editBtn.addEventListener("click", () => {
            const active = container.querySelector(".event-item--active");
            if (!active) return;

            const id = active.getAttribute("data-event-id");
            if (onEditEvent) onEditEvent(id);
        });
    }

    // Löschen
    const deleteBtn = container.querySelector("#btnDeleteEvent");
    if (deleteBtn) {
        deleteBtn.addEventListener("click", () => {
            const active = container.querySelector(".event-item--active");
            if (!active) return;

            const id = active.getAttribute("data-event-id");
            if (onDeleteEvent) onDeleteEvent(id);
        });
    }
}

// --------------------------------------------------------------------
// Helper
// --------------------------------------------------------------------

function addStatusOptions(select, active) {
    const values = ["", "offen", "geplant", "erledigt"];
    for (let i = 0; i < values.length; i++) {
        const v = values[i];
        const opt = document.createElement("option");
        opt.value = v;
        opt.textContent = (v === "") ? "Alle" : v;
        if (String(v) === String(active)) opt.selected = true;
        select.appendChild(opt);
    }
}

function addParticipantOptions(select, list, active) {
    const all = document.createElement("option");
    all.value = "";
    all.textContent = "Alle";
    if (String(active) === "") all.selected = true;
    select.appendChild(all);

    for (let i = 0; i < list.length; i++) {
        const p = list[i];
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = String(p.name || "");
        if (String(p.id) === String(active)) opt.selected = true;
        select.appendChild(opt);
    }
}

function addTagOptions(select, list, active) {
    const all = document.createElement("option");
    all.value = "";
    all.textContent = "Alle";
    if (String(active) === "") all.selected = true;
    select.appendChild(all);

    for (let i = 0; i < list.length; i++) {
        const t = list[i];
        const opt = document.createElement("option");
        opt.value = t.id;
        opt.textContent = String(t.label || "");
        if (String(t.id) === String(active)) opt.selected = true;
        select.appendChild(opt);
    }
}

function detailLine(labelText, valueText) {
    const p = document.createElement("p");
    const strong = document.createElement("strong");
    strong.textContent = labelText + " ";
    p.appendChild(strong);

    const span = document.createElement("span");
    span.textContent = String(valueText || "");
    p.appendChild(span);
    return p;
}

function formatDateTime(value) {
    const s = String(value || "").trim();
    if (s.length === 0) return "";

    const parts = s.split("T");
    if (parts.length !== 2) return s;

    const date = parts[0];
    const time = parts[1];

    const d = date.split("-");
    if (d.length !== 3) return s;

    const yyyy = d[0];
    const mm = d[1];
    const dd = d[2];

    return dd + "." + mm + "." + yyyy + ", " + time + " Uhr";
}

function makeParticipantDropdown(participants, activeIds) {
    const wrap = document.createElement("div");
    wrap.className = "dropdown-checklist";
    wrap.id = "detailParticipants";

    const details = document.createElement("details");
    details.className = "dropdown-checklist__details";

    const summary = document.createElement("summary");
    summary.className = "dropdown-checklist__summary";
    summary.textContent = "Teilnehmer auswählen";
    details.appendChild(summary);

    const box = document.createElement("div");
    box.className = "dropdown-checklist__box";

    if (!participants || participants.length === 0) {
        const p = document.createElement("p");
        p.textContent = "Keine Teilnehmer vorhanden.";
        box.appendChild(p);
    } else {
        const ids = Array.isArray(activeIds) ? activeIds.map(Number) : [];

        for (let i = 0; i < participants.length; i++) {
            const item = participants[i];

            const row = document.createElement("label");
            row.className = "checkbox-row";

            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.setAttribute("data-id", String(item.id));
            cb.checked = ids.includes(Number(item.id));

            const txt = document.createElement("span");
            txt.textContent = String(item.name || "");

            row.appendChild(cb);
            row.appendChild(txt);
            box.appendChild(row);
        }
    }

    details.appendChild(box);
    wrap.appendChild(details);
    return wrap;
}

function getCheckedParticipantIds(container) {
    const group = container.querySelector("#detailParticipants");
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