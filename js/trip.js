const savedTrip = localStorage.getItem("trip");
const activityForm = document.getElementById("activity-form");
const activityList = document.getElementById("activity-list");


if (savedTrip) {
    // Transforme le texte JSON en objet JavaScript
    const trip = JSON.parse(savedTrip);
    displayActivities(trip);

    // Affiche les informations du voyage sur la page
    document.getElementById("trip-title").textContent = trip.name;
    document.getElementById("trip-destination").textContent = trip.destination;
    // Affiche les dates disponibles ou un message si elles sont absentes
    let datesText = "Dates à déterminer";

    if (trip.departureDate && trip.returnDate) {
        datesText = "Du " + trip.departureDate + " au " + trip.returnDate;
    } else if (trip.departureDate) {
        datesText = "Départ : " + trip.departureDate;
    } else if (trip.returnDate) {
        datesText = "Retour : " + trip.returnDate;
    }
    document.getElementById("trip-dates").textContent = datesText;
    displayActivityOverview(trip);
}

// Réagit à l'ajout d'une activité
activityForm.addEventListener("submit", function (event) {
    // Empêche la page de se recharger
    event.preventDefault();
    // Récupère le voyage enregistré dans le navigateur
    const savedTrip = localStorage.getItem("trip");

    if (!savedTrip) {
        alert("Crée d'abord un voyage avant d'ajouter une activité.");
        return;
    }
    // Transforme le voyage sauvegardé en objet JavaScript
    const trip = JSON.parse(savedTrip);
    // Prépare une liste si le voyage a été créé avant l'ajout de activities
    if (!Array.isArray(trip.activities)) {
        trip.activities = [];
    }

    const activityName = document.getElementById("activity-name").value.trim();
    // Empêche l'ajout d'une activité vide
    if (!activityName) {
        alert("Entre un nom pour l'activité.");
        return;
    }    
    const activityLocation = document.getElementById("activity-location").value.trim();
    // Regroupe les informations de l'activité
    const activity = {
        name: activityName,
        location: activityLocation
    };
    // Ajoute l'objet au voyage
    trip.activities.push(activity);

    localStorage.setItem("trip", JSON.stringify(trip));
    
    // Réaffiche toutes les activités avec leur bouton Supprimer
    displayActivities(trip);
    
    // Vide le formulaire pour faciliter l'ajout suivant
    activityForm.reset();
});

// Affiche toutes les activités d'un voyage
function displayActivities(trip) {
    // Vide la liste pour éviter les doublons
    activityList.innerHTML = "";

    for (const [index, activity] of (trip.activities || []).entries()) {
        const listItem = document.createElement("li");
        const name = typeof activity === "string" ? activity : activity.name;
        const location = typeof activity === "string" ? "" : activity.location;
        listItem.textContent = location ? name + " — " + location : name;

        // Crée un bouton pour supprimer cette activité
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Supprimer";
        deleteButton.classList.add("delete-button");
        deleteButton.type = "button";

        deleteButton.addEventListener("click", function () {
            // Retire l'activité du tableau et sauvegarde le voyage
            trip.activities.splice(index, 1);
            localStorage.setItem("trip", JSON.stringify(trip));

            // Actualise la liste affichée
            displayActivities(trip);
        });

        listItem.appendChild(deleteButton);
        activityList.appendChild(listItem);
    }
}

// Affiche les activités dans l'aperçu de la vue d'ensemble
function displayActivityOverview(trip) {
    const overviewList = document.getElementById("trip-activities");

    // Vide l'aperçu avant de le reconstruire
    overviewList.innerHTML = "";

    for (const activity of trip.activities || []) {
        const listItem = document.createElement("li");

        // Accepte les anciennes activités en texte et les nouvelles en objet
        listItem.textContent =
            typeof activity === "string" ? activity : activity.name;

        overviewList.appendChild(listItem);
    }
}