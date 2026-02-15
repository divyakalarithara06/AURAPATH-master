/**
 * AuraPath - Safety-First Navigation Logic
 */

// --- Configuration & State ---
const CONFIG = {
    DEFAULT_COORD: { lat: 40.7128, lng: -74.0060 }, // NYC
    INACTIVITY_LIMIT_SEC: 90,
    SOS_LIMIT_SEC: 5,
    RISK_THRESHOLD: 3,
    MARKER_COLORS: {
        USER: '#3b82f6',
        CHECKPOINT: '#10b981',
        RISK: '#ef4444'
    },
    TELEGRAM: {
        BOT_TOKEN: 'YOUR_BOT_TOKEN', // User needs to replace this
        CHAT_ID: 'YOUR_CHAT_ID'      // User needs to replace this
    }
};

let state = {
    map: null,
    userPos: null,
    lastPos: null,
    startTime: null,
    inactivityTimer: null,
    sosTimer: null,
    sosSecondsRemaining: 120,
    isNavigating: false,
    activeRoute: null,
    inactivitySeconds: 0,
    simulatedPoints: [],
    checkpointMarkers: [],
    reviews: JSON.parse(localStorage.getItem('auraPathReviews') || '[]')
};

// --- Simulated Safety Dataset ---
// Generate points around the map for demo
function generateSimulatedData(center) {
    const points = [];
    const types = ['streetlight', 'shop', 'risk'];
    for (let i = 0; i < 50; i++) {
        const offsetLat = (Math.random() - 0.5) * 0.05;
        const offsetLng = (Math.random() - 0.5) * 0.05;
        points.push({
            lat: center.lat + offsetLat,
            lng: center.lng + offsetLng,
            streetlights: Math.floor(Math.random() * 5),
            shops: Math.floor(Math.random() * 3),
            riskLevel: Math.floor(Math.random() * 5) + 1,
            type: types[Math.floor(Math.random() * types.length)]
        });
    }
    return points;
}

// --- Initialization ---
function init() {
    console.log("AuraPath Initializing...");
    setupMap();
    setupEventListeners();
    renderReviews();

    // Check local storage for previous user position
    const savedPos = localStorage.getItem('auraPathLastPos');
    if (savedPos) {
        state.userPos = JSON.parse(savedPos);
        centerMapOn(state.userPos.lat, state.userPos.lng);
    } else {
        centerMapOn(CONFIG.DEFAULT_COORD.lat, CONFIG.DEFAULT_COORD.lng);
    }

    // Start background loops
    setInterval(monitoringLoop, 1000);

    // Load Telegram Config
    const savedTg = localStorage.getItem('auraPathTelegram');
    if (savedTg) {
        CONFIG.TELEGRAM = JSON.parse(savedTg);
        const tokenInput = document.getElementById('tgBotToken');
        tokenInput.value = "SAVED";
        tokenInput.type = "text";
        document.getElementById('tgChatId').value = CONFIG.TELEGRAM.CHAT_ID;
    }
}

function setupMap() {
    state.map = L.map('map', {
        zoomControl: false,
        attributionControl: false
    }).setView([CONFIG.DEFAULT_COORD.lat, CONFIG.DEFAULT_COORD.lng], 13);

    // Dark Tile Layer (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
    }).addTo(state.map);

    L.control.zoom({ position: 'bottomright' }).addTo(state.map);
}

function centerMapOn(lat, lng) {
    state.userPos = { lat, lng };
    state.map.flyTo([lat, lng], 15);
    state.simulatedPoints = generateSimulatedData(state.userPos);
    updateRiskLevelDisplay();
    drawUserMarker();
}

function drawUserMarker() {
    if (state.userMarker) state.map.removeLayer(state.userMarker);

    const icon = L.divIcon({
        className: 'user-marker',
        html: `<div style="width: 20px; height: 20px; background: ${CONFIG.MARKER_COLORS.USER}; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 15px ${CONFIG.MARKER_COLORS.USER};"></div>`,
        iconSize: [20, 20]
    });

    state.userMarker = L.marker([state.userPos.lat, state.userPos.lng], { icon }).addTo(state.map);
}

// --- Core Features ---

// 1. Live Location System
async function handleUseLocation() {
    const btn = document.getElementById('useLocationBtn');
    btn.innerText = "Locating...";

    if (!navigator.geolocation) {
        showManualInputs("Geolocation not supported. Enter manual coordinates.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const { latitude, longitude } = pos.coords;
            centerMapOn(latitude, longitude);
            btn.innerText = "Location Used";
            document.getElementById('manualInputs').classList.add('hidden');
        },
        (err) => {
            console.warn("Location denied or error:", err);
            showManualInputs("Access denied. Please enter manually.");
            btn.innerText = "Use My Location";
        }
    );
}

function showManualInputs(msg) {
    console.log(msg);
    document.getElementById('manualInputs').classList.remove('hidden');
}

async function handleManualLocation() {
    const query = document.getElementById('manualLocationName').value;
    if (!query) {
        alert("Please enter a location name (e.g. City or Landmark)");
        return;
    }

    const btn = document.getElementById('setManualLocation');
    const originalText = btn.innerText;
    btn.innerText = "Searching...";
    btn.disabled = true;

    try {
        // Use free Nominatim API for geocoding
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data && data.length > 0) {
            const { lat, lon } = data[0];
            const latitude = parseFloat(lat);
            const longitude = parseFloat(lon);

            centerMapOn(latitude, longitude);
            localStorage.setItem('auraPathLastPos', JSON.stringify({ lat: latitude, lng: longitude }));
            console.log(`Manual location set to: ${query} (${latitude}, ${longitude})`);
        } else {
            alert("Location not found. Please be more specific (e.g. name + city).");
        }
    } catch (err) {
        console.error("Geocoding error:", err);
        alert("Search failed. Please check your internet connection.");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// 2. Safety Score Engine
function calculateSafetyScore(route) {
    // Formula: +2 per streetlight, +1 per shop, -5 per riskLevel
    // Inside simulatedPoints, find points near the route
    let rawScore = 50; // Base score

    // Simulate finding points along route
    const nearbyPoints = state.simulatedPoints.slice(0, 10); // Mock subset

    nearbyPoints.forEach(p => {
        rawScore += (p.streetlights * 2);
        rawScore += (p.shops * 1);
        rawScore -= (p.riskLevel * 5);
    });

    // Slightly influence by community reviews
    const unsafeReports = state.reviews.filter(r => r.type === 'unsafe').length;
    rawScore -= (unsafeReports * 2);

    // Normalize 0-100
    return Math.max(0, Math.min(100, rawScore));
}

// --- Features handled at the end of the file ---

// 4. Inactivity Monitoring
function monitoringLoop() {
    if (!state.userPos) return;

    // Movement Detection Simulation
    // If not moving for real, we simulate it by comparing state.userPos with state.lastPos
    // (In a real app, this would use live GPS feeds)
    const isMoving = checkMovement();
    const movementText = document.querySelector('.status-text');
    const pulse = document.querySelector('.pulse');

    if (isMoving) {
        state.inactivitySeconds = 0;
        movementText.innerText = "User in Motion";
        pulse.style.backgroundColor = CONFIG.MARKER_COLORS.CHECKPOINT;
    } else {
        state.inactivitySeconds++;
        movementText.innerText = `Stopped (${state.inactivitySeconds}s)`;
        pulse.style.backgroundColor = CONFIG.MARKER_COLORS.RISK;
    }

    // CHECK INACTIVITY RISK
    const currentRisk = getCurrentRiskLevel();
    if (state.inactivitySeconds > CONFIG.INACTIVITY_LIMIT_SEC && currentRisk >= CONFIG.RISK_THRESHOLD) {
        showRiskAlert();
    }

    // SOS TIMER
    if (state.sosActive) {
        state.sosSecondsRemaining--;
        updateSosDisplay();
        if (state.sosSecondsRemaining <= 0) {
            triggerEmergencyProtocol();
        }
    }

    state.lastPos = { ...state.userPos };
}

function checkMovement() {
    // For this simulation, we'll say user is "moving" if they are toggling something or searching
    // But to make it "testable" for the user, let's just make it stop after 5 seconds of no activity
    return false; // Force stop for demo testing
}

function getCurrentRiskLevel() {
    // Check nearest simulated point
    if (state.simulatedPoints.length === 0) return 1;
    return state.simulatedPoints[0].riskLevel;
}

function updateRiskLevelDisplay() {
    const level = getCurrentRiskLevel();
    const badge = document.getElementById('riskLevelBadge');
    badge.className = 'badge ' + (level < 3 ? 'risk-low' : (level < 4 ? 'risk-med' : 'risk-high'));
    badge.innerText = (level < 3 ? 'Low' : (level < 4 ? 'Moderate' : 'High')) + ' Risk Zone';
}

function showRiskAlert() {
    document.getElementById('riskAlertPopup').classList.remove('hidden');
}

function handleConfirmSafe() {
    state.inactivitySeconds = 0;
    document.getElementById('riskAlertPopup').classList.add('hidden');
    console.log("User confirmed safe.");
}

async function handleShareLocation() {
    const lat = state.userPos.lat.toFixed(4);
    const lng = state.userPos.lng.toFixed(4);
    const message = `🚨 <b>MANUAL SOS ALERT</b> 🚨\n\nAuraPath user has manually shared their location!\n\n📍 <b>Coordinates:</b> ${lat}, ${lng}\n🗺️ <b>View on Map:</b> https://www.google.com/maps?q=${lat},${lng}`;

    showToast("Sending emergency notification...", "info");
    const success = await sendTelegramSOS(message);

    if (success) {
        // success handled inside sendTelegramSOS toast now
    } else {
        showToast("Failed to send Telegram alert. Check configuration.", "error");
        // Fallback to alert if Telegram fails
        alert("Emergency contact notified with your location: " + lat + ", " + lng);
    }

    document.getElementById('riskAlertPopup').classList.add('hidden');
}

// 5. SOS Mode
function toggleSosMode(e) {
    state.sosActive = e.target.checked;
    const controls = document.getElementById('sosControls');
    const hint = document.getElementById('sosInactiveHint');

    if (state.sosActive) {
        controls.classList.remove('hidden');
        hint.classList.add('hidden');
        resetSosTimer();
        console.log("SOS Mode Activated");
    } else {
        controls.classList.add('hidden');
        hint.classList.remove('hidden');
        console.log("SOS Mode Deactivated");
    }
}

function resetSosTimer() {
    state.sosSecondsRemaining = CONFIG.SOS_LIMIT_SEC;
    updateSosDisplay();
}

function updateSosDisplay() {
    const min = Math.floor(state.sosSecondsRemaining / 60);
    const sec = state.sosSecondsRemaining % 60;
    document.getElementById('sosTimer').innerText = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

async function triggerEmergencyProtocol() {
    state.sosActive = false;
    document.getElementById('sosAlertPopup').classList.remove('hidden');
    console.error("Emergency protocol triggered!");

    const lat = state.userPos.lat.toFixed(4);
    const lng = state.userPos.lng.toFixed(4);
    const message = `🚨 <b>AUTOMATIC SOS ALERT</b> 🚨\n\nAuraPath SOS timer has expired without user check-in!\n\n📍 <b>Last Known Location:</b> ${lat}, ${lng}\n🗺️ <b>View on Map:</b> https://www.google.com/maps?q=${lat},${lng}`;

    showToast("Triggering automatic SOS Telegram alert...", "error");
    await sendTelegramSOS(message);
}

/**
 * Sends a notification to Telegram via Bot API
 */
async function sendTelegramSOS(message) {
    const { BOT_TOKEN, CHAT_ID } = CONFIG.TELEGRAM;

    if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN' || !CHAT_ID || CHAT_ID === 'YOUR_CHAT_ID') {
        console.warn("Telegram Bot Token or Chat ID not configured.");
        showToast("Telegram not configured! Check settings.", "error");
        return false;
    }

    // Use GET request with query params for better compatibility in local file:// environments
    // This avoids CORS preflight (OPTIONS) which often fails on file://
    const baseUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const params = new URLSearchParams({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'HTML' // Switched to HTML for more predictable parsing
    });

    const url = `${baseUrl}?${params.toString()}`;

    console.log("Attempting to send Telegram SOS...");

    try {
        const response = await fetch(url); // Default is GET
        const data = await response.json();

        if (data.ok) {
            console.log("Telegram SOS sent successfully");
            showToast("Telegram alert sent!", "success");
            return true;
        } else {
            console.error("Telegram API error:", data);
            showToast(`Telegram Error: ${data.description}`, "error");
            return false;
        }
    } catch (error) {
        console.error("Error sending Telegram SOS:", error);
        showToast("Network error while sending SOS", "error");
        return false;
    }
}

// 6. Safe Checkpoints
// 6. Safe Checkpoints
function updateCheckpoints() {
    console.log("Safe Checkpoints Refreshing...");
    const list = document.getElementById('checkpointsList');
    if (!list || !state.map) return;

    // 1. Clear Map
    if (state.checkpointMarkers && state.checkpointMarkers.length > 0) {
        state.checkpointMarkers.forEach(m => state.map.removeLayer(m));
    }
    state.checkpointMarkers = [];

    // 2. Clear Sidebar List
    list.innerHTML = '';

    // 3. Mock Checkpoint Data (Calculated relative to current map view)
    const checkpoints = [
        { name: 'Apex Safety Lounge', type: 'Sanctuary', icon: '☕', safety: 'High' },
        { name: 'District General Health', type: 'Medical', icon: '🏥', safety: 'Critical' },
        { name: 'Police Watch Post 5', type: 'Security', icon: '👮', safety: 'Maximum' },
        { name: 'Community Care Point', type: 'Safe Zone', icon: '🏠', safety: 'High' }
    ];

    const origin = state.userPos || state.map.getCenter();
    if (!origin) return;

    // 4. Generate and Add
    checkpoints.forEach((cp, index) => {
        // Random offset from center for demo
        const lat = origin.lat + (Math.random() - 0.5) * 0.012;
        const lng = origin.lng + (Math.random() - 0.5) * 0.012;

        // Add to Sidebar
        const item = document.createElement('div');
        item.className = 'checkpoint-item fade-in';
        item.style.animationDelay = `${index * 0.1}s`;
        item.innerHTML = `
            <div class="checkpoint-icon" style="font-size: 24px;">${cp.icon}</div>
            <div class="checkpoint-info">
                <h5>${cp.name}</h5>
                <p>${Math.floor(Math.random() * 300 + 100)}m • ${cp.safety} Safety Ranking</p>
            </div>
        `;
        list.appendChild(item);

        // Add to Map with maximum visibility settings
        const marker = L.marker([lat, lng], {
            icon: L.divIcon({
                className: 'cp-marker', // Matches style.css
                html: `<div class="marker-emoji-wrapper">${cp.icon}</div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            }),
            zIndexOffset: 1000 // Ensure markers are on top
        }).addTo(state.map).bindPopup(`<strong>${cp.name}</strong><br>${cp.type} • Secured Zone`);

        state.checkpointMarkers.push(marker);
    });

    console.log(`${state.checkpointMarkers.length} checkpoints added to map.`);
}

// 7. Community Review
function handleReviewSubmit(e) {
    e.preventDefault();
    const type = document.querySelector('input[name="review"]:checked')?.value;
    if (!type) return;

    const newReview = {
        type,
        text: type.replace('_', ' ').toUpperCase(),
        time: new Date().toLocaleTimeString(),
        id: Date.now()
    };

    state.reviews.unshift(newReview);
    localStorage.setItem('auraPathReviews', JSON.stringify(state.reviews));
    renderReviews();
    e.target.reset();

    // Influence score if navigating
    if (state.activeRoute) {
        state.activeRoute.score = calculateSafetyScore(state.activeRoute);
        selectRoute(state.activeRoute);
    }
}

function renderReviews() {
    const container = document.getElementById('reviewsContainer');
    container.innerHTML = '';

    state.reviews.slice(0, 5).forEach(r => {
        const div = document.createElement('div');
        div.className = 'review-item';
        div.innerHTML = `
            <p>${r.text}</p>
            <time>${r.time}</time>
        `;
        container.appendChild(div);
    });
}

// --- Event Listeners ---
function setupEventListeners() {
    document.getElementById('useLocationBtn').onclick = handleUseLocation;
    document.getElementById('setManualLocation').onclick = handleManualLocation;
    document.getElementById('searchRouteBtn').onclick = handleSearchRoute;
    document.getElementById('confirmSafeBtn').onclick = handleConfirmSafe;
    document.getElementById('shareLocationBtn').onclick = handleShareLocation;
    document.getElementById('dismissSosAlert').onclick = () => document.getElementById('sosAlertPopup').classList.add('hidden');
    document.getElementById('sosToggle').onchange = toggleSosMode;
    document.getElementById('imSafeBtn').onclick = resetSosTimer;
    document.getElementById('reviewForm').onsubmit = handleReviewSubmit;

    // Theme Toggle
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.onchange = (e) => {
        const theme = e.target.checked ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        if (theme === 'light') document.body.classList.add('light-mode');
        else document.body.classList.remove('light-mode');
        showToast(`Switched to ${theme} mode`, 'info');
    };

    // Telegram Config Focus (Clear "SAVED" on click to allow edit)
    document.getElementById('tgBotToken').onfocus = (e) => {
        if (e.target.value === 'SAVED') {
            e.target.value = '';
            e.target.type = 'password';
        }
    };

    // Telegram Config Toggle
    document.getElementById('toggleTelegramConfig').onclick = () => {
        document.getElementById('telegramInputs').classList.toggle('hidden');
    };

    // Telegram Config Save
    document.getElementById('saveTelegramConfig').onclick = async () => {
        const tokenInput = document.getElementById('tgBotToken');
        const chatIdInput = document.getElementById('tgChatId');
        const token = tokenInput.value.trim();
        const chatId = chatIdInput.value.trim();

        if (!token || !chatId || token === 'SAVED') {
            showToast("Please enter valid credentials", "error");
            return;
        }

        CONFIG.TELEGRAM.BOT_TOKEN = token;
        CONFIG.TELEGRAM.CHAT_ID = chatId;
        localStorage.setItem('auraPathTelegram', JSON.stringify(CONFIG.TELEGRAM));

        // UI Feedback: Change token to "SAVED"
        tokenInput.value = "SAVED";
        tokenInput.type = "text"; // Show it as saved text

        showToast("Configuration saved! Sending test message...", "info");

        // Send actual test message
        const success = await sendTelegramSOS("✅ <b>AuraPath:</b> Connection Successful! Your emergency alerts will now be sent to this chat.");

        if (success) {
            setTimeout(() => document.getElementById('telegramInputs').classList.add('hidden'), 2000);
        }
    };

    // Global Ripple Effect
    document.addEventListener('click', (e) => {
        const target = e.target.closest('.btn-ripple');
        if (!target) return;

        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        target.appendChild(ripple);

        const rect = target.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${e.clientY - rect.top - size / 2}px`;

        ripple.addEventListener('animationend', () => ripple.remove());
    });
}

// --- UI Enhancements ---

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️');
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// 3. Updated Route System with Loader
function handleSearchRoute() {
    const dest = document.getElementById('destinationInput').value;
    if (!dest) {
        showToast("Please enter a destination", "error");
        return;
    }

    // Show Loader
    const loader = document.getElementById('routeLoader');
    const routesList = document.getElementById('routesList');
    const routeCard = document.getElementById('routeComparisonCard');

    routeCard.classList.remove('hidden');
    routesList.innerHTML = '';
    loader.classList.remove('hidden');

    // Simulated recalculation delay (Reduced for better UX)
    setTimeout(() => {
        loader.classList.add('hidden');
        state.isNavigating = true;

        const routes = [
            {
                id: 1, type: 'fastest', dist: '1.2km', time: '14 min', score: 65, color: '#3b82f6',
                why: "Calculated based on traffic-flow and direct distance. High visibility but moderate congestion."
            },
            {
                id: 2, type: 'safest', dist: '1.8km', time: '18 min', score: 92, color: '#10b981',
                why: "Prioritizes high street lighting (12+ points), proximity to open shops, and low incident reports."
            }
        ];

        routes.forEach(r => {
            const card = document.createElement('div');
            card.className = `route-card ${r.type} fade-in`;
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center">
                    <strong>${r.type.toUpperCase()}</strong>
                    <span class="badge ${r.score > 80 ? 'risk-low' : 'risk-med'}">${r.score}% Safety</span>
                </div>
                <div class="helper-text" style="margin: 5px 0;">${r.dist} • ${r.time}</div>
                <button class="toggle-info-btn" onclick="event.stopPropagation(); toggleRouteInfo(this.parentElement)">Why this route? ▾</button>
                <div class="route-info-expand">${r.why}</div>
            `;
            card.onclick = () => selectRoute(r);
            routesList.appendChild(card);
        });

        // Auto-select safest route (Triggers updateCheckpoints automatically)
        selectRoute(routes[1]);
        showToast("Routes found & prioritized", "success");
    }, 800);
}

function toggleRouteInfo(card) {
    card.classList.toggle('expanded');
    const btn = card.querySelector('.toggle-info-btn');
    btn.innerText = card.classList.contains('expanded') ? 'Hide details ▴' : 'Why this route? ▾';
}

function selectRoute(route) {
    if (!route) return;
    state.activeRoute = route;

    // UI Update
    document.querySelectorAll('.route-card').forEach(c => c.classList.remove('active'));
    const activeCard = document.querySelector(`.route-card.${route.type}`);
    if (activeCard) activeCard.classList.add('active');

    const bar = document.getElementById('safetyMeterBar');
    const val = document.getElementById('safetyScoreValue');
    const verdict = document.getElementById('safetyVerdict');

    if (bar) bar.style.width = route.score + '%';
    if (val) val.innerText = route.score;
    if (verdict) verdict.innerText = route.score > 80 ? "This route is highly recommended for safety." : "Caution: Moderate risk detected on this path.";

    document.getElementById('statLights').innerText = Math.floor(route.score / 4);
    document.getElementById('statShops').innerText = Math.floor(route.score / 8);
    document.getElementById('statRisk').innerText = route.score > 80 ? 'Low' : 'Moderate';

    // Map Polyline
    if (state.currentPolyline) state.map.removeLayer(state.currentPolyline);
    const endLat = state.userPos.lat + (Math.random() - 0.5) * 0.02;
    const endLng = state.userPos.lng + (Math.random() - 0.5) * 0.02;
    state.currentPolyline = L.polyline([
        [state.userPos.lat, state.userPos.lng],
        [state.userPos.lat + 0.005, state.userPos.lng + 0.005],
        [endLat, endLng]
    ], { color: route.color, weight: 6, opacity: 0.8 }).addTo(state.map);

    state.map.fitBounds(state.currentPolyline.getBounds(), { padding: [50, 50] });

    // RESTORE CHECKPOINTS
    setTimeout(() => updateCheckpoints(), 500); // Small delay to ensure map stability
    showToast(`Active: ${route.type.toUpperCase()}`, 'info');
}

// SOS notification enhancement
const originalToggleSosMode = toggleSosMode;
toggleSosMode = function (e) {
    originalToggleSosMode(e);
    if (e.target.checked) {
        showToast("SOS Mode Activated!", "error");
    } else {
        showToast("SOS Mode Deactivated", "success");
    }
};

// Start
window.onload = init;
