// --------------------------------------------------------------------
// eventModel.js
//
// Dieses Model bildet die zentrale Datenlogik der Anwendung.
// Es speichert alle Events, verwaltet Filter, merkt sich
// die aktuelle Auswahl und stellt CRUD-Funktionen bereit.
//
// Zusätzlich implementiert es ein einfaches Observer-Prinzip:
// Die UI kann Listener registrieren und wird bei Änderungen
// automatisch benachrichtigt.
//
// WICHTIG:
// Alle Änderungen passieren nur im Speicher (this.events).
// Die JSON-Datei wird nicht zurückgeschrieben.
// --------------------------------------------------------------------

import { Filters } from "./filters.js";

// --------------------------------------------------------------------
// Konstruktor
//
// Erstellt eine neue Instanz des EventModels.
// Initialisiert:
// - Eventspeicher
// - aktuelle Auswahl
// - Filterobjekt
// - Listener-Container für UI-Benachrichtigungen
// --------------------------------------------------------------------
export function EventModel() {
    this.events = [];
    this.selectedEventId = null;
    this.filters = new Filters();

    // Listener sind nach Typ gruppiert
    this.listeners = {
        loaded: [],
        changed: [],
        banner: []
    };
}

// --------------------------------------------------------------------
// Listener-System (Observer Pattern)
//
// Ermöglicht es der UI, auf Änderungen im Model zu reagieren.
// --------------------------------------------------------------------

// Registriert eine Callback-Funktion für ein Ereignis
EventModel.prototype.addListener = function (type, fn) {
    if (!this.listeners[type]) return;
    this.listeners[type].push(fn);
};

// Löst ein Ereignis aus und ruft alle registrierten Listener auf
EventModel.prototype._emit = function (type, data) {
    if (!this.listeners[type]) return;

    for (let i = 0; i < this.listeners[type].length; i++) {
        this.listeners[type][i](data);
    }
};

// Hilfsfunktion für Banner-Meldungen
EventModel.prototype._banner = function (text) {
    this._emit("banner", text);
};

// --------------------------------------------------------------------
// Laden der Events
//
// Lädt die Datei events.json per fetch().
// Nach erfolgreichem Laden:
// - werden die Events gespeichert
// - eine Startauswahl gesetzt
// - UI über "loaded" und "changed" informiert
// --------------------------------------------------------------------
EventModel.prototype.load = function () {
    fetch("./json/events.json")
        .then((res) => {
            // HTTP-Status prüfen
            if (!res.ok)
                throw new Error("events.json konnte nicht geladen werden");
            return res.json();
        })
        .then((data) => {
            // Absicherung: nur Arrays übernehmen
            this.events = Array.isArray(data) ? data : [];

            // Falls Events existieren → erstes automatisch auswählen
            this.selectedEventId =
                this.events.length > 0 ? this.events[0].id : null;

            this._emit("loaded", null);
            this._emit("changed", null);
        })
        .catch((err) => {
            console.error(err);
            this._banner("Fehler beim Laden der Events.");
        });
};

// --------------------------------------------------------------------
// Filter & Auswahl
//
// Das Model speichert nur die Filterwerte.
// Die tatsächliche Filterung passiert in getFilteredEvents().
// --------------------------------------------------------------------

EventModel.prototype.setFilters = function (newFilters) {
    this.filters.set(newFilters);
    this._emit("changed", null);
};

EventModel.prototype.selectEvent = function (id) {
    const eid = Number(id);

    // Ungültige ID abfangen
    if (isNaN(eid)) return;

    this.selectedEventId = eid;
    this._emit("changed", null);
};

// Sucht das aktuell ausgewählte Event im Array
EventModel.prototype.getSelectedEvent = function () {
    const eid = Number(this.selectedEventId);

    for (let i = 0; i < this.events.length; i++) {
        if (Number(this.events[i].id) === eid)
            return this.events[i];
    }

    return null;
};

// --------------------------------------------------------------------
// Gefilterte Eventliste
//
// Wendet die gesetzten Filter (Status, Teilnehmer, Tag) an.
// Wichtig:
// - Original-Array bleibt unverändert (slice())
// - Arrays wie tagIds/participantIds werden abgesichert
// - Wenn Auswahl durch Filter verschwindet,
//   wird automatisch das erste sichtbare Event gewählt.
// --------------------------------------------------------------------
EventModel.prototype.getFilteredEvents = function () {
    const status = String(this.filters.status || "").trim();
    const participantId =
        String(this.filters.participantId || "").trim();
    const tagId = String(this.filters.tagId || "").trim();

    // Kopie erzeugen → verhindert Manipulation des Originals
    let list = this.events.slice();

    // -------------------------
    // Status-Filter
    // -------------------------
    if (status.length > 0) {
        list = list.filter((ev) =>
            String(ev.status) === status
        );
    }

    // -------------------------
    // Teilnehmer-Filter
    // participantIds ist ein Array von IDs.
    // includes() prüft, ob die ID enthalten ist.
    // map(Number) stellt sicher, dass String-IDs auch funktionieren.
    // -------------------------
    if (participantId.length > 0) {
        const pid = Number(participantId);

        list = list.filter((ev) => {
            const arr = Array.isArray(ev.participantIds)
                ? ev.participantIds
                : [];

            return arr.map(Number).includes(pid);
        });
    }

    // -------------------------
    // Tag-Filter (gleiches Prinzip wie oben)
    // -------------------------
    if (tagId.length > 0) {
        const tid = Number(tagId);

        list = list.filter((ev) => {
            const arr = Array.isArray(ev.tagIds)
                ? ev.tagIds
                : [];

            return arr.map(Number).includes(tid);
        });
    }

    // -------------------------
    // Auswahl-Validierung:
    // Falls das aktuell ausgewählte Event nicht
    // mehr in der gefilterten Liste vorkommt,
    // wird automatisch das erste gewählt.
    // -------------------------
    if (list.length > 0) {
        const sel = this.getSelectedEvent();

        const stillThere =
            sel &&
            list.some((ev) =>
                Number(ev.id) === Number(sel.id)
            );

        if (!stillThere) {
            this.selectedEventId = list[0].id;
        }
    }

    return list;
};

// --------------------------------------------------------------------
// CRUD – Events verwalten
//
// Create  → addEvent()
// Update  → updateEvent()
// Delete  → deleteEvent()
//
// Hilfsfunktionen:
// - _nextId(): erzeugt neue eindeutige ID
// - _normalize(): vereinheitlicht Eingabedaten
// --------------------------------------------------------------------

EventModel.prototype._nextId = function () {
    let maxId = 0;

    // höchste vorhandene ID suchen
    for (let i = 0; i < this.events.length; i++) {
        const id = Number(this.events[i].id);

        if (!isNaN(id) && id > maxId)
            maxId = id;
    }

    return maxId + 1;
};

// Normalisiert Daten:
// - Strings trimmen
// - Arrays in Zahlen umwandeln
// - feste Objektstruktur garantieren
EventModel.prototype._normalize = function (data) {
    const ev = {
        id: data && data.id ? Number(data.id) : null,
        title: String((data && data.title) || "").trim(),
        dateTime:
            String((data && data.dateTime) || "").trim(),
        location:
            String((data && data.location) || "").trim(),
        description:
            String((data && data.description) || "").trim(),
        status:
            String((data && data.status) || "").trim(),
        tagIds: [],
        participantIds: []
    };

    if (data && Array.isArray(data.tagIds)) {
        ev.tagIds =
            data.tagIds
                .map(Number)
                .filter((x) => !isNaN(x));
    }

    if (data && Array.isArray(data.participantIds)) {
        ev.participantIds =
            data.participantIds
                .map(Number)
                .filter((x) => !isNaN(x));
    }

    return ev;
};

// Erstellt ein neues Event
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

// Aktualisiert ein bestehendes Event
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

// Löscht ein Event
EventModel.prototype.deleteEvent = function (id) {
    const eid = Number(id);
    if (isNaN(eid)) return;

    const before = this.events.length;

    // filter() erstellt ein neues Array ohne das Event
    this.events =
        this.events.filter(
            (ev) => Number(ev.id) !== eid
        );

    if (this.events.length === before) {
        this._banner("Event nicht gefunden.");
        return;
    }

    this.selectedEventId =
        this.events.length > 0
            ? this.events[0].id
            : null;

    this._banner("Event wurde gelöscht.");
    this._emit("changed", null);
};