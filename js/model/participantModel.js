// --------------------------------------------------------------------
// participantModel.js
// Model für Teilnehmer (EventTarget-basiert)
// - lädt participants.json
// - CRUD: add/delete
// - Events: "loaded", "changed", "banner"
// --------------------------------------------------------------------

export class ParticipantModel extends EventTarget {
    constructor() {
        super();
        this.participants = [];
    }

    _emit(type, detail) {
        this.dispatchEvent(new CustomEvent(type, { detail: detail }));
    }

    _banner(text) {
        this._emit("banner", String(text || ""));
    }

    load() {
        fetch("./json/participants.json")
            .then((res) => {
                if (!res.ok) throw new Error("participants.json konnte nicht geladen werden");
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
    }

    getAll() {
        return this.participants.slice();
    }

    _nextId() {
        let maxId = 0;
        for (let i = 0; i < this.participants.length; i++) {
            const id = Number(this.participants[i].id);
            if (!isNaN(id) && id > maxId) maxId = id;
        }
        return maxId + 1;
    }

    _normalize(data) {
        return {
            id: data && data.id ? Number(data.id) : null,
            name: String((data && data.name) || "").trim(),
            email: String((data && data.email) || "").trim()
        };
    }

    addParticipant(data) {
        const p = this._normalize(data);

        if (p.name.length === 0 || p.email.length === 0) {
            this._banner("Name und E-Mail sind Pflichtfelder.");
            return;
        }

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
    }

    deleteParticipant(id) {
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
    }
}