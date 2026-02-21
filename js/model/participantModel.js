// --------------------------------------------------------------------
// participantModel.js
//
// Dieses Model verwaltet alle Teilnehmer.
// Es lädt die Teilnehmer aus participants.json, speichert sie im Array
// und bietet Funktionen zum Anzeigen, Hinzufügen und Löschen.
//
// Zusätzlich gibt es ein kleines Listener-System, damit die UI
// automatisch neu rendern kann oder Meldungen anzeigen kann.
//
// Hinweis:
// Änderungen passieren nur im Speicher (participants-Array).
// --------------------------------------------------------------------

export function ParticipantModel() {
    this.participants = [];

    // Listener-Typen:
    // loaded  -> Daten wurden geladen
    // changed -> Daten haben sich geändert (UI neu rendern)
    // banner  -> Meldung anzeigen
    this.listeners = {
        loaded: [],
        changed: [],
        banner: []
    };
}

// --------------------------------------------------------------------
// Listener
// --------------------------------------------------------------------

// UI kann sich registrieren (z.B. "wenn changed, dann neu rendern")
ParticipantModel.prototype.addListener = function (type, fn) {
    if (!this.listeners[type]) return;
    this.listeners[type].push(fn);
};

// Ruft alle Listener eines Typs auf
ParticipantModel.prototype._emit = function (type, data) {
    if (!this.listeners[type]) return;

    for (let i = 0; i < this.listeners[type].length; i++) {
        this.listeners[type][i](data);
    }
};

// Kurzfunktion für Banner-Meldungen
ParticipantModel.prototype._banner = function (text) {
    this._emit("banner", text);
};

// --------------------------------------------------------------------
// Laden
// Datei: ./json/participants.json
// erwartete Struktur: [{id, name, email}, ...]
// --------------------------------------------------------------------

// Lädt Teilnehmer aus der JSON-Datei und informiert danach die UI
ParticipantModel.prototype.load = function () {
    fetch("./json/participants.json")
        .then((res) => {
            if (!res.ok) {
                throw new Error("participants.json konnte nicht geladen werden");
            }
            return res.json();
        })
        .then((data) => {
            // Absicherung: nur Arrays übernehmen
            this.participants = Array.isArray(data) ? data : [];

            this._emit("loaded", null);
            this._emit("changed", null);
        })
        .catch((err) => {
            console.error(err);
            this._banner("Fehler beim Laden der Teilnehmer.");
        });
};

// --------------------------------------------------------------------
// Getter
// --------------------------------------------------------------------

// Gibt eine Kopie der Teilnehmerliste zurück (Original bleibt geschützt)
ParticipantModel.prototype.getAll = function () {
    return this.participants.slice();
};

// Sucht einen Teilnehmer anhand der ID
ParticipantModel.prototype.getById = function (id) {
    const pid = Number(id);
    if (isNaN(pid)) return null;

    for (let i = 0; i < this.participants.length; i++) {
        if (Number(this.participants[i].id) === pid) {
            return this.participants[i];
        }
    }
    return null;
};

// --------------------------------------------------------------------
// CRUD
// --------------------------------------------------------------------

// Erzeugt eine neue eindeutige ID (max + 1)
ParticipantModel.prototype._nextId = function () {
    let maxId = 0;

    for (let i = 0; i < this.participants.length; i++) {
        const id = Number(this.participants[i].id);
        if (!isNaN(id) && id > maxId) maxId = id;
    }

    return maxId + 1;
};

// Bereinigt Eingabedaten (Strings trimmen, ID in Number umwandeln)
ParticipantModel.prototype._normalize = function (data) {
    return {
        id: data && data.id ? Number(data.id) : null,
        name: String((data && data.name) || "").trim(),
        email: String((data && data.email) || "").trim()
    };
};

// Fügt einen neuen Teilnehmer hinzu (mit Mini-Validierung)
ParticipantModel.prototype.addParticipant = function (data) {
    const p = this._normalize(data);

    // Pflichtfelder prüfen
    if (p.name.length === 0 || p.email.length === 0) {
        this._banner("Name und E-Mail sind Pflichtfelder.");
        return;
    }

    // E-Mail muss eindeutig sein (kein doppelter Eintrag)
    const exists = this.participants.some((x) =>
        String(x.email).toLowerCase() === p.email.toLowerCase()
    );
    if (exists) {
        this._banner("Diese E-Mail-Adresse ist bereits vorhanden.");
        return;
    }

    // Neue ID vergeben und speichern
    p.id = this._nextId();
    this.participants.push(p);

    this._banner("Teilnehmer*in hinzugefügt.");
    this._emit("changed", null);
};

// Löscht einen Teilnehmer anhand der ID
ParticipantModel.prototype.deleteParticipant = function (id) {
    const pid = Number(id);
    if (isNaN(pid)) return;

    const before = this.participants.length;

    // Entfernt den Teilnehmer aus der Liste
    this.participants = this.participants.filter(
        (p) => Number(p.id) !== pid
    );

    // Wenn Länge gleich bleibt -> ID wurde nicht gefunden
    if (this.participants.length === before) {
        this._banner("Teilnehmer*in nicht gefunden.");
        return;
    }

    this._banner("Teilnehmer*in gelöscht.");
    this._emit("changed", null);
};