// --------------------------------------------------------------------
// participantModel.js
//
// Model für Teilnehmer:
// - Laden von participants.json
// - CRUD: add/delete
// - Listener: "loaded", "changed", "banner"
// --------------------------------------------------------------------

export function ParticipantModel() {
    this.participants = [];

    this.listeners = {
        loaded: [],
        changed: [],
        banner: []
    };
}

// --------------------------------------------------------------------
// Listener
// --------------------------------------------------------------------
ParticipantModel.prototype.addListener = function (type, fn) {
    if (!this.listeners[type]) return;
    this.listeners[type].push(fn);
};

ParticipantModel.prototype._emit = function (type, data) {
    if (!this.listeners[type]) return;

    for (let i = 0; i < this.listeners[type].length; i++) {
        this.listeners[type][i](data);
    }
};

ParticipantModel.prototype._banner = function (text) {
    this._emit("banner", text);
};

// --------------------------------------------------------------------
// Laden
// Datei: ./json/participants.json
// erwartete Struktur: [{id, name, email}, ...]
// --------------------------------------------------------------------
ParticipantModel.prototype.load = function () {
    fetch("./json/participants.json")
        .then((res) => {
            if (!res.ok) {
                throw new Error("participants.json konnte nicht geladen werden");
            }
            return res.json();
        })
        .then((data) => {
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
ParticipantModel.prototype.getAll = function () {
    return this.participants.slice();
};

ParticipantModel.prototype.getById = function (id) {
    const pid = Number(id);
    if (isNaN(pid)) return null;

    for (let i = 0; i < this.participants.length; i++) {
        if (Number(this.participants[i].id) === pid) return this.participants[i];
    }
    return null;
};

// --------------------------------------------------------------------
// CRUD
// --------------------------------------------------------------------
ParticipantModel.prototype._nextId = function () {
    let maxId = 0;
    for (let i = 0; i < this.participants.length; i++) {
        const id = Number(this.participants[i].id);
        if (!isNaN(id) && id > maxId) maxId = id;
    }
    return maxId + 1;
};

ParticipantModel.prototype._normalize = function (data) {
    return {
        id: data && data.id ? Number(data.id) : null,
        name: String((data && data.name) || "").trim(),
        email: String((data && data.email) || "").trim()
    };
};

ParticipantModel.prototype.addParticipant = function (data) {
    const p = this._normalize(data);

    if (p.name.length === 0 || p.email.length === 0) {
        this._banner("Name und E-Mail sind Pflichtfelder.");
        return;
    }

    // E-Mail darf nicht doppelt sein
    const exists = this.participants.some(
        (x) => String(x.email).toLowerCase() === p.email.toLowerCase()
    );
    if (exists) {
        this._banner("Diese E-Mail-Adresse ist bereits vorhanden.");
        return;
    }

    p.id = this._nextId();
    this.participants.push(p);

    this._banner("Teilnehmer*in hinzugefügt.");
    this._emit("changed", null);
};

ParticipantModel.prototype.deleteParticipant = function (id) {
    const pid = Number(id);
    if (isNaN(pid)) return;

    const before = this.participants.length;
    this.participants = this.participants.filter((p) => Number(p.id) !== pid);

    if (this.participants.length === before) {
        this._banner("Teilnehmer*in nicht gefunden.");
        return;
    }

    this._banner("Teilnehmer*in gelöscht.");
    this._emit("changed", null);
};