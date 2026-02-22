// --------------------------------------------------------------------
// participantView.js
// Seite "Teilnehmer":
// - Formular: Teilnehmer hinzufügen (Name* + Email*)
// - Liste: alle Teilnehmer anzeigen
// - Aktion: Teilnehmer löschen
//
// Web Component + ShadowRoot
// - lädt globales CSS in den ShadowRoot (damit SCSS/CSS wirkt)
// --------------------------------------------------------------------

function clearContainer(container) {
    while (container.firstChild) container.removeChild(container.firstChild);
}

// ------------------------------------------------------------
// <participant-view> Web Component
// ------------------------------------------------------------
export class ParticipantView extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({ mode: "open" });

        // Globales CSS im Shadow DOM verfügbar machen
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "./styles/main.css";
        this.shadowRoot.appendChild(link);

        this.root = document.createElement("div");
        this.shadowRoot.appendChild(this.root);

        this._data = { participants: [] };
    }

    setData(data) {
        this._data = data || this._data;
        this.render();
    }

    render() {
        clearContainer(this.root);

        const participants = (this._data && this._data.participants)
            ? this._data.participants
            : [];

        const page = document.createElement("div");
        page.className = "participants-page";

        const card = document.createElement("div");
        card.className = "card";

        const h = document.createElement("h3");
        h.textContent = "Teilnehmer";
        card.appendChild(h);

        // -----------------------------
        // Formular
        // -----------------------------
        const form = document.createElement("form");
        form.id = "participantForm";

        // Name *
        const labelName = document.createElement("label");

        const nameText = document.createElement("span");
        nameText.textContent = "Name";
        labelName.appendChild(nameText);

        const starName = document.createElement("span");
        starName.textContent = " *";
        starName.className = "required-star";
        labelName.appendChild(starName);

        const inputName = document.createElement("input");
        inputName.type = "text";
        inputName.id = "participantName";
        inputName.required = true;
        labelName.appendChild(inputName);

        form.appendChild(labelName);

        // Email *
        const labelEmail = document.createElement("label");

        const emailText = document.createElement("span");
        emailText.textContent = "Email";
        labelEmail.appendChild(emailText);

        const starEmail = document.createElement("span");
        starEmail.textContent = " *";
        starEmail.className = "required-star";
        labelEmail.appendChild(starEmail);

        const inputEmail = document.createElement("input");
        inputEmail.type = "email";
        inputEmail.id = "participantEmail";
        inputEmail.required = true;
        labelEmail.appendChild(inputEmail);

        form.appendChild(labelEmail);

        const btn = document.createElement("button");
        btn.type = "submit";
        btn.textContent = "Teilnehmer hinzufügen";
        form.appendChild(btn);

        // Submit -> nach außen melden
        form.addEventListener("submit", (e) => {
            e.preventDefault();

            const payload = {
                name: String(inputName.value || "").trim(),
                email: String(inputEmail.value || "").trim()
            };

            this.dispatchEvent(
                new CustomEvent("add-participant", {
                    detail: payload,
                    bubbles: true,
                    composed: true
                })
            );

            inputName.value = "";
            inputEmail.value = "";
        });

        card.appendChild(form);

        // -----------------------------
        // Liste
        // -----------------------------
        const ul = document.createElement("ul");
        ul.className = "participant-list";

        if (participants.length === 0) {
            const li = document.createElement("li");
            li.textContent = "Keine Teilnehmer vorhanden.";
            ul.appendChild(li);
        } else {
            for (let i = 0; i < participants.length; i++) {
                const p = participants[i];

                const li = document.createElement("li");
                li.setAttribute("data-participant-id", p.id);

                const info = document.createElement("div");
                info.className = "participant-info";

                const name = document.createElement("strong");
                name.textContent = String(p.name || "");
                info.appendChild(name);

                const email = document.createElement("small");
                email.textContent = String(p.email || "");
                info.appendChild(document.createElement("br"));
                info.appendChild(email);

                li.appendChild(info);

                const del = document.createElement("button");
                del.type = "button";
                del.textContent = "Löschen";
                del.className = "btn-participant-delete";

                del.addEventListener("click", () => {
                    this.dispatchEvent(
                        new CustomEvent("delete-participant", {
                            detail: { id: p.id },
                            bubbles: true,
                            composed: true
                        })
                    );
                });

                li.appendChild(del);
                ul.appendChild(li);
            }
        }

        card.appendChild(ul);
        page.appendChild(card);
        this.root.appendChild(page);
    }
}

if (!customElements.get("participant-view")) {
    customElements.define("participant-view", ParticipantView);
}

// ------------------------------------------------------------
// Helfer-Funktionen: wie bisher im Controller verwendbar
// ------------------------------------------------------------
export function renderParticipantView(container, data) {
    clearContainer(container);

    const el = document.createElement("participant-view");
    container.appendChild(el);

    el.setData(data);
}

export function bindParticipantView(container, onAddParticipant, onDeleteParticipant) {
    const el = container.querySelector("participant-view");
    if (!el) return;

    el.addEventListener("add-participant", (e) => {
        if (onAddParticipant) onAddParticipant(e.detail);
    });

    el.addEventListener("delete-participant", (e) => {
        const id = e.detail ? e.detail.id : null;
        if (onDeleteParticipant) onDeleteParticipant(id);
    });
}