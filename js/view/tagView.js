// --------------------------------------------------------------------
// tagView.js
// Seite "Tags":
// - Formular: neues Tag anlegen (Pflichtfeld *)
// - Liste: alle Tags anzeigen
// - Aktionen: Tag bearbeiten / löschen
//
// Web Component + ShadowRoot
// - lädt globales CSS in den ShadowRoot
// --------------------------------------------------------------------

function clearContainer(container) {
    while (container.firstChild) container.removeChild(container.firstChild);
}

export class TagView extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({ mode: "open" });

        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "./styles/main.css";
        this.shadowRoot.appendChild(link);

        this.root = document.createElement("div");
        this.shadowRoot.appendChild(this.root);

        this._data = { tags: [] };

        // Merker: welches Tag gerade bearbeitet wird
        this._editingId = null;
    }

    setData(data) {
        this._data = data || this._data;
        this.render();
    }

    render() {
        clearContainer(this.root);

        const tags = (this._data && this._data.tags) ? this._data.tags : [];

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
        input.required = true;
        label.appendChild(input);

        form.appendChild(label);

        const btn = document.createElement("button");
        btn.type = "submit";
        btn.textContent = "Tag hinzufügen";
        form.appendChild(btn);

        form.addEventListener("submit", (e) => {
            e.preventDefault();

            const payload = { label: String(input.value || "").trim() };

            this.dispatchEvent(
                new CustomEvent("add-tag", {
                    detail: payload,
                    bubbles: true,
                    composed: true
                })
            );

            input.value = "";
        });

        card.appendChild(form);

        // -----------------------------
        // Liste
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
                li.setAttribute("data-tag-id", t.id);

                // Linke Seite: Anzeige ODER Edit-Input
                if (Number(this._editingId) === Number(t.id)) {
                    // Edit-Modus
                    const editWrap = document.createElement("div");
                    editWrap.className = "tag-edit";

                    const editInput = document.createElement("input");
                    editInput.type = "text";
                    editInput.value = String(t.label || "");
                    editInput.className = "tag-edit__input";
                    editWrap.appendChild(editInput);

                    li.appendChild(editWrap);

                    // Buttons: Speichern / Abbrechen / Löschen (optional)
                    const actions = document.createElement("div");
                    actions.className = "tag-actions";

                    const save = document.createElement("button");
                    save.type = "button";
                    save.textContent = "Speichern";
                    save.className = "btn-tag-save";

                    save.addEventListener("click", () => {
                        const newLabel = String(editInput.value || "").trim();

                        this.dispatchEvent(
                            new CustomEvent("update-tag", {
                                detail: { id: t.id, label: newLabel },
                                bubbles: true,
                                composed: true
                            })
                        );

                        this._editingId = null;
                        // UI wird ohnehin durch Model "changed" neu gerendert,
                        // aber fürs direkte Feedback rendern wir zusätzlich:
                        this.render();
                    });

                    const cancel = document.createElement("button");
                    cancel.type = "button";
                    cancel.textContent = "Abbrechen";
                    cancel.className = "btn-tag-cancel";

                    cancel.addEventListener("click", () => {
                        this._editingId = null;
                        this.render();
                    });

                    const del = document.createElement("button");
                    del.type = "button";
                    del.textContent = "Löschen";
                    del.className = "btn-tag-delete";

                    del.addEventListener("click", () => {
                        this.dispatchEvent(
                            new CustomEvent("delete-tag", {
                                detail: { id: t.id },
                                bubbles: true,
                                composed: true
                            })
                        );
                    });

                    actions.appendChild(save);
                    actions.appendChild(cancel);
                    actions.appendChild(del);

                    li.appendChild(actions);
                } else {
                    // Normal-Modus
                    const span = document.createElement("span");
                    span.textContent = String(t.label || "");
                    li.appendChild(span);

                    const actions = document.createElement("div");
                    actions.className = "tag-actions";

                    const edit = document.createElement("button");
                    edit.type = "button";
                    edit.textContent = "Bearbeiten";
                    edit.className = "btn-tag-edit";

                    edit.addEventListener("click", () => {
                        this._editingId = t.id;
                        this.render();
                    });

                    const del = document.createElement("button");
                    del.type = "button";
                    del.textContent = "Löschen";
                    del.className = "btn-tag-delete";

                    del.addEventListener("click", () => {
                        this.dispatchEvent(
                            new CustomEvent("delete-tag", {
                                detail: { id: t.id },
                                bubbles: true,
                                composed: true
                            })
                        );
                    });

                    actions.appendChild(edit);
                    actions.appendChild(del);

                    li.appendChild(actions);
                }

                ul.appendChild(li);
            }
        }

        card.appendChild(ul);
        page.appendChild(card);
        this.root.appendChild(page);
    }
}

if (!customElements.get("tag-view")) {
    customElements.define("tag-view", TagView);
}

// ------------------------------------------------------------
// Helfer-Funktionen wie bisher für den Controller
// ------------------------------------------------------------
export function renderTagView(container, data) {
    clearContainer(container);

    const el = document.createElement("tag-view");
    container.appendChild(el);

    el.setData(data);
}

export function bindTagView(container, onAddTag, onDeleteTag, onUpdateTag) {
    const el = container.querySelector("tag-view");
    if (!el) return;

    el.addEventListener("add-tag", (e) => {
        if (onAddTag) onAddTag(e.detail);
    });

    el.addEventListener("delete-tag", (e) => {
        const id = e.detail ? e.detail.id : null;
        if (onDeleteTag) onDeleteTag(id);
    });

    el.addEventListener("update-tag", (e) => {
        if (onUpdateTag) onUpdateTag(e.detail);
    });
}