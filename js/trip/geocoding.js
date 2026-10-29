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

// Conserve les suggestions déjà recherchées pendant la session
const suggestionsCache = new Map();

// Recherche des suggestions et permet d'annuler la requête
export async function findPlaceSuggestions(query, signal) {
    const text = query.trim();

    if (text.length < 3) {
        return [];
    }

    if (suggestionsCache.has(text)) {
        return suggestionsCache.get(text);
    }

    const url = new URL(
        "https://api.geoapify.com/v1/geocode/autocomplete"
    );

    url.search = new URLSearchParams({
        text: text,
        format: "json",
        lang: "fr",
        limit: "5",
        apiKey: GEOAPIFY_API_KEY
    }).toString();

    const response = await fetch(url, { signal });

    if (!response.ok) {
        throw new Error("Impossible de rechercher les suggestions.");
    }

    const data = await response.json();
    const results = data.results || [];

    suggestionsCache.set(text, results);
    return results;
}