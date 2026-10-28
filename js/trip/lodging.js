import { getSavedTrip, saveTrip } from "./storage.js";

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

            currentTrip.lodging = { name: name, address: address };
            saveTrip(currentTrip);
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
