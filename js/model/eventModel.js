// --------------------------------------------------------------------
// eventModel.js
// Model für Events
// - Laden von events.json
// - Filter (status, participantId, tagId) über Filters-Klasse
// - Auswahl (selectedEventId)
// - CRUD: add/update/delete
// - Zusatz: updateParticipants(eventId, participantIds)
// - Listener: "loaded", "changed", "banner"
// --------------------------------------------------------------------

import { Filters } from "./filters.js";

export function EventModel() {
    this.events = [];
    this.selectedEventId = null;

    // Filter als eigene Klasse
    this.filters = new Filters();

    this.listeners = {
        loaded: [],
        changed: [],
        banner: []
    };
}

// --------------------------------------------------------------------
// Listener
// --------------------------------------------------------------------
EventModel.prototype.addListener = function (type, fn) {
    if (!this.listeners[type]) return;
    this.listeners[type].push(fn);
};

EventModel.prototype._emit = function (type, data) {
    if (!this.listeners[type]) return;

    for (let i = 0; i < this.listeners[type].length; i++) {
        this.listeners[type][i](data);
    }
};

EventModel.prototype._banner = function (text) {
    this._emit("banner", text);
};

// --------------------------------------------------------------------
// Laden
// --------------------------------------------------------------------
EventModel.prototype.load = function () {
    fetch("./json/events.json")
        .then((res) => {
            if (!res.ok) throw new Error("events.json konnte nicht geladen werden");
            return res.json();
        })
        .then((data) => {
            this.events = Array.isArray(data) ? data : [];

            if (this.events.length > 0) {
                this.selectedEventId = this.events[0].id;
            } else {
                this.selectedEventId = null;
            }

            this._emit("loaded", null);
            this._emit("changed", null);
        })
        .catch((err) => {
            console.error(err);
            this._banner("Fehler beim Laden der Events.");
        });
};

// --------------------------------------------------------------------
// Filter + Auswahl
// --------------------------------------------------------------------
EventModel.prototype.setFilters = function (newFilters) {
    this.filters.set(newFilters);
    this._emit("changed", null);
};

EventModel.prototype.selectEvent = function (id) {
    const eid = Number(id);
    if (isNaN(eid)) return;

    this.selectedEventId = eid;
    this._emit("changed", null);
};

EventModel.prototype.getSelectedEvent = function () {
    const eid = Number(this.selectedEventId);
    for (let i = 0; i < this.events.length; i++) {
        if (Number(this.events[i].id) === eid) return this.events[i];
    }
    return null;
};

// --------------------------------------------------------------------
// Events filtern
// participantId/tagId funktionieren nur,
// wenn Events participantIds/tagIds Arrays haben.
// --------------------------------------------------------------------
EventModel.prototype.getFilteredEvents = function () {
    const status = String(this.filters.status || "").trim();
    const participantId = String(this.filters.participantId || "").trim();
    const tagId = String(this.filters.tagId || "").trim();

    let list = this.events.slice();

    // Status
    if (status.length > 0) {
        list = list.filter((ev) => String(ev.status) === status);
    }

    // Teilnehmer (event.participantIds enthält IDs)
    if (participantId.length > 0) {
        const pid = Number(participantId);
        list = list.filter((ev) => {
            const arr = Array.isArray(ev.participantIds) ? ev.participantIds : [];
            return arr.map(Number).includes(pid);
        });
    }

    // Tags (event.tagIds enthält IDs)
    if (tagId.length > 0) {
        const tid = Number(tagId);
        list = list.filter((ev) => {
            const arr = Array.isArray(ev.tagIds) ? ev.tagIds : [];
            return arr.map(Number).includes(tid);
        });
    }

    // Wenn Auswahl nicht mehr sichtbar: erste gefilterte auswählen
    if (list.length > 0) {
        const sel = this.getSelectedEvent();
        const stillThere = sel && list.some((ev) => Number(ev.id) === Number(sel.id));

        if (!stillThere) {
            this.selectedEventId = list[0].id;
        }
    }

    return list;
};

// --------------------------------------------------------------------
// CRUD Events
// erwartete Felder: title, dateTime, location, description, status,
// optional: tagIds[], participantIds[]
// --------------------------------------------------------------------
EventModel.prototype._nextId = function () {
    let maxId = 0;
    for (let i = 0; i < this.events.length; i++) {
        const id = Number(this.events[i].id);
        if (!isNaN(id) && id > maxId) maxId = id;
    }
    return maxId + 1;
};

EventModel.prototype._normalize = function (data) {
    const ev = {
        id: data && data.id ? Number(data.id) : null,
        title: String((data && data.title) || "").trim(),
        dateTime: String((data && data.dateTime) || "").trim(),
        location: String((data && data.location) || "").trim(),
        description: String((data && data.description) || "").trim(),
        status: String((data && data.status) || "").trim(),
        tagIds: [],
        participantIds: []
    };

    if (data && Array.isArray(data.tagIds)) {
        ev.tagIds = data.tagIds.map(Number).filter((x) => !isNaN(x));
    }

    if (data && Array.isArray(data.participantIds)) {
        ev.participantIds = data.participantIds.map(Number).filter((x) => !isNaN(x));
    }

    return ev;
};

EventModel.prototype.addEvent = function (data) {
    const ev = this._normalize(data);

    if (ev.title.length === 0) {
        this._banner("Titel ist ein Pflichtfeld.");
        return;
    }

    ev.id = this._nextId();
    this.events.push(ev);

    this.selectedEventId = ev.id;

    this._banner("Event erstellt.");
    this._emit("changed", null);
};

EventModel.prototype.updateEvent = function (data) {
    const id = Number(data && data.id);
    if (isNaN(id)) return;

    const ev = this._normalize(data);
    ev.id = id;

    for (let i = 0; i < this.events.length; i++) {
        if (Number(this.events[i].id) === id) {
            this.events[i] = ev;

            this._banner("Event gespeichert.");
            this._emit("changed", null);
            return;
        }
    }

    this._banner("Event nicht gefunden.");
};

EventModel.prototype.deleteEvent = function (id) {
    const eid = Number(id);
    if (isNaN(eid)) return;

    const before = this.events.length;
    this.events = this.events.filter((ev) => Number(ev.id) !== eid);

    if (this.events.length === before) {
        this._banner("Event nicht gefunden.");
        return;
    }

    if (this.events.length > 0) {
        this.selectedEventId = this.events[0].id;
    } else {
        this.selectedEventId = null;
    }

    this._banner("Event wurde gelöscht.");
    this._emit("changed", null);
};

// --------------------------------------------------------------------
// Teilnehmer im Detail speichern
// (wird von eventsView über den Controller verwendet)
// --------------------------------------------------------------------
EventModel.prototype.updateParticipants = function (eventId, participantIds) {
    const eid = Number(eventId);
    if (isNaN(eid)) return;

    const ids = Array.isArray(participantIds)
        ? participantIds.map(Number).filter((x) => !isNaN(x))
        : [];

    for (let i = 0; i < this.events.length; i++) {
        if (Number(this.events[i].id) === eid) {
            // Hier ändern wir nur participantIds, der Rest bleibt gleich
            this.events[i].participantIds = ids;

            this._banner("Teilnehmer gespeichert.");
            this._emit("changed", null);
            return;
        }
    }

    this._banner("Event nicht gefunden.");
};