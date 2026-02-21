// --------------------------------------------------------------------
// bannerView.js
//
// Diese View zeigt kurze Hinweis- oder Fehlermeldungen an.
// Beispiele:
// - "Event erstellt."
// - "Fehler beim Laden."
// --------------------------------------------------------------------

// Hilfsfunktion:
// Entfernt alle vorhandenen Elemente aus dem Container.
// So wird vor jeder neuen Meldung alles geleert.
function clearContainer(container) {
    while (container.firstChild)
        container.removeChild(container.firstChild);
}

// Rendert eine Banner-Meldung in den angegebenen Container.
// container = DOM-Element (z.B. div#banner)
// text = Meldungstext
export function renderBannerView(container, text) {
    // Erst alten Inhalt entfernen
    clearContainer(container);

    // Wenn kein Text vorhanden ist → nichts anzeigen
    if (!text) return;

    // Wrapper-Div für Styling
    const wrap = document.createElement("div");
    wrap.className = "banner";

    // Text-Element erzeugen
    const p = document.createElement("p");
    p.textContent = String(text || "");

    wrap.appendChild(p);

    // Banner in den Container einfügen
    container.appendChild(wrap);
}