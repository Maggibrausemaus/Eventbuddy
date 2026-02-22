// --------------------------------------------------------------------
// filters.js
//
// Kleine Hilfsklasse für die aktuellen Filter der Eventliste.
// Speichert:
// - status
// - participantId
// - tagId
// --------------------------------------------------------------------

export function Filters() {
    this.status = "";
    this.participantId = "";
    this.tagId = "";
}

// Setzt nur die Felder, die im übergebenen Objekt vorkommen
Filters.prototype.set = function (data) {
    if (!data) return;

    if ("status" in data) this.status = data.status || "";
    if ("participantId" in data) this.participantId = data.participantId || "";
    if ("tagId" in data) this.tagId = data.tagId || "";
};

// Setzt alle Filter wieder zurück
Filters.prototype.reset = function () {
    this.status = "";
    this.participantId = "";
    this.tagId = "";
};