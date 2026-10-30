import { getSavedTrip } from "./storage.js";
import { findDestination } from "./geocoding.js";

let activitiesMap = null;
let selectedLocationMarker = null;
let activityMarkers = null;
let lodgingMarker = null;

export function showActivitiesMap() {
    if (!activitiesMap) {
        // La carte est créée à la première ouverture de l’onglet.
        activitiesMap = L.map("activities-map").setView([20, 0], 2);

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(activitiesMap);
        centerMapOnDestination();

        activitiesMap.on("click", function (event) {
            const coordinates = event.latlng;

            if (selectedLocationMarker) {
                selectedLocationMarker.setLatLng(coordinates);
            } else {
                selectedLocationMarker = L.marker(coordinates).addTo(activitiesMap);
            }
        });
    }

    activitiesMap.invalidateSize();
    displayActivityMarkers();
    // Affiche aussi le logement à l'ouverture de la carte
    displayLodgingMarker();
}

export function getSelectedLocationCoordinates() {
    if (!selectedLocationMarker) {
        return null;
    }

    const coordinates = selectedLocationMarker.getLatLng();
    return { lat: coordinates.lat, lng: coordinates.lng };
}

export function clearSelectedLocationMarker() {
    if (selectedLocationMarker) {
        activitiesMap.removeLayer(selectedLocationMarker);
        selectedLocationMarker = null;
    }
}

export function displayActivityMarkers() {
    if (!activitiesMap) {
        return;
    }

    if (!activityMarkers) {
        activityMarkers = L.layerGroup().addTo(activitiesMap);
    }

    activityMarkers.clearLayers();

    const trip = getSavedTrip();

    for (const activity of trip?.activities || []) {
        if (!activity.coordinates) {
            continue;
        }

        const popupContent = document.createElement("span");
        popupContent.textContent = activity.name;

        L.marker([
            activity.coordinates.lat,
            activity.coordinates.lng
        ])
            .bindPopup(popupContent)
            .addTo(activityMarkers);
    }
}

// Centre la carte sur une activité enregistrée
export function focusActivityOnMap(coordinates) {
    if (!activitiesMap || !coordinates) {
        return;
    }

    activitiesMap.setView(
        [coordinates.lat, coordinates.lng],
        16 //niveau zoom
    );
}

export function selectLocationOnMap(coordinates) {
    if (!activitiesMap) {
        return;
    }

    // Déplace le marqueur de sélection ou le crée
    if (selectedLocationMarker) {
        selectedLocationMarker.setLatLng(coordinates);
    } else {
        selectedLocationMarker = L.marker(coordinates).addTo(activitiesMap);
    }

    // Centre la carte sur le lieu sélectionné
    activitiesMap.setView(coordinates, 16);
}

// Explore une zone sans la sélectionner comme emplacement d'activité
export function explorePlaceOnMap(place) {
    if (!activitiesMap) {
        return;
    }

    const zoomByType = {
        country: 5,
        state: 7,
        county: 9,
        city: 11,
        postcode: 13,
        district: 13,
        suburb: 14,
        street: 15
    };

    const zoom = zoomByType[place.result_type] ?? 12;

    activitiesMap.setView([place.lat, place.lon], zoom);
}

// Centre la carte sur la destination enregistrée dans le voyage
async function centerMapOnDestination() {
    const trip = getSavedTrip();
    const status = document.getElementById("place-search-status");

    if (!trip?.destination) {
        return;
    }

    // Utilise directement la destination choisie lors de la création
    if (
        Number.isFinite(trip.destinationLocation?.lat) &&
        Number.isFinite(trip.destinationLocation?.lng)
    ) {
        explorePlaceOnMap({
            lat: trip.destinationLocation.lat,
            lon: trip.destinationLocation.lng,
            result_type: trip.destinationLocation.type
        });

        // Évite une recherche API puisque les coordonnées sont connues
        return;
    }

    // Évite de déplacer la carte si l'utilisateur commence déjà à l'utiliser
    let userInteracted = false;

    function markInteraction() {
        userInteracted = true;
    }

    activitiesMap.on("mousedown touchstart keydown movestart", markInteraction);

    try {
        const place = await findDestination(trip.destination);

        if (userInteracted) {
            return;
        }

        if (place) {
            explorePlaceOnMap(place);
        } else {
            status.textContent =
                "Destination introuvable. Utilise la recherche pour explorer la carte.";
        }
    } catch {
        if (!userInteracted) {
            status.textContent =
                "Impossible de localiser la destination. Tu peux utiliser la carte et réessayer avec la recherche.";
        }
    } finally {
        // Retire l'écouteur devenu inutile après la recherche
        activitiesMap.off("mousedown touchstart keydown movestart", markInteraction);
    }
}

// Affiche le logement enregistré sur la carte
export function displayLodgingMarker() {
    if (!activitiesMap) {
        return;
    }

    // Retire le précédent marqueur avant de reconstruire l'affichage
    if (lodgingMarker) {
        activitiesMap.removeLayer(lodgingMarker);
        lodgingMarker = null;
    }

    const lodging = getSavedTrip()?.lodging;

    if (
        !Number.isFinite(lodging?.coordinates?.lat) ||
        !Number.isFinite(lodging?.coordinates?.lng)
    ) {
        return;
    }

    // Distingue le logement des marqueurs d'activités
    const icon = L.divIcon({
        className: "lodging-marker",
        html: '<span aria-label="Hébergement">🏨</span>',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
    });

    const popupContent = document.createElement("span");
    popupContent.textContent = lodging.name + " — " + lodging.address;

    lodgingMarker = L.marker(
        [lodging.coordinates.lat, lodging.coordinates.lng],
        { icon: icon }
    )
        .bindPopup(popupContent)
        .addTo(activitiesMap);
}



