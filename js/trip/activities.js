import { getSavedTrip, saveTrip } from "./storage.js";
import {
    clearSelectedLocationMarker,
    displayActivityMarkers,
    getSelectedLocationCoordinates,
    focusActivityOnMap,
    selectLocationOnMap
} from "./map.js";
import { findPlaceSuggestions } from "./geocoding.js";

const activityForm = document.getElementById("activity-form");
const activityList = document.getElementById("activity-list");
const editDialog = document.getElementById("edit-activity-dialog");
const editForm = document.getElementById("edit-activity-form");
const editNameInput = document.getElementById("edit-activity-name");
const editNameError = document.getElementById("edit-activity-name-error");
const editLocationInput = document.getElementById("edit-activity-location");

// Retient la position de l'activité en cours de modification
let editingIndex = null;
// Conserve le lieu sélectionné pendant la modification
let editedCoordinates = null;
let editSearchTimer = null;
let editSearchController = null;
let editSearchVersion = 0;

const editResults = document.getElementById("edit-location-results");
const editStatus = document.getElementById("edit-location-status");

// Annule la recherche et efface les suggestions précédentes
function cancelEditSearch() {
    clearTimeout(editSearchTimer);
    editSearchController?.abort();
    editSearchVersion++;

    editResults.replaceChildren();
    editResults.hidden = true;
    editStatus.textContent = "";
}

export function initializeActivities(trip) {

    initializeActivityLocationSearch();
    
    // Recherche les lieux après une pause dans la saisie
    editLocationInput.addEventListener("input", function () {
        cancelEditSearch();

        // Le nouveau texte ne correspond plus aux anciennes coordonnées
        editedCoordinates = null;

        const query = editLocationInput.value.trim();

        if (query.length < 3) {
            return;
        }

        const version = editSearchVersion;

        editSearchTimer = setTimeout(async function () {
            editSearchController = new AbortController();
            editStatus.textContent = "Recherche en cours…";

            try {
                const results = await findPlaceSuggestions(
                    query,
                    editSearchController.signal
                );

                if (version !== editSearchVersion) {
                    return;
                }

                for (const place of results) {
                    const item = document.createElement("li");
                    const button = document.createElement("button");

                    button.type = "button";
                    button.textContent = place.formatted;

                    button.addEventListener("click", function () {
                        cancelEditSearch();

                        // Prépare le nouveau lieu sans encore modifier le voyage
                        editLocationInput.value = place.formatted;
                        editedCoordinates = {
                            lat: place.lat,
                            lng: place.lon
                        };

                        editStatus.textContent = "Nouvel emplacement sélectionné.";
                    });

                    item.appendChild(button);
                    editResults.appendChild(item);
                }

                editResults.hidden = results.length === 0;
                editStatus.textContent = results.length
                    ? "Sélectionne le nouvel emplacement."
                    : "Aucun lieu trouvé.";
            } catch (error) {
                if (
                    error.name === "AbortError" ||
                    version !== editSearchVersion
                ) {
                    return;
                }

                editStatus.textContent =
                    "Recherche indisponible. Tu peux garder un emplacement sans coordonnées.";
            }
        }, 400);
    });

    // Empêche une réponse de recherche de réapparaître après la fermeture
    editDialog.addEventListener("close", function () {
        cancelEditSearch();
        editedCoordinates = null;
    });

    editForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = editNameInput.value.trim();

    editNameInput.setAttribute("aria-invalid", String(!name));
    editNameError.textContent = name ? "" : "Entre un nom pour l'activité.";
    editNameError.hidden = Boolean(name);

    if (!name) {
        editNameInput.focus();
        return;
    }

    const currentTrip = getSavedTrip();

    if (
        editingIndex === null ||
        !currentTrip?.activities ||
        editingIndex >= currentTrip.activities.length
    ) {
        return;
    }

    const activity = currentTrip.activities[editingIndex];

    // Enregistre le texte et les coordonnées du lieu choisi
    currentTrip.activities[editingIndex] = {
        ...(typeof activity === "string" ? {} : activity),
        name: name,
        location: editLocationInput.value.trim(),
        coordinates: editedCoordinates
    };

    saveTrip(currentTrip);
    displayActivities(currentTrip);
    displayActivityMarkers();
    editDialog.close();
});

// Ferme la fenêtre sans modifier l'activité
document.getElementById("cancel-edit-activity").addEventListener(
    "click",
    function () {
        editDialog.close();
    }
);

// Oublie la sélection après une fermeture, y compris avec Échap
editDialog.addEventListener("close", function () {
    editingIndex = null;
});

// Efface l'erreur dès que le nom est corrigé
editNameInput.addEventListener("input", function () {
    if (editNameInput.value.trim()) {
        editNameInput.removeAttribute("aria-invalid");
        editNameError.hidden = true;
        editNameError.textContent = "";
    }
});
    
    if (trip) {
        displayActivities(trip);
    }

    activityForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const trip = getSavedTrip();

        if (!trip) {
            alert("Crée d'abord un voyage avant d'ajouter une activité.");
            return;
        }

        if (!Array.isArray(trip.activities)) {
            trip.activities = [];
        }

        const activityName = document.getElementById("activity-name").value.trim();

        if (!activityName) {
            alert("Entre un nom pour l'activité.");
            return;
        }

        const activityLocation =
            document.getElementById("activity-location").value.trim();

        trip.activities.push({
            id: crypto.randomUUID(),
            name: activityName,
            location: activityLocation,
            coordinates: getSelectedLocationCoordinates()
        });

        saveTrip(trip);
        displayActivities(trip);
        displayActivityMarkers();
        activityForm.reset();
        clearSelectedLocationMarker();
    });
}

function displayActivities(trip) {
    activityList.innerHTML = "";

    // Accepte aussi les activités plus anciennes enregistrées comme texte.
    for (const [index, activity] of (trip.activities || []).entries()) {
        const listItem = document.createElement("li");
        const name = typeof activity === "string" ? activity : activity.name;
        const location = typeof activity === "string" ? "" : activity.location;
        listItem.textContent = location ? name + " — " + location : name;
        const actions = document.createElement("div");
        actions.classList.add("activity-actions");

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Supprimer";
        deleteButton.classList.add("delete-button");
        deleteButton.type = "button";

        deleteButton.addEventListener("click", function () {
            const currentTrip = getSavedTrip();

            if (!currentTrip) {
                return;
            }

            currentTrip.activities.splice(index, 1);
            saveTrip(currentTrip);
            displayActivities(currentTrip);
            displayActivityMarkers();
        });

        // Propose le centrage seulement si l'activité possède un emplacement
        if (typeof activity !== "string" && activity.coordinates) {
            const mapButton = document.createElement("button");
            // Utilise la même icône de localisation que pour le logement
            mapButton.type = "button";
            mapButton.classList.add("location-button");
            mapButton.setAttribute("aria-label", "Voir sur la carte : " + name);
            mapButton.title = "Voir sur la carte";

            // Icône fixe : aucune donnée saisie n'est insérée dans le HTML
            mapButton.innerHTML = `
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                >
                    <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/>
                    <circle cx="12" cy="10" r="3"/>
                </svg>
            `;

            mapButton.addEventListener("click", function () {
                focusActivityOnMap(activity.coordinates);
            });

            actions.appendChild(mapButton);
        }

        // Ouvre la fenêtre avec le nom actuel de l'activité
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Modifier";
        editButton.classList.add("secondary-button");

        editButton.addEventListener("click", function () {
            editingIndex = index;
            editNameInput.value = name;
            editLocationInput.value = location || "";
            editedCoordinates =
                typeof activity === "string" ? null : (activity.coordinates || null);

            cancelEditSearch();
            editNameInput.removeAttribute("aria-invalid");
            editNameError.hidden = true;
            editNameError.textContent = "";

            editDialog.showModal();
        });

        actions.appendChild(editButton);

        actions.appendChild(deleteButton);
        listItem.appendChild(actions);
        activityList.appendChild(listItem);
    }

    displayActivityOverview(trip);
}

function displayActivityOverview(trip) {
    const overviewList = document.getElementById("trip-activities");
    overviewList.innerHTML = "";

    for (const activity of trip.activities || []) {
        const listItem = document.createElement("li");
        listItem.textContent =
            typeof activity === "string" ? activity : activity.name;
        overviewList.appendChild(listItem);
    }
}

// Active les suggestions du formulaire de création d'activité
function initializeActivityLocationSearch() {
    const input = document.getElementById("activity-location");
    const resultsList = document.getElementById("activity-location-results");
    const status = document.getElementById("activity-location-status");

    let timer = null;
    let controller = null;
    let version = 0;

    function cancelSearch() {
        clearTimeout(timer);
        controller?.abort();
        version++;

        resultsList.replaceChildren();
        resultsList.hidden = true;
        status.textContent = "";
    }

    input.addEventListener("input", function () {
        cancelSearch();

        // Le texte modifié ne doit pas garder les anciennes coordonnées
        clearSelectedLocationMarker();

        const query = input.value.trim();

        if (query.length < 3) {
            return;
        }

        const currentVersion = version;

        timer = setTimeout(async function () {
            controller = new AbortController();
            status.textContent = "Recherche en cours…";

            try {
                const results = await findPlaceSuggestions(
                    query,
                    controller.signal
                );

                if (currentVersion !== version) {
                    return;
                }

                for (const place of results) {
                    const item = document.createElement("li");
                    const button = document.createElement("button");

                    button.type = "button";
                    button.textContent = place.formatted;

                    button.addEventListener("click", function () {
                        cancelSearch();

                        // Sélectionne le point utilisé lors de l'ajout
                        selectLocationOnMap({
                            lat: place.lat,
                            lng: place.lon
                        });

                        input.value = place.formatted;
                        status.textContent = "Emplacement sélectionné.";
                    });

                    item.appendChild(button);
                    resultsList.appendChild(item);
                }

                resultsList.hidden = results.length === 0;
                status.textContent = results.length
                    ? "Sélectionne un emplacement."
                    : "Aucun résultat trouvé.";
            } catch (error) {
                if (
                    error.name === "AbortError" ||
                    currentVersion !== version
                ) {
                    return;
                }

                status.textContent =
                    "Recherche indisponible. Tu peux sélectionner un point sur la carte.";
            }
        }, 400);
    });

    // Empêche une recherche en attente de réapparaître après un ajout
    activityForm.addEventListener("reset", cancelSearch);

    // Ferme les suggestions si l'utilisateur choisit directement sur la carte
    document.getElementById("activities-map").addEventListener(
        "pointerdown",
        cancelSearch
    );

    input.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            cancelSearch();
        }
    });
}