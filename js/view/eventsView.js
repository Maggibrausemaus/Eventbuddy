// --------------------------------------------------------------------
// eventsView.js
// Seite "Events":
// - Filter oben (Status, Teilnehmer, Tag)
// - Eventliste (Auswahl per Klick)
// - Detailbereich
// - Aktionen: Bearbeiten / Löschen
// - Detail: Teilnehmer ändern + speichern
//
// Web Component + ShadowRoot
// - lädt globales CSS in den ShadowRoot (damit SCSS/CSS wirkt)
// --------------------------------------------------------------------

function clearContainer(container) {
    while (container.firstChild) container.removeChild(container.firstChild);
}

// ------------------------------------------------------------
// <events-view> Web Component
// ------------------------------------------------------------
export class EventsView extends HTMLElement {
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

        this._data = {
            filters: {},
            tags: [],
            participants: [],
            events: [],
            selected: null
        };
    }

    setData(data) {
        this._data = data || this._data;
        this.render();
    }

    render() {
        clearContainer(this.root);

        const data = this._data || {};
        const filters = data.filters || {};
        const tags = data.tags || [];
        const participants = data.participants || [];
        const events = data.events || [];
        const selected = data.selected || null;

        // ausgewählte Event-ID am Element merken (für "Teilnehmer speichern")
        if (selected && selected.id !== undefined && selected.id !== null) {
            this.setAttribute("data-selected-event-id", String(selected.id));
        } else {
            this.removeAttribute("data-selected-event-id");
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
        const statusSelect = document.createElement("select");
        statusSelect.id = "filterStatus";
        addStatusOptions(statusSelect, String(filters.status || ""));
        statusSelect.addEventListener("change", () => {
            this.dispatchEvent(new CustomEvent("filter-change", {
                detail: { status: statusSelect.value },
                bubbles: true,
                composed: true
            }));
        });
        filterRow.appendChild(makeLabeled("Status", statusSelect));

        // Teilnehmer
        const participantSelect = document.createElement("select");
        participantSelect.id = "filterParticipant";
        addParticipantOptions(
            participantSelect,
            participants,
            String(filters.participantId || "")
        );
        participantSelect.addEventListener("change", () => {
            this.dispatchEvent(new CustomEvent("filter-change", {
                detail: { participantId: participantSelect.value },
                bubbles: true,
                composed: true
            }));
        });
        filterRow.appendChild(makeLabeled("Teilnehmer", participantSelect));

        // Tag
        const tagSelect = document.createElement("select");
        tagSelect.id = "filterTag";
        addTagOptions(tagSelect, tags, String(filters.tagId || ""));
        tagSelect.addEventListener("change", () => {
            this.dispatchEvent(new CustomEvent("filter-change", {
                detail: { tagId: tagSelect.value },
                bubbles: true,
                composed: true
            }));
        });
        filterRow.appendChild(makeLabeled("Tag", tagSelect));

        filterCard.appendChild(filterRow);
        page.appendChild(filterCard);

        // -----------------------------
        // Layout: Liste + Details
        // -----------------------------
        const layout = document.createElement("div");
        layout.className = "events-layout";

        // -----------------------------
        // Liste
        // -----------------------------
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

                if (selected && Number(selected.id) === Number(ev.id)) {
                    li.classList.add("event-item--active");
                }

                li.addEventListener("click", () => {
                    this.dispatchEvent(new CustomEvent("select-event", {
                        detail: { id: ev.id },
                        bubbles: true,
                        composed: true
                    }));
                });

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

        // -----------------------------
        // Details
        // -----------------------------
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

            // Teilnehmer Dropdown (Checkboxen)
            const currentIds = Array.isArray(selected.participantIds)
                ? selected.participantIds.map(Number)
                : [];

            detailCard.appendChild(makeParticipantDropdown(participants, currentIds));

            // Teilnehmer speichern
            const saveBtn = document.createElement("button");
            saveBtn.type = "button";
            saveBtn.id = "btnSaveParticipants";
            saveBtn.textContent = "Teilnehmer speichern";
            saveBtn.addEventListener("click", () => {
                const evId = this.getAttribute("data-selected-event-id");
                if (!evId) return;

                const ids = getCheckedParticipantIds(detailCard);

                this.dispatchEvent(new CustomEvent("update-participants", {
                    detail: { eventId: evId, participantIds: ids },
                    bubbles: true,
                    composed: true
                }));
            });
            detailCard.appendChild(saveBtn);

            // Aktionen
            const actions = document.createElement("div");
            actions.className = "event-detail-actions";

            const editBtn = document.createElement("button");
            editBtn.type = "button";
            editBtn.id = "btnEditEvent";
            editBtn.textContent = "Bearbeiten";
            editBtn.addEventListener("click", () => {
                this.dispatchEvent(new CustomEvent("edit-event", {
                    detail: { id: selected.id },
                    bubbles: true,
                    composed: true
                }));
            });
            actions.appendChild(editBtn);

            const deleteBtn = document.createElement("button");
            deleteBtn.type = "button";
            deleteBtn.id = "btnDeleteEvent";
            deleteBtn.textContent = "Löschen";
            deleteBtn.addEventListener("click", () => {
                this.dispatchEvent(new CustomEvent("delete-event", {
                    detail: { id: selected.id },
                    bubbles: true,
                    composed: true
                }));
            });
            actions.appendChild(deleteBtn);

            detailCard.appendChild(actions);
        }

        layout.appendChild(detailCard);
        page.appendChild(layout);
        this.root.appendChild(page);
    }
}

if (!customElements.get("events-view")) {
    customElements.define("events-view", EventsView);
}

// ------------------------------------------------------------
// Helfer-Funktion: wie bisher im Controller verwendbar
// ------------------------------------------------------------
export function renderEventsView(container, data) {
    clearContainer(container);

    const el = document.createElement("events-view");
    container.appendChild(el);

    el.setData(data);
}

// ------------------------------------------------------------
// bindEventsView: bleibt nutzbar
// ------------------------------------------------------------
export function bindEventsView(
    container,
    onFilterChange,
    onSelectEvent,
    onEditEvent,
    onDeleteEvent,
    onUpdateParticipants
) {
    const el = container.querySelector("events-view");
    if (!el) return;

    el.addEventListener("filter-change", (e) => {
        if (onFilterChange) onFilterChange(e.detail || {});
    });

    el.addEventListener("select-event", (e) => {
        const id = e.detail ? e.detail.id : null;
        if (onSelectEvent) onSelectEvent(id);
    });

    el.addEventListener("edit-event", (e) => {
        const id = e.detail ? e.detail.id : null;
        if (onEditEvent) onEditEvent(id);
    });

    el.addEventListener("delete-event", (e) => {
        const id = e.detail ? e.detail.id : null;
        if (onDeleteEvent) onDeleteEvent(id);
    });

    el.addEventListener("update-participants", (e) => {
        if (!onUpdateParticipants) return;
        const d = e.detail || {};
        onUpdateParticipants(d.eventId, d.participantIds);
    });
}

// --------------------------------------------------------------------
// Helper (nur für diese Datei)
// --------------------------------------------------------------------

function makeLabeled(text, control) {
    const label = document.createElement("label");

    const span = document.createElement("span");
    span.textContent = text;
    label.appendChild(span);

    label.appendChild(control);
    return label;
}

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

    return d[2] + "." + d[1] + "." + d[0] + ", " + time + " Uhr";
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

function getCheckedParticipantIds(scopeEl) {
    const group = scopeEl.querySelector("#detailParticipants");
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