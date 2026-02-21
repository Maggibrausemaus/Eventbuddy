// --------------------------------------------------------------------
// filters.js
//
// Diese Klasse speichert die aktuellen Filterwerte
// (Status, Teilnehmer, Tag).
// Sie enthält keine Filterlogik selbst –
// das Filtern übernimmt das EventModel.
//
// Ziel:
// Filterzustand getrennt vom Model verwalten.
// --------------------------------------------------------------------
export function Filters() {
    // Aktueller Status-Filter (z.B. "open", "closed")
    this.status = "";

    // Gefilterte Teilnehmer-ID
    this.participantId = "";

    // Gefilterte Tag-ID
    this.tagId = "";
}

// --------------------------------------------------------------------
// set(data)
//
// Übernimmt neue Filterwerte.
// Nur Felder, die im data-Objekt vorhanden sind,
// werden aktualisiert.
//
// Vorteil:
// Man kann einzelne Filter ändern,
// ohne alle zurücksetzen zu müssen.
// --------------------------------------------------------------------
Filters.prototype.set = function (data) {
    if (!data) return;

    // Prüft, ob das Feld existiert (nicht nur truthy!)
    if ("status" in data)
        this.status = data.status || "";

    if ("participantId" in data)
        this.participantId = data.participantId || "";

    if ("tagId" in data)
        this.tagId = data.tagId || "";
};

// --------------------------------------------------------------------
// reset()
//
// Setzt alle Filter zurück.
// Danach sind keine Filter mehr aktiv.
// --------------------------------------------------------------------
Filters.prototype.reset = function () {
    this.status = "";
    this.participantId = "";
    this.tagId = "";
};