// --------------------------------------------------------------------
// tagView.js
// Seite "Tags":
// - Formular: neues Tag anlegen (Pflichtfeld *)
// - Liste: alle Tags anzeigen
// - Aktion: Tag löschen
//
// Web Component + ShadowRoot
// - lädt globales CSS in den ShadowRoot (damit SCSS/CSS wirkt)
// --------------------------------------------------------------------

function clearContainer(container) {
    while (container.firstChild) container.removeChild(container.firstChild);
}

// ------------------------------------------------------------
// <tag-view> Web Component
// ------------------------------------------------------------
export class TagView extends HTMLElement {
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

        this._data = { tags: [] };
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
        // Formular
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

        // Submit -> nach außen melden
        form.addEventListener("submit", (e) => {
            e.preventDefault();

            const payload = {
                label: String(input.value || "").trim()
            };

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

                const span = document.createElement("span");
                span.textContent = String(t.label || "");
                li.appendChild(span);

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

                li.appendChild(del);
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
// Helfer-Funktionen: wie bisher im Controller verwendbar
// ------------------------------------------------------------
export function renderTagView(container, data) {
    clearContainer(container);

    const el = document.createElement("tag-view");
    container.appendChild(el);

    el.setData(data);
}

export function bindTagView(container, onAddTag, onDeleteTag) {
    const el = container.querySelector("tag-view");
    if (!el) return;

    el.addEventListener("add-tag", (e) => {
        if (onAddTag) onAddTag(e.detail);
    });

    el.addEventListener("delete-tag", (e) => {
        const id = e.detail ? e.detail.id : null;
        if (onDeleteTag) onDeleteTag(id);
    });
}