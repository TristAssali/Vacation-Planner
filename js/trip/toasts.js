let dismissTimer;
let currentToast;

// Affiche un seul message temporaire à la fois
export function showToast(message) {
    const container = document.getElementById("toast-container");

    clearTimeout(dismissTimer);

    const toast = document.createElement("div");
    toast.className = "toast";

    const text = document.createElement("p");
    text.textContent = message;

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "toast-close";
    closeButton.textContent = "×";
    closeButton.setAttribute("aria-label", "Fermer la notification");

    function dismiss() {
        clearTimeout(dismissTimer);
        toast.remove();

        if (currentToast === toast) {
            currentToast = null;
        }
    }

    function scheduleDismiss() {
        clearTimeout(dismissTimer);

        // Laisse le temps de lire tant que la souris ou le clavier est dessus
        if (toast.matches(":hover") || toast.contains(document.activeElement)) {
            return;
        }

        dismissTimer = setTimeout(dismiss, 3000);
    }

    closeButton.addEventListener("click", dismiss);
    toast.addEventListener("mouseenter", function () {
        clearTimeout(dismissTimer);
    });
    toast.addEventListener("mouseleave", scheduleDismiss);
    toast.addEventListener("focusin", function () {
        clearTimeout(dismissTimer);
    });
    toast.addEventListener("focusout", scheduleDismiss);

    toast.append(text, closeButton);
    currentToast = toast;
    container.replaceChildren(toast);

    scheduleDismiss();
}

// Retire un avertissement temporaire devenu inutile
export function clearToast() {
    clearTimeout(dismissTimer);
    currentToast?.remove();
    currentToast = null;
}