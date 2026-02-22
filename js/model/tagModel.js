// --------------------------------------------------------------------
// tagModel.js
// Model für Tags (EventTarget-basiert)
// - lädt tags.json
// - CRUD: add / update / delete
// - Regeln: kein leerer Name, keine Duplikate
// - Events: "loaded", "changed", "banner"
// --------------------------------------------------------------------

export class TagModel extends EventTarget {
    constructor() {
        super();
        this.tags = [];
    }

    _emit(type, detail) {
        this.dispatchEvent(new CustomEvent(type, { detail: detail }));
    }

    _banner(text) {
        this._emit("banner", String(text || ""));
    }

    load() {
        fetch("./json/tags.json")
            .then((res) => {
                if (!res.ok) throw new Error("tags.json konnte nicht geladen werden");
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
    }

    getAll() {
        return this.tags.slice();
    }

    _nextId() {
        let maxId = 0;
        for (let i = 0; i < this.tags.length; i++) {
            const id = Number(this.tags[i].id);
            if (!isNaN(id) && id > maxId) maxId = id;
        }
        return maxId + 1;
    }

    _normalize(data) {
        return {
            id: data && data.id ? Number(data.id) : null,
            label: String((data && data.label) || "").trim()
        };
    }

    addTag(data) {
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
    }

    // NEU: Tag bearbeiten
    updateTag(data) {
        const id = Number(data && data.id);
        if (isNaN(id)) return;

        const t = this._normalize(data);
        t.id = id;

        if (t.label.length === 0) {
            this._banner("Der Tag-Name darf nicht leer sein.");
            return;
        }

        const duplicate = this.tags.some(
            (x) =>
                Number(x.id) !== id &&
                String(x.label).toLowerCase() === t.label.toLowerCase()
        );

        if (duplicate) {
            this._banner("Dieses Tag existiert bereits.");
            return;
        }

        for (let i = 0; i < this.tags.length; i++) {
            if (Number(this.tags[i].id) === id) {
                this.tags[i] = t;

                this._banner("Tag wurde aktualisiert.");
                this._emit("changed", null);
                return;
            }
        }

        this._banner("Tag nicht gefunden.");
    }

    deleteTag(id) {
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
    }
}