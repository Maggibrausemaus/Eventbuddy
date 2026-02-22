// --------------------------------------------------------------------
// bannerView.js
// Hinweisleiste für kurze Meldungen
// - Web Component + ShadowRoot
// - lädt globales CSS in den ShadowRoot (damit SCSS/CSS wirkt)
// --------------------------------------------------------------------

function clearContainer(container) {
    while (container.firstChild) container.removeChild(container.firstChild);
}

export class BannerView extends HTMLElement {
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

        this.text = "";
    }

    setText(text) {
        this.text = String(text || "");
        this.render();
    }

    render() {
        clearContainer(this.root);

        if (!this.text || this.text.trim().length === 0) return;

        const wrap = document.createElement("div");
        wrap.className = "banner";

        const p = document.createElement("p");
        p.textContent = this.text;

        wrap.appendChild(p);
        this.root.appendChild(wrap);
    }
}

if (!customElements.get("banner-view")) {
    customElements.define("banner-view", BannerView);
}

export function renderBannerView(container, text) {
    clearContainer(container);

    const el = document.createElement("banner-view");
    container.appendChild(el);

    el.setText(text);
}