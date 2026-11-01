import { getSavedTrip } from "./trip/storage.js";
import { initializeActivities } from "./trip/activities.js";
import { initializeLodging } from "./trip/lodging.js";
import { showActivitiesMap, focusActivityOnMap } from "./trip/map.js";
import { initializePlaceSearch } from "./trip/place-search.js";
import { showOverviewMap } from "./trip/overview-map.js";
import { initializeItinerary, displayItineraryDays } from "./trip/itinerary.js";
import { initializeNotifications } from "./trip/notifications.js";

initializeItinerary();
const trip = getSavedTrip();

if (trip) {
    document.getElementById("trip-title").textContent = trip.name;
    document.getElementById("trip-destination").textContent = trip.destination;

    let datesText = "Dates à déterminer";

    if (trip.departureDate && trip.returnDate) {
        datesText = "Du " + trip.departureDate + " au " + trip.returnDate;
    } else if (trip.departureDate) {
        datesText = "Départ : " + trip.departureDate;
    } else if (trip.returnDate) {
        datesText = "Retour : " + trip.returnDate;
    }

    document.getElementById("trip-dates").textContent = datesText;
}

initializeActivities(trip);
initializeLodging(trip);
initializePlaceSearch();
const overviewButton = document.getElementById("overview-button");
const ideasButton = document.getElementById("ideas-button");
const overviewPanel = document.getElementById("overview-panel");
const ideasPanel = document.getElementById("ideas-panel");
const itineraryButton = document.getElementById("itinerary-button");
const itineraryPanel = document.getElementById("itinerary-panel");

overviewButton.addEventListener("click", function () {
    itineraryPanel.hidden = true;
    itineraryButton.classList.remove("active");
    overviewPanel.hidden = false;
    ideasPanel.hidden = true;
    overviewButton.classList.add("active");
    ideasButton.classList.remove("active");
    requestAnimationFrame(showOverviewMap);
});

ideasButton.addEventListener("click", function () {
    itineraryPanel.hidden = true;
    itineraryButton.classList.remove("active");
    overviewPanel.hidden = true;
    ideasPanel.hidden = false;
    ideasButton.classList.add("active");
    overviewButton.classList.remove("active");
    requestAnimationFrame(showActivitiesMap);
});

document.getElementById("back-button").addEventListener("click", function () {
    window.location.href = "index.html";
});

// Ouvre l'onglet de la carte et montre le logement
document.getElementById("view-lodging-button").addEventListener(
    "click",
    function () {
        const lodging = getSavedTrip()?.lodging;

        if (!lodging?.coordinates) {
            return;
        }

        // Affiche le panneau et sélectionne son onglet
        overviewPanel.hidden = true;
        ideasPanel.hidden = false;
        overviewButton.classList.remove("active");
        ideasButton.classList.add("active");

        // Attend que le panneau soit visible avant de créer et centrer la carte
        requestAnimationFrame(function () {
            showActivitiesMap();
            focusActivityOnMap(lodging.coordinates);
        });
    }
);

// Affiche l'aperçu au chargement de la page
requestAnimationFrame(showOverviewMap);

// Ouvre l'onglet qui contient la grande carte
document.getElementById("open-map-button").addEventListener(
    "click",
    function () {
        ideasButton.click();
    }
);

// Affiche l'itinéraire et cache les deux autres panneaux
itineraryButton.addEventListener("click", function () {
    overviewPanel.hidden = true;
    ideasPanel.hidden = true;
    itineraryPanel.hidden = false;

    overviewButton.classList.remove("active");
    ideasButton.classList.remove("active");
    itineraryButton.classList.add("active");

    displayItineraryDays();
});

initializeNotifications();