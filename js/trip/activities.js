import { getSavedTrip, saveTrip } from "./storage.js";
import {
    clearSelectedLocationMarker,
    displayActivityMarkers,
    getSelectedLocationCoordinates
} from "./map.js";

const activityForm = document.getElementById("activity-form");
const activityList = document.getElementById("activity-list");

export function initializeActivities(trip) {
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

        listItem.appendChild(deleteButton);
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
