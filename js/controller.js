// --------------------------------------------------------------------
// controller.js
//
// Steuert die App:
// - merkt sich, welche Seite aktiv ist (activePage)
// - rendert Navigation, Banner und Seiteninhalt
// - verbindet Views mit den Models (Callbacks)
// --------------------------------------------------------------------

import { renderBannerView } from "./view/bannerView.js";
import { renderNavView, bindNavView } from "./view/navView.js";
import { renderEventsView, bindEventsView } from "./view/eventsView.js";
import {
    renderEventFormView,
    bindEventFormView,
    startEdit
} from "./view/eventFormView.js";
import { renderParticipantView, bindParticipantView } from "./view/participantView.js";
import { renderTagView, bindTagView } from "./view/tagView.js";

export function Controller(eventModel, participantModel, tagModel) {
    this.eventModel = eventModel;
    this.participantModel = participantModel;
    this.tagModel = tagModel;

    this.app = document.getElementById("app");

    this.activePage = "events"; // aktuelle Seite
    this.editEvent = null;      // wenn gesetzt: Formular läuft im Edit-Modus
    this.bannerText = "";       // Text für die Banner-Leiste

    // Modelle so verbinden, dass bei Änderungen neu gerendert wird
    this._wire(this.eventModel);
    this._wire(this.participantModel);
    this._wire(this.tagModel);

    this.render();
}

// --------------------------------------------------------------------
// Model Listener
// --------------------------------------------------------------------

// Registriert Listener, damit die UI automatisch aktualisiert wird
Controller.prototype._wire = function (model) {
    model.addListener("loaded", () => this.render());
    model.addListener("changed", () => this.render());

    model.addListener("banner", (text) => {
        this.bannerText = text;
        this.render();
    });
};

// --------------------------------------------------------------------
// Render
// --------------------------------------------------------------------

// Baut die komplette Seite neu auf (Nav, Banner, Content)
Controller.prototype.render = function () {

    // App-Container komplett leeren
    while (this.app.firstChild) {
        this.app.removeChild(this.app.firstChild);
    }

    const page = document.createElement("div");
    page.className = "page";

    const navArea = document.createElement("header");
    const bannerArea = document.createElement("section");
    const content = document.createElement("main");

    page.appendChild(navArea);
    page.appendChild(bannerArea);
    page.appendChild(content);

    this.app.appendChild(page);

    // -----------------------------
    // Navigation
    // -----------------------------
    renderNavView(navArea, this.activePage);

    bindNavView(navArea, (pageId) => {
        // Seite wechseln + Edit/Banner zurücksetzen
        this.activePage = pageId;
        this.editEvent = null;
        this.bannerText = "";
        this.render();
    });

    // -----------------------------
    // Banner
    // -----------------------------
    renderBannerView(bannerArea, this.bannerText);

    // ------------------------------------------------------------
    // EVENTS
    // ------------------------------------------------------------
    if (this.activePage === "events") {

        renderEventsView(content, {
            filters: this.eventModel.filters,
            events: this.eventModel.getFilteredEvents(),
            selected: this.eventModel.getSelectedEvent(),
            tags: this.tagModel.getAll(),
            participants: this.participantModel.getAll()
        });

        bindEventsView(
            content,

            // Filter geändert
            (filters) => this.eventModel.setFilters(filters),

            // Event in der Liste gewählt
            (id) => this.eventModel.selectEvent(id),

            // Bearbeiten: merkt sich Event und wechselt ins Formular
            (id) => {
                this.editEvent = this.eventModel.getSelectedEvent();
                this.activePage = "newEvent";
                this.render();
            },

            // Löschen: mit Sicherheitsabfrage
            (id) => {
                const ok = confirm("Event wirklich löschen?");
                if (ok) this.eventModel.deleteEvent(id);
            }
        );
    }

    // ------------------------------------------------------------
    // EVENT ERSTELLEN / BEARBEITEN
    // ------------------------------------------------------------
    if (this.activePage === "newEvent") {

        renderEventFormView(content, {
            tags: this.tagModel.getAll(),
            participants: this.participantModel.getAll(),
            editEvent: this.editEvent
        });

        bindEventFormView(
            content,

            // Submit: entscheidet zwischen add und update
            (formData) => {
                if (formData.id) {
                    this.eventModel.updateEvent(formData);
                } else {
                    this.eventModel.addEvent(formData);
                }

                // zurück zur Liste
                this.editEvent = null;
                this.activePage = "events";
                this.render();
            },

            // Edit abbrechen: zurück zur Liste
            () => {
                this.editEvent = null;
                this.activePage = "events";
                this.render();
            }
        );

        // Falls Edit-Modus: Formular mit Daten füllen
        if (this.editEvent) {
            startEdit(content, this.editEvent);
        }
    }

    // ------------------------------------------------------------
    // TEILNEHMER
    // ------------------------------------------------------------
    if (this.activePage === "participants") {

        renderParticipantView(content, {
            participants: this.participantModel.getAll()
        });

        bindParticipantView(
            content,

            // Hinzufügen
            (data) => this.participantModel.addParticipant(data),

            // Löschen (mit Prüfung ob Teilnehmer noch verwendet wird)
            (id) => {
                const pid = Number(id);

                // Prüfen, ob pid in irgendeinem Event in participantIds vorkommt
                const used = this.eventModel.events.some((ev) => {
                    const arr = Array.isArray(ev.participantIds)
                        ? ev.participantIds
                        : [];
                    return arr.map(Number).includes(pid);
                });

                if (used) {
                    alert(
                        "Dieser Teilnehmer kann nicht gelöscht werden,\n" +
                        "weil er in einem Event verwendet wird."
                    );
                    return;
                }

                const ok = confirm("Teilnehmer wirklich löschen?");
                if (ok) this.participantModel.deleteParticipant(pid);
            }
        );
    }

    // ------------------------------------------------------------
    // TAGS
    // ------------------------------------------------------------
    if (this.activePage === "tags") {

        renderTagView(content, {
            tags: this.tagModel.getAll()
        });

        bindTagView(
            content,

            // Hinzufügen
            (data) => this.tagModel.addTag(data),

            // Löschen (mit Prüfung ob Tag noch verwendet wird)
            (id) => {
                const tid = Number(id);

                // Prüfen, ob tid in irgendeinem Event in tagIds vorkommt
                const used = this.eventModel.events.some((ev) => {
                    const arr = Array.isArray(ev.tagIds)
                        ? ev.tagIds
                        : [];
                    return arr.map(Number).includes(tid);
                });

                if (used) {
                    alert(
                        "Dieser Tag kann nicht gelöscht werden,\n" +
                        "weil er in einem Event verwendet wird."
                    );
                    return;
                }

                const ok = confirm("Tag wirklich löschen?");
                if (ok) this.tagModel.deleteTag(tid);
            }
        );
    }
};