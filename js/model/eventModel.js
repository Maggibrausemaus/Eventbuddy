// --------------------------------------------------------------------
// eventModel.js
// Model für Events (EventTarget-basiert)
// - lädt events.json
// - Filter über Filters-Klasse
// - Auswahl (selectedEventId)
// - CRUD + updateParticipants
// - Events: "loaded", "changed", "banner"
// --------------------------------------------------------------------

import { Filters } from "./filters.js";

export class EventModel extends EventTarget {
    constructor() {
        super();

        this.events = [];
        this.selectedEventId = null;
        this.filters = new Filters();
    }

    // ------------------------------------------------------------
    // interne Event-Helfer
    // ------------------------------------------------------------
    _emit(type, detail) {
        this.dispatchEvent(new CustomEvent(type, { detail: detail }));
    }

    _banner(text) {
        this._emit("banner", String(text || ""));
    }

    // ------------------------------------------------------------
    // Laden
    // ------------------------------------------------------------
    load() {
        fetch("./json/events.json")
            .then((res) => {
                if (!res.ok) throw new Error("events.json konnte nicht geladen werden");
                return res.json();
            })
            .then((data) => {
                this.events = Array.isArray(data) ? data : [];
                this.selectedEventId = (this.events.length > 0) ? this.events[0].id : null;

                this._emit("loaded", null);
                this._emit("changed", null);
            })
            .catch((err) => {
                console.error(err);
                this._banner("Fehler beim Laden der Events.");
            });
    }

    // ------------------------------------------------------------
    // Filter + Auswahl
    // ------------------------------------------------------------
    setFilters(newFilters) {
        this.filters.set(newFilters);
        this._emit("changed", null);
    }

    selectEvent(id) {
        const eid = Number(id);
        if (isNaN(eid)) return;

        this.selectedEventId = eid;
        this._emit("changed", null);
    }

    getSelectedEvent() {
        const eid = Number(this.selectedEventId);

        for (let i = 0; i < this.events.length; i++) {
            if (Number(this.events[i].id) === eid) return this.events[i];
        }
        return null;
    }

    // ------------------------------------------------------------
    // Filterliste
    // ------------------------------------------------------------
    getFilteredEvents() {
        const status = String(this.filters.status || "").trim();
        const participantId = String(this.filters.participantId || "").trim();
        const tagId = String(this.filters.tagId || "").trim();

        let list = this.events.slice();

        if (status.length > 0) {
            list = list.filter((ev) => String(ev.status) === status);
        }

        if (participantId.length > 0) {
            const pid = Number(participantId);
            list = list.filter((ev) => {
                const arr = Array.isArray(ev.participantIds) ? ev.participantIds : [];
                return arr.map(Number).includes(pid);
            });
        }

        if (tagId.length > 0) {
            const tid = Number(tagId);
            list = list.filter((ev) => {
                const arr = Array.isArray(ev.tagIds) ? ev.tagIds : [];
                return arr.map(Number).includes(tid);
            });
        }

        // Auswahl anpassen, falls nicht mehr sichtbar
        if (list.length > 0) {
            const sel = this.getSelectedEvent();
            const stillThere = sel && list.some((ev) => Number(ev.id) === Number(sel.id));
            if (!stillThere) this.selectedEventId = list[0].id;
        }

        return list;
    }

    // ------------------------------------------------------------
    // CRUD
    // ------------------------------------------------------------
    _nextId() {
        let maxId = 0;
        for (let i = 0; i < this.events.length; i++) {
            const id = Number(this.events[i].id);
            if (!isNaN(id) && id > maxId) maxId = id;
        }
        return maxId + 1;
    }

    _normalize(data) {
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
    }

    addEvent(data) {
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
    }

    updateEvent(data) {
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
    }

    deleteEvent(id) {
        const eid = Number(id);
        if (isNaN(eid)) return;

        const before = this.events.length;
        this.events = this.events.filter((ev) => Number(ev.id) !== eid);

        if (this.events.length === before) {
            this._banner("Event nicht gefunden.");
            return;
        }

        this.selectedEventId = (this.events.length > 0) ? this.events[0].id : null;

        this._banner("Event wurde gelöscht.");
        this._emit("changed", null);
    }

    // ------------------------------------------------------------
    // Teilnehmer im Detail speichern
    // ------------------------------------------------------------
    updateParticipants(eventId, participantIds) {
        const eid = Number(eventId);
        if (isNaN(eid)) return;

        const ids = Array.isArray(participantIds)
            ? participantIds.map(Number).filter((x) => !isNaN(x))
            : [];

        for (let i = 0; i < this.events.length; i++) {
            if (Number(this.events[i].id) === eid) {
                this.events[i].participantIds = ids;

                this._banner("Teilnehmer gespeichert.");
                this._emit("changed", null);
                return;
            }
        }

        this._banner("Event nicht gefunden.");
    }
}