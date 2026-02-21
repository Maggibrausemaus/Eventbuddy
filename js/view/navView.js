// --------------------------------------------------------------------
// navView.js
//
// Kleine View für die Navigation oben.
// Sie rendert Buttons für die Seiten und markiert die aktive Seite.
// Zusätzlich werden Click-Handler gebunden, damit der Controller
// die Navigation steuern kann.
// --------------------------------------------------------------------

export function renderNavView(container, activePage) {
    // Container leeren, damit die Navigation sauber neu gerendert wird
    while (container.firstChild)
        container.removeChild(container.firstChild);

    const nav = document.createElement("nav");
    nav.className = "nav";

    // Buttons erzeugen (activePage entscheidet, welcher aktiv aussieht)
    nav.appendChild(makeNavButton("Events", "events", activePage));
    nav.appendChild(makeNavButton("Event erstellen", "newEvent", activePage));
    nav.appendChild(makeNavButton("Teilnehmer", "participants", activePage));
    nav.appendChild(makeNavButton("Tags", "tags", activePage));

    container.appendChild(nav);
}

// --------------------------------------------------------------------
// bindNavView(container, onNavigate)
//
// Verknüpft alle Nav-Buttons mit einem Callback.
// Der Callback bekommt die Zielseite (data-nav) übergeben.
// --------------------------------------------------------------------
export function bindNavView(container, onNavigate) {
    const buttons = container.querySelectorAll("[data-nav]");

    for (let i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener("click", () => {
            const target = buttons[i].getAttribute("data-nav");
            if (onNavigate) onNavigate(target);
        });
    }
}

// Erzeugt einen einzelnen Nav-Button und markiert ihn ggf. als aktiv
function makeNavButton(text, navId, activePage) {
    const btn = document.createElement("button");

    // Wichtig bei Buttons in/nahe Forms: sonst könnte es submitten
    btn.type = "button";

    btn.textContent = text;

    // data-nav wird später in bindNavView ausgelesen
    btn.classList.add("nav__btn");
    btn.setAttribute("data-nav", navId);

    // Aktive Seite optisch markieren
    if (String(activePage) === String(navId)) {
        btn.classList.add("nav__btn--active");
    }

    return btn;
}