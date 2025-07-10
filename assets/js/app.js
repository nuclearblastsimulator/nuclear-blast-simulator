// Global variables
let map;
let currentBomb = 'little-boy';
let blastCircles = {};
let useMetric = false;
let hiddenZones = new Set();
let groundZeroMarker = null;
let currentLocation = { lat: 36.0104, lng: -84.2696 };

// Bomb data (yields in kilotons)
const bombData = {
    'tnt': { name: '1 Ton TNT', yield: 0.001, details: 'Reference explosive' },
    'tomahawk': { name: 'Tomahawk Missile', yield: 0.5, details: '1,000 lbs warhead • Cruise missile' },
    'moab': { name: 'MOAB (Mother of All Bombs)', yield: 11, details: '21,600 lbs • Largest conventional' },
    'little-boy': { name: 'Little Boy', yield: 15, details: '15 kilotons • Hiroshima 1945' },
    'fat-man': { name: 'Fat Man', yield: 21, details: '21 kilotons • Nagasaki 1945' },
    'w88': { name: 'W88 Warhead', yield: 475, details: '475 kilotons • Modern US SLBM' },
    'b83': { name: 'B83', yield: 1200, details: '1.2 megatons • US Strategic Bomb' },
    'castle-bravo': { name: 'Castle Bravo', yield: 15000, details: '15 megatons • Largest US test' },
    'tsar-bomba': { name: 'Tsar Bomba', yield: 50000, details: '50 megatons • Largest ever tested' }
};

// Initialize everything after page loads
window.addEventListener('DOMContentLoaded', function () {
    // Initialize map
    map = L.map('map').setView([36.0104, -84.2696], 12);

    // Add medium-dark tile layer (slightly brighter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
        className: 'map-tiles'
    }).addTo(map);

    // Apply CSS filter to brighten the map slightly
    const style = document.createElement('style');
    style.textContent = '.map-tiles { filter: brightness(5) contrast(0.7); }';
    document.head.appendChild(style);

    // Set up event listeners
    setupEventListeners();
});

// Format distance with both units
function formatDistanceBoth(meters) {
    const km = (meters / 1000).toFixed(2);
    const miles = (meters * 0.000621371).toFixed(2);
    return `${km} km / ${miles} mi`;
}

// Format distance for display
function formatDistance(meters) {
    if (useMetric) {
        if (meters < 1000) {
            return `${Math.round(meters)} meters`;
        } else {
            return `${(meters / 1000).toFixed(2)} km`;
        }
    } else {
        const miles = meters * 0.000621371;
        const feet = meters * 3.28084;
        if (feet < 5280) {
            return `${Math.round(feet).toLocaleString()} feet`;
        } else {
            return `${miles.toFixed(2)} miles`;
        }
    }
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
// These formulas provide educational approximations. Actual effects vary with:
// height of burst, weather, terrain, and atmospheric conditions.
//
// Overpressure damage thresholds:
// - 5 psi: Heavy damage (most buildings collapse)
// - 1 psi: Moderate damage (residential buildings damaged)
// - 0.25 psi: Light damage (windows shatter)
function calculateRadii(yieldKt) {
    // More accurate scaling formulas based on nuclear weapons effects data
    const fireball = 0.2 * Math.pow(yieldKt, 0.4) * 1000; // meters
    const heavyBlast = 0.28 * Math.pow(yieldKt, 0.33) * 1000; // 5 psi
    const moderateBlast = 0.7 * Math.pow(yieldKt, 0.33) * 1000; // 1 psi  
    const lightBlast = 1.5 * Math.pow(yieldKt, 0.33) * 1000; // 0.25 psi
    const thermalRadiation = 1.2 * Math.pow(yieldKt, 0.41) * 1000; // 3rd degree burns

    return {
        fireball,
        heavyBlast,
        moderateBlast,
        lightBlast,
        thermalRadiation
    };
}

// Create popup content for each zone
function createZonePopup(zoneName, radius, effects) {
    return `
        <div style="background: #222; color: #fff; padding: 12px; border-radius: 6px; min-width: 250px;">
            <h4 style="margin: 0 0 8px 0; color: #f77f00; font-family: 'Rubik Mono One', monospace; font-size: 14px; text-transform: uppercase;">${zoneName}</h4>
            <p style="margin: 4px 0; font-size: 14px; font-family: 'Inter', sans-serif;"><strong>Radius:</strong> ${formatDistanceBoth(radius)}</p>
            <p style="margin: 8px 0 0 0; font-size: 13px; line-height: 1.4; color: #ccc; font-family: 'Inter', sans-serif;">${effects}</p>
        </div>
    `;
}

// Clear all blast circles
function clearBlast() {
    Object.values(blastCircles).forEach(circle => {
        if (circle) map.removeLayer(circle);
    });
    blastCircles = {};

    if (groundZeroMarker) {
        map.removeLayer(groundZeroMarker);
        groundZeroMarker = null;
    }
}

// Simulate blast with animation
function simulateBlast() {
    const citySelect = document.getElementById('city-select');
    const customAddress = document.getElementById('custom-address').value;

    if (!citySelect.value && !customAddress) {
        alert('Please select a city or enter a custom address first.');
        return;
    }

    // Clear existing blast
    clearBlast();

    // Animate the blast circles appearing
    setTimeout(() => {
        drawBlast(currentLocation.lat, currentLocation.lng);
    }, 100);
}

// Draw blast circles with animation
function drawBlast(lat, lng) {
    const bomb = bombData[currentBomb];
    const radii = calculateRadii(bomb.yield);

    // Store the circles in order from largest to smallest for staggered animation
    const circleOrder = [];

    // Thermal radiation (outermost)
    if (!hiddenZones.has('thermal')) {
        const thermalCircle = L.circle([lat, lng], {
            radius: radii.thermalRadiation,
            fillColor: '#c8c800',
            fillOpacity: 0,
            color: '#c8c800',
            weight: 1,
            className: 'blast-circle'
        }).addTo(map);
        thermalCircle.bindPopup(createZonePopup(
            'Thermal Radiation Zone',
            radii.thermalRadiation,
            'Third-degree burns to exposed skin. Most flammable materials ignite. Fire storms likely in urban areas. Windows shatter from thermal shock.'
        ));
        blastCircles.thermal = thermalCircle;
        circleOrder.push({ circle: thermalCircle, opacity: 0.2 });
    }

    // Light damage
    if (!hiddenZones.has('light')) {
        const lightCircle = L.circle([lat, lng], {
            radius: radii.lightBlast,
            fillColor: '#ffff00',
            fillOpacity: 0,
            color: '#ffff00',
            weight: 1,
            className: 'blast-circle'
        }).addTo(map);
        lightCircle.bindPopup(createZonePopup(
            'Light Damage Zone (0.25 psi)',
            radii.lightBlast,
            'Windows shatter causing injuries. Light frame buildings damaged. 25% injuries, 1% fatalities among exposed population.'
        ));
        blastCircles.light = lightCircle;
        circleOrder.push({ circle: lightCircle, opacity: 0.3 });
    }

    // Moderate damage
    if (!hiddenZones.has('moderate')) {
        const moderateCircle = L.circle([lat, lng], {
            radius: radii.moderateBlast,
            fillColor: '#ffc800',
            fillOpacity: 0,
            color: '#ffc800',
            weight: 1,
            className: 'blast-circle'
        }).addTo(map);
        moderateCircle.bindPopup(createZonePopup(
            'Moderate Damage Zone (1 psi)',
            radii.moderateBlast,
            'Residential buildings moderately damaged. Walls crack, roofs cave in. 50% injuries, 5% fatalities. Most vehicles damaged.'
        ));
        blastCircles.moderate = moderateCircle;
        circleOrder.push({ circle: moderateCircle, opacity: 0.4 });
    }

    // Heavy blast damage
    if (!hiddenZones.has('heavy')) {
        const heavyCircle = L.circle([lat, lng], {
            radius: radii.heavyBlast,
            fillColor: '#ff6400',
            fillOpacity: 0,
            color: '#ff6400',
            weight: 1,
            className: 'blast-circle'
        }).addTo(map);
        heavyCircle.bindPopup(createZonePopup(
            'Heavy Blast Damage Zone (5 psi)',
            radii.heavyBlast,
            'Most buildings collapse. Concrete structures heavily damaged. 90% injuries, 50% fatalities. Total destruction of infrastructure.'
        ));
        blastCircles.heavy = heavyCircle;
        circleOrder.push({ circle: heavyCircle, opacity: 0.5 });
    }

    // Fireball
    if (!hiddenZones.has('fireball')) {
        const fireballCircle = L.circle([lat, lng], {
            radius: radii.fireball,
            fillColor: '#ff0000',
            fillOpacity: 0,
            color: '#ff0000',
            weight: 2,
            className: 'blast-circle'
        }).addTo(map);
        fireballCircle.bindPopup(createZonePopup(
            'Fireball Zone',
            radii.fireball,
            'Complete vaporization. Temperatures exceed 100 million °C. Everything is instantly vaporized. 100% fatalities. Ground zero.'
        ));
        blastCircles.fireball = fireballCircle;
        circleOrder.push({ circle: fireballCircle, opacity: 0.6 });
    }

    // Animate opacity for each circle with staggered timing
    circleOrder.forEach((item, index) => {
        setTimeout(() => {
            item.circle.setStyle({ fillOpacity: item.opacity });
        }, index * 150);
    });

    // Add marker at ground zero after circles animate
    setTimeout(() => {
        groundZeroMarker = L.marker([lat, lng]).addTo(map)
            .bindPopup(`<div style="background: #222; color: #fff; padding: 12px; border-radius: 6px;">
                <h4 style="margin: 0 0 8px 0; color: #f77f00; font-family: 'Rubik Mono One', monospace; font-size: 14px; text-transform: uppercase;">${bomb.name}</h4>
                <p style="margin: 4px 0; font-size: 14px; font-family: 'Inter', sans-serif;"><strong>Yield:</strong> ${bomb.yield < 1 ? (bomb.yield * 1000) + ' tons TNT' : bomb.yield > 1000 ? (bomb.yield / 1000) + ' MT' : bomb.yield + ' kT'}</p>
                <p style="margin: 4px 0; font-size: 13px; color: #ccc; font-family: 'Inter', sans-serif;">Ground Zero - Point of detonation</p>
            </div>`);
    }, circleOrder.length * 150);

    // Adjust map view to show all circles
    map.setView([lat, lng], getZoomLevel(radii.thermalRadiation));
}

// Calculate appropriate zoom level
function getZoomLevel(maxRadius) {
    if (maxRadius > 50000) return 8;
    if (maxRadius > 20000) return 9;
    if (maxRadius > 10000) return 10;
    if (maxRadius > 5000) return 11;
    return 12;
}

// Search for custom address
async function searchAddress() {
    const address = document.getElementById('custom-address').value;
    if (!address) return;

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
        const data = await response.json();

        if (data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lng = parseFloat(data[0].lon);
            currentLocation = { lat, lng };
            map.setView([lat, lng], 12);
            document.getElementById('city-select').value = '';
            clearBlast(); // Clear blast when location changes
        } else {
            alert('Location not found. Please try a different address.');
        }
    } catch (error) {
        alert('Error searching for location. Please try again.');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Handle weapon selection
    document.getElementById('weapon-select').addEventListener('change', function () {
        currentBomb = this.value;
        updateWeaponDetails();
        clearBlast(); // Clear blast when weapon changes
    });

    // Handle city selection
    document.getElementById('city-select').addEventListener('change', function () {
        if (this.value) {
            const [lat, lng] = this.value.split(',').map(Number);
            currentLocation = { lat, lng };
            map.setView([lat, lng], 12);
            clearBlast(); // Clear blast when city changes
        }
    });

    // Allow Enter key for search
    document.getElementById('custom-address').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            searchAddress();
        }
    });

    // Handle unit selection (simplified since it's hidden)
    useMetric = false; // Always use imperial by default

    // Handle legend clicks
    document.querySelectorAll('.legend-item').forEach(item => {
        item.addEventListener('click', function () {
            const zone = this.dataset.zone;

            if (hiddenZones.has(zone)) {
                hiddenZones.delete(zone);
                this.classList.remove('disabled');
            } else {
                hiddenZones.add(zone);
                this.classList.add('disabled');
            }

            // If blast is currently shown, redraw it
            if (Object.keys(blastCircles).length > 0) {
                clearBlast();
                simulateBlast();
            }
        });
    });
}

// Update weapon details display
function updateWeaponDetails() {
    const weapon = bombData[currentBomb];
    const detailsDiv = document.getElementById('weapon-details');
    detailsDiv.innerHTML = `
        <div class="bomb-name">${weapon.name}</div>
        <div class="bomb-details">${weapon.details}</div>
    `;
}

// Make functions globally accessible for onclick handlers
window.simulateBlast = simulateBlast;
window.searchAddress = searchAddress;