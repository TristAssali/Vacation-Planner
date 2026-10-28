console.log("JavaScript est connecté !");

const tripForm = document.getElementById("trip-form");
// Récupère le formulaire et la liste des activités

tripForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const tripName = document.getElementById("trip-name").value.trim();
    const destination = document.getElementById("destination").value.trim();
    
    const departureDate = document.getElementById("departure-date").value;
    const returnDate = document.getElementById("return-date").value;
    // Prépare les messages selon les valeurs entrées
    const errors = {
        "trip-name": tripName ? "" : "Entre un nom pour le voyage.",
        "destination": destination ? "" : "Entre une destination.",
        "departure-date": "",
        "return-date": ""
    };
    // Les dates sont facultatives, mais leur ordre doit être cohérent
    if (departureDate && returnDate && returnDate < departureDate) {
        errors["return-date"] =
            "La date de retour ne peut pas précéder la date de départ.";
    }

    let firstInvalidInput = null;
    // Affiche ou efface les erreurs sous les champs
    for (const [fieldId, message] of Object.entries(errors)) {
        const input = document.getElementById(fieldId);
        const error = document.getElementById(fieldId + "-error");

        input.setAttribute("aria-invalid", String(Boolean(message)));
        error.textContent = message;
        error.hidden = !message;

        if (message && !firstInvalidInput) {
            firstInvalidInput = input;
        }
    }
    // Empêche la création si un champ est invalide
    if (firstInvalidInput) {
        firstInvalidInput.focus();
        return;
    }
    const trip = {
        name: tripName,
        destination: destination,
        departureDate: departureDate,
        returnDate: returnDate,
        activities: [] 
    };
    
    // Convertit l'objet en texte JSON, puis le sauvegarde dans le navigateur.
    localStorage.setItem("trip", JSON.stringify(trip));
    // Ouvre la page du voyage après sa sauvegarde
    window.location.href = "trip.html";

    console.log(trip);
    
    console.log("Nom du voyage :", tripName);
    console.log("Destination :", destination);
    console.log("Date de départ :", departureDate);
    console.log("Date de retour :", returnDate);

    console.log("Formulaire envoyé !");
});

// Réévalue l'ordre des dates lorsque l'une d'elles change
for (const fieldId of ["departure-date", "return-date"]) {
    document.getElementById(fieldId).addEventListener("input", function () {
        const departure = document.getElementById("departure-date").value;
        const returnInput = document.getElementById("return-date");
        const error = document.getElementById("return-date-error");

        // Retire l'erreur si les dates sont cohérentes ou incomplètes
        if (!departure || !returnInput.value || returnInput.value >= departure) {
            returnInput.removeAttribute("aria-invalid");
            error.hidden = true;
            error.textContent = "";
        }
    });
}