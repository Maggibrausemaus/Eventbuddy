// --------------------------------------------------------------------
// tagModel.js
//
// Dieses Model verwaltet alle Tags.
// Es lädt Tags aus tags.json, speichert sie im Array und bietet
// Funktionen zum Anzeigen, Hinzufügen und Löschen.
//
// Regeln beim Hinzufügen:
// - Tag-Name (label) darf nicht leer sein
// - Tag darf nicht doppelt vorkommen (case-insensitive)
//
// Zusätzlich gibt es ein Listener-System, damit die UI automatisch
// aktualisiert wird oder Meldungen anzeigen kann.
//
// Hinweis:
// Änderungen passieren nur im Speicher (tags-Array).
// --------------------------------------------------------------------

export function TagModel() {
    this.tags = [];

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

// UI kann sich registrieren (z.B. bei "changed" neu rendern)
TagModel.prototype.addListener = function (type, fn) {
    if (!this.listeners[type]) return;
    this.listeners[type].push(fn);
};

// Ruft alle Listener eines Typs auf
TagModel.prototype._emit = function (type, data) {
    if (!this.listeners[type]) return;

    for (let i = 0; i < this.listeners[type].length; i++) {
        this.listeners[type][i](data);
    }
};

// Kurzfunktion für Banner-Meldungen
TagModel.prototype._banner = function (text) {
    this._emit("banner", text);
};

// --------------------------------------------------------------------
// Laden
// Datei: ./json/tags.json
// erwartete Struktur: [{id, label}, ...]
// --------------------------------------------------------------------

// Lädt Tags aus der JSON-Datei und informiert danach die UI
TagModel.prototype.load = function () {
    fetch("./json/tags.json")
        .then((res) => {
            if (!res.ok) {
                throw new Error("tags.json konnte nicht geladen werden");
            }
            return res.json();
        })
        .then((data) => {
            // Absicherung: nur Arrays übernehmen
            this.tags = Array.isArray(data) ? data : [];

            this._emit("loaded", null);
            this._emit("changed", null);
        })
        .catch((err) => {
            console.error(err);
            this._banner("Fehler beim Laden der Tags.");
        });
};

// --------------------------------------------------------------------
// Getter
// --------------------------------------------------------------------

// Gibt eine Kopie der Tag-Liste zurück
TagModel.prototype.getAll = function () {
    return this.tags.slice();
};

// Sucht einen Tag anhand der ID
TagModel.prototype.getById = function (id) {
    const tid = Number(id);
    if (isNaN(tid)) return null;

    for (let i = 0; i < this.tags.length; i++) {
        if (Number(this.tags[i].id) === tid) return this.tags[i];
    }
    return null;
};

// --------------------------------------------------------------------
// CRUD
// --------------------------------------------------------------------

// Erzeugt eine neue eindeutige ID (max + 1)
TagModel.prototype._nextId = function () {
    let maxId = 0;

    for (let i = 0; i < this.tags.length; i++) {
        const id = Number(this.tags[i].id);
        if (!isNaN(id) && id > maxId) maxId = id;
    }

    return maxId + 1;
};

// Bereinigt Eingabedaten (trimmen + ID als Number)
TagModel.prototype._normalize = function (data) {
    return {
        id: data && data.id ? Number(data.id) : null,
        label: String((data && data.label) || "").trim()
    };
};

// Fügt einen neuen Tag hinzu (Validierung + Duplikatprüfung)
TagModel.prototype.addTag = function (data) {
    const t = this._normalize(data);

    // Pflichtfeld: label muss gesetzt sein
    if (t.label.length === 0) {
        this._banner("Der Tag-Name darf nicht leer sein.");
        return;
    }

    // Duplikatprüfung (case-insensitive)
    const exists = this.tags.some((x) =>
        String(x.label).toLowerCase() === t.label.toLowerCase()
    );
    if (exists) {
        this._banner("Dieses Tag existiert bereits.");
        return;
    }

    // Speichern
    t.id = this._nextId();
    this.tags.push(t);

    this._banner("Tag wurde hinzugefügt.");
    this._emit("changed", null);
};

// Löscht einen Tag anhand der ID
TagModel.prototype.deleteTag = function (id) {
    const tid = Number(id);
    if (isNaN(tid)) return;

    const before = this.tags.length;

    // Entfernt den Tag aus dem Array
    this.tags = this.tags.filter((t) => Number(t.id) !== tid);

    // Wenn sich nichts geändert hat -> nicht gefunden
    if (this.tags.length === before) {
        this._banner("Tag nicht gefunden.");
        return;
    }

    this._banner("Tag wurde gelöscht.");
    this._emit("changed", null);
};