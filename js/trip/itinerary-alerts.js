// Retourne les avertissements sans modifier le voyage
export function getItineraryAlerts(trip) {
    const alerts = [];
    const activities = new Map(
        (trip?.activities || []).map(activity => [
            activity.id,
            activity
        ])
    );

    for (const [dayIndex, day] of (trip?.days || []).entries()) {
        const timedEntries = [];

        for (const entry of day.items || []) {
            const activity = activities.get(entry.activityId);

            // Ignore les activités supprimées ou sans heure
            if (!activity || !entry.startTime) {
                continue;
            }

            const duration = entry.durationMinutes;

            // Sans durée, aucun conflit ne peut être confirmé
            if (!Number.isFinite(duration) || duration <= 0) {
                continue;
            }
        

            const [hours, minutes] = entry.startTime.split(":").map(Number);
            const start = hours * 60 + minutes;

            timedEntries.push({
                entry,
                name: activity.name,
                start,
                end: start + duration
            });
        }

        // Trie une copie des horaires, sans changer l'ordre du programme
        timedEntries.sort((a, b) => a.start - b.start);

        for (let i = 0; i < timedEntries.length; i++) {
            const first = timedEntries[i];

            for (let j = i + 1; j < timedEntries.length; j++) {
                const second = timedEntries[j];

                // Les suivantes commencent encore plus tard
                if (second.start >= first.end) {
                    break;
                }

                // Identifiant stable même si les activités changent d'ordre
                const entryIds = [
                    first.entry.id,
                    second.entry.id
                ].sort();

                alerts.push({
                    id: "overlap:" + entryIds.join(":"),
                    type: "overlap",
                    message:
                        first.name + " et " + second.name +
                        " se chevauchent au jour " + (dayIndex + 1) + ".",
                    dayId: day.id,
                    entryIds
                });
            }
        }
    }

    return alerts;
}