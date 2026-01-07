/**
 * Sets up a keyboard focus trap inside a dialog/modal to ensure
 * keyboard users cannot tab outside its boundaries while it is open.
 * - Loops focus between the first and last focusable elements with Tab/Shift+Tab.
 * - Closes via Escape key if a close button selector is provided.
 * - Returns focus to the element that opened the dialog (if provided).
 *
 * @param {HTMLElement} container - The dialog or modal element where focus should be trapped.
 * @param {HTMLElement} [openBtn] - The button or element that opened the dialog.
 *                                  It receives focus again when the dialog closes.
 * @param {string} [closeBtnSelector] - Optional selector for a close button inside the dialog.
 *                                      It will be triggered when Escape key is pressed.
 * @param {HTMLElement[]} [focusableElements] - Optional precomputed array of focusable elements
 *                                              within the container. If not provided, it will be
 *                                              automatically computed.
 */
function focusTrapAlly(container, openBtn, closeBtnSelector, focusableElements) {
    let focusables = focusableElements || getFocusableElementsAlly(container);
    if (!focusables.length) return;

    container.tabIndex = '-1';
    container.focus();

    const onKeyDown = (e) => {
        if (e.key !== 'Tab') return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    };

    container.addEventListener('keydown', onKeyDown);

    const removeEscape = onEscape(() => {
        cleanup();
        if (closeBtnSelector) {
            container.querySelector(closeBtnSelector).click();
        }
        if (openBtn) {
            setTimeout(() => openBtn.focus(), 50);
        }
    });

    function onEscape(handler) {
        const escapeListener = (e) => {
            if (e.key === 'Escape' || e.code === 'Escape') handler(e);
        };
        container.addEventListener('keydown', escapeListener);
        return () => container.removeEventListener('keydown', escapeListener);
    }

    function cleanup() {
        container.removeEventListener('keydown', onKeyDown);
        removeEscape();
    }

    return cleanup;
}

function getFocusableElementsAlly(container) {
    return Array.from(
        container.querySelectorAll(`
            a[href]:not([tabindex="-1"]),
            button:not([disabled]):not([tabindex="-1"]),
            input:not([disabled]):not([type="hidden"]),
            select:not([disabled]),
            textarea:not([disabled]),
            [tabindex]:not([tabindex="-1"])
        `)
    );
}
