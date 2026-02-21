// --------------------------------------------------------------------
// participantView.js
//
// View für die Seite "Teilnehmer":
// - Formular zum Hinzufügen (Name + Email Pflichtfelder)
// - Liste aller Teilnehmer
// - Löschen eines Teilnehmers über Button
// --------------------------------------------------------------------

function clearContainer(container) {
    while (container.firstChild)
        container.removeChild(container.firstChild);
}

export function renderParticipantView(container, data) {
    clearContainer(container);

    const participants = data.participants || [];

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
    inputName.required = true; // Browser-Validierung

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
    inputEmail.type = "email"; // Browser prüft grob das Format
    inputEmail.id = "participantEmail";
    inputEmail.required = true;

    labelEmail.appendChild(inputEmail);
    form.appendChild(labelEmail);

    const btn = document.createElement("button");
    btn.type = "submit";
    btn.textContent = "Teilnehmer hinzufügen";
    form.appendChild(btn);

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

            // Wichtig für Delete-Logik
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
            del.type = "button"; // verhindert Submit
            del.textContent = "Löschen";
            del.className = "btn-participant-delete";
            li.appendChild(del);

            ul.appendChild(li);
        }
    }

    card.appendChild(ul);
    page.appendChild(card);
    container.appendChild(page);
}

export function bindParticipantView(
    container,
    onAddParticipant,
    onDeleteParticipant
) {
    const form = container.querySelector("#participantForm");
    const inputName = container.querySelector("#participantName");
    const inputEmail = container.querySelector("#participantEmail");

    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault(); // Seite nicht neu laden

            const payload = {
                name: inputName ? String(inputName.value || "").trim() : "",
                email: inputEmail ? String(inputEmail.value || "").trim() : ""
            };

            if (onAddParticipant) onAddParticipant(payload);

            // Formular nach Submit leeren
            if (inputName) inputName.value = "";
            if (inputEmail) inputEmail.value = "";
        });
    }

    const deleteButtons = container.querySelectorAll(".btn-participant-delete");

    for (let i = 0; i < deleteButtons.length; i++) {
        deleteButtons[i].addEventListener("click", () => {
            // Sucht das nächste Element mit data-participant-id
            const li = deleteButtons[i].closest("[data-participant-id]");
            if (!li) return;

            const id = li.getAttribute("data-participant-id");
            if (onDeleteParticipant) onDeleteParticipant(id);
        });
    }
}