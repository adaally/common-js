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



/**
* Sets up ARIA list semantics
 *
 * @param {HTMLElement} container - The slider/carousel container element.
 * @param {string} itemClass - The class selector for individual slide items.
 */
function addListSemantics(container, itemClass) {
    container.setAttribute('role', 'list');
    container.querySelectorAll(itemClass).forEach(item => {
        item.setAttribute('role', 'listitem');
    });
}


/**
 * Sets up ARIA slider semantics for a carousel/slider component.
 * - Assigns role="region" to the container.
 *
 * @param {HTMLElement} container - The slider/carousel container element.
 * @param {string} itemClass - The class selector for individual slide items.
 * @param {string} [titleSelector] - Optional selector for the title element associated with the slider.
 * @param {HTMLElement} [titleElement] - Optional title element associated with the slider.
 */
function addSliderSemantics(container, itemClass, titleSelector, titleElement) {
    if (!container) return;
    container.setAttribute('role', 'region');

    const addIdToTitleIfRequired = (title) => {
        if (title.id) return;
        title.id = `slider_title_${Math.random().toString(16).slice(2)}`;
    };

    if (titleSelector) {
        //If the title is not passed, we try to find a title. The class .container is common on this website, it might vary on other websites
        const containerCarousel = container.closest('.container');
        const title = containerCarousel.querySelector(titleSelector);
        if (title) {
            addIdToTitleIfRequired(title);
            container.setAttribute('aria-labelledby', title.id);
        }
    } else {
        //If there's an existing titleElement passed
        addIdToTitleIfRequired(titleElement);
        container.setAttribute('aria-labelledby', titleElement.id)
    }

    const items = container.querySelectorAll(itemClass);
    items.forEach((item, index) => {
        item.setAttribute('role', 'group');
        item.setAttribute('aria-label', `Slide ${index + 1} of ${items.length}`);
    });
}


/**
 * Toggles visibility of interactive elements within slide items for accessibility.
 *
 * @param {HTMLElement} slideItem - The individual slide item element.
 * @param {boolean} isVisible - Whether the slide item is visible or not.
 */
function toggleElementsVisibility(slideItem, isVisible) {
    const isElementVisible = slideItem.classList.contains('is-selected');
    const actualItemVisibility = isVisible && isElementVisible;
    slideItem.querySelectorAll('a, input, button, select, textarea, [tabindex]').forEach(focusable => {
        focusable.setAttribute('aria-hidden', actualItemVisibility ? 'false' : 'true');
        focusable.setAttribute('tabindex', actualItemVisibility ? '0' : '-1');
        listenImageLazyLoad(slideItem, actualItemVisibility)
    });
}

/**
 * Adds an ARIA description to an element by setting the aria-describedby attribute.
 *
 * @param {HTMLElement} element - The element to which the description will be added.
 * @param {string} descriptionId - The ID of the element that contains the description text.
 */
function setAriaDescribedBy(element, descriptionId) {
    if (!element || !descriptionId) return;
    const existingDescribedBy = element.getAttribute('aria-describedby');
    const describedByIds = existingDescribedBy ? existingDescribedBy.split(' ') : [];
    if (!describedByIds.includes(descriptionId)) {
        describedByIds.push(descriptionId);
        element.setAttribute('aria-describedby', describedByIds.join(' '));
    }
}

function removeAllNoScript() {
    document.querySelectorAll('noscript').forEach(ns => ns.remove());
}
removeAllNoScript();