import { GEOAPIFY_API_KEY } from "../config.js";

// Trouve les coordonnées d'une destination et réutilise les résultats connus
const destinationCache = new Map();

export async function findDestination(destination) {
    const query = destination.trim();

    if (!query) {
        return null;
    }

    if (destinationCache.has(query)) {
        return destinationCache.get(query);
    }

    const url = new URL("https://api.geoapify.com/v1/geocode/search");

    url.search = new URLSearchParams({
        text: query,
        format: "json",
        lang: "fr",
        limit: "1",
        apiKey: GEOAPIFY_API_KEY
    }).toString();

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Impossible de rechercher la destination.");
    }

    const data = await response.json();
    const place = data.results?.[0] || null;

    // Évite de refaire la même recherche pendant cette session de page
    destinationCache.set(query, place);

    return place;
}