// --------------------------------------------------------------------
// tagModel.js
//
// Model für Tags:
// - Laden von tags.json
// - CRUD: add/delete
// - Regeln: Tag-Name darf nicht leer sein, keine Duplikate
// - Listener: "loaded", "changed", "banner"
// --------------------------------------------------------------------

export function TagModel() {
    this.tags = [];

    this.listeners = {
        loaded: [],
        changed: [],
        banner: []
    };
}

// --------------------------------------------------------------------
// Listener
// --------------------------------------------------------------------
TagModel.prototype.addListener = function (type, fn) {
    if (!this.listeners[type]) return;
    this.listeners[type].push(fn);
};

TagModel.prototype._emit = function (type, data) {
    if (!this.listeners[type]) return;

    for (let i = 0; i < this.listeners[type].length; i++) {
        this.listeners[type][i](data);
    }
};

TagModel.prototype._banner = function (text) {
    this._emit("banner", text);
};

// --------------------------------------------------------------------
// Laden
// Datei: ./json/tags.json
// erwartete Struktur: [{id, label}, ...]
// --------------------------------------------------------------------
TagModel.prototype.load = function () {
    fetch("./json/tags.json")
        .then((res) => {
            if (!res.ok) {
                throw new Error("tags.json konnte nicht geladen werden");
            }
            return res.json();
        })
        .then((data) => {
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
TagModel.prototype.getAll = function () {
    return this.tags.slice();
};

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
TagModel.prototype._nextId = function () {
    let maxId = 0;
    for (let i = 0; i < this.tags.length; i++) {
        const id = Number(this.tags[i].id);
        if (!isNaN(id) && id > maxId) maxId = id;
    }
    return maxId + 1;
};

TagModel.prototype._normalize = function (data) {
    return {
        id: data && data.id ? Number(data.id) : null,
        label: String((data && data.label) || "").trim()
    };
};

TagModel.prototype.addTag = function (data) {
    const t = this._normalize(data);

    if (t.label.length === 0) {
        this._banner("Der Tag-Name darf nicht leer sein.");
        return;
    }

    const exists = this.tags.some(
        (x) => String(x.label).toLowerCase() === t.label.toLowerCase()
    );
    if (exists) {
        this._banner("Dieses Tag existiert bereits.");
        return;
    }

    t.id = this._nextId();
    this.tags.push(t);

    this._banner("Tag wurde hinzugefügt.");
    this._emit("changed", null);
};

TagModel.prototype.deleteTag = function (id) {
    const tid = Number(id);
    if (isNaN(tid)) return;

    const before = this.tags.length;
    this.tags = this.tags.filter((t) => Number(t.id) !== tid);

    if (this.tags.length === before) {
        this._banner("Tag nicht gefunden.");
        return;
    }

    this._banner("Tag wurde gelöscht.");
    this._emit("changed", null);
};