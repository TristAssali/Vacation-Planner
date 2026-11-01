// Garde la clé et le format JSON utilisés par les voyages déjà enregistrés.
const TRIP_STORAGE_KEY = "trip";
// Sujet observé : annonce les changements du voyage
const tripEvents = new EventTarget();

export function getSavedTrip() {
    const savedTrip = localStorage.getItem(TRIP_STORAGE_KEY);

    if (!savedTrip) {
        return null;
    }

    const trip = JSON.parse(savedTrip);
    let changed = false;

    // Prépare la liste pour les anciens voyages
    if (!Array.isArray(trip.activities)) {
        trip.activities = [];
        changed = true;
    }

    // Donne un identifiant permanent aux activités qui n'en ont pas
    trip.activities = trip.activities.map(function (activity) {
        if (typeof activity === "string") {
            changed = true;

            return {
                id: crypto.randomUUID(),
                name: activity,
                location: "",
                coordinates: null
            };
        }

        if (!activity.id) {
            changed = true;

            return {
                ...activity,
                id: crypto.randomUUID()
            };
        }

        return activity;
    });

    // Enregistre la conversion seulement si quelque chose a changé
    if (changed) {
        saveTrip(trip);
    }

    return trip;
}

export function saveTrip(trip) {
    localStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify(trip));

    tripEvents.dispatchEvent(new Event("trip-changed"));
}

// Abonne un observateur et permet de le désabonner au besoin
export function subscribeToTripChanges(callback) {
    tripEvents.addEventListener("trip-changed", callback);

    return function unsubscribe() {
        tripEvents.removeEventListener("trip-changed", callback);
    };
}
