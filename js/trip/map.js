import { getSavedTrip } from "./storage.js";

let activitiesMap = null;
let selectedLocationMarker = null;
let activityMarkers = null;

export function showActivitiesMap() {
    if (!activitiesMap) {
        // La carte est créée à la première ouverture de l’onglet.
        activitiesMap = L.map("activities-map").setView([40.7128, -74.0060], 12);

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(activitiesMap);

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
