// --------------------------------------------------------------------
// controller.js
//
// Steuert die SPA
// - Navigation
// - Events (Liste/Detail/Filter, Bearbeiten, Löschen, Teilnehmer speichern)
// - Event erstellen / bearbeiten
// - Teilnehmer
// - Tags (Add/Delete + Bearbeiten über updateTag)
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

    this.activePage = "events";
    this.editEvent = null;
    this.bannerText = "";

    this._wire(this.eventModel);
    this._wire(this.participantModel);
    this._wire(this.tagModel);

    this.render();
}

// --------------------------------------------------------------------
// Model Listener (EventTarget-basiert)
// --------------------------------------------------------------------
Controller.prototype._wire = function (model) {
    model.addEventListener("loaded", () => this.render());
    model.addEventListener("changed", () => this.render());
    model.addEventListener("banner", (e) => {
        this.bannerText = e.detail || "";
        this.render();
    });
};

// --------------------------------------------------------------------
// Render
// --------------------------------------------------------------------
Controller.prototype.render = function () {

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

    // Navigation
    renderNavView(navArea, this.activePage);
    bindNavView(navArea, (pageId) => {
        this.activePage = pageId;
        this.editEvent = null;
        this.bannerText = "";
        this.render();
    });

    // Banner
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

            // Filter
            (filters) => this.eventModel.setFilters(filters),

            // Select
            (id) => this.eventModel.selectEvent(id),

            // Edit
            (id) => {
                this.editEvent = this.eventModel.getSelectedEvent();
                this.activePage = "newEvent";
                this.render();
            },

            // Delete
            (id) => {
                const ok = confirm("Event wirklich löschen?");
                if (ok) this.eventModel.deleteEvent(id);
            },

            // Teilnehmer speichern
            (eventId, participantIds) => {
                this.eventModel.updateParticipants(eventId, participantIds);
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

            // Submit
            (formData) => {
                if (formData.id) {
                    this.eventModel.updateEvent(formData);
                } else {
                    this.eventModel.addEvent(formData);
                }

                this.editEvent = null;
                this.activePage = "events";
                this.render();
            },

            // Cancel Edit
            () => {
                this.editEvent = null;
                this.activePage = "events";
                this.render();
            }
        );

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

            // Add
            (data) => this.participantModel.addParticipant(data),

            // Delete (nur wenn nicht verwendet)
            (id) => {
                const pid = Number(id);

                const used = this.eventModel.events.some((ev) => {
                    const arr = Array.isArray(ev.participantIds) ? ev.participantIds : [];
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

            // Add
            (data) => this.tagModel.addTag(data),

            // Delete (nur wenn nicht verwendet)
            (id) => {
                const tid = Number(id);

                const used = this.eventModel.events.some((ev) => {
                    const arr = Array.isArray(ev.tagIds) ? ev.tagIds : [];
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
            },

            // Update (NEU)
            (data) => {
                // data = { id, label }
                this.tagModel.updateTag(data);
            }
        );
    }
};