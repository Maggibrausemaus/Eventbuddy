// --------------------------------------------------------------------
// tagView.js
//
// View für die Seite "Tags":
// - Formular zum Anlegen eines neuen Tags (Pflichtfeld)
// - Liste aller Tags
// - Löschen eines Tags über Button
// --------------------------------------------------------------------

function clearContainer(container) {
    while (container.firstChild)
        container.removeChild(container.firstChild);
}

export function renderTagView(container, data) {
    clearContainer(container);

    const tags = data.tags || [];

    const page = document.createElement("div");
    page.className = "tags-page";

    const card = document.createElement("div");
    card.className = "card";

    const h = document.createElement("h3");
    h.textContent = "Tags";
    card.appendChild(h);

    // -----------------------------
    // Formular: Neues Tag
    // -----------------------------
    const form = document.createElement("form");
    form.id = "tagForm";

    const label = document.createElement("label");

    const txt = document.createElement("span");
    txt.textContent = "Neues Tag";
    label.appendChild(txt);

    const star = document.createElement("span");
    star.textContent = " *";
    star.className = "required-star";
    label.appendChild(star);

    const input = document.createElement("input");
    input.type = "text";
    input.id = "tagLabel";
    input.required = true; // Browser prüft leeres Feld

    label.appendChild(input);
    form.appendChild(label);

    const btn = document.createElement("button");
    btn.type = "submit";
    btn.textContent = "Tag hinzufügen";
    form.appendChild(btn);

    card.appendChild(form);

    // -----------------------------
    // Liste der Tags
    // -----------------------------
    const ul = document.createElement("ul");
    ul.className = "tag-list";

    if (tags.length === 0) {
        const li = document.createElement("li");
        li.textContent = "Keine Tags vorhanden.";
        ul.appendChild(li);
    } else {
        for (let i = 0; i < tags.length; i++) {
            const t = tags[i];

            const li = document.createElement("li");

            // Wichtig für Delete-Logik
            li.setAttribute("data-tag-id", t.id);

            const span = document.createElement("span");
            span.textContent = String(t.label || "");
            li.appendChild(span);

            const del = document.createElement("button");
            del.type = "button"; // verhindert Formular-Submit
            del.textContent = "Löschen";
            del.className = "btn-tag-delete";
            li.appendChild(del);

            ul.appendChild(li);
        }
    }

    card.appendChild(ul);
    page.appendChild(card);
    container.appendChild(page);
}

// --------------------------------------------------------------------
// bindTagView(container, onAddTag, onDeleteTag)
//
// Verbindet:
// - Formular-Submit → neues Tag anlegen
// - Klick auf Löschen → Tag-ID weitergeben
// --------------------------------------------------------------------
export function bindTagView(container, onAddTag, onDeleteTag) {

    const form = container.querySelector("#tagForm");
    const input = container.querySelector("#tagLabel");

    // -----------------------------
    // Formular-Submit
    // -----------------------------
    if (form) {
        form.addEventListener("submit", (e) => {

            // Verhindert Seiten-Reload
            e.preventDefault();

            // Eingabewert lesen und trimmen
            const payload = {
                label: input
                    ? String(input.value || "").trim()
                    : ""
            };

            // Neues Tag nach außen weitergeben
            if (onAddTag) onAddTag(payload);

            // Eingabefeld leeren
            if (input) input.value = "";
        });
    }

    // -----------------------------
    // Delete-Buttons
    // -----------------------------
    const deleteButtons = container.querySelectorAll(".btn-tag-delete");

    for (let i = 0; i < deleteButtons.length; i++) {

        deleteButtons[i].addEventListener("click", () => {

            // Sucht das nächste übergeordnete Element mit data-tag-id
            const li = deleteButtons[i].closest("[data-tag-id]");
            if (!li) return;

            // ID aus data-Attribut lesen
            const id = li.getAttribute("data-tag-id");

            // ID nach außen weitergeben
            if (onDeleteTag) onDeleteTag(id);
        });
    }
}