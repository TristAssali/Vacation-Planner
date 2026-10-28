import { GEOAPIFY_API_KEY } from "../config.js";
import { selectLocationOnMap, explorePlaceOnMap, clearSelectedLocationMarker } from "./map.js";

export function initializePlaceSearch() {
    const form = document.getElementById("place-search-form");
    const input = document.getElementById("place-search");
    const status = document.getElementById("place-search-status");
    const resultsList = document.getElementById("place-search-results");

    let timer = null;
    let controller = null;
    let searchVersion = 0;
    const cache = new Map();

    // Affiche les suggestions sans interpréter leur texte comme du HTML
    function displayResults(results) {
        resultsList.replaceChildren();
        resultsList.hidden = results.length === 0;

        status.textContent = results.length
            ? "Sélectionne un lieu dans les suggestions."
            : "Aucun résultat trouvé.";

        for (const place of results) {
            const item = document.createElement("li");
            const button = document.createElement("button");

            button.type = "button";
            button.textContent = place.formatted;

            button.addEventListener("click", function () {
                // Seuls les lieux précis deviennent un emplacement sélectionné
                const isPrecisePlace =
                    ["building", "amenity"].includes(place.result_type);

                if (isPrecisePlace) {
                    selectLocationOnMap({
                        lat: place.lat,
                        lng: place.lon
                    });

                    document.getElementById("activity-location").value =
                        place.formatted;

                    status.textContent =
                        "Lieu sélectionné. Tu peux ajouter ton activité.";
                } else {
                    // Retire l'ancienne sélection pour éviter d'enregistrer le mauvais point
                    clearSelectedLocationMarker();
                    document.getElementById("activity-location").value = "";

                    explorePlaceOnMap(place);

                    status.textContent =
                        "Zone affichée. Clique sur la carte pour choisir un emplacement précis.";
                }

                input.value = place.formatted;
                resultsList.hidden = true;
            });

            item.appendChild(button);
            resultsList.appendChild(item);
        }
    }

    // Annule les recherches précédentes et invalide leurs réponses
    function cancelSearch() {
        clearTimeout(timer);
        controller?.abort();
        searchVersion++;
    }

    async function searchPlaces() {
        const query = input.value.trim();

        if (query.length < 3) {
            return;
        }

        const version = searchVersion;
        status.textContent = "Recherche en cours…";

        try {
            // Réutilise les résultats d'une recherche identique
            if (cache.has(query)) {
                displayResults(cache.get(query));
                return;
            }

            controller = new AbortController();

            const url = new URL(
                "https://api.geoapify.com/v1/geocode/autocomplete"
            );

            url.search = new URLSearchParams({
                text: query,
                format: "json",
                lang: "fr",
                limit: "5",
                apiKey: GEOAPIFY_API_KEY
            }).toString();

            const response = await fetch(url, {
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error("Recherche impossible");
            }

            const data = await response.json();

            // Ignore une réponse si la saisie a changé entre-temps
            if (version !== searchVersion) {
                return;
            }

            const results = data.results || [];
            cache.set(query, results);
            displayResults(results);
        } catch (error) {
            if (error.name === "AbortError" || version !== searchVersion) {
                return;
            }

            resultsList.hidden = true;
            status.textContent =
                "Recherche impossible. Réessaie dans quelques instants.";
        }
    }

    input.addEventListener("input", function () {
        cancelSearch();
        resultsList.replaceChildren();
        resultsList.hidden = true;
        status.textContent = "";

        // Attend une pause de 400 ms après au moins trois caractères
        if (input.value.trim().length >= 3) {
            timer = setTimeout(searchPlaces, 400);
        }
    });

    // Le bouton et la touche Entrée permettent aussi de rechercher
    form.addEventListener("submit", function (event) {
        event.preventDefault();
        cancelSearch();
        searchPlaces();
    });

    document.addEventListener("click", function (event) {
        if (!form.contains(event.target)) {
            cancelSearch();
            resultsList.hidden = true;
        }
    });

    form.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            cancelSearch();
            resultsList.hidden = true;
        }
    });
}