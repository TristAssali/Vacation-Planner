import { findPlaceSuggestions } from "./trip/geocoding.js";

export function initializeDestinationSearch() {
    const input = document.getElementById("destination");
    const resultsList = document.getElementById("destination-results");
    const status = document.getElementById("destination-status");
    const container = input.closest(".destination-search-container");

    let selectedDestination = null;
    let timer = null;
    let controller = null;
    let version = 0;

    // Annule les recherches et invalide leurs anciennes réponses
    function cancelSearch() {
        clearTimeout(timer);
        controller?.abort();
        version++;
    }

    input.addEventListener("input", function () {
        cancelSearch();

        // Une saisie modifiée ne correspond plus au choix précédent
        selectedDestination = null;
        resultsList.replaceChildren();
        resultsList.hidden = true;
        status.textContent = "";

        const query = input.value.trim();

        if (query.length < 3) {
            return;
        }

        const currentVersion = version;

        // Attend une courte pause avant de contacter le service
        timer = setTimeout(async function () {
            controller = new AbortController();
            status.textContent = "Recherche en cours…";

            try {
                const results = await findPlaceSuggestions(
                    query,
                    controller.signal
                );

                if (currentVersion !== version) {
                    return;
                }

                resultsList.replaceChildren();

                for (const place of results) {
                    const item = document.createElement("li");
                    const button = document.createElement("button");

                    button.type = "button";
                    button.textContent = place.formatted;

                    button.addEventListener("click", function () {
                        cancelSearch();

                        // Conserve le libellé et les coordonnées du choix
                        selectedDestination = {
                            label: place.formatted,
                            lat: place.lat,
                            lng: place.lon,
                            type: place.result_type
                        };

                        input.value = place.formatted;
                        resultsList.hidden = true;
                        status.textContent = "Destination sélectionnée.";

                        // Efface l'erreur après une sélection valide
                        input.removeAttribute("aria-invalid");
                        document.getElementById("destination-error").hidden = true;
                    });

                    item.appendChild(button);
                    resultsList.appendChild(item);
                }

                resultsList.hidden = results.length === 0;
                status.textContent = results.length
                    ? "Choisis une destination dans la liste."
                    : "Aucune destination trouvée.";
            } catch (error) {
                if (
                    error.name === "AbortError" ||
                    currentVersion !== version
                ) {
                    return;
                }

                status.textContent =
                    "Recherche indisponible. Réessaie dans un instant.";
            }
        }, 400);
    });

    // Ferme les suggestions quand on quitte la zone de recherche
    document.addEventListener("click", function (event) {
        if (!container.contains(event.target)) {
            cancelSearch();
            resultsList.hidden = true;
            status.textContent = "";
        }
    });

    container.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            cancelSearch();
            resultsList.hidden = true;
            status.textContent = "";
        }
    });

    // Permet au formulaire de récupérer la destination sélectionnée
    return {
        getSelectedDestination() {
            return selectedDestination;
        }
    };
}