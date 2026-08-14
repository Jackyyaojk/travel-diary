// Initialize map
const map = L.map('map').setView([35, 105], 4);

map.createPane('regionsPane');
map.getPane('regionsPane').style.zIndex = 350;

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

let regionLayer = L.geoJSON(null, { pane: 'regionsPane' }).addTo(map);

const markerColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB',
    '#E67E22', '#2ECC71', '#F1C40F', '#E74C3C'
];

let currentMode = 'intl';
let markersLayer = L.layerGroup().addTo(map);

const btnIntl = document.getElementById('btn-intl');
const btnDomestic = document.getElementById('btn-domestic');
const detailsPanel = document.getElementById('location-details');
const placeholder = document.getElementById('placeholder');
const locationCount = document.getElementById('location-count');

function setMode(mode) {
    currentMode = mode;

    if (mode === 'intl') {
        btnIntl.classList.add('active');
        btnDomestic.classList.remove('active');
        map.setView([20, 0], 2);
    } else {
        btnDomestic.classList.add('active');
        btnIntl.classList.remove('active');
        map.setView([35, 105], 4);
    }

    renderMarkers();
    loadAndRenderRegions(mode);
}

let cachedGeoData = {
    world: null,
    china: null
};

function loadAndRenderRegions(mode) {
    if (regionLayer) map.removeLayer(regionLayer);

    const urls = getGeoJsonUrls(mode);
    const cacheKey = (mode === 'intl') ? 'world' : 'china';

    if (cachedGeoData[cacheKey]) {
        drawRegions(cachedGeoData[cacheKey], mode);
        return;
    }

    loadGeoJsonWithFallback(urls)
        .then(data => {
            cachedGeoData[cacheKey] = data;
            drawRegions(data, mode);
        })
        .catch(err => {
            console.error(`[travel-map] ${mode} GeoJSON load failed`, err);
        });
}

function getGeoJsonUrls(mode) {
    const source = (mode === 'intl') ? geoJsonUrls.world : geoJsonUrls.china;
    return Array.isArray(source) ? source : [source];
}

function loadGeoJsonWithFallback(urls, index = 0) {
    const url = urls[index];

    return fetch(url)
        .then(res => {
            if (!res.ok) {
                throw new Error(`${res.status} ${res.statusText}`);
            }
            return res.json();
        })
        .catch(err => {
            if (index + 1 >= urls.length) {
                throw err;
            }
            console.warn(`[travel-map] GeoJSON source failed, trying fallback: ${url}`, err);
            return loadGeoJsonWithFallback(urls, index + 1);
        });
}

function drawRegions(data, mode) {
    let visitedCount = 0;

    regionLayer = L.geoJSON(data, {
        pane: 'regionsPane',
        style: function(feature) {
            let isVisited = false;
            let visitedColor = '#FF9F43';

            const props = feature.properties;
            const geoNames = getFeatureNames(props);

            if (typeof travelData !== 'undefined' && travelData[mode]) {
                const currentList = travelData[mode];

                for (let i = 0; i < currentList.length; i++) {
                    const trip = currentList[i];
                    let match = false;
                    const targets = regionMapping?.[mode]?.[trip.name];

                    if (targets) {
                        if (geoNames.some(n => n && targets.some(t => n.includes(t) || t.includes(n)))) {
                            match = true;
                        }
                    }

                    if (!match && !targets && mode === 'intl') {
                        if (geoNames.some(n => n && trip.name.includes(n))) {
                            match = true;
                        }
                    }

                    if (match) {
                        isVisited = true;
                        visitedColor = markerColors[i % markerColors.length];
                        visitedCount++;
                        break;
                    }
                }
            }

            return {
                fillColor: isVisited ? visitedColor : 'transparent',
                weight: isVisited ? 2 : 0.5,
                opacity: 1,
                color: isVisited ? '#555' : '#ccc',
                dashArray: '3',
                fillOpacity: isVisited ? 0.75 : 0
            };
        }
    }).addTo(map);
    regionLayer.bringToBack();
    console.info(`[travel-map] ${mode} regions loaded: ${data.features.length}, visited regions matched: ${visitedCount}`);
}

function getFeatureNames(props) {
    const knownKeys = ['name', 'NAME', 'Name', 'chn_name', 'fullname', 'fullName', 'adcode', 'id'];
    const names = knownKeys.map(key => props[key]);

    Object.keys(props).forEach(key => {
        if (typeof props[key] === 'string') {
            names.push(props[key]);
        }
    });

    return names.filter(Boolean).map(String);
}

function renderMarkers() {
    markersLayer.clearLayers();

    const data = travelData[currentMode];
    locationCount.innerText = data.length;

    renderList(data);

    data.forEach((item, index) => {
        const color = markerColors[index % markerColors.length];

        const icon = L.divIcon({
            className: 'custom-pin-container',
            html: `<div class="custom-pin" style="background-color: ${color};"></div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        });

        const marker = L.marker([item.lat, item.lng], { icon: icon })
            .addTo(markersLayer);

        marker.on('click', () => {
            showDetails(item);
            map.setView([item.lat, item.lng], 8, {
                animate: true,
                duration: 1.5
            });
        });
    });
}

function renderList(listData) {
    placeholder.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'travel-list-group';

    listData.forEach(item => {
        const div = document.createElement('div');
        div.className = 'travel-item';
        div.innerHTML = `
            <div class="travel-item-name">${item.name}</div>
            <div class="travel-item-date"><i class="far fa-calendar-alt"></i> ${item.date}</div>
        `;

        div.addEventListener('click', () => {
            showDetails(item);
            map.flyTo([item.lat, item.lng], 8);
        });

        wrapper.appendChild(div);
    });

    placeholder.appendChild(wrapper);
}

function showDetails(item) {
    placeholder.style.display = 'none';
    detailsPanel.classList.remove('hidden');

    let photoSrc = item.photo;
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

    if (currentMode === 'intl') {
        map.setView([20, 0], 2);
    } else {
        map.setView([35, 105], 4);
    }
}

btnIntl.addEventListener('click', () => setMode('intl'));
btnDomestic.addEventListener('click', () => setMode('domestic'));

setMode('intl');

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

audioPlayer.addEventListener('ended', nextSong);

welcomeOverlay.addEventListener('click', () => {
    welcomeOverlay.style.opacity = '0';
    setTimeout(() => {
        welcomeOverlay.style.display = 'none';
    }, 500);

    if (typeof musicList !== 'undefined' && musicList.length > 0) {
        loadSong(0);
        audioPlayer.play().catch(e => {
            console.log("Play failed even after click:", e);
        });
    }
});

if (typeof musicList !== 'undefined' && musicList.length > 0) {
    loadSong(0);
}
