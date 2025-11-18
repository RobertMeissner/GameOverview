// Page load analytics
gtag('event', 'page_view', {
    page_title: 'BacklogBlitz Landing Page',
    page_location: window.location.href
});

// Scroll tracking
let scrollThresholds = [25, 50, 75, 90];
let triggeredThresholds = [];

window.addEventListener('scroll', () => {
    const scrollPercent = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);

    scrollThresholds.forEach(threshold => {
        if (scrollPercent >= threshold && !triggeredThresholds.includes(threshold)) {
            triggeredThresholds.push(threshold);
            trackEvent('scroll', 'engagement', `${threshold}_percent`);
        }
    });
});

// Time on page tracking
let startTime = Date.now();
window.addEventListener('beforeunload', () => {
    const timeOnPage = Math.round((Date.now() - startTime) / 1000);
    trackEvent('engagement', 'time_on_page', timeOnPage.toString());
});

// Section visibility tracking
const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px 0px -100px 0px'
};

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const sectionName = entry.target.id || entry.target.className;
            trackEvent('section_view', 'engagement', sectionName);
        }
    });
}, observerOptions);

// Observe main sections
document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        sectionObserver.observe(section);
    });
});

// Button hover tracking
document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.cta-button, .tier-button');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            trackEvent('button_hover', 'engagement', button.textContent.trim());
        });
    });
});

// Form interaction tracking (for future use)
function trackFormStart(formName) {
    trackEvent('form_start', 'engagement', formName);
}

function trackFormComplete(formName) {
    trackEvent('form_complete', 'conversion', formName);
}

function trackFormError(formName, errorType) {
    trackEvent('form_error', 'error', `${formName}_${errorType}`);
}
