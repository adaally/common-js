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


/**
 * JUDG.ME WIDGET FIXES
 */
function fixReviews() {
    if (!window.location.pathname.includes('/products')) return;
    const container = document.querySelector('.jdgm-rev-widg');

    if (!container) return;

    const updateReviewList = () => {
        const reviewsSection = container.querySelector('.jdgm-rev-widg__reviews');
        reviewsSection.querySelectorAll('.jdgm-rev').forEach(review => {
            fixReviewItem(review);
        });
    };

    const bodyreviews = document.querySelector('.jdgm-rev-widg__body');
    if (bodyreviews) {
        new MutationObserver(() => {
            updateReviewList();
        }).observe(bodyreviews, {
            childList: true,
            subtree: true
        });
    }

    fixBadges(container);
    fixRatingSection(container);
    fixAverage(container);
    updateReviewList();
    fixCountdown(container);
    fixEmailValidationMessage(container);
    fixNotificationAlert(container);
    focusFirstErrorOnSubmit(container);
    fixAskQuestionForm(container);
    tabListToReviewsQuestions(container);
    paginationSemantics(container);
    fixQuestionsSection(container);
    focusStarFirst(container);

    function focusStarFirst(container) {
        const observerReviewBtn = new MutationObserver(() => {
            const reviewBtn = container.querySelector('.jdgm-write-rev-link');
            if (reviewBtn) {
                reviewBtn.addEventListener('click', () => {
                    setTimeout(() => {
                        const stars = container.querySelectorAll('.jdgm-form__fieldset a.jdgm-star');
                        if (stars.length > 0) {
                            stars[0].focus()
                        }
                    }, 200);
                });

                reviewBtn.addEventListener('click', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        reviewBtn.click();
                    }
                })

                observerReviewBtn.disconnect();
            }
        });

        observerReviewBtn.observe(container, {
            subtree: true,
            childList: true
        })
    }

    function paginationSemantics(container) {
        const observe = (paginationObserver) => {
            paginationObserver.observe(container, {
                subtree: true,
                childList: true
            });
        };

        const paginationObserver = new MutationObserver(() => {
            const pagination = container.querySelector('.jdgm-paginate');
            if (!pagination) return;
            paginationObserver.disconnect();
            pagination.setAttribute('role', 'navigation');
            pagination.setAttribute('aria-label', 'Pagination');
            const pages = pagination.querySelectorAll(
                '.jdgm-paginate__page:not(.jdgm-paginate__next-page):not(.jdgm-paginate__last-page)'
            );
            pages.forEach(page => {
                page.setAttribute('aria-current', page.classList.contains('jdgm-curt'));
                page.addEventListener('click', () => observe(paginationObserver));
                page.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') observe(paginationObserver);
                });
            });

            pagination.querySelectorAll('.jdgm-paginate__next-page, .jdgm-paginate__prev-page').forEach(page => {
                page.setAttribute('tabindex', '-1');
                page.setAttribute('aria-hidden', 'true');
            });
        })

        observe(paginationObserver);
    }

    function tabListToReviewsQuestions(container) {
        const tabsObserver = new MutationObserver(() => {
            const tabsContainer = container.querySelector('.jdgm-subtab');
            if (!tabsContainer) return;
            const tabs = Array.from(tabsContainer.querySelectorAll('.jdgm-subtab__name'));

            // Add tablist role
            tabsContainer.setAttribute('role', 'tablist');

            tabs.forEach((tab, index) => {
                tab.setAttribute('role', 'tab');

                const isActive = tab.classList.contains('jdgm--active');

                tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
                tab.tabIndex = isActive ? 0 : -1;

                // Assign an ID if none exists (required for tabpanel linking)
                if (!tab.id) tab.id = `jdgm-tab-${index}`;

                // Create aria-controls if missing (safe fallback)
                if (!tab.hasAttribute('aria-controls')) {
                    tab.setAttribute('aria-controls', `jdgm-tabpanel-${index}`);
                }

                // Handle click activation
                tab.addEventListener('click', () => activateTab(tab));

                // Keyboard navigation
                tab.addEventListener('keydown', e => {
                    const curr = tabs.indexOf(tab);
                    let next = null;

                    if (e.key === 'ArrowRight') {
                        next = tabs[curr + 1] || tabs[0];
                    } else if (e.key === 'ArrowLeft') {
                        next = tabs[curr - 1] || tabs[tabs.length - 1];
                    } else if (e.key === 'Home') {
                        next = tabs[0];
                    } else if (e.key === 'End') {
                        next = tabs[tabs.length - 1];
                    } else if (e.key === 'Enter' || e.key === ' ') {
                        activateTab(tab);
                    }

                    if (next) {
                        e.preventDefault();
                        next.focus();
                    }
                });
            });

            function activateTab(selected) {
                tabs.forEach(tab => {
                    const isSelected = tab === selected;
                    tab.classList.toggle('jdgm--active', isSelected);
                    tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');
                    tab.tabIndex = isSelected ? 0 : -1;
                });
            }

            tabsObserver.disconnect();
        });

        tabsObserver.observe(container, {
            subtree: true,
            childList: true
        })
    }

    function fixReviewItem(item) {
        item.setAttribute('role', 'group');
        const reviewId = item.getAttribute('data-review-id');
        const userContainer = item.querySelector('.jdgm-rev__author-wrapper');
        userContainer.id = reviewId;
        item.setAttribute('aria-labelledby', userContainer.id);
        const icon = item.querySelector('.jdgm-rev__icon');
        if (icon) {
            icon.setAttribute('aria-hidden', 'true');
        }

        const rating = item.querySelector('.jdgm-rev__rating');
        if (rating) {
            const value = rating.getAttribute('data-score');
            rating.setAttribute('aria-label', `${value} out of 5 stars`);
            rating.removeAttribute('tabindex');
        }

        listenToThumbsUp(item);

        function listenToThumbsUp(item) {
            const observer = new MutationObserver(() => {
                const voteContainer = item.querySelector('.jdgm-rev__votes-inner');
                if (voteContainer) {
                    const username = userContainer.querySelector('.jdgm-rev__author').innerText;
                    const voteNumbers = voteContainer.querySelectorAll('.jdgm-rev__thumb-count');
                    voteContainer.querySelectorAll('.jdgm-rev__thumb-btn').forEach((voteBtn, index) => {
                        voteBtn.setAttribute('role', 'button');
                        voteBtn.removeAttribute('title');
                        voteNumbers[index].id = `vote_${index}_${reviewId}`;

                        const isPositive = voteBtn.classList.contains('jdgm-rev_thumb-up');
                        voteBtn.setAttribute('aria-label', `${username}'s review ${isPositive ? 'was' : 'was not'} helpful`);
                        voteBtn.setAttribute('aria-describedby', voteNumbers[index].id);

                        const oldValue = voteNumbers[index].innerText;

                        const verifyPress = () => {
                            setTimeout(() => {
                                const newValue = voteNumbers[index].innerText;
                                if (newValue !== oldValue) {
                                    voteBtn.setAttribute('aria-pressed', 'true');
                                }
                            }, 500);

                        }
                        voteBtn.addEventListener('click', verifyPress);
                        voteBtn.addEventListener('keydown', (e) => {
                            if (e.key === 'Enter') {
                                verifyPress();
                            }
                        });
                    });

                    observer.disconnect();
                }
            });

            observer.observe(item, {
                subtree: true,
                childList: true
            });
        }


    }

    function fixRatingSection(container) {
        const list = container.querySelector('.jdgm-histogram');
        if (!list) return;

        list.setAttribute('role', 'list');
        list.setAttribute('aria-label', 'Ratings Distribution');
        list.querySelectorAll('.jdgm-histogram__row').forEach(row => {

            if (!row.classList.contains('jdgm-histogram__clear-filter')) {
                row.setAttribute('role', 'listitem');
                row.querySelectorAll('.jdgm-histogram__bar, .jdgm-histogram__frequency').forEach(el => {
                    el.setAttribute('aria-hidden', 'true');
                })
            } else {
                row.setAttribute('role', 'button');
            }

        });
    }

    function fixBadges(container) {
        const badgeContainer = container.querySelector('.jdgm-medals .jdgm-medals__container');
        if (!badgeContainer) return;

        badgeContainer.setAttribute('aria-label', 'Judge.me badges');
        badgeContainer.setAttribute('role', 'list');
        badgeContainer.querySelectorAll('.jdgm-medal-wrapper').forEach(badge => {
            badge.setAttribute('role', 'listitem');
            badge.removeAttribute('title');
        })
    }

    function fixAverage(container) {
        const average = container.querySelector('.jdgm-rev-widg__summary-stars');
        if (!average) return;
        average.removeAttribute('aria-label');
        average.removeAttribute('role');
        average.querySelectorAll('.jdgm-star').forEach(star => {
            star.setAttribute('aria-hidden', 'true');
        })
    }

    function fixCountdown(container) {
        const formObserver = new MutationObserver(() => {
            const formWrapper = container.querySelector('.jdgm-form-wrapper');
            if (formWrapper && formWrapper.style.display !== 'none') {
                const countdowns = formWrapper.querySelectorAll('.jdgm-countdown');

                countdowns.forEach((countdown, index) => {
                    if (countdown.hasAttribute('data-countdown-fixed')) return;
                    countdown.setAttribute('data-countdown-fixed', 'true');
                    countdown.id = `countdown_` + index;

                    const formFieldContainer = countdown.closest('.jdgm-form__fieldset');
                    if (formFieldContainer) {
                        const field = formFieldContainer.querySelector('input, textarea');
                        if (field) {
                            field.setAttribute('aria-describedby', countdown.id);
                        }
                    }

                    const observer = new MutationObserver(() => {
                        if (countdown.textContent.trim() && !countdown.querySelector('.visually-hidden')) {
                            const hiddenSpan = document.createElement('span');
                            hiddenSpan.className = 'visually-hidden';
                            hiddenSpan.textContent = ' characters remaining';
                            countdown.appendChild(hiddenSpan);
                        }
                    });

                    observer.observe(countdown, {
                        childList: true,
                        characterData: true,
                        subtree: true
                    });

                    if (countdown.textContent.trim() && !countdown.querySelector('.visually-hidden')) {
                        const hiddenSpan = document.createElement('span');
                        hiddenSpan.className = 'visually-hidden';
                        hiddenSpan.textContent = ' characters remaining';
                        countdown.appendChild(hiddenSpan);
                    }
                });
            }
        });

        formObserver.observe(container, {
            childList: true,
            subtree: true,
            attributes: true
        });
    }

    function fixAskQuestionForm(container) {
        const formObserver = new MutationObserver(() => {
            const formWrapper = container.querySelector('.jdgm-question-form-wrapper');
            if (formWrapper && formWrapper.style.display !== 'none') {
                const titleAskQuestion = container.querySelector('.jdgm-question-form-wrapper div.jdgm-form__title');
                if (titleAskQuestion) {
                    const h3 = document.createElement('h3');
                    h3.innerText = titleAskQuestion.innerText;
                    h3.className = titleAskQuestion.className;
                    titleAskQuestion.replaceWith(h3);
                }

                const nameInput = container.querySelector('#jdgm_question_reviewer_name:not([autocomplete])');
                if (nameInput) {
                    nameInput.setAttribute('autocomplete', 'name')
                    // nameInput.setAttribute('aria-required', 'true')
                }

                const emailInput = container.querySelector('#jdgm_question_reviewer_email:not([autocomplete])');
                if (emailInput) {
                    emailInput.setAttribute('autocomplete', 'email')
                    // emailInput.setAttribute('aria-required', 'true')
                }
                const formContainer = container.querySelector('.jdgm-question-form:not([applied])')
                if (formContainer) {
                    formContainer.querySelectorAll('label').forEach(label => {
                        label.innerText = label.innerText + '*'
                    });
                    // const questionTextArea = container.querySelector('#jdgm_question_content');
                    // if(questionTextArea) {
                    //     questionTextArea.setAttribute('aria-required', 'true')
                    // }
                    formContainer.setAttribute('applied', 'true');
                }
            }
        });

        formObserver.observe(container, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style']
        });
    }


    function fixEmailValidationMessage(container) {
        const formObserver = new MutationObserver(() => {
            const formWrapper = container.querySelector('.jdgm-form-wrapper');
            if (formWrapper && formWrapper.style.display !== 'none') {
                const form = formWrapper.querySelector('form:not([applied])');
                if (form) {
                    form.setAttribute('applied', 'true');
                    form.querySelectorAll('input[name="reviewer_name"], input[name="reviewer_email"]').forEach(input => {
                        const parent = input.parentNode;
                        const label = parent.querySelector('label');
                        label.innerText = label.innerText + '*';

                        if (input.getAttribute('name') === 'reviewer_name') {
                            input.setAttribute('autocomplete', 'name');
                            input.setAttribute('aria-required', 'true');
                        } else {
                            input.setAttribute('autocomplete', 'email');
                            input.setAttribute('aria-required', 'true');
                        }
                    });
                    const textarea = form.querySelector('textarea');
                    textarea.setAttribute('aria-required', 'true');
                    const parent = textarea.closest('.jdgm-form__body-fieldset');
                    const label = parent.querySelector('label');
                    label.innerText = label.innerText + '*';

                    const stars = form.querySelector('.jdgm-form__rating-fieldset');
                    const labelStars = stars.querySelector('label');
                    labelStars.innerText = labelStars.innerText + '*';

                    const fileInput = document.querySelector('input[type="file"]');
                    if (fileInput) {
                        fileInput.title = '';
                    }

                    new MutationObserver(() => {
                        const deleteBtn = form.querySelector('.jdgm-picture-fieldset__delete');
                        if (deleteBtn) {
                            deleteBtn.setAttribute('aria-label', 'Remove media');
                            deleteBtn.setAttribute('role', 'button');
                            deleteBtn.setAttribute('tabindex', '0');
                        }
                    }).observe(form, { subtree: true, childList: true });

                    makeStarsRadioGroup(form);
                }

                const titleAskQuestion = formWrapper.querySelector('h2.jdgm-form__title');
                if (titleAskQuestion) {
                    const h3 = document.createElement('h3');
                    h3.innerText = titleAskQuestion.innerText;
                    h3.className = titleAskQuestion.className;
                    titleAskQuestion.replaceWith(h3);
                }

                const emailFieldset = formWrapper.querySelector('.jdgm-form__email-fieldset');
                if (!emailFieldset) return;

                if (emailFieldset.hasAttribute('data-email-error-fixed')) return;
                emailFieldset.setAttribute('data-email-error-fixed', 'true');

                const emailInput = emailFieldset.querySelector('input[type="email"]');
                if (!emailInput) return;

                const applyMessage = () => {
                    const describedBy = emailInput.getAttribute('aria-describedby');
                    let errorElement = null;

                    if (describedBy) {
                        errorElement = document.getElementById(describedBy);
                    }

                    if (!errorElement) {
                        errorElement = emailFieldset.querySelector('.jdgm-input-error');
                    }

                    if (errorElement && errorElement.textContent.trim() === 'Please enter a valid email address.') {
                        errorElement.textContent = 'Please enter a valid email address in the format user@example.com';
                    }
                };

                applyMessage();

                const observer = new MutationObserver(() => {
                    applyMessage();
                });

                observer.observe(emailFieldset, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['class', 'aria-invalid', 'aria-describedby']
                });
            }
        });

        formObserver.observe(container, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style']
        });
    }

    function makeStarsRadioGroup(container) {
        const stars = Array.from(container.querySelectorAll('.jdgm-star'));
        const input = container.querySelector('input[name="score"]');

        if (!stars.length) return;
        container.setAttribute('role', 'radiogroup');

        const parent = stars[0].parentNode;
        if (parent) {
            parent.className = parent.className + "2";
        }

        // Init stars
        stars.forEach((star, index) => {
            star.setAttribute('role', 'radio');
            star.setAttribute('tabindex', index === 0 ? '0' : '-1');
            star.setAttribute('aria-checked', 'false');
            star.removeAttribute('title');

            // Mouse
            star.addEventListener('click', () => {
                select(index, { focus: false });
            });

            // Keyboard
            star.addEventListener('keydown', e => {
                switch (e.key) {
                    case 'Enter':
                    case ' ':
                        e.preventDefault();
                        select(index);
                        break;
                    case 'ArrowRight':
                        move(index + 1);
                        break;
                    case 'ArrowLeft':
                        move(index - 1);
                        break;
                }
            });
        });

        function select(i, { focus = true } = {}) {
            if (i < 0 || i >= stars.length) return;

            stars.forEach((star, idx) => {
                const isOn = idx <= i;
                const isSelected = idx === i;

                star.classList.toggle('jdgm--on', isOn);
                star.classList.toggle('jdgm--off', !isOn);
                star.setAttribute('aria-checked', isSelected ? 'true' : 'false');
                star.tabIndex = isSelected ? 0 : -1;
            });

            if (focus) {
                stars[i].focus();
            }

            const parent = stars[0].parentNode;
            if (parent) {
                parent.querySelector('input').setAttribute('aria-invalid', parent.querySelectorAll('a.jdgm--on').length ? 'false' : 'true');
            }
            input.value = stars[i].dataset.alt;
        }

        function move(i) {
            if (i < 0 || i >= stars.length) return;

            stars.forEach(s => (s.tabIndex = -1));
            stars[i].tabIndex = 0;
            stars[i].focus();
        }
    }


    function fixNotificationAlert(container) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && node.classList.contains('jdgm-notification')) {
                        const titleElement = node.querySelector('.jdgm-notification__title');
                        if (titleElement && !titleElement.hasAttribute('data-alert-role-added')) {
                            titleElement.setAttribute('role', 'alert');
                            titleElement.setAttribute('data-alert-role-added', 'true');
                        }
                    }
                });
            });
        });

        observer.observe(container, {
            childList: true,
            subtree: true
        });
    }

    function focusFirstErrorOnSubmit(container) {
        const formObserver = new MutationObserver(() => {
            const formWrapper = container.querySelector('.jdgm-form-wrapper');
            if (formWrapper && formWrapper.style.display !== 'none') {
                const form = formWrapper.querySelector('.jdgm-form');
                if (!form || form.hasAttribute('data-focus-error-attached')) return;

                form.setAttribute('data-focus-error-attached', 'true');

                form.addEventListener('submit', () => {
                    setTimeout(() => {
                        const errors = form.querySelectorAll('[aria-invalid="true"]');
                        if (errors.length > 0) {
                            const field = errors[0];
                            //Changed the class for stars to stop listening to the library star update
                            const fieldset = field.closest('.jdgm-form__rating2');
                            if (fieldset) {
                                fieldset.querySelector('input').setAttribute('aria-invalid', fieldset.querySelectorAll('a.jdgm--on').length ? 'false' : 'true');
                                const firstStar = fieldset.querySelector('a');
                                if (firstStar) {
                                    firstStar.focus();
                                }


                            } else {
                                field.focus();
                            }

                        }
                    }, 150);
                });
            }
        });

        formObserver.observe(container, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style']
        });
    }

    function fixQuestionsSection(container) {
        const observer = new MutationObserver((mutations) => {
            const questionsContainer = container.querySelector('.jdgm-quest-widg__body');
            if (!questionsContainer) return;

            questionsContainer.querySelectorAll('.jdgm-quest').forEach((item, index) => {
                item.setAttribute('role', 'group');
                const author = item.querySelector('.jdgm-rev__author');
                if (author) {
                    author.id = `quest_${index}`;
                    item.setAttribute('aria-labelledby', author.id)
                }

                const profile = item.querySelector('.jdgm-rev__icon');
                if (profile) {
                    profile.setAttribute('aria-hidden', 'true');
                }
            });
        });

        observer.observe(container, {
            childList: true,
            subtree: true
        });
    }

}

fixReviews();

/** ------------------------------------------------- END OF JUDG.ME WIDGET FIXES ------------------------------------------------- */

/**
 * Fix redundant link(.ada-span-link)
 * Works when we have access to the HTML and we can replace all redundant links with <span class="ada-span-link">
 * It simulates a link behaviour when clicking it
 * Requires a parent element selector
 * Usage: fixThumbnailRedundantLink('.featured-collection__container');
 */
function fixThumbnailRedundantLink(parentSelector) {
    document.querySelectorAll(`${parentSelector} .ada-span-link`).forEach(element => {
        const href = element.getAttribute('href');

        if (href) {
            element.style.cursor = 'pointer'
            element.addEventListener('click', () => {
                window.location.href = href;
            });
        }
    });
}

/** ------------------------------------------------- END OF Fix redundant link(.ada-span-link) ------------------------------------------------- */


/**
 * Slider scroll-snap-type fixes
 * Adds slider functionality with ARIA semantics for better accessibility on mobile devices(If required we can remove the width validator to work also on desktop).
 * This should be used when the slider container has 'scroll-snap-type' 'scroll' funcionality not when they are using flickity for example, 
 * since flickity already has options to add accessibility fixes
 * Requires: 
 * - A parent container selector for the slider
 * - A child selector for the individual slides within the slider container
 * Usage example: sliderOnMobile('.featured-collection__container', '.product-grid-item'); https://kononutrition.com/
 */
function sliderOnMobile(parentSelector, childSelector) {
    if (window.innerWidth < 768) {
        document.querySelectorAll(parentSelector).forEach(container => {
            const slides = container.querySelectorAll(childSelector);
            addSliderSemantics(container, slides);
            appendSliderArrows(slides, container);
            intersectionObserverAda(slides, container);
        });
    }
}

function addSliderSemantics(container, slides) {
    container.setAttribute('role', 'region');

    const firstChild = container.querySelector(':scope > div');

    if (firstChild) {
        firstChild.tabIndex = '-1';
    }

    const oldList = container.querySelector('[role="list"]');
    if (oldList) {
        const ariaLabel = oldList.getAttribute('aria-label');
        if (ariaLabel) {
            container.setAttribute('aria-label', ariaLabel);
            oldList.removeAttribute('role');
            oldList.removeAttribute('aria-label');
        }
    }
    slides.forEach((slide, index) => {
        slide.setAttribute('role', 'group');
        slide.setAttribute('aria-label', `Slide ${index + 1} of ${slides.length}`)
    });
}


function appendSliderArrows(slides, wrapperContainer) {
    /* --------------------
        Create arrows
    --------------------- */
    const controls = document.createElement('div');
    controls.className = 'tent-slider-controls';
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', 'Slider controls');

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'ally-carousel-btn prev';
    prevBtn.setAttribute('aria-label', 'Previous slide');
    prevBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
        `;

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'ally-carousel-btn next';
    nextBtn.setAttribute('aria-label', 'Next slide');
    nextBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
        `;

    wrapperContainer.style.position = 'relative';

    // controls.append(prevBtn, nextBtn);
    wrapperContainer.append(prevBtn, nextBtn);
    let currentIndex = 0;

    function moveTo(index) {
        currentIndex = Math.max(0, Math.min(index, slides.length - 1));

        slides[currentIndex].scrollIntoView({
            behavior: 'smooth',
            inline: 'start',
            block: 'nearest'
        });
    }

    prevBtn.addEventListener('click', () => moveTo(currentIndex - 1));
    nextBtn.addEventListener('click', () => moveTo(currentIndex + 1));
}

function intersectionObserverAda(slides, parent, visibilityPercentage = 0.9) {
    const observer = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                const isVisible = entry.intersectionRatio >= visibilityPercentage;
                entry.target.setAttribute(
                    'aria-hidden',
                    isVisible ? 'false' : 'true'
                );

                entry.target.querySelectorAll('a, button, [tabindex]').forEach(element => {
                    element.setAttribute('tabindex', isVisible ? '0' : '-1');
                });
            });
        },
        {
            root: parent,
            threshold: [visibilityPercentage]
        }
    );

    slides.forEach(slide => observer.observe(slide));
}

/** ------------------------------------------------- END OF Slider scroll-snap-type fixes ------------------------------------------------- */


/**
 * Flickity slider fixes
 * Listens for Flickity sliders being added to the page and applies accessibility fixes to them.
 * Usage: listenToFlickitySliders();
 */
function listenToFlickitySliders() {
    document.querySelectorAll('.flickity-enabled')
        .forEach(handleNewCarousel);

    const obs = new MutationObserver((mutations) => {
        for (const m of mutations) {

            // New nodes added
            if (m.type === 'childList') {
                for (const node of m.addedNodes) {
                    if (!(node instanceof HTMLElement)) continue;

                    if (node.classList.contains('flickity-enabled')) {
                        handleNewSlider(node);
                    }

                    node.querySelectorAll?.('.flickity-enabled')
                        .forEach(handleNewSlider);
                }
            }

            // Existing nodes getting the class later
            if (m.type === 'attributes' && m.attributeName === 'class') {
                const el = m.target;

                if (el.classList.contains('flickity-enabled')) {
                    handleNewSlider(el);
                }
            }
        }
    });

    obs.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
    });


    function handleNewSlider(slider) {
        // Avoid duplicates
        if (slider._modified) return;
        slider._modified = true;
        slider.removeAttribute('tabindex');
        // Once the slider is found we look for all the children elements
        // So we can add all the selectors we find in the different implementations of the sliders
        // Here for the homepage product slider we have .product-grid-item, for the testimonial slider we have .testimonial__item 
        const slides = slider.querySelectorAll('.product-grid-item, .testimonial__item');

        //For each new slider we apply slider semantics
        addSliderSemantics(slider, slides);
    }
}

/** ------------------------------------------------- END OF Flickity slider fixes ------------------------------------------------- */


/**
 * Dropdown keyboard navigation fixes .(https://kononutrition.com/collections/all)
 * Usage fixCollectionSortOptions('.collection__sort__option-wrapper', '.collection__sort__button')
*/
function fixCollectionSortOptions(parentSelector, itemSelector) {
    document.querySelectorAll(parentSelector).forEach(wrapper => {

        const labels = [...wrapper.querySelectorAll(itemSelector)];
        labels.forEach(label => {
            //Here we change the state of all the options to false, but we need to find a way to find the selected one and set it to true
            updateOption(label, false);
        });

        wrapper.addEventListener('keydown', (e) => {
            if (!e.target.matches(itemSelector)) return;

            const index = labels.indexOf(e.target);
            labels.forEach(item => item.tabIndex = -1);
            // Arrow navigation
            if (['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(e.key)) {
                e.preventDefault();

                let nextIndex = index;

                if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                    nextIndex = (index + 1) % labels.length;
                }

                if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                    nextIndex = (index - 1 + labels.length) % labels.length;
                }
                updateOption(labels[nextIndex], true);
            }

            // Activate option
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.target.click(); // triggers the hidden radio via label
            }
        });

        function updateOption(option, active) {
            option.setAttribute('role', 'radio');
            option.setAttribute('aria-checked', active ? 'true' : 'false');
            option.setAttribute('tabindex', active ? '0' : '-1');
        }

    });
}

/** ------------------------------------------------- END OF Dropdown keyboard navigation fixes ------------------------------------------------- */



/** 
 * Product Page single accordion widget fixes
 * Groups accordions in a single container and adds list semantics
*/
function groupAccordionsAndAddListSemantics() {

    const accordions = document.querySelectorAll('.product__accordions');

    if (accordions.length) {
        const wrapper = document.createElement('div');
        wrapper.setAttribute('role', 'list');
        wrapper.setAttribute('aria-label', 'Product information');

        const parent = accordions[0].parentNode;
        parent.insertBefore(wrapper, accordions[0]);

        accordions.forEach(acc => {
            acc.setAttribute('role', 'listitem');
            wrapper.appendChild(acc);
        });
    }
}


/** ------------------------------------------------- END OF Product Page single accordion widget fixes ------------------------------------------------- */