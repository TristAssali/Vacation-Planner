import { getSavedTrip, subscribeToTripChanges } from "./storage.js";
import { getItineraryAlerts } from "./itinerary-alerts.js";
import { showToast, clearToast } from "./toasts.js";

let initialized = false;

export function initializeNotifications() {
    // Évite de brancher plusieurs fois les mêmes événements
    if (initialized) {
        return;
    }

    initialized = true;

    const container = document.querySelector(".notifications");
    const button = document.getElementById("notifications-button");
    const panel = document.getElementById("notifications-panel");
    const count = document.getElementById("notifications-count");
    const list = document.getElementById("notifications-list");
    const empty = document.getElementById("notifications-empty");

    function closePanel() {
        panel.hidden = true;
        button.setAttribute("aria-expanded", "false");
    }

    let previousAlertIds = null;

    function updateNotifications() {
        const alerts = getItineraryAlerts(getSavedTrip());

        const currentAlertIds = new Set(alerts.map(alert => alert.id));

        // Au chargement, remplit seulement la cloche
        if (previousAlertIds !== null) {
            const newAlerts = alerts.filter(
                alert => !previousAlertIds.has(alert.id)
            );

            if (newAlerts.length === 1) {
                showToast(newAlerts[0].message);
            } else if (newAlerts.length > 1) {
                showToast(
                    newAlerts.length +
                    " nouveaux conflits d’horaire. Consulte la cloche."
                );
            } else {
                // Évite de laisser affiché un message qui pourrait être périmé
                clearToast();
            }
        }

        previousAlertIds = currentAlertIds;

        count.textContent = String(alerts.length);
        count.hidden = alerts.length === 0;

        button.setAttribute(
            "aria-label",
            "Notifications : " + alerts.length + " avertissement(s)"
        );

        empty.hidden = alerts.length > 0;
        list.replaceChildren();

        for (const alert of alerts) {
            const item = document.createElement("li");

            // Affiche les noms comme du texte, sans interpréter de HTML
            item.textContent = alert.message;
            list.appendChild(item);
        }
    }

    button.addEventListener("click", function () {
        panel.hidden = !panel.hidden;
        button.setAttribute("aria-expanded", String(!panel.hidden));
    });

    // Ferme la liste lorsqu'on clique ailleurs
    document.addEventListener("click", function (event) {
        if (!container.contains(event.target)) {
            closePanel();
        }
    });

    container.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !panel.hidden) {
            closePanel();
            button.focus();
        }
    });

    // Observateur : recalcule les avertissements après chaque sauvegarde
    subscribeToTripChanges(updateNotifications);

    // Affiche aussi les problèmes déjà présents au chargement
    updateNotifications();
}