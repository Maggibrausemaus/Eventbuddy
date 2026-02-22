// --------------------------------------------------------------------
// main.js
//
// Einstiegspunkt der App:
// - Models erstellen
// - Controller erstellen
// - JSON-Daten laden
// --------------------------------------------------------------------

import { EventModel } from "./model/eventModel.js";
import { ParticipantModel } from "./model/participantModel.js";
import { TagModel } from "./model/tagModel.js";
import { Controller } from "./controller.js";

const eventModel = new EventModel();
const participantModel = new ParticipantModel();
const tagModel = new TagModel();

new Controller(eventModel, participantModel, tagModel);

// Daten laden
eventModel.load();
participantModel.load();
tagModel.load();