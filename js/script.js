console.log("JavaScript est connecté !");

const tripForm = document.getElementById("trip-form");
// Récupère le formulaire et la liste des activités
const activityForm = document.getElementById("activity-form");
const activityList = document.getElementById("activity-list");

tripForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const tripName = document.getElementById("trip-name").value;
    const destination = document.getElementById("destination").value;
    const departureDate = document.getElementById("departure-date").value;
    const returnDate = document.getElementById("return-date").value;
    const trip = {
        name: tripName,
        destination: destination,
        departureDate: departureDate,
        returnDate: returnDate,
        activities: [] 
    };
    
    // Convertit l'objet en texte JSON, puis le sauvegarde dans le navigateur.
    localStorage.setItem("trip", JSON.stringify(trip));

   // Affiche le voyage qui vient d'être créé
    displayTrip(trip);

    console.log(trip);
    
    console.log("Nom du voyage :", tripName);
    console.log("Destination :", destination);
    console.log("Date de départ :", departureDate);
    console.log("Date de retour :", returnDate);

    console.log("Formulaire envoyé !");
});

// Affiche les informations d'un voyage sur la page
function displayTrip(trip) {
    document.getElementById("display-name").textContent = trip.name;
    document.getElementById("display-destination").textContent = trip.destination;

    document.getElementById("display-departure").textContent =
        "Départ : " + (trip.departureDate || "Non précisée");

    document.getElementById("display-return").textContent =
        "Retour : " + (trip.returnDate || "Non précisée");
    
    displayActivities(trip);
}

// Récupère le voyage sauvegardé, s'il existe
const savedTrip = localStorage.getItem("trip");

if (savedTrip) {
    // Transforme le texte JSON en objet JavaScript
    const trip = JSON.parse(savedTrip);
    displayTrip(trip);
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

    const activityName = document.getElementById("activity-name").value;
    // Ajoute l'activité au voyage et sauvegarde la nouvelle version
    trip.activities.push(activityName);
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
        listItem.textContent = activity + " ";

        // Crée un bouton pour supprimer cette activité
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Supprimer";
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