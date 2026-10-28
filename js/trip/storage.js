// Garde la clé et le format JSON utilisés par les voyages déjà enregistrés.
const TRIP_STORAGE_KEY = "trip";

export function getSavedTrip() {
    const savedTrip = localStorage.getItem(TRIP_STORAGE_KEY);
    return savedTrip ? JSON.parse(savedTrip) : null;
}

export function saveTrip(trip) {
    localStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify(trip));
}
