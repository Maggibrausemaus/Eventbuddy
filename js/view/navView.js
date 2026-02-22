// --------------------------------------------------------------------
// navView.js
// Navigation (Buttons)
// - Web Component + ShadowRoot
// - lädt globales CSS in den ShadowRoot
// --------------------------------------------------------------------

function clearContainer(container) {
    while (container.firstChild) container.removeChild(container.firstChild);
}

export class NavView extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({ mode: "open" });

        // Globales CSS im Shadow DOM verfügbar machen
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "./styles/main.css";
        this.shadowRoot.appendChild(link);

        this.activePage = "events";

        this.root = document.createElement("div");
        this.shadowRoot.appendChild(this.root);
    }

    setActive(pageId) {
        this.activePage = String(pageId || "events");
        this.render();
    }

    render() {
        // innerHTML ist hier praktisch (wie im Unterricht)
        this.root.innerHTML = `
            <nav class="nav">
                <button type="button" class="nav__btn" data-nav="events">Events</button>
                <button type="button" class="nav__btn" data-nav="newEvent">Event erstellen</button>
                <button type="button" class="nav__btn" data-nav="participants">Teilnehmer</button>
                <button type="button" class="nav__btn" data-nav="tags">Tags</button>
            </nav>
        `;

        const buttons = this.root.querySelectorAll("[data-nav]");

        for (let i = 0; i < buttons.length; i++) {
            const id = buttons[i].getAttribute("data-nav");

            if (String(id) === String(this.activePage)) {
                buttons[i].classList.add("nav__btn--active");
            } else {
                buttons[i].classList.remove("nav__btn--active");
            }

            buttons[i].addEventListener("click", () => {
                const target = buttons[i].getAttribute("data-nav");

                this.dispatchEvent(
                    new CustomEvent("navigate", {
                        detail: { pageId: target },
                        bubbles: true,
                        composed: true
                    })
                );
            });
        }
    }
}

if (!customElements.get("nav-view")) {
    customElements.define("nav-view", NavView);
}

export function renderNavView(container, activePage) {
    clearContainer(container);

    const el = document.createElement("nav-view");
    container.appendChild(el);

    el.setActive(activePage);
}

export function bindNavView(container, onNavigate) {
    const el = container.querySelector("nav-view");
    if (!el) return;

    el.addEventListener("navigate", (e) => {
        const pageId = e.detail ? e.detail.pageId : null;
        if (onNavigate) onNavigate(pageId);
    });
}