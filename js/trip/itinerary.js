import { getSavedTrip, saveTrip } from "./storage.js";

// Prépare l'itinéraire sans remplacer une planification existante
export function initializeItinerary() {
    const trip = getSavedTrip();

    if (!trip || Array.isArray(trip.days)) {
        return;
    }

    trip.days = [];

    // Sans les deux dates, les journées seront ajoutées manuellement
    if (trip.departureDate && trip.returnDate) {
        // Utilise UTC pour éviter les décalages liés aux changements d'heure
        const departure = new Date(trip.departureDate + "T00:00:00Z");
        const returnDate = new Date(trip.returnDate + "T00:00:00Z");

        for (
            const date = new Date(departure);
            date <= returnDate;
            date.setUTCDate(date.getUTCDate() + 1)
        ) {
            trip.days.push({
                id: crypto.randomUUID(),
                date: date.toISOString().slice(0, 10),
                items: [] // Étapes qui seront planifiées dans cette journée
            });
        }
    }

    saveTrip(trip);
}

// Conserve la sélection lorsqu'on quitte puis rouvre l'onglet
let selectedDayId = null;
let itineraryEventsInitialized = false;
// Identifie l'étape dont on modifie l'horaire
let scheduledDayId = null;
let scheduledEntryId = null;

export function displayItineraryDays() {
    // Branche les événements une seule fois
    if (!itineraryEventsInitialized) {

        enableDailyDrop(document.getElementById("itinerary-day-items"));
        
        document.getElementById("previous-day").addEventListener(
            "click",
            function () {
                changeDay(-1);
            }
        );

        document.getElementById("next-day").addEventListener(
            "click",
            function () {
                changeDay(1);
            }
        );

        document.getElementById("itinerary-day-select").addEventListener(
            "change",
            function (event) {
                selectedDayId = event.target.value;
                renderItinerary();
            }
        );

        document.getElementById("itinerary-view").addEventListener(
            "change",
            renderItinerary
        );

        document.getElementById("add-itinerary-day").addEventListener(
            "click",
            function () {
                const trip = getSavedTrip();

                // Les voyages datés utilisent leurs journées automatiques
                if (!trip || (trip.departureDate && trip.returnDate)) {
                    return;
                }

                if (!Array.isArray(trip.days)) {
                    trip.days = [];
                }

                const day = {
                    id: crypto.randomUUID(),
                    date: null,
                    items: []
                };

                trip.days.push(day);
                saveTrip(trip);

                selectedDayId = day.id;
                renderItinerary();
            }
        );

            document.getElementById("schedule-cancel").addEventListener(
        "click",
        function () {
            document.getElementById("schedule-dialog").close();
        }
    );

    // Oublie l'étape sélectionnée après la fermeture
    document.getElementById("schedule-dialog").addEventListener(
        "close",
        function () {
            scheduledDayId = null;
            scheduledEntryId = null;
        }
    );

    // Empêche l'envoi classique du formulaire pendant cette étape
    document.getElementById("schedule-form").addEventListener(
        "submit",
        function (event) {
            event.preventDefault();

            const startInput = document.getElementById("schedule-start");
            const durationInput = document.getElementById("schedule-duration");
            const error = document.getElementById("schedule-error");

            const startTime = startInput.value;
            const durationText = durationInput.value.trim();
            const duration = durationText === "" ? null : Number(durationText);

            // Vérifie les champs tout en permettant de les laisser vides
            if (
                !startInput.validity.valid ||
                !durationInput.validity.valid ||
                (duration !== null &&
                    (!Number.isInteger(duration) || duration <= 0))
            ) {
                error.textContent =
                    "Entre une heure valide et une durée entière supérieure à zéro, ou laisse les champs vides.";
                error.hidden = false;
                return;
            }

            const trip = getSavedTrip();
            const day = trip?.days?.find(day => day.id === scheduledDayId);
            const entry = day?.items?.find(item => item.id === scheduledEntryId);

            if (!entry) {
                error.textContent = "Cette étape n'existe plus. Ferme la fenêtre.";
                error.hidden = false;
                return;
            }

            // Enregistre uniquement l'horaire de cette étape
            entry.startTime = startTime || null;
            entry.durationMinutes = duration;

            saveTrip(trip);
            document.getElementById("schedule-dialog").close();
            renderItinerary();
        }
    );

    const deleteDialog = document.getElementById("delete-activity-dialog");

    // Ouvre notre fenêtre à la place de la confirmation du navigateur
    document.getElementById("schedule-remove").addEventListener(
        "click",
        function () {
            deleteDialog.showModal();

            // Sélectionne Annuler par défaut pour éviter un clic accidentel
            document.getElementById("cancel-delete-activity").focus();
        }
    );

    // Ferme la confirmation et conserve la fenêtre Horaire
    document.getElementById("cancel-delete-activity").addEventListener(
        "click",
        function () {
            deleteDialog.close();
        }
    );

    // Supprime l'activité uniquement après confirmation
    document.getElementById("confirm-delete-activity").addEventListener(
        "click",
        function () {
            const trip = getSavedTrip();
            const day = trip?.days?.find(
                day => day.id === scheduledDayId
            );
            const entry = day?.items?.find(
                item => item.id === scheduledEntryId
            );

            if (!entry) {
                deleteDialog.close();
                return;
            }

            const activityId = entry.activityId;

            // Retire l'activité des idées
            trip.activities = (trip.activities || []).filter(
                activity => activity.id !== activityId
            );

            // Retire toutes ses occurrences dans le programme
            for (const tripDay of trip.days || []) {
                tripDay.items = (tripDay.items || []).filter(
                    item => item.activityId !== activityId
                );
            }

            saveTrip(trip);

            deleteDialog.close();
            document.getElementById("schedule-dialog").close();

            // Retient la vue à rouvrir après l'actualisation
            sessionStorage.setItem(
                "reopen-itinerary",
                document.getElementById("itinerary-view").value
            );

            window.location.reload();
        }
    );


        itineraryEventsInitialized = true;
    }

    renderItinerary();
}

// Déplace la sélection sans dépasser les limites du voyage
function changeDay(direction) {
    const days = getSavedTrip()?.days || [];
    const index = days.findIndex(day => day.id === selectedDayId);
    const nextDay = days[index + direction];

    if (nextDay) {
        selectedDayId = nextDay.id;
        renderItinerary();
    }
}

// Prépare un libellé commun aux deux vues
function getDayLabel(day, index) {
    let label = "Jour " + (index + 1);

    if (day.date) {
        label += " — " + new Date(
            day.date + "T00:00:00Z"
        ).toLocaleDateString("fr-CA", {
            timeZone: "UTC",
            day: "numeric",
            month: "long"
        });
    }

    return label;
}

// Actualise la navigation et les deux modes d'affichage
function renderItinerary() {
    const trip = getSavedTrip();
    const days = trip?.days || [];

    const selector = document.getElementById("itinerary-day-select");
    const title = document.getElementById("itinerary-day-title");
    const itemsList = document.getElementById("itinerary-day-items");
    const fullView = document.getElementById("itinerary-full-view");
    const view = document.getElementById("itinerary-view");

    let index = days.findIndex(day => day.id === selectedDayId);

    if (index < 0 && days.length > 0) {
        index = 0;
        selectedDayId = days[0].id;
    }

    selector.replaceChildren();

    // Remplit le petit sélecteur plutôt qu'une barre de boutons
    days.forEach(function (day, dayIndex) {
        const option = document.createElement("option");
        option.value = day.id;
        option.textContent = getDayLabel(day, dayIndex);
        selector.appendChild(option);
    });

    selector.disabled = days.length === 0;

    if (index >= 0) {
        selector.value = selectedDayId;
    }

    document.getElementById("previous-day").disabled = index <= 0;
    document.getElementById("next-day").disabled =
        index < 0 || index >= days.length - 1;

    document.getElementById("add-itinerary-day").hidden =
        !trip || Boolean(trip.departureDate && trip.returnDate);

    // Affiche la journée sélectionnée
    title.textContent = index >= 0
        ? getDayLabel(days[index], index)
        : "Aucune journée pour le moment.";

    itemsList.replaceChildren();

    if (index >= 0) {
        const entries = days[index].items || [];

        if (entries.length === 0) {
            const message = document.createElement("li");
            message.textContent = "Aucune activité planifiée.";
            itemsList.appendChild(message);
        }

        for (const entry of entries) {
            const activity = trip.activities.find(
                activity => activity.id === entry.activityId
            );

            const item = document.createElement("li");
            // Identifie l'étape et permet de la déplacer dans la journée
            item.dataset.entryId = entry.id;
            item.draggable = true;

            item.addEventListener("dragstart", function (event) {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("application/json", JSON.stringify({
                    dayId: days[index].id,
                    entryId: entry.id
                }));
            });
            const label = document.createElement("span");

            // Affiche l'heure et la durée lorsqu'elles sont connues
            const timeText = entry.startTime || "Sans heure";
            const durationText = entry.durationMinutes
                ? " · " + entry.durationMinutes + " min"
                : "";

            label.textContent = activity
                ? activity.name + " — " + timeText + durationText
                : "Activité supprimée des idées";

            // Retire uniquement cette étape du programme
            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.textContent = "Retirer";
            removeButton.classList.add("danger-button");

            // Conserve les identifiants de la journée et de l'étape concernées
            const dayId = days[index].id;
            const entryId = entry.id;

            removeButton.addEventListener("click", function () {
                const currentTrip = getSavedTrip();
                const day = currentTrip?.days?.find(day => day.id === dayId);

                if (!day) {
                    return;
                }

                day.items = day.items.filter(item => item.id !== entryId);

                saveTrip(currentTrip);
                renderItinerary();
            });

            // Permet de modifier l'horaire de cette étape
            const scheduleButton = document.createElement("button");
            scheduleButton.type = "button";
            scheduleButton.textContent = "Horaire";
            scheduleButton.classList.add("secondary-button");

            scheduleButton.addEventListener("click", function () {
                openScheduleDialog(dayId, entryId);
            });

            item.append(label, scheduleButton, removeButton);
            itemsList.appendChild(item);
        }
    }

    // Actualise les choix selon la journée sélectionnée
    renderAvailableActivities(trip);

    // Reconstruit le calendrier avec un positionnement à la minute
    renderTripCalendar(trip, fullView, view);

    // Bascule entre la journée détaillée et le résumé du voyage
    const showAll = view.value === "all";
    document.getElementById("itinerary-daily-view").hidden = showAll;
    fullView.hidden = !showAll;

    // Réserve toute la largeur au calendrier dans la vue complète
    const activitiesColumn =
        document.getElementById("itinerary-activities").parentElement;

    activitiesColumn.hidden = showAll;

    document.querySelector(".itinerary-layout")
        .classList.toggle("calendar-mode", showAll);
}

// Affiche les activités et permet de les planifier dans la journée choisie
function renderAvailableActivities(trip) {
    const list = document.getElementById("itinerary-activities");
    list.replaceChildren();

    const selectedDay = trip?.days?.find(day => day.id === selectedDayId);

    for (const activity of trip?.activities || []) {
        const item = document.createElement("li");
        const name = document.createElement("span");
        const button = document.createElement("button");

        name.textContent = activity.name;
        button.type = "button";

        // Empêche d'ajouter deux fois la même activité à cette journée
        const alreadyPlanned = selectedDay?.items?.some(
            entry => entry.activityId === activity.id
        );

        button.textContent = alreadyPlanned ? "✓ Ajoutée" : "+ Ajouter";
        button.disabled = !selectedDay || Boolean(alreadyPlanned);

        // Une activité déjà présente ne peut pas être ajoutée deux fois
        item.draggable = Boolean(selectedDay) && !alreadyPlanned;

        item.addEventListener("dragstart", function (event) {
            event.dataTransfer.effectAllowed = "copy";
            event.dataTransfer.setData("application/json", JSON.stringify({
                activityId: activity.id
            }));
        });

        button.addEventListener("click", function () {
            // Relit les données pour conserver les dernières modifications
            const currentTrip = getSavedTrip();
            const day = currentTrip?.days?.find(
                day => day.id === selectedDayId
            );

            if (!day || !currentTrip.activities.some(
                currentActivity => currentActivity.id === activity.id
            )) {
                return;
            }

            if (!Array.isArray(day.items)) {
                day.items = [];
            }

            if (day.items.some(entry => entry.activityId === activity.id)) {
                return;
            }

            // Référence l'activité sans recopier son nom ou son emplacement
            day.items.push({
                id: crypto.randomUUID(),
                activityId: activity.id,
                startTime: null,
                durationMinutes: null
            });

            saveTrip(currentTrip);
            renderItinerary();
        });

        item.append(name, button);
        list.appendChild(item);
    }
}

// Ouvre la fenêtre avec l'horaire de l'étape sélectionnée
function openScheduleDialog(dayId, entryId) {
    const trip = getSavedTrip();

    const day = trip?.days?.find(day => day.id === dayId);
    const entry = day?.items?.find(item => item.id === entryId);

    if (!entry) {
        return;
    }

    // Retient l'étape pour l'enregistrement à venir
    scheduledDayId = dayId;
    scheduledEntryId = entryId;

    // Préremplit les valeurs déjà enregistrées
    document.getElementById("schedule-start").value =
        entry.startTime || "";

    document.getElementById("schedule-duration").value =
        entry.durationMinutes ?? "";

    const error = document.getElementById("schedule-error");
    error.hidden = true;
    error.textContent = "";

    document.getElementById("schedule-dialog").showModal();
}

// Affiche les étapes à leur heure exacte, avec une hauteur proportionnelle
function renderTripCalendar(trip, container, view) {
    container.replaceChildren();

    const days = trip?.days || [];

    if (!days.length) {
        container.textContent = "Ajoute une journée pour commencer.";
        return;
    }

    const calendar = document.createElement("div");
    calendar.className = "precise-calendar";
    calendar.style.gridTemplateColumns =
        `64px repeat(${days.length}, minmax(180px, 1fr))`;

    function addCell(className, text = "") {
        const cell = document.createElement("div");
        cell.className = className;
        cell.textContent = text;
        calendar.appendChild(cell);
        return cell;
    }

    // En-têtes
    addCell("precise-corner");

    days.forEach(function (day, index) {
        const header = addCell("precise-header");
        const button = document.createElement("button");

        button.type = "button";
        button.className = "secondary-button";
        button.textContent = getDayLabel(day, index);

        button.addEventListener("click", function () {
            selectedDayId = day.id;
            view.value = "day";
            renderItinerary();
        });

        header.appendChild(button);
    });

    // Crée une carte cliquable sans insérer de texte utilisateur en HTML
    function createCard(day, entry) {
        const activity = trip.activities.find(
            activity => activity.id === entry.activityId
        );

        const button = document.createElement("button");
        button.type = "button";
        button.className = "precise-event";

        const time = entry.startTime || "Sans heure";
        const duration = entry.durationMinutes
            ? entry.durationMinutes + " min"
            : "Durée à préciser";

        button.textContent =
            time + " · " + duration + " — " +
            (activity?.name || "Activité supprimée des idées");

        button.title = button.textContent;

        button.addEventListener("click", function () {
            openScheduleDialog(day.id, entry.id);
        });

        // Permet de déplacer cette étape dans le calendrier
        button.draggable = true;

        button.addEventListener("dragstart", function (event) {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData(
                "application/json",
                JSON.stringify({
                    dayId: day.id,
                    entryId: entry.id
                })
            );
        });

        return button;
    }

    // Ligne des activités sans heure
    addCell("precise-unscheduled-label", "Sans heure");

    for (const day of days) {
        const cell = addCell("precise-unscheduled");

        enableCalendarDrop(cell, day.id, false);

        for (const entry of day.items || []) {
            if (!entry.startTime) {
                cell.appendChild(createCard(day, entry));
            }
        }
    }

    // Échelle commune : 1 minute correspond à 1 pixel
    const timeColumn = addCell("precise-time-column");

    for (let hour = 0; hour < 24; hour++) {
        const label = document.createElement("span");
        label.className = "precise-hour";
        label.style.top = hour * 60 + "px";
        label.textContent = String(hour).padStart(2, "0") + ":00";
        timeColumn.appendChild(label);
    }

    for (const day of days) {
        const column = addCell("precise-day-column");

            enableCalendarDrop(column, day.id, true);


        // Répartit les étapes qui se chevauchent dans des couloirs
        const entries = (day.items || [])
            .filter(entry => entry.startTime)
            .map(function (entry) {
                const [hours, minutes] = entry.startTime.split(":").map(Number);
                const start = hours * 60 + minutes;

                // Sans durée, utilise 30 minutes uniquement pour l'affichage
                const duration = entry.durationMinutes || 30;
                const end = Math.min(1440, start + duration);

                return { entry, start, end };
            })
            .sort((a, b) => a.start - b.start);

        const laneEnds = [];

        for (const event of entries) {
            let lane = laneEnds.findIndex(end => end <= event.start);

            if (lane === -1) {
                lane = laneEnds.length;
            }

            laneEnds[lane] = event.end;
            event.lane = lane;
        }

        const laneCount = Math.max(1, laneEnds.length);

        for (const event of entries) {
            const card = createCard(day, event.entry);
            card.classList.add("precise-timed-event");

            card.style.top = event.start + "px";
            card.style.height = event.end - event.start + "px";
            card.style.left =
                `calc(${event.lane * 100 / laneCount}% + 3px)`;
            card.style.width = `calc(${100 / laneCount}% - 6px)`;

            column.appendChild(card);
        }
    }

    container.appendChild(calendar);
}

// Transforme une colonne du calendrier en zone de dépôt
function enableCalendarDrop(element, targetDayId, timed) {
    element.addEventListener("dragover", function (event) {
        if (!event.dataTransfer.types.includes("application/json")) {
            return;
        }

        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    });

    element.addEventListener("drop", function (event) {
        event.preventDefault();

        let source;

        try {
            source = JSON.parse(
                event.dataTransfer.getData("application/json")
            );
        } catch {
            return;
        }

        // Relit le voyage pour conserver ses dernières modifications
        const trip = getSavedTrip();
        const sourceDay = trip?.days?.find(
            day => day.id === source.dayId
        );
        const targetDay = trip?.days?.find(
            day => day.id === targetDayId
        );
        const entry = sourceDay?.items?.find(
            item => item.id === source.entryId
        );

        if (!entry || !targetDay) {
            return;
        }

        // Refuse un doublon de la même activité dans la journée cible
        const duplicate = targetDay.items?.some(
            item =>
                item.activityId === entry.activityId &&
                item.id !== entry.id
        );

        if (duplicate) {
            alert("Cette activité est déjà planifiée dans cette journée.");
            return;
        }

        let startTime = null;

        if (timed) {
            // Convertit la position verticale en minutes, par pas de 15 min
            const bounds = element.getBoundingClientRect();
            const minutesAtPointer =
                (event.clientY - bounds.top) / bounds.height * 1440;

            const minutes = Math.max(
                0,
                Math.min(1425, Math.round(minutesAtPointer / 15) * 15)
            );

            const hoursText = String(Math.floor(minutes / 60))
                .padStart(2, "0");
            const minutesText = String(minutes % 60).padStart(2, "0");

            startTime = hoursText + ":" + minutesText;
        }

        // Déplace l'étape en conservant son identifiant et sa durée
        sourceDay.items = sourceDay.items.filter(
            item => item.id !== entry.id
        );

        if (!Array.isArray(targetDay.items)) {
            targetDay.items = [];
        }

        targetDay.items.push({
            ...entry,
            startTime: startTime
        });

        saveTrip(trip);
        renderItinerary();
    });
}

// Ajoute ou réordonne les étapes avec un indicateur de dépôt
function enableDailyDrop(list) {
    // Ligne visuelle indépendante des cartes et sans effet sur leur position
    const indicator = document.createElement("div");
    indicator.className = "daily-drop-indicator";
    indicator.setAttribute("aria-hidden", "true");

    // Trouve la carte devant laquelle insérer l'activité
    function getNextCard(clientY) {
        return Array.from(
            list.querySelectorAll("li[data-entry-id]")
        ).find(function (card) {
            const bounds = card.getBoundingClientRect();
            return clientY < bounds.top + bounds.height / 2;
        });
    }

    function clearIndicator() {
        indicator.remove();
    }

    list.addEventListener("dragover", function (event) {
        if (!event.dataTransfer.types.includes("application/json")) {
            return;
        }

        if (!getSavedTrip()?.days?.some(day => day.id === selectedDayId)) {
            return;
        }

        event.preventDefault();

        const nextCard = getNextCard(event.clientY);
        const listBounds = list.getBoundingClientRect();
        const cards = list.querySelectorAll("li[data-entry-id]");
        const lastCard = cards[cards.length - 1];

        // Positionne la ligne avant une carte ou après la dernière
        let position = 12;

        if (nextCard) {
            position = nextCard.getBoundingClientRect().top
                - listBounds.top + list.scrollTop - 6;
        } else if (lastCard) {
            position = lastCard.getBoundingClientRect().bottom
                - listBounds.top + list.scrollTop + 6;
        }

        indicator.style.top = Math.max(0, position) + "px";
        list.appendChild(indicator);
    });

    list.addEventListener("dragleave", function (event) {
        // Ne masque pas la ligne en passant sur un enfant de la liste
        if (!list.contains(event.relatedTarget)) {
            clearIndicator();
        }
    });

    // Nettoie aussi après un déplacement annulé avec Échap
    document.addEventListener("dragend", clearIndicator);
    document.addEventListener("drop", clearIndicator);

    list.addEventListener("drop", function (event) {
        event.preventDefault();
        clearIndicator();

        let source;

        try {
            source = JSON.parse(
                event.dataTransfer.getData("application/json")
            );
        } catch {
            return;
        }

        if (!source || typeof source !== "object") {
            return;
        }

        const trip = getSavedTrip();
        const targetDay = trip?.days?.find(
            day => day.id === selectedDayId
        );

        if (!targetDay) {
            return;
        }

        let entry;
        let sourceDay;

        if (source.entryId) {
            sourceDay = trip.days.find(day => day.id === source.dayId);
            entry = sourceDay?.items?.find(
                item => item.id === source.entryId
            );
        } else if (source.activityId) {
            const activity = trip.activities?.find(
                activity => activity.id === source.activityId
            );

            if (!activity) {
                return;
            }

            // Une nouvelle étape n'a pas encore d'horaire
            entry = {
                id: crypto.randomUUID(),
                activityId: activity.id,
                startTime: null,
                durationMinutes: null
            };
        }

        if (!entry) {
            return;
        }

        if ((targetDay.items || []).some(item =>
            item.activityId === entry.activityId &&
            item.id !== entry.id
        )) {
            return;
        }

        // Utilise le même repère que la ligne affichée pendant le déplacement
        const nextCard = getNextCard(event.clientY);
        const nextEntryId = nextCard?.dataset.entryId;

        if (nextEntryId === entry.id) {
            return;
        }

        // Conserve l'étape complète, y compris son heure et sa durée
        if (sourceDay) {
            sourceDay.items = sourceDay.items.filter(
                item => item.id !== entry.id
            );
        }

        if (!Array.isArray(targetDay.items)) {
            targetDay.items = [];
        }

        const nextIndex = targetDay.items.findIndex(
            item => item.id === nextEntryId
        );

        const insertionIndex = nextIndex >= 0
            ? nextIndex
            : targetDay.items.length;

        targetDay.items.splice(insertionIndex, 0, entry);

        saveTrip(trip);
        renderItinerary();
    });
}

// Rouvre l'itinéraire après une suppression et conserve son mode d'affichage
const itineraryViewToRestore = sessionStorage.getItem("reopen-itinerary");

if (itineraryViewToRestore) {
    sessionStorage.removeItem("reopen-itinerary");

    document.getElementById("itinerary-view").value =
        itineraryViewToRestore;

    document.getElementById("itinerary-button").click();
}