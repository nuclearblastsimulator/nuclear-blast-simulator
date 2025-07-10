// Google Analytics Event Tracking for Nuclear Blast Simulator
// This file handles all analytics events for user behavior tracking

// Helper to check if we're in development
const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Console log wrapper that only logs in development
const devLog = (...args) => {
  if (isDev) {
    console.log(...args);
  }
};

devLog('📊 Analytics.js loaded!', {
  gtag_defined: typeof gtag !== 'undefined',
  dataLayer_defined: typeof window.dataLayer !== 'undefined',
  url: window.location.href,
  ga_script: document.querySelector('script[src*="googletagmanager"]'),
  scripts: Array.from(document.scripts)
    .map((s) => s.src)
    .filter((src) => src.includes('google'))
})

// Analytics helper object
const Analytics = {
  // Track if analytics is available
  isAvailable: function () {
    return typeof gtag !== 'undefined'
  },

  // Helper to safely send events
  sendEvent: function (eventName, parameters = {}) {
    if (this.isAvailable()) {
      // Enhanced debug logging
      devLog(`📊 Analytics Event: ${eventName}`, {
        parameters: parameters,
        timestamp: new Date().toISOString(),
        gtag_available: true
      })

      gtag('event', eventName, parameters)
    } else {
      devLog('⚠️ Analytics not available - gtag is undefined', {
        event: eventName,
        parameters: parameters
      })
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
  trackBlastSimulation: function (weaponType, location, detonationType) {
    devLog('💥 Tracking blast simulation:', {
      weapon: weaponType,
      location: location,
      type: detonationType,
      count: this.sessionData.simulationCount + 1
    })

    this.sessionData.simulationCount++
    this.sessionData.weaponsUsed.add(weaponType)
    this.sessionData.locationsUsed.add(location)

    this.sendEvent('blast_simulation', {
      weapon_type: weaponType,
      location: location,
      detonation_type: detonationType,
      simulation_number: this.sessionData.simulationCount
    })

    // Check for power user status (10+ simulations)
    if (this.sessionData.simulationCount === 10) {
      this.sendEvent('power_user', {
        total_simulations: this.sessionData.simulationCount
      })
    }

    // Check for multiple weapons tested (3+ different weapons)
    if (this.sessionData.weaponsUsed.size === 3) {
      this.sendEvent('multiple_weapons_tested', {
        weapons_count: this.sessionData.weaponsUsed.size,
        weapons_list: Array.from(this.sessionData.weaponsUsed).join(',')
      })
    }

    // Check for multiple locations tested (3+ different locations)
    if (this.sessionData.locationsUsed.size === 3) {
      this.sendEvent('multiple_locations_tested', {
        locations_count: this.sessionData.locationsUsed.size
      })
    }
  },

  // Weapon selection tracking
  trackWeaponSelected: function (weaponName, weaponYield, weaponCategory) {
    this.sendEvent('weapon_selected', {
      weapon_name: weaponName,
      weapon_yield: weaponYield,
      weapon_category: weaponCategory
    })
  },

  // Weapon comparison (switching weapons while blast is active)
  trackWeaponComparison: function (previousWeapon, newWeapon, blastActive) {
    if (blastActive) {
      this.sendEvent('weapon_comparison', {
        previous_weapon: previousWeapon,
        new_weapon: newWeapon
      })
    }
  },

  // Location tracking
  trackPresetCitySelected: function (cityName, coordinates) {
    this.sendEvent('preset_city_selected', {
      city_name: cityName,
      coordinates: coordinates
    })
  },

  trackCustomLocationSearched: function (searchQuery, success) {
    this.sendEvent('custom_location_searched', {
      search_query: searchQuery,
      search_success: success
    })
  },

  // Map interaction tracking
  trackZoneClicked: function (zoneType) {
    this.sendEvent('zone_clicked', {
      zone_type: zoneType
    })
  },

  trackMapInteraction: function (interactionType, zoomLevel) {
    this.sendEvent('map_interaction', {
      interaction_type: interactionType,
      zoom_level: zoomLevel
    })
  },

  // Effects panel tracking
  effectsPanelOpenTime: null,

  trackEffectsPanelOpened: function () {
    this.effectsPanelOpenTime = Date.now()
    this.sendEvent('effects_panel_opened')
  },

  trackEffectsPanelClosed: function () {
    this.sendEvent('effects_panel_closed')

    // Track viewing duration if panel was opened
    if (this.effectsPanelOpenTime) {
      const viewDuration = Math.round((Date.now() - this.effectsPanelOpenTime) / 1000)
      this.trackEffectsDetailViewed(viewDuration)
      this.effectsPanelOpenTime = null
    }
  },

  trackEffectsDetailViewed: function (viewDurationSeconds) {
    this.sendEvent('effects_detail_viewed', {
      view_duration_seconds: viewDurationSeconds,
      weapon_type: currentBomb // This will reference the global variable from app.js
    })
  },

  // External links
  trackExternalLinkClicked: function (linkType, linkUrl) {
    this.sendEvent('external_link_clicked', {
      link_type: linkType,
      link_url: linkUrl
    })
  },

  // Detonation type tracking
  trackDetonationTypeChanged: function (newType, previousType) {
    this.sendEvent('detonation_type_changed', {
      type_selected: newType,
      previous_type: previousType
    })
  },

  // Session summary (call this on page unload)
  trackSessionSummary: function () {
    const sessionDuration = Math.round((Date.now() - this.sessionData.startTime) / 1000)

    this.sendEvent('simulations_per_session', {
      total_simulations: this.sessionData.simulationCount,
      unique_weapons: this.sessionData.weaponsUsed.size,
      unique_locations: this.sessionData.locationsUsed.size,
      session_duration_seconds: sessionDuration
    })
  },

  // Initialize analytics
  init: function () {
    devLog('🚀 Initializing Analytics...', {
      gtag_available: this.isAvailable(),
      current_page: window.location.pathname,
      hostname: window.location.hostname
    })

    // Track session summary when user leaves
    window.addEventListener('beforeunload', () => {
      devLog('👋 User leaving - tracking session summary')
      this.trackSessionSummary()
    })

    // Set up external link tracking
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[target="_blank"]')
      if (link) {
        const href = link.getAttribute('href')
        let linkType = 'other'

        if (href.includes('github.com')) {
          linkType = 'github'
        } else if (href.includes('creativecommons.org')) {
          linkType = 'license'
        }

        devLog('🔗 External link clicked:', href)
        this.trackExternalLinkClicked(linkType, href)
      }
    })

    devLog('✅ Analytics initialized successfully!')
  }
}

// Make Analytics globally available
window.Analytics = Analytics

// Initialize analytics when DOM is ready
function initializeAnalytics() {
  // Wait a bit for gtag to be fully loaded
  setTimeout(() => {
    devLog('⏰ Checking gtag availability after delay...', {
      gtag_defined: typeof gtag !== 'undefined',
      dataLayer_defined: typeof window.dataLayer !== 'undefined'
    })

    // If gtag still doesn't exist (development/blocked), create a mock
    // if (typeof gtag === 'undefined' && window.location.hostname === 'localhost') {
    //     console.log('🔧 Creating mock gtag for development');
    //     window.gtag = function() {
    //         console.log('🎯 Mock gtag called:', arguments);
    //         // Still push to dataLayer for debugging
    //         if (window.dataLayer) {
    //             window.dataLayer.push(arguments);
    //         }
    //     };
    // }

    Analytics.init()
  }, 100)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAnalytics)
} else {
  initializeAnalytics()
}
