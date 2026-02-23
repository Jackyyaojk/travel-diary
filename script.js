// Initialize map
const map = L.map('map').setView([35, 105], 4); // Default center (roughly China/Asia)

// Add tile layer (using CartoDB Voyager for a clean look, will appear grayscale via CSS)
// Or CartoDB Positron which is already light/gray
const tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
	subdomains: 'abcd',
	maxZoom: 20
}).addTo(map);

// GeoJSON Layers (for coloring regions)
let regionLayer = L.geoJSON(null).addTo(map);

// Unified Color Palette (Rainbow)
const markerColors = [
        '#FF6B6B', // Red
        '#4ECDC4', // Teal 
        '#45B7D1', // Light Blue
        '#96CEB4', // Greenish
        '#FFEEAD', // Yellow
        '#D4A5A5', // Pink
        '#9B59B6', // Purple
        '#3498DB', // Blue
        '#E67E22', // Orange
        '#2ECC71', // Green
        '#F1C40F', // Yellow
        '#E74C3C'  // Red
];

// State
let currentMode = 'intl'; // 'intl' or 'domestic'
let markersLayer = L.layerGroup().addTo(map);

// DOM Elements
const btnIntl = document.getElementById('btn-intl');
const btnDomestic = document.getElementById('btn-domestic');
const detailsPanel = document.getElementById('location-details');
const placeholder = document.getElementById('placeholder');
const locationCount = document.getElementById('location-count');

// Switch Mode Function
function setMode(mode) {
    currentMode = mode;
    
    // Update Button styles
    if (mode === 'intl') {
        btnIntl.classList.add('active');
        btnDomestic.classList.remove('active');
        // Fit view to world or specific region
        map.setView([20, 0], 2); 
    } else {
        btnDomestic.classList.add('active');
        btnIntl.classList.remove('active');
        // Fit view to China
        map.setView([35, 105], 4); 
    }

    renderMarkers();    loadAndRenderRegions(mode);
}

// Global cached GeoJSON data to avoid re-fetching
let cachedGeoData = {
    world: null,
    china: null
};

function loadAndRenderRegions(mode) {
    if (regionLayer) map.removeLayer(regionLayer);
    
    // Using reliable sources for GeoJSON with valid CORS headers
    // World countries
    const worldUrl = 'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json';
    // China provinces (GitHub source - more stable for GitHub Pages due to CORS)
    const chinaUrl = 'https://raw.githubusercontent.com/longwosion/geojson-map-china/master/china.json';

    const url = (mode === 'intl') ? worldUrl : chinaUrl;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            regionLayer = L.geoJSON(data, {
                style: function(feature) {
                    let isVisited = false;
                    let visitedColor = '#FF9F43'; // default fallback

                    const props = feature.properties;
                    // Common name property keys
                    const geoNames = [props.name, props.NAME, props.Name, props.chn_name];

                    if (typeof travelData !== 'undefined' && travelData[mode]) {
                        const currentList = travelData[mode];
                        
                        // Check if any trip matches this region
                        for (let i = 0; i < currentList.length; i++) {
                            const trip = currentList[i];
                            let match = false;

                            // Check via configured mapping (best)
                            if (typeof regionMapping !== 'undefined' && regionMapping[mode] && regionMapping[mode][trip.name]) {
                                const targets = regionMapping[mode][trip.name];
                                // Improved fuzzy matching: Check if geoName contains target OR target contains geoName
                                // "北京市" contains "北京" -> Match!
                                if (geoNames.some(n => n && targets.some(t => n.includes(t) || t.includes(n)))) {
                                    match = true;
                                }
                            }
                            
                            // Heuristic: check if trip name contains geo name (e.g. "Spain" in "Spain - Madrid")
                            // Only safely do this for International mode where names are English
                            if (!match && mode === 'intl') {
                                if (geoNames.some(n => n && trip.name.includes(n))) {
                                    match = true;
                                }
                            }

                            if (match) {
                                isVisited = true;
                                // Use the same color as the marker (index based)
                                visitedColor = markerColors[i % markerColors.length];
                                break;
                            }
                        }
                    }

                    return {
                        fillColor: isVisited ? visitedColor : 'transparent', 
                        weight: isVisited ? 1 : 0.5,
                        opacity: 1,
                        color: isVisited ? 'white' : '#ccc',  // White border if visited, gray otherwise
                        dashArray: '3',
                        fillOpacity: isVisited ? 0.6 : 0
                    };
                }
            }).addTo(map);
            regionLayer.bringToBack();
        })
        .catch(err => {
            console.error("GeoJSON load failed", err);
        });
}

// Render Markers
function renderMarkers() {
    markersLayer.clearLayers();
    
    const data = travelData[currentMode];
    locationCount.innerText = data.length;

    // Render the list of visited places as well
    renderList(data);

    data.forEach((item, index) => {
        // Pick a color based on index to keep it consistent for the same item, or random
        // Using index % colors.length ensures it cycles through colors
        const color = markerColors[index % markerColors.length];

        // Create custom icon with dynamic color
        const icon = L.divIcon({
            className: 'custom-pin-container', 
            html: `<div class="custom-pin" style="background-color: ${color};"></div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 30] 
        });

        // Add marker to map
        const marker = L.marker([item.lat, item.lng], { icon: icon })
            .addTo(markersLayer);

        // Click event to show details
        marker.on('click', () => {
            showDetails(item);
            
            // Highlight marker (optional: maybe change color)
            map.setView([item.lat, item.lng], 8, {
                animate: true,
                duration: 1.5
            });
        });
    });
}

// Render the side list
function renderList(listData) {
    // Only update if placeholder is visible, otherwise we don't want to show the list while viewing details
    // Actually, maybe we always want to show the list until details are viewed.
    // Let's assume the user wants the list shown by default.
    
    // But if details panel is open, we don't clear it.
    // However, the request is for when "initially no selection".
    
    placeholder.innerHTML = '';
    
    const wrapper = document.createElement('div');
    wrapper.className = 'travel-list-group';
    
    // Sort by date perhaps? Or keep original order. Let's keep original for now.
    
    listData.forEach(item => {
        const div = document.createElement('div');
        div.className = 'travel-item';
        div.innerHTML = `
            <div class="travel-item-name">${item.name}</div>
            <div class="travel-item-date"><i class="far fa-calendar-alt"></i> ${item.date}</div>
        `;
        
        div.addEventListener('click', () => {
            showDetails(item);
            // Also center map
            map.flyTo([item.lat, item.lng], 8);
        });
        
        wrapper.appendChild(div);
    });
    
    placeholder.appendChild(wrapper);
}

// Show Details
function showDetails(item) {
    placeholder.style.display = 'none';
    detailsPanel.classList.remove('hidden');

    let photoSrc = item.photo;
    // Check if basePaths is defined and if the photo path isn't absolute/URL
    // We also check it DOES NOT start with '.' to avoid double prefixing if manually added
    if (typeof basePaths !== 'undefined' && basePaths[currentMode] && 
        !photoSrc.startsWith('http') && !photoSrc.startsWith('/') && !photoSrc.startsWith('file://') && !photoSrc.startsWith('.')) {
        photoSrc = basePaths[currentMode] + photoSrc;
    }

    document.getElementById('detail-photo').src = photoSrc;
    document.getElementById('detail-name').innerText = item.name;
    document.getElementById('detail-date').innerText = item.date;
    document.getElementById('detail-desc').innerText = item.desc || "暂无描述";
}

function hideDetails() {
    detailsPanel.classList.add('hidden');
    placeholder.style.display = 'block';
    
    // Zoom out map based on current mode
    if (currentMode === 'intl') {
        map.setView([20, 0], 2);
    } else {
        map.setView([35, 105], 4);
    }
}

// Event Listeners
btnIntl.addEventListener('click', () => setMode('intl'));
btnDomestic.addEventListener('click', () => setMode('domestic'));

// Initialize
setMode('intl'); // Start with International view or logic to decide based on preference

// --- Music Player Logic ---
let currentSongIndex = 0;
const audioPlayer = document.getElementById('bg-music');
const welcomeOverlay = document.getElementById('welcome-overlay');

function loadSong(index) {
    if (index >= musicList.length) index = 0;
    if (index < 0) index = musicList.length - 1;
    currentSongIndex = index;

    const song = musicList[currentSongIndex];
    audioPlayer.src = song.url;
}

function nextSong() {
    let newIndex = currentSongIndex + 1;
    if (newIndex >= musicList.length) newIndex = 0;
    loadSong(newIndex);
    audioPlayer.play();
}

// Auto play next song when current one ends
audioPlayer.addEventListener('ended', nextSong);

// Start on Click for Overlay
welcomeOverlay.addEventListener('click', () => {
    // Hide Overlay
    welcomeOverlay.style.opacity = '0';
    setTimeout(() => {
        welcomeOverlay.style.display = 'none';
    }, 500);

    // Start Music
    if (typeof musicList !== 'undefined' && musicList.length > 0) {
        loadSong(0); // Ensure first song is loaded
        audioPlayer.play().catch(e => {
            console.log("Play failed even after click:", e);
        });
    }
});

// Initialize first song (ready to play)
if (typeof musicList !== 'undefined' && musicList.length > 0) {
    loadSong(0);
}