import { getSavedTrip } from "./storage.js";

let overviewMap = null;
let markers = null;

export function showOverviewMap() {
    if (!overviewMap) {
        // Crée une carte d'aperçu sans zoom à la molette
        overviewMap = L.map("overview-map", {
            scrollWheelZoom: false
        }).setView([20, 0], 2);

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(overviewMap);

        markers = L.featureGroup().addTo(overviewMap);
    }

    overviewMap.invalidateSize();
    markers.clearLayers();

    const trip = getSavedTrip();

    // Ajoute les activités qui possèdent des coordonnées
    for (const activity of trip?.activities || []) {
        addMarker(activity.coordinates, activity.name);
    }

    // Distingue le logement avec un symbole d'hôtel
    const lodging = trip?.lodging;

    if (lodging) {
        const icon = L.divIcon({
            className: "lodging-marker",
            html: '<span aria-label="Hébergement">🏨</span>',
            iconSize: [36, 36],
            iconAnchor: [18, 36]
        });

        addMarker(lodging.coordinates, lodging.name, icon);
    }

    if (markers.getLayers().length > 0) {
        // Cadre tous les lieux sans trop zoomer s'il n'y en a qu'un
        overviewMap.fitBounds(markers.getBounds(), {
            padding: [30, 30],
            maxZoom: 14
        });
    } else if (
        Number.isFinite(trip?.destinationLocation?.lat) &&
        Number.isFinite(trip?.destinationLocation?.lng)
    ) {
        // Affiche la destination si aucun lieu n'est encore enregistré
        overviewMap.setView([
            trip.destinationLocation.lat,
            trip.destinationLocation.lng
        ], 10);
    } else {
        overviewMap.setView([20, 0], 2);
    }
}

// Ajoute un marqueur seulement si ses coordonnées sont valides
function addMarker(coordinates, name, icon = null) {
    if (
        !Number.isFinite(coordinates?.lat) ||
        !Number.isFinite(coordinates?.lng)
    ) {
        return;
    }

    const popup = document.createElement("span");
    popup.textContent = name || "Lieu";

    L.marker(
        [coordinates.lat, coordinates.lng],
        icon ? { icon: icon } : {}
    )
        .bindPopup(popup)
        .addTo(markers);
}