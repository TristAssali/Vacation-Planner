let activitiesMap = null;
let selectedLocationMarker = null;
let activityMarkers = null;

const savedTrip = localStorage.getItem("trip");
const activityForm = document.getElementById("activity-form");
const activityList = document.getElementById("activity-list");


if (savedTrip) {
    // Transforme le texte JSON en objet JavaScript
    const trip = JSON.parse(savedTrip);
    // Affiche le logement s'il a déjà été enregistré
    if (trip.lodging) {
        document.getElementById("lodging-display").textContent =
            trip.lodging.name + " — " + trip.lodging.address;

        // Préremplit les champs pour faciliter les modifications
        document.getElementById("lodging-name").value = trip.lodging.name;
        document.getElementById("lodging-address").value = trip.lodging.address;
    }
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

    displayActivityMarkers();
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
    // Récupère le point sélectionné, s'il existe
    const coordinates = selectedLocationMarker
        ? selectedLocationMarker.getLatLng()
        : null;

    // Enregistre le nom, l'emplacement écrit et les coordonnées
    const activity = {
        name: activityName,
        location: activityLocation,
        coordinates: coordinates
            ? { lat: coordinates.lat, lng: coordinates.lng }
            : null
    };
    // Ajoute l'objet au voyage
    trip.activities.push(activity);

    localStorage.setItem("trip", JSON.stringify(trip));
    
    // Réaffiche toutes les activités avec leur bouton Supprimer
    displayActivities(trip);
    // Affiche les marqueurs des activités enregistrées
    displayActivityMarkers();
    
    // Vide le formulaire pour faciliter l'ajout suivant
    activityForm.reset();

    // Efface la sélection pour préparer l'activité suivante
    if (selectedLocationMarker) {
        activitiesMap.removeLayer(selectedLocationMarker);
        selectedLocationMarker = null;
    }
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
            const currentTrip = JSON.parse(localStorage.getItem("trip"));

            if (!currentTrip) {
                return;
            }
            // Supprime l'activité et sauvegarde le voyage à jour
            currentTrip.activities.splice(index, 1);
            localStorage.setItem("trip", JSON.stringify(currentTrip));
            // Actualise les listes d'activités
            displayActivities(currentTrip);
            // Retire aussi de la carte le marqueur de l'activité supprimée
            displayActivityMarkers();
        });

        listItem.appendChild(deleteButton);
        activityList.appendChild(listItem);
    }
    displayActivityOverview(trip);
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

// Récupère les boutons et leurs sections
const overviewButton = document.getElementById("overview-button");
const ideasButton = document.getElementById("ideas-button");
const overviewPanel = document.getElementById("overview-panel");
const ideasPanel = document.getElementById("ideas-panel");

// Affiche la vue d'ensemble et cache les idées
overviewButton.addEventListener("click", function () {
    overviewPanel.hidden = false;
    ideasPanel.hidden = true;
    // Met en évidence l'onglet Vue d'ensemble
    overviewButton.classList.add("active");
    ideasButton.classList.remove("active");
});

// Affiche les idées et cache la vue d'ensemble
ideasButton.addEventListener("click", function () {
    overviewPanel.hidden = true;
    ideasPanel.hidden = false;
    // Met en évidence l'onglet Idées et carte
    ideasButton.classList.add("active");
    overviewButton.classList.remove("active");
    requestAnimationFrame(showActivitiesMap);
});

// Retourne à la page de création sans effacer le voyage
document.getElementById("back-button").addEventListener("click", function () {
    window.location.href = "index.html";
});

// Récupère le formulaire d'hébergement
const lodgingForm = document.getElementById("lodging-form");

lodgingForm.addEventListener("submit", function (event) {
    // Empêche le rechargement de la page
    event.preventDefault();

    const name = document.getElementById("lodging-name").value.trim();
    const address = document.getElementById("lodging-address").value.trim();

    // Affiche une erreur pour chaque champ vide
    const nameInput = document.getElementById("lodging-name");
    const addressInput = document.getElementById("lodging-address");
    const nameError = document.getElementById("lodging-name-error");
    const addressError = document.getElementById("lodging-address-error");

    nameInput.setAttribute("aria-invalid", String(!name));
    addressInput.setAttribute("aria-invalid", String(!address));

    nameError.textContent = name ? "" : "Entre le nom du logement.";
    addressError.textContent = address ? "" : "Entre l'adresse du logement.";

    nameError.hidden = Boolean(name);
    addressError.hidden = Boolean(address);

    // Arrête l'enregistrement et sélectionne le premier champ invalide
    if (!name || !address) {
        if (!name) {
            nameInput.focus();
        } else {
            addressInput.focus();
        }

        return;
    }

    // Récupère la version actuelle du voyage pour conserver ses activités
    const savedTrip = localStorage.getItem("trip");

    if (!savedTrip) {
        alert("Crée d'abord un voyage.");
        return;
    }

    const trip = JSON.parse(savedTrip);

    // Ajoute ou remplace le logement dans le voyage
    trip.lodging = {
        name: name,
        address: address
    };

    localStorage.setItem("trip", JSON.stringify(trip));

    // Affiche le logement enregistré
    document.getElementById("lodging-display").textContent =
        name + " — " + address;
    lodgingDialog.close();
});

// Récupère la fenêtre et ses boutons
const lodgingDialog = document.getElementById("lodging-dialog");
const editLodgingButton = document.getElementById("edit-lodging-button");
const closeLodgingButton = document.getElementById("close-lodging-button");

// Ouvre le formulaire avec les informations enregistrées
editLodgingButton.addEventListener("click", function () {
    const trip = JSON.parse(localStorage.getItem("trip"));

    // Réinitialise les champs pour abandonner les modifications non enregistrées
    document.getElementById("lodging-name").value =
        trip?.lodging?.name || "";
    document.getElementById("lodging-address").value =
        trip?.lodging?.address || "";

    // Réinitialise les erreurs à chaque ouverture de la fenêtre
    for (const fieldId of ["lodging-name", "lodging-address"]) {
        document.getElementById(fieldId).removeAttribute("aria-invalid");

        const error = document.getElementById(fieldId + "-error");
        error.hidden = true;
        error.textContent = "";
    }

    lodgingDialog.showModal();
});

// Ferme la fenêtre sans enregistrer
closeLodgingButton.addEventListener("click", function () {
    lodgingDialog.close();
});

// Retire l'erreur dès que le champ contient du texte
for (const fieldId of ["lodging-name", "lodging-address"]) {
    const input = document.getElementById(fieldId);
    const error = document.getElementById(fieldId + "-error");

    input.addEventListener("input", function () {
        if (input.value.trim()) {
            input.removeAttribute("aria-invalid");
            error.hidden = true;
            error.textContent = "";
        }
    });
}

// Conserve la carte pour ne la créer qu'une seule fois
function showActivitiesMap() {
    if (!activitiesMap) {
        // Centre temporairement la carte sur New York
        activitiesMap = L.map("activities-map").setView(
            [40.7128, -74.0060],
            12
        );

        // Ajoute le fond de carte et les crédits OpenStreetMap
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(activitiesMap);

        // Sélectionne un emplacement lorsque l'utilisateur clique sur la carte
        activitiesMap.on("click", function (event) {
            const coordinates = event.latlng;

            // Déplace le marqueur existant ou en crée un nouveau
            if (selectedLocationMarker) {
                selectedLocationMarker.setLatLng(coordinates);
            } else {
                selectedLocationMarker = L.marker(coordinates).addTo(activitiesMap);
            }
        });
    }

    // Ajuste la carte à l'espace disponible après l'affichage de l'onglet
    activitiesMap.invalidateSize();

    displayActivityMarkers();
}

// Met à jour les marqueurs à partir du voyage sauvegardé
function displayActivityMarkers() {
    // Attend que la carte soit créée
    if (!activitiesMap) {
        return;
    }

    if (!activityMarkers) {
        activityMarkers = L.layerGroup().addTo(activitiesMap);
    }

    // Retire les anciens marqueurs pour éviter les doublons
    activityMarkers.clearLayers();

    const trip = JSON.parse(localStorage.getItem("trip"));

    for (const activity of trip?.activities || []) {
        if (!activity.coordinates) {
            continue;
        }

        // Utilise du texte pour afficher le nom sans interpréter du HTML
        const popupContent = document.createElement("span");
        popupContent.textContent = activity.name;

        L.marker([
            activity.coordinates.lat,
            activity.coordinates.lng
        ])
            .bindPopup(popupContent)
            .addTo(activityMarkers);
    }
}