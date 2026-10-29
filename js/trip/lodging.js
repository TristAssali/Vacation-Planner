import { getSavedTrip, saveTrip } from "./storage.js";
import { findPlaceSuggestions } from "./geocoding.js";
import { displayLodgingMarker } from "./map.js";

export function initializeLodging(trip) {
    const lodgingDialog = document.getElementById("lodging-dialog");
    const lodgingNameInput = document.getElementById("lodging-name");
    const lodgingAddressInput = document.getElementById("lodging-address");


    if (trip?.lodging) {
        document.getElementById("lodging-display").textContent =
            trip.lodging.name + " — " + trip.lodging.address;
        lodgingNameInput.value = trip.lodging.name;
        lodgingAddressInput.value = trip.lodging.address;
    }

    document.getElementById("lodging-form").addEventListener(
        "submit",
        function (event) {
            event.preventDefault();

            const name = lodgingNameInput.value.trim();
            const address = lodgingAddressInput.value.trim();
            const nameError = document.getElementById("lodging-name-error");
            const addressError = document.getElementById("lodging-address-error");

            lodgingNameInput.setAttribute("aria-invalid", String(!name));
            lodgingAddressInput.setAttribute("aria-invalid", String(!address));

            nameError.textContent = name ? "" : "Entre le nom du logement.";
            addressError.textContent = address
                ? ""
                : "Entre l'adresse du logement.";

            nameError.hidden = Boolean(name);
            addressError.hidden = Boolean(address);

            if (!name || !address) {
                (name ? lodgingAddressInput : lodgingNameInput).focus();
                return;
            }

            const currentTrip = getSavedTrip();

            if (!currentTrip) {
                alert("Crée d'abord un voyage.");
                return;
            }

            currentTrip.lodging = { name: name, address: address, coordinates: selectedCoordinates };
            saveTrip(currentTrip);
            displayLodgingMarker();
            document.getElementById("lodging-display").textContent =
                name + " — " + address;
            lodgingDialog.close();
        }
    );

    document.getElementById("edit-lodging-button").addEventListener(
        "click",
        function () {
            const currentTrip = getSavedTrip();

            lodgingNameInput.value = currentTrip?.lodging?.name || "";
            lodgingAddressInput.value = currentTrip?.lodging?.address || "";
            // Restaure les coordonnées enregistrées et efface les anciennes suggestions
            selectedCoordinates = currentTrip?.lodging?.coordinates || null;
            cancelAddressSearch();

            for (const fieldId of ["lodging-name", "lodging-address"]) {
                document.getElementById(fieldId).removeAttribute("aria-invalid");

                const error = document.getElementById(fieldId + "-error");
                error.hidden = true;
                error.textContent = "";
            }

            lodgingDialog.showModal();
        }
    );

    document.getElementById("close-lodging-button").addEventListener(
        "click",
        function () {
            lodgingDialog.close();
        }
    );

    const resultsList = document.getElementById("lodging-address-results");
    const searchStatus = document.getElementById("lodging-search-status");

    let selectedCoordinates = trip?.lodging?.coordinates || null;
    let searchTimer = null;
    let searchController = null;
    let searchVersion = 0;

    // Annule la recherche et empêche ses anciens résultats de s'afficher
    function cancelAddressSearch() {
        clearTimeout(searchTimer);
        searchController?.abort();
        searchVersion++;

        resultsList.replaceChildren();
        resultsList.hidden = true;
        searchStatus.textContent = "";
    }

    // Recherche après une pause dans la saisie
    lodgingAddressInput.addEventListener("input", function () {
        cancelAddressSearch();

        // Une adresse modifiée ne correspond plus aux anciennes coordonnées
        selectedCoordinates = null;

        const query = lodgingAddressInput.value.trim();

        if (query.length < 3) {
            return;
        }

        const version = searchVersion;

        searchTimer = setTimeout(async function () {
            searchController = new AbortController();
            searchStatus.textContent = "Recherche en cours…";

            try {
                const results = await findPlaceSuggestions(
                    query,
                    searchController.signal
                );

                if (version !== searchVersion) {
                    return;
                }

                for (const place of results) {
                    const item = document.createElement("li");
                    const button = document.createElement("button");

                    button.type = "button";
                    button.textContent = place.formatted;

                    button.addEventListener("click", function () {
                        cancelAddressSearch();

                        lodgingAddressInput.value = place.formatted;
                        selectedCoordinates = {
                            lat: place.lat,
                            lng: place.lon
                        };

                        // Efface l'erreur du champ après une sélection
                        lodgingAddressInput.removeAttribute("aria-invalid");
                        document.getElementById("lodging-address-error").hidden = true;
                        searchStatus.textContent = "Adresse sélectionnée.";
                    });

                    item.appendChild(button);
                    resultsList.appendChild(item);
                }

                resultsList.hidden = results.length === 0;
                searchStatus.textContent = results.length
                    ? "Sélectionne l'adresse de ton logement."
                    : "Aucun résultat trouvé.";
            } catch (error) {
                if (error.name === "AbortError" || version !== searchVersion) {
                    return;
                }

                searchStatus.textContent =
                    "Recherche indisponible. Tu peux saisir l'adresse manuellement.";
            }
        }, 400);
    });

    // Nettoie les suggestions lorsque la fenêtre est fermée
    lodgingDialog.addEventListener("close", cancelAddressSearch);

    for (const input of [lodgingNameInput, lodgingAddressInput]) {
        const error = document.getElementById(input.id + "-error");

        input.addEventListener("input", function () {
            if (input.value.trim()) {
                input.removeAttribute("aria-invalid");
                error.hidden = true;
                error.textContent = "";
            }
        });
    }
}
