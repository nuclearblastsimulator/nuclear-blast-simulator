// Helper to check if we're in development
const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Console log wrapper that only logs in development
const devLog = (...args) => {
  if (isDev) {
    console.log(...args);
  }
};

// Global variables
let map
let currentBomb = null // Will be set from JSON data
let blastCircles = {}
let useMetric = false
let hiddenZones = new Set()
let groundZeroMarker = null
let currentLocation = { lat: 36.0104, lng: -84.2696 }
let previousDetonationType = 'air' // Track for analytics
let previousWeapon = null // Track for weapon comparison
let windDirection = 45 // Wind direction in degrees (0 = North, 90 = East, etc.)
let windSpeed = 15 // Wind speed in mph

// Bomb data - will be populated from JSON
let bombData = {}
let weaponCategories = {}
let defaultWeapon = null

// Initialize everything after page loads
window.addEventListener('DOMContentLoaded', async function () {
  // Load weapon data from JSON
  try {
    const response = await fetch('../assets/data.json')
    const data = await response.json()

    // Process weapons data
    data.weapons.forEach((weapon) => {
      bombData[weapon.id] = {
        name: weapon.name,
        yield: weapon.yield,
        details: weapon.details,
        category: weapon.category
      }

      // Set default weapon
      if (weapon.default) {
        defaultWeapon = weapon.id
        currentBomb = weapon.id
        previousWeapon = weapon.id
      }
    })

    // Store categories
    weaponCategories = data.categories

    // Populate weapon select dropdown
    populateWeaponSelect(data.weapons)

    // Populate location select dropdown
    populateLocationSelect(data.locations)

    // Update initial weapon details
    updateWeaponDetails()
  } catch (error) {
    devLog('Error loading weapons data:', error)
    // Fallback to hardcoded data if JSON fails to load
    alert('Error loading weapons data. Please refresh the page.')
  }

  // Initialize map
  map = L.map('map').setView([36.0104, -84.2696], 12)

  // Add medium-dark tile layer (slightly brighter)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20,
    className: 'map-tiles'
  }).addTo(map)

  // Apply CSS filter to brighten the map slightly
  const style = document.createElement('style')
  style.textContent = '.map-tiles { filter: brightness(5) contrast(0.7); }'
  document.head.appendChild(style)

  // Track map interactions
  let mapInteractionTimeout
  map.on('moveend', function () {
    clearTimeout(mapInteractionTimeout)
    mapInteractionTimeout = setTimeout(() => {
      if (typeof Analytics !== 'undefined') {
        Analytics.trackMapInteraction('pan_zoom', map.getZoom())
      }
    }, 1000) // Debounce to avoid too many events
  })

  // Set up event listeners
  setupEventListeners()

  // Initialize map visibility
  updateMapVisibility()

  // Update map visibility on window resize
  window.addEventListener('resize', updateMapVisibility)

  // Initialize wind direction
  updateWindDirection()

  // Simulate random wind changes every 30 seconds
  setInterval(() => {
    windDirection = Math.random() * 360
    windSpeed = 10 + Math.random() * 20 // 10-30 mph
    updateWindDirection()
  }, 30000)
})

// Format distance with both units
function formatDistanceBoth(meters) {
  const km = (meters / 1000).toFixed(2)
  const miles = (meters * 0.000621371).toFixed(2)
  return `${km} km / ${miles} mi`
}

// Format distance for display
function formatDistance(meters) {
  if (useMetric) {
    if (meters < 1000) {
      return `${Math.round(meters)} meters`
    } else {
      return `${(meters / 1000).toFixed(2)} km`
    }
  } else {
    const miles = meters * 0.000621371
    const feet = meters * 3.28084
    if (feet < 5280) {
      return `${Math.round(feet).toLocaleString()} feet`
    } else {
      return `${miles.toFixed(2)} miles`
    }
  }
}

// Populate weapon select dropdown from JSON data
function populateWeaponSelect(weapons) {
  const select = document.getElementById('weapon-select')
  select.innerHTML = '' // Clear existing options

  // Group weapons by category
  const weaponsByCategory = {}
  weapons.forEach((weapon) => {
    if (!weaponsByCategory[weapon.category]) {
      weaponsByCategory[weapon.category] = []
    }
    weaponsByCategory[weapon.category].push(weapon)
  })

  // Create optgroups and options
  Object.keys(weaponCategories).forEach((categoryKey) => {
    if (weaponsByCategory[categoryKey]) {
      const optgroup = document.createElement('optgroup')
      optgroup.label = weaponCategories[categoryKey]

      weaponsByCategory[categoryKey].forEach((weapon) => {
        const option = document.createElement('option')
        option.value = weapon.id
        option.textContent = weapon.displayText
        if (weapon.default) {
          option.selected = true
        }
        optgroup.appendChild(option)
      })

      select.appendChild(optgroup)
    }
  })
}
// Populate location select dropdown from JSON data
function populateLocationSelect(locations) {
  const select = document.getElementById('city-select')
  select.innerHTML = '' // Clear existing options

  // Add placeholder option
  const placeholderOption = document.createElement('option')
  placeholderOption.value = ''
  placeholderOption.textContent = 'Choose a city...'
  select.appendChild(placeholderOption)

  // Add location options
  locations.forEach((location) => {
    const option = document.createElement('option')
    option.value = location.coordinates
    option.textContent = location.name
    if (location.default) {
      option.selected = true
      // Set initial location
      const [lat, lng] = location.coordinates.split(',').map(Number)
      currentLocation = { lat, lng }
    }
    select.appendChild(option)
  })
}

// Nuclear weapon effects scaling formulas based on authoritative sources
//
// Primary References:
// 1. "The Effects of Nuclear Weapons" by Glasstone & Dolan (1977, 3rd Ed.)
//    - U.S. Department of Defense/Energy official publication
// 2. "Nuclear Weapons FAQ" by Carey Sublette (nuclearweaponarchive.org)
//
// Scaling Laws:
// - Fireball: R ∝ Y^0.4 (Glasstone & Dolan: R ≈ 100W^0.4 in feet)
// - Blast: R ∝ Y^0.33 (cube root law - pressure scales with volume)
// - Thermal: R ∝ Y^0.41 (modified square root law due to atmospheric absorption)
//
// Surface vs Air Burst:
// - Air bursts maximize blast damage area (optimum height ~1.5x fireball radius)
// - Surface bursts reduce blast radii by ~15-20% but create significant fallout
// - Thermal effects reduced by ~30% for surface bursts due to ground absorption
//
// These formulas provide educational approximations. Actual effects vary with:
// height of burst, weather, terrain, and atmospheric conditions.
//
// Overpressure damage thresholds:
// - 5 psi: Heavy damage (most buildings collapse)
// - 1 psi: Moderate damage (residential buildings damaged)
// - 0.25 psi: Light damage (windows shatter)
function calculateRadii(yieldKt) {
  // Check if surface burst is selected
  const isSurfaceBurst =
    document.querySelector('input[name="detonation"]:checked').value === 'surface'

  // Base calculations for air burst
  let fireball = 0.2 * Math.pow(yieldKt, 0.4) * 1000 // meters
  let heavyBlast = 0.28 * Math.pow(yieldKt, 0.33) * 1000 // 5 psi
  let moderateBlast = 0.7 * Math.pow(yieldKt, 0.33) * 1000 // 1 psi
  let lightBlast = 1.5 * Math.pow(yieldKt, 0.33) * 1000 // 0.25 psi
  let thermalRadiation = 1.2 * Math.pow(yieldKt, 0.41) * 1000 // 3rd degree burns

  // Apply surface burst reduction factors
  if (isSurfaceBurst) {
    // Fireball touches ground, so radius remains same but effects differ
    // Blast radii reduced by ~15-20% due to ground reflection interference
    heavyBlast *= 0.82
    moderateBlast *= 0.83
    lightBlast *= 0.85
    // Thermal effects significantly reduced due to ground absorption
    thermalRadiation *= 0.7
  }

  return {
    fireball,
    heavyBlast,
    moderateBlast,
    lightBlast,
    thermalRadiation
  }
}

// Create popup content for each zone
function createZonePopup(zoneName, radius, effects) {
  const isSurfaceBurst =
    document.querySelector('input[name="detonation"]:checked').value === 'surface'
  const burstType = isSurfaceBurst ? ' (Surface Burst)' : ' (Air Burst)'

  return `
        <div style="background: #222; color: #fff; padding: 12px; border-radius: 6px; min-width: 250px;">
            <h4 style="margin: 0 0 8px 0; color: #f77f00; font-family: 'Rubik Mono One', monospace; font-size: 14px; text-transform: uppercase;">${zoneName}${burstType}</h4>
            <p style="margin: 4px 0; font-size: 14px; font-family: 'Inter', sans-serif;"><strong>Radius:</strong> ${formatDistanceBoth(
              radius
            )}</p>
            <p style="margin: 8px 0 0 0; font-size: 13px; line-height: 1.4; color: #ccc; font-family: 'Inter', sans-serif;">${effects}</p>
        </div>
    `
}

// Clear all blast circles
function clearBlast() {
  Object.values(blastCircles).forEach((circle) => {
    if (circle) map.removeLayer(circle)
  })
  blastCircles = {}

  if (groundZeroMarker) {
    map.removeLayer(groundZeroMarker)
    groundZeroMarker = null
  }

  // Hide effects panel and button
  document.getElementById('effects-toggle').classList.remove('visible')
  closeEffectsPanel()
}

// Update map visibility based on mobile and blast state
function updateMapVisibility() {
  // Map is now always visible - this function kept for potential future use
  return
}

// Update wind direction indicator
function updateWindDirection() {
  const windArrow = document.getElementById('wind-arrow')
  const windSpeedElement = document.getElementById('wind-speed')

  if (windArrow && windSpeedElement) {
    windArrow.style.transform = `rotate(${windDirection}deg)`
    windSpeedElement.textContent = `${Math.round(windSpeed)} mph`
  }
}

// Simulate blast with animation
function simulateBlast() {
  const citySelect = document.getElementById('city-select')
  const customAddress = document.getElementById('custom-address').value

  if (!citySelect.value && !customAddress) {
    alert('Please select a city or enter a custom address first.')
    return
  }

  // Get current detonation type for analytics
  const detonationType = document.querySelector('input[name="detonation"]:checked').value
  const locationName =
    citySelect.options[citySelect.selectedIndex]?.text || customAddress || 'Custom Location'

  // Track blast simulation
  if (typeof Analytics !== 'undefined') {
    Analytics.trackBlastSimulation(currentBomb, locationName, detonationType)
  }

  // Clear existing blast
  clearBlast()

  // Animate the blast circles appearing
  setTimeout(() => {
    drawBlast(currentLocation.lat, currentLocation.lng)
  }, 100)
}

// Draw blast circles with animation
function drawBlast(lat, lng) {
  const bomb = bombData[currentBomb]
  const radii = calculateRadii(bomb.yield)
  const isSurfaceBurst =
    document.querySelector('input[name="detonation"]:checked').value === 'surface'

  // Add ground zero marker first
  const detonationType = isSurfaceBurst ? 'Surface Burst' : 'Air Burst'
  const detonationNote = isSurfaceBurst
    ? 'Creates significant radioactive fallout and crater'
    : 'Optimized for maximum blast damage area'

  groundZeroMarker = L.marker([lat, lng]).addTo(map)
    .bindPopup(`<div style="background: #222; color: #fff; padding: 12px; border-radius: 6px;">
              <h4 style="margin: 0 0 8px 0; color: #f77f00; font-family: 'Rubik Mono One', monospace; font-size: 14px; text-transform: uppercase;">${
                bomb.name
              }</h4>
              <p style="margin: 4px 0; font-size: 14px; font-family: 'Inter', sans-serif;"><strong>Yield:</strong> ${
                bomb.yield < 1
                  ? bomb.yield * 1000 + ' tons TNT'
                  : bomb.yield > 1000
                  ? bomb.yield / 1000 + ' MT'
                  : bomb.yield + ' kT'
              }</p>
              <p style="margin: 4px 0; font-size: 13px; font-family: 'Inter', sans-serif;"><strong>Type:</strong> ${detonationType}</p>
              <p style="margin: 4px 0; font-size: 12px; color: #ccc; font-family: 'Inter', sans-serif;">${detonationNote}</p>
          </div>`)

  // Store the circles for animation
  const circleOrder = []

  // Helper function to add click tracking to circles
  const addZoneClickTracking = (circle, zoneType) => {
    circle.on('click', () => {
      if (typeof Analytics !== 'undefined') {
        Analytics.trackZoneClicked(zoneType)
      }
    })
  }

  // Add circles from largest to smallest (so smaller ones are on top)
  // But store them in reverse order for animation

  // Thermal radiation (outermost - add first so it's at the bottom)
  if (!hiddenZones.has('thermal')) {
    const thermalCircle = L.circle([lat, lng], {
      radius: 0, // Start with 0 radius for animation
      fillColor: '#c8c800',
      fillOpacity: 0,
      color: '#c8c800',
      weight: 0, // Start with 0 weight
      opacity: 1
    }).addTo(map)

    const thermalEffects = isSurfaceBurst
      ? 'Third-degree burns to exposed skin (reduced range due to ground absorption). Fire ignition less likely. Significant radioactive fallout in this zone.'
      : 'Third-degree burns to exposed skin. Most flammable materials ignite. Fire storms likely in urban areas. Windows shatter from thermal shock.'

    thermalCircle.bindPopup(
      createZonePopup('Thermal Radiation Zone', radii.thermalRadiation, thermalEffects)
    )

    addZoneClickTracking(thermalCircle, 'thermal')
    blastCircles.thermal = thermalCircle
  }

  // Light damage
  if (!hiddenZones.has('light')) {
    const lightCircle = L.circle([lat, lng], {
      radius: 0, // Start with 0 radius for animation
      fillColor: '#ffff00',
      fillOpacity: 0,
      color: '#ffff00',
      weight: 0, // Start with 0 weight
      opacity: 1
    }).addTo(map)

    const lightEffects = isSurfaceBurst
      ? 'Windows shatter. Light structures damaged. Radioactive fallout begins to settle. 20% injuries, 1% fatalities.'
      : 'Windows shatter causing injuries. Light frame buildings damaged. 25% injuries, 1% fatalities among exposed population.'

    lightCircle.bindPopup(
      createZonePopup('Light Damage Zone (0.25 psi)', radii.lightBlast, lightEffects)
    )

    addZoneClickTracking(lightCircle, 'light')
    blastCircles.light = lightCircle
  }

  // Moderate damage
  if (!hiddenZones.has('moderate')) {
    const moderateCircle = L.circle([lat, lng], {
      radius: 0, // Start with 0 radius for animation
      fillColor: '#ffc800',
      fillOpacity: 0,
      color: '#ffc800',
      weight: 0, // Start with 0 weight
      opacity: 1
    }).addTo(map)

    const moderateEffects = isSurfaceBurst
      ? 'Buildings damaged, some collapse. Heavy radioactive fallout. 45% injuries, 5% immediate fatalities. Radiation sickness likely.'
      : 'Residential buildings moderately damaged. Walls crack, roofs cave in. 50% injuries, 5% fatalities. Most vehicles damaged.'

    moderateCircle.bindPopup(
      createZonePopup('Moderate Damage Zone (1 psi)', radii.moderateBlast, moderateEffects)
    )

    addZoneClickTracking(moderateCircle, 'moderate')
    blastCircles.moderate = moderateCircle
  }

  // Heavy blast damage
  if (!hiddenZones.has('heavy')) {
    const heavyCircle = L.circle([lat, lng], {
      radius: 0, // Start with 0 radius for animation
      fillColor: '#ff6400',
      fillOpacity: 0,
      color: '#ff6400',
      weight: 0, // Start with 0 weight
      opacity: 1
    }).addTo(map)

    const heavyEffects = isSurfaceBurst
      ? 'Buildings collapse. Intense radioactive fallout. 85% injuries, 50% immediate fatalities. Lethal radiation dose within hours.'
      : 'Most buildings collapse. Concrete structures heavily damaged. 90% injuries, 50% fatalities. Total destruction of infrastructure.'

    heavyCircle.bindPopup(
      createZonePopup('Heavy Blast Damage Zone (5 psi)', radii.heavyBlast, heavyEffects)
    )

    addZoneClickTracking(heavyCircle, 'heavy')
    blastCircles.heavy = heavyCircle
  }

  // Fireball (innermost - add last so it's on top)
  if (!hiddenZones.has('fireball')) {
    const fireballCircle = L.circle([lat, lng], {
      radius: 0, // Start with 0 radius for animation
      fillColor: '#ff0000',
      fillOpacity: 0,
      color: '#ff0000',
      weight: 0, // Start with 0 weight
      opacity: 1
    }).addTo(map)

    const fireballEffects = isSurfaceBurst
      ? 'Complete vaporization. Massive crater formed. Extreme radioactive contamination. Everything destroyed. 100% fatalities.'
      : 'Complete vaporization. Temperatures exceed 100 million °C. Everything is instantly vaporized. 100% fatalities. Ground zero.'

    fireballCircle.bindPopup(createZonePopup('Fireball Zone', radii.fireball, fireballEffects))

    addZoneClickTracking(fireballCircle, 'fireball')
    blastCircles.fireball = fireballCircle
  }

  // Build animation order from inside out
  if (blastCircles.fireball)
    circleOrder.push({
      circle: blastCircles.fireball,
      opacity: 0.6,
      targetRadius: radii.fireball,
      targetWeight: 2
    })
  if (blastCircles.heavy)
    circleOrder.push({
      circle: blastCircles.heavy,
      opacity: 0.5,
      targetRadius: radii.heavyBlast,
      targetWeight: 1
    })
  if (blastCircles.moderate)
    circleOrder.push({
      circle: blastCircles.moderate,
      opacity: 0.4,
      targetRadius: radii.moderateBlast,
      targetWeight: 1
    })
  if (blastCircles.light)
    circleOrder.push({
      circle: blastCircles.light,
      opacity: 0.3,
      targetRadius: radii.lightBlast,
      targetWeight: 1
    })
  if (blastCircles.thermal)
    circleOrder.push({
      circle: blastCircles.thermal,
      opacity: 0.2,
      targetRadius: radii.thermalRadiation,
      targetWeight: 1
    })

  // Animate radius and opacity for each circle with staggered timing
  circleOrder.forEach((item, index) => {
    setTimeout(() => {
      animateCircle(item.circle, item.targetRadius, item.opacity, item.targetWeight)
    }, index * 100)
  })

  // Helper function to animate a single circle
  function animateCircle(circle, targetRadius, targetOpacity, targetWeight) {
    let startTime = Date.now()
    const duration = 400

    function animate() {
      const progress = Math.min((Date.now() - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4) // easeOutQuart

      circle.setRadius(targetRadius * eased)
      circle.setStyle({
        fillOpacity: targetOpacity * progress,
        weight: targetWeight * progress
      })

      if (progress < 1) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }

  // Show effects panel button and update panel content
  setTimeout(() => {
    document.getElementById('effects-toggle').classList.add('visible')
    updateEffectsPanel(bomb, radii, isSurfaceBurst)

    // Add fallout pattern for surface bursts
    if (isSurfaceBurst) {
      drawFalloutPattern(lat, lng, bomb.yield)
    }
  }, circleOrder.length * 100 + 200)

  // Adjust map view to show all circles
  map.setView([lat, lng], getZoomLevel(radii.thermalRadiation))
}

// Calculate appropriate zoom level
function getZoomLevel(maxRadius) {
  if (maxRadius > 50000) return 8
  if (maxRadius > 20000) return 9
  if (maxRadius > 10000) return 10
  if (maxRadius > 5000) return 11
  return 12
}

// Draw fallout pattern for surface bursts
function drawFalloutPattern(lat, lng, yieldKt) {
  const falloutDistance = Math.pow(yieldKt, 0.25) * 15000 // Approximate fallout distance in meters

  // Calculate fallout ellipse based on wind direction
  const windRadians = (windDirection * Math.PI) / 180
  const falloutWidth = falloutDistance * 0.3 // Fallout pattern width

  // Create fallout pattern points
  const falloutPoints = []
  const numPoints = 50

  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI
    let distance, width

    // Create elongated pattern in wind direction
    if (angle >= 0 && angle <= Math.PI) {
      // Downwind side - longer pattern
      distance = falloutDistance * (0.3 + 0.7 * Math.cos(angle - windRadians))
      width = falloutWidth * (0.5 + 0.5 * Math.abs(Math.sin(angle - windRadians)))
    } else {
      // Upwind side - shorter pattern
      distance = falloutDistance * 0.2
      width = falloutWidth * 0.3
    }

    const offsetLat = (distance * Math.cos(angle)) / 111000 // Convert to degrees
    const offsetLng = (distance * Math.sin(angle)) / (111000 * Math.cos((lat * Math.PI) / 180))

    falloutPoints.push([lat + offsetLat, lng + offsetLng])
  }

  // Create fallout pattern polygon
  const falloutPattern = L.polygon(falloutPoints, {
    fillColor: '#8B4513',
    fillOpacity: 0.15,
    color: '#8B4513',
    weight: 1,
    dashArray: '5, 5',
    className: 'blast-circle'
  }).addTo(map)

  falloutPattern.bindPopup(
    createZonePopup(
      'Radioactive Fallout Zone',
      falloutDistance,
      `Deadly radioactive fallout carried by wind at ${Math.round(
        windSpeed
      )} mph. Lethal radiation doses within hours. Evacuation required for weeks to months. Pattern based on current wind direction.`
    )
  )

  // Add click tracking
  falloutPattern.on('click', () => {
    if (typeof Analytics !== 'undefined') {
      Analytics.trackZoneClicked('fallout')
    }
  })

  blastCircles.fallout = falloutPattern
}

// Search for custom address
async function searchAddress() {
  const address = document.getElementById('custom-address').value
  if (!address) return

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
    )
    const data = await response.json()

    if (data.length > 0) {
      const lat = parseFloat(data[0].lat)
      const lng = parseFloat(data[0].lon)
      currentLocation = { lat, lng }
      map.setView([lat, lng], 12)
      document.getElementById('city-select').value = ''
      clearBlast() // Clear blast when location changes

      // Track successful search
      if (typeof Analytics !== 'undefined') {
        Analytics.trackCustomLocationSearched(address, true)
      }
    } else {
      alert('Location not found. Please try a different address.')
      // Track failed search
      if (typeof Analytics !== 'undefined') {
        Analytics.trackCustomLocationSearched(address, false)
      }
    }
  } catch (error) {
    alert('Error searching for location. Please try again.')
    // Track failed search
    if (typeof Analytics !== 'undefined') {
      Analytics.trackCustomLocationSearched(address, false)
    }
  }
}

// Setup event listeners
function setupEventListeners() {
  // Handle weapon selection
  document.getElementById('weapon-select').addEventListener('change', function () {
    const blastActive = Object.keys(blastCircles).length > 0

    // Track weapon comparison if blast is active
    if (typeof Analytics !== 'undefined' && blastActive) {
      Analytics.trackWeaponComparison(previousWeapon, this.value, true)
    }

    currentBomb = this.value
    updateWeaponDetails()

    // Track weapon selection
    if (typeof Analytics !== 'undefined') {
      const weapon = bombData[currentBomb]
      Analytics.trackWeaponSelected(weapon.name, weapon.yield, weapon.category)
    }

    previousWeapon = currentBomb
    clearBlast() // Clear blast when weapon changes
  })

  // Handle city selection
  document.getElementById('city-select').addEventListener('change', function () {
    if (this.value) {
      const [lat, lng] = this.value.split(',').map(Number)
      currentLocation = { lat, lng }
      map.setView([lat, lng], 12)
      clearBlast() // Clear blast when city changes

      // Track city selection
      if (typeof Analytics !== 'undefined') {
        const cityName = this.options[this.selectedIndex].text
        Analytics.trackPresetCitySelected(cityName, this.value)
      }
    }
  })

  // Allow Enter key for search
  document.getElementById('custom-address').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      searchAddress()
    }
  })

  // Handle unit selection (simplified since it's hidden)
  useMetric = false // Always use imperial by default

  // Handle detonation type change
  document.querySelectorAll('input[name="detonation"]').forEach((radio) => {
    radio.addEventListener('change', function () {
      const newType = this.value

      // Track detonation type change
      if (typeof Analytics !== 'undefined') {
        Analytics.trackDetonationTypeChanged(newType, previousDetonationType)
      }

      previousDetonationType = newType

      // If blast is currently shown, redraw it
      if (Object.keys(blastCircles).length > 0) {
        clearBlast()
        simulateBlast()
      }
    })
  })

  // Handle legend clicks
  document.querySelectorAll('.legend-item').forEach((item) => {
    item.addEventListener('click', function () {
      const zone = this.dataset.zone

      if (hiddenZones.has(zone)) {
        hiddenZones.delete(zone)
        this.classList.remove('disabled')
      } else {
        hiddenZones.add(zone)
        this.classList.add('disabled')
      }

      // If blast is currently shown, redraw it
      if (Object.keys(blastCircles).length > 0) {
        clearBlast()
        simulateBlast()
      }
    })
  })

  // Handle escape key to close effects panel
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      const panel = document.getElementById('effects-panel')
      if (panel.classList.contains('open')) {
        closeEffectsPanel()
      }
    }
  })
}

// Update weapon details display
function updateWeaponDetails() {
  const weapon = bombData[currentBomb]
  const detailsDiv = document.getElementById('weapon-details')
  detailsDiv.innerHTML = `
        <div class="bomb-name">${weapon.name}</div>
        <div class="bomb-details">${weapon.details}</div>
    `
}

// Make functions globally accessible for onclick handlers
window.simulateBlast = simulateBlast
window.searchAddress = searchAddress

// Effects panel functions
function toggleEffectsPanel() {
  const panel = document.getElementById('effects-panel')
  const isOpening = !panel.classList.contains('open')

  if (isOpening) {
    panel.classList.add('open')
    // Track panel opened
    if (typeof Analytics !== 'undefined') {
      Analytics.trackEffectsPanelOpened()
    }
  } else {
    closeEffectsPanel()
  }
}

function closeEffectsPanel() {
  const panel = document.getElementById('effects-panel')
  panel.classList.remove('open')

  // Track panel closed
  if (typeof Analytics !== 'undefined') {
    Analytics.trackEffectsPanelClosed()
  }
}

function updateEffectsPanel(bomb, radii, isSurfaceBurst) {
  const content = document.getElementById('effects-content')
  const detonationType = isSurfaceBurst ? 'Surface Burst' : 'Air Burst'

  let html = `
        <div class="blast-summary">
            <div class="blast-summary-title">${bomb.name}</div>
            <div class="blast-summary-details">
                <div>Yield: ${
                  bomb.yield < 1
                    ? bomb.yield * 1000 + ' tons TNT'
                    : bomb.yield > 1000
                    ? bomb.yield / 1000 + ' MT'
                    : bomb.yield + ' kT'
                }</div>
                <div>Type: ${detonationType}</div>
                <div>${
                  isSurfaceBurst
                    ? 'Creates significant radioactive fallout'
                    : 'Maximizes blast damage area'
                }</div>
            </div>
        </div>
    `

  // Zone data
  const zones = [
    {
      id: 'fireball',
      name: 'Fireball Zone',
      color: 'rgba(255, 0, 0, 0.6)',
      radius: radii.fireball,
      pressure: 'N/A',
      casualties: '100% fatalities',
      effects: isSurfaceBurst
        ? 'Complete vaporization. Massive crater formed. Extreme radioactive contamination.'
        : 'Complete vaporization. Temperatures exceed 100 million °C. Everything instantly vaporized.'
    },
    {
      id: 'heavy',
      name: 'Heavy Blast Damage',
      color: 'rgba(255, 100, 0, 0.5)',
      radius: radii.heavyBlast,
      pressure: '5 psi',
      casualties: isSurfaceBurst ? '85% injuries, 50% fatalities' : '90% injuries, 50% fatalities',
      effects: isSurfaceBurst
        ? 'Buildings collapse. Intense radioactive fallout. Lethal radiation dose within hours.'
        : 'Most buildings collapse. Concrete structures heavily damaged. Total infrastructure destruction.'
    },
    {
      id: 'moderate',
      name: 'Moderate Damage',
      color: 'rgba(255, 200, 0, 0.4)',
      radius: radii.moderateBlast,
      pressure: '1 psi',
      casualties: isSurfaceBurst ? '45% injuries, 5% fatalities' : '50% injuries, 5% fatalities',
      effects: isSurfaceBurst
        ? 'Buildings damaged, some collapse. Heavy radioactive fallout. Radiation sickness likely.'
        : 'Residential buildings damaged. Walls crack, roofs cave in. Most vehicles damaged.'
    },
    {
      id: 'light',
      name: 'Light Damage',
      color: 'rgba(255, 255, 0, 0.3)',
      radius: radii.lightBlast,
      pressure: '0.25 psi',
      casualties: isSurfaceBurst ? '20% injuries, 1% fatalities' : '25% injuries, 1% fatalities',
      effects: isSurfaceBurst
        ? 'Windows shatter. Light structures damaged. Radioactive fallout begins to settle.'
        : 'Windows shatter causing injuries. Light frame buildings damaged.'
    },
    {
      id: 'thermal',
      name: 'Thermal Radiation',
      color: 'rgba(200, 200, 0, 0.2)',
      radius: radii.thermalRadiation,
      pressure: 'N/A',
      casualties: 'Variable based on exposure',
      effects: isSurfaceBurst
        ? 'Third-degree burns (reduced range). Fire ignition less likely. Significant fallout.'
        : 'Third-degree burns to exposed skin. Fire storms likely. Thermal shock damage.'
    }
  ]

  // Add zone details
  zones.forEach((zone) => {
    if (!hiddenZones.has(zone.id)) {
      html += `
                <div class="effect-zone">
                    <div class="effect-zone-header">
                        <div class="effect-zone-color" style="background: ${zone.color};"></div>
                        <div class="effect-zone-title">${zone.name}</div>
                    </div>
                    <div class="effect-zone-stats">
                        <div class="effect-stat">
                            <span class="effect-stat-label">Radius:</span>
                            <span class="effect-stat-value">${formatDistanceBoth(
                              zone.radius
                            )}</span>
                        </div>
                        <div class="effect-stat">
                            <span class="effect-stat-label">Overpressure:</span>
                            <span class="effect-stat-value">${zone.pressure}</span>
                        </div>
                        <div class="effect-stat">
                            <span class="effect-stat-label">Casualties:</span>
                            <span class="effect-stat-value">${zone.casualties}</span>
                        </div>
                    </div>
                    <div class="effect-zone-description">
                        ${zone.effects}
                    </div>
                </div>
            `
    }
  })

  content.innerHTML = html
}

// Fullscreen toggle function
function toggleFullscreen() {
  const mapContainer = document.querySelector('.map-container')
  const fullscreenToggle = document.getElementById('fullscreen-toggle')
  const fullscreenIcon = fullscreenToggle.querySelector('.fullscreen-icon')
  const exitFullscreenIcon = fullscreenToggle.querySelector('.exit-fullscreen-icon')

  if (mapContainer.classList.contains('map-fullscreen')) {
    // Exit fullscreen
    mapContainer.classList.remove('map-fullscreen')
    fullscreenIcon.style.display = 'block'
    exitFullscreenIcon.style.display = 'none'
  } else {
    // Enter fullscreen
    mapContainer.classList.add('map-fullscreen')
    fullscreenIcon.style.display = 'none'
    exitFullscreenIcon.style.display = 'block'
  }

  // Force map to recalculate its size
  setTimeout(() => {
    map.invalidateSize()
  }, 300)
}

window.toggleEffectsPanel = toggleEffectsPanel
window.closeEffectsPanel = closeEffectsPanel
window.toggleFullscreen = toggleFullscreen
