console.log("JavaScript est connecté !");

const tripForm = document.getElementById("trip-form");
// Récupère le formulaire et la liste des activités

tripForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const tripName = document.getElementById("trip-name").value.trim();
    const destination = document.getElementById("destination").value.trim();
    // Vérifie que les deux champs contiennent du texte
    if (!tripName || !destination) {
        alert("Entre un nom de voyage et une destination.");
        return;
    }
    const departureDate = document.getElementById("departure-date").value;
    const returnDate = document.getElementById("return-date").value;
    // Vérifie que le retour ne précède pas le départ
    if (departureDate && returnDate && returnDate < departureDate) {
        alert("La date de retour doit être après la date de départ.");
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