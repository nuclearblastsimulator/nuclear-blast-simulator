// Google Analytics Event Tracking for Nuclear Blast Simulator
// This file handles all analytics events for user behavior tracking

// Analytics helper object
const Analytics = {
    // Track if analytics is available
    isAvailable: function() {
        return typeof gtag !== 'undefined';
    },

    // Helper to safely send events
    sendEvent: function(eventName, parameters = {}) {
        if (this.isAvailable()) {
            gtag('event', eventName, parameters);
            
            // Debug logging in development
            if (window.location.hostname === 'localhost') {
                console.log('Analytics Event:', eventName, parameters);
            }
        }
    },

    // Session tracking
    sessionData: {
        simulationCount: 0,
        weaponsUsed: new Set(),
        locationsUsed: new Set(),
        startTime: Date.now()
    },

    // Core simulation events
    trackBlastSimulation: function(weaponType, location, detonationType) {
        this.sessionData.simulationCount++;
        this.sessionData.weaponsUsed.add(weaponType);
        this.sessionData.locationsUsed.add(location);

        this.sendEvent('blast_simulation', {
            weapon_type: weaponType,
            location: location,
            detonation_type: detonationType,
            simulation_number: this.sessionData.simulationCount
        });

        // Check for power user status (10+ simulations)
        if (this.sessionData.simulationCount === 10) {
            this.sendEvent('power_user', {
                total_simulations: this.sessionData.simulationCount
            });
        }

        // Check for multiple weapons tested (3+ different weapons)
        if (this.sessionData.weaponsUsed.size === 3) {
            this.sendEvent('multiple_weapons_tested', {
                weapons_count: this.sessionData.weaponsUsed.size,
                weapons_list: Array.from(this.sessionData.weaponsUsed).join(',')
            });
        }

        // Check for multiple locations tested (3+ different locations)
        if (this.sessionData.locationsUsed.size === 3) {
            this.sendEvent('multiple_locations_tested', {
                locations_count: this.sessionData.locationsUsed.size
            });
        }
    },

    // Weapon selection tracking
    trackWeaponSelected: function(weaponName, weaponYield, weaponCategory) {
        this.sendEvent('weapon_selected', {
            weapon_name: weaponName,
            weapon_yield: weaponYield,
            weapon_category: weaponCategory
        });
    },

    // Weapon comparison (switching weapons while blast is active)
    trackWeaponComparison: function(previousWeapon, newWeapon, blastActive) {
        if (blastActive) {
            this.sendEvent('weapon_comparison', {
                previous_weapon: previousWeapon,
                new_weapon: newWeapon
            });
        }
    },

    // Location tracking
    trackPresetCitySelected: function(cityName, coordinates) {
        this.sendEvent('preset_city_selected', {
            city_name: cityName,
            coordinates: coordinates
        });
    },

    trackCustomLocationSearched: function(searchQuery, success) {
        this.sendEvent('custom_location_searched', {
            search_query: searchQuery,
            search_success: success
        });
    },

    // Map interaction tracking
    trackZoneClicked: function(zoneType) {
        this.sendEvent('zone_clicked', {
            zone_type: zoneType
        });
    },

    trackMapInteraction: function(interactionType, zoomLevel) {
        this.sendEvent('map_interaction', {
            interaction_type: interactionType,
            zoom_level: zoomLevel
        });
    },

    // Effects panel tracking
    effectsPanelOpenTime: null,

    trackEffectsPanelOpened: function() {
        this.effectsPanelOpenTime = Date.now();
        this.sendEvent('effects_panel_opened');
    },

    trackEffectsPanelClosed: function() {
        this.sendEvent('effects_panel_closed');
        
        // Track viewing duration if panel was opened
        if (this.effectsPanelOpenTime) {
            const viewDuration = Math.round((Date.now() - this.effectsPanelOpenTime) / 1000);
            this.trackEffectsDetailViewed(viewDuration);
            this.effectsPanelOpenTime = null;
        }
    },

    trackEffectsDetailViewed: function(viewDurationSeconds) {
        this.sendEvent('effects_detail_viewed', {
            view_duration_seconds: viewDurationSeconds,
            weapon_type: currentBomb // This will reference the global variable from app.js
        });
    },

    // External links
    trackExternalLinkClicked: function(linkType, linkUrl) {
        this.sendEvent('external_link_clicked', {
            link_type: linkType,
            link_url: linkUrl
        });
    },

    // Detonation type tracking
    trackDetonationTypeChanged: function(newType, previousType) {
        this.sendEvent('detonation_type_changed', {
            type_selected: newType,
            previous_type: previousType
        });
    },

    // Session summary (call this on page unload)
    trackSessionSummary: function() {
        const sessionDuration = Math.round((Date.now() - this.sessionData.startTime) / 1000);
        
        this.sendEvent('simulations_per_session', {
            total_simulations: this.sessionData.simulationCount,
            unique_weapons: this.sessionData.weaponsUsed.size,
            unique_locations: this.sessionData.locationsUsed.size,
            session_duration_seconds: sessionDuration
        });
    },

    // Page view tracking
    trackPageView: function(pagePath, pageTitle) {
        this.sendEvent('page_view', {
            page_path: pagePath || window.location.pathname,
            page_title: pageTitle || document.title,
            page_location: window.location.href
        });
    },

    // Initialize analytics
    init: function() {
        // Track initial page view
        this.trackPageView();

        // Track session summary when user leaves
        window.addEventListener('beforeunload', () => {
            this.trackSessionSummary();
        });

        // Set up external link tracking
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[target="_blank"]');
            if (link) {
                const href = link.getAttribute('href');
                let linkType = 'other';
                
                if (href.includes('github.com')) {
                    linkType = 'github';
                } else if (href.includes('creativecommons.org')) {
                    linkType = 'license';
                }
                
                this.trackExternalLinkClicked(linkType, href);
            }
        });

        // Track client-side navigation for SPAs
        let lastPath = window.location.pathname;
        const checkForNavigation = () => {
            if (window.location.pathname !== lastPath) {
                lastPath = window.location.pathname;
                this.trackPageView();
            }
        };
        
        // Check for navigation changes periodically
        setInterval(checkForNavigation, 1000);

        console.log('Analytics initialized');
    }
};

// Initialize analytics when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Analytics.init());
} else {
    Analytics.init();
}