// ===== CONFIG =====
const ADMIN_WHATSAPP = '917734906606'; // Admin WhatsApp number (with country code)

// ===== MAIN APPLICATION =====
let creatorsData = [];
let filtered = [];
let userLocation = null;
let gpsReady = false;
let nearMeActive = false;
let serviceRowCount = 5;
let viewMode = 'small';
let currentSearchQuery = '';
let searchTimeout = null;

// ===== CUSTOM NICHE STATE =====
let customNiches = [];

// ===== DOM REFS =====
const grid = document.getElementById('creatorsGrid');
const countEl = document.getElementById('creatorCount');
const searchInput = document.getElementById('searchInput');
const searchArea = document.getElementById('searchArea');
const searchToggle = document.getElementById('searchToggle');
const menuToggle = document.getElementById('menuToggle');
const themeToggle = document.getElementById('themeToggle');
const sideMenu = document.getElementById('sideMenu');
const overlay = document.getElementById('overlay');
const closeMenuBtn = document.getElementById('closeMenuBtn');
const nearMeBtn = document.getElementById('nearmeBtn');
const nearMeMenu = document.getElementById('nearMeMenu');
const listProfileBtn = document.getElementById('listProfileBtn');
const listProfileDesktop = document.getElementById('listProfileDesktop');
const profileModal = document.getElementById('profileModal');
const joinModal = document.getElementById('joinModal');
const closeProfileModal = document.getElementById('closeProfileModal');
const closeJoinModal = document.getElementById('closeJoinModal');
const modalBody = document.getElementById('modalBody');
const joinForm = document.getElementById('joinForm');

// side filters
const sideDistrict = document.getElementById('sideDistrict');
const sideNiche = document.getElementById('sideNiche');
const sideService = document.getElementById('sideService');
const sideBudget = document.getElementById('sideBudget');
const applySideFilters = document.getElementById('applySideFilters');

// ===== TOAST =====
function showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = 'toast-container';
    const iconMap = {
        'success': 'fa-check-circle',
        'warning': 'fa-exclamation-triangle',
        'error': 'fa-times-circle',
        'info': 'fa-info-circle'
    };
    el.innerHTML =
        `<i class="fas ${iconMap[type] || 'fa-info-circle'}"></i> ${msg}`;
    container.appendChild(el);
    setTimeout(() => { el.remove(); }, 4000);
}

// ===== CUSTOM NICHE FUNCTIONS =====
function addCustomNiche() {
    const input = document.getElementById('customNicheInput');
    const value = input.value.trim();
    if (!value) {
        showToast('⚠️ Please enter a niche name', 'warning');
        return;
    }
    
    if (value.length > 30) {
        showToast('⚠️ Niche name should be under 30 characters', 'warning');
        return;
    }
    
    // Check if already exists in custom list
    const existing = customNiches.find(n => n.toLowerCase() === value.toLowerCase());
    if (existing) {
        showToast('⚠️ This niche already exists', 'warning');
        input.value = '';
        return;
    }
    
    // Check if it's already in the default list
    const defaultLabels = document.querySelectorAll('.extra-niche-cb');
    let alreadyDefault = false;
    defaultLabels.forEach(cb => {
        if (cb.value.toLowerCase() === value.toLowerCase()) {
            alreadyDefault = true;
        }
    });
    if (alreadyDefault) {
        showToast('⚠️ This niche is already in the list above', 'warning');
        input.value = '';
        return;
    }
    
    customNiches.push(value);
    renderCustomNiches();
    input.value = '';
    updateCustomNicheCounter();
    showToast('✅ Added "' + value + '" niche', 'success');
}

function removeCustomNiche(value) {
    customNiches = customNiches.filter(n => n !== value);
    renderCustomNiches();
    updateCustomNicheCounter();
}

function renderCustomNiches() {
    const container = document.getElementById('additionalNichesContainer');
    // Remove existing custom tags (keep default ones)
    container.querySelectorAll('.niche-tag-custom').forEach(el => el.remove());
    
    customNiches.forEach(niche => {
        const label = document.createElement('label');
        label.className = 'niche-tag-custom';
        label.innerHTML = `
            <input type="checkbox" class="extra-niche-cb" value="${niche}">
            🏷️ ${niche}
            <span class="remove-custom-niche" onclick="event.stopPropagation(); removeCustomNiche('${niche}')">×</span>
        `;
        container.appendChild(label);
    });
}

function updateCustomNicheCounter() {
    const container = document.getElementById('additionalNichesContainer');
    const count = customNiches.length;
    // Remove existing counter if any
    const existingCounter = container.querySelector('.custom-niche-counter');
    if (existingCounter) existingCounter.remove();
    
    if (count > 0) {
        const counter = document.createElement('span');
        counter.className = 'custom-niche-counter';
        counter.style.cssText = 'font-size:11px;color:var(--text-muted);margin-left:auto;padding-left:8px;';
        counter.textContent = `+${count} custom`;
        container.appendChild(counter);
    }
}

function getAllSelectedNiches() {
    const selected = [];
    document.querySelectorAll('.extra-niche-cb:checked').forEach(cb => {
        selected.push(cb.value);
    });
    return selected;
}

// ===== SERVICE ROW FUNCTIONS =====
function addServiceRow() {
    serviceRowCount++;
    const container = document.getElementById('serviceChargesContainer');
    const row = document.createElement('div');
    row.className = 'service-charge-row';
    row.id = `service-row-${serviceRowCount}`;
    row.innerHTML = `
        <div class="form-group" style="margin-bottom:0;">
            <label style="font-size:11px;">Service Name</label>
            <input type="text" class="service-name-input" placeholder="e.g. Product Review" style="padding:8px 12px;font-size:13px;">
        </div>
        <div class="form-group" style="margin-bottom:0;">
            <label style="font-size:11px;">Charge (₹)</label>
            <input type="number" class="service-charge-input" placeholder="5000" style="padding:8px 12px;font-size:13px;">
        </div>
        <div class="form-group" style="margin-bottom:0;">
            <label style="font-size:11px;">Model</label>
            <select class="service-model-select" style="padding:8px 12px;font-size:13px;">
                <option value="fixed">Fixed</option>
                <option value="starting_from">Starting From</option>
                <option value="negotiable">Negotiable</option>
                <option value="range">Range</option>
            </select>
        </div>
        <div class="form-group" style="margin-bottom:0;">
            <label style="font-size:11px;">Min (₹)</label>
            <input type="number" class="service-min-input" placeholder="3000" style="padding:8px 12px;font-size:13px;">
        </div>
        <div class="form-group" style="margin-bottom:0;">
            <label style="font-size:11px;">Max (₹)</label>
            <input type="number" class="service-max-input" placeholder="7000" style="padding:8px 12px;font-size:13px;">
        </div>
        <button type="button" class="remove-service-btn" onclick="removeServiceRow(this)" style="margin-top:18px;">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(row);
}

function removeServiceRow(btn) {
    const row = btn.closest('.service-charge-row');
    if (row && document.querySelectorAll('.service-charge-row').length > 1) {
        row.remove();
    } else {
        showToast('⚠️ At least one service is required', 'warning');
    }
}

function getServiceCharges() {
    const rows = document.querySelectorAll('.service-charge-row');
    const services = [];
    rows.forEach(row => {
        const name = row.querySelector('.service-name-input')?.value?.trim();
        const chargeRaw = parseInt(row.querySelector('.service-charge-input')?.value);
        const model = row.querySelector('.service-model-select')?.value;
        const min = parseInt(row.querySelector('.service-min-input')?.value);
        const max = parseInt(row.querySelector('.service-max-input')?.value);
        const hasCharge = !isNaN(chargeRaw);
        const hasRange = !isNaN(min) && !isNaN(max);
        if (name && (hasCharge || hasRange)) {
            const charge = hasCharge ? chargeRaw : min;
            const service = { service: name, charge: charge, model: model || 'fixed' };
            if (!isNaN(min)) service.min = min;
            if (!isNaN(max)) service.max = max;
            services.push(service);
        }
    });
    return services;
}

function getServices(c) {
    const fromList = c.services || [];
    const fromCharges = (c.serviceCharges || []).map(s => s.service);
    return [...new Set([...fromList, ...fromCharges])];
}

// ===== FILTERS STORAGE =====
function saveFilters() {
    const filters = {
        district: sideDistrict.value,
        niche: sideNiche.value,
        service: sideService.value,
        budget: sideBudget.value
    };
    try {
        localStorage.setItem('cgFilters', JSON.stringify(filters));
    } catch (e) {}
}

function loadFilters() {
    try {
        const saved = localStorage.getItem('cgFilters');
        if (saved) {
            const filters = JSON.parse(saved);
            sideDistrict.value = filters.district || '';
            sideNiche.value = filters.niche || '';
            sideService.value = filters.service || '';
            sideBudget.value = filters.budget || '';
        }
    } catch (e) {}
}

function clearFilters() {
    sideDistrict.value = '';
    sideNiche.value = '';
    sideService.value = '';
    sideBudget.value = '';
    saveFilters();
    render();
    closeMenu();
    showToast('🗑️ Filters cleared', 'info');
}

// ===== LOAD DATA WITH RETRY =====
async function loadData(retries = 3) {
    try {
        const res = await fetch('creators.json');
        if (!res.ok) throw new Error('Network error - Could not load creators.json');
        const data = await res.json();
        creatorsData = data.creators || [];
        creatorsData.forEach(c => { 
            c.services = getServices(c);
            // Ensure additionalNiches is always an array
            if (!c.additionalNiches) c.additionalNiches = [];
        });
        filtered = [...creatorsData];
        populateSideFilters();
        loadFilters();
        render();
        getUserLocationSilent();
        showToast('✅ ' + creatorsData.length + ' creators loaded successfully!', 'success');
    } catch (e) {
        if (retries > 0) {
            showToast('⚠️ Retrying... (' + (4 - retries) + '/3)', 'warning');
            setTimeout(() => loadData(retries - 1), 2000);
        } else {
            console.error('Error loading creators:', e);
            grid.innerHTML =
                `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Unable to Load Creators</h3><p>Make sure <strong>creators.json</strong> is in the same folder as index.html</p><p style="font-size:13px;color:var(--text-muted);margin-top:8px;">Error: ${e.message}</p><button class="btn-primary" onclick="loadData()" style="margin-top:16px;padding:10px 24px;border-radius:60px;"><i class="fas fa-rotate"></i> Retry</button></div>`;
            showToast('⚠️ Could not load creators.json. Check console for details.', 'warning');
        }
    }
}

function populateSideFilters() {
    const districts = [...new Set(creatorsData.map(c => c.district))].sort();
    const niches = [...new Set(creatorsData.flatMap(c => [c.niche, ...(c.additionalNiches || [])].filter(Boolean)))].sort();
    const services = [...new Set(creatorsData.flatMap(c => c.services || []))].sort();

    [sideDistrict, sideNiche, sideService].forEach(sel => {
        while (sel.options.length > 1) sel.remove(1);
    });

    districts.forEach(d => {
        const o = document.createElement('option');
        o.value = d;
        o.textContent = d;
        sideDistrict.appendChild(o);
    });
    niches.forEach(n => {
        const o = document.createElement('option');
        o.value = n;
        o.textContent = n;
        sideNiche.appendChild(o);
    });
    services.forEach(s => {
        const o = document.createElement('option');
        o.value = s;
        o.textContent = s;
        sideService.appendChild(o);
    });
}

// Silent background GPS - only re-renders if Near Me is already active
function getUserLocationSilent() {
    if (!navigator.geolocation) {
        userLocation = { lat: 21.2514, lng: 81.6296 };
        gpsReady = true;
        return;
    }
    navigator.geolocation.getCurrentPosition(
        pos => {
            userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            gpsReady = true;
            if (nearMeActive) render();
        },
        () => {
            userLocation = { lat: 21.2514, lng: 81.6296 };
            gpsReady = true;
            if (nearMeActive) render();
        },
        { enableHighAccuracy: true, timeout: 8000 }
    );
}

// Active GPS request triggered by user - shows toast and re-renders
function getUserLocation(callback) {
    if (!navigator.geolocation) {
        userLocation = { lat: 21.2514, lng: 81.6296 };
        gpsReady = true;
        showToast('📍 Geolocation not supported, using Raipur', 'warning');
        if (callback) callback();
        return;
    }
    navigator.geolocation.getCurrentPosition(
        pos => {
            userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            gpsReady = true;
            showToast('📍 Location detected', 'success');
            if (callback) callback();
        },
        () => {
            userLocation = { lat: 21.2514, lng: 81.6296 };
            gpsReady = true;
            showToast('📍 Using default location (Raipur)', 'warning');
            if (callback) callback();
        },
        { enableHighAccuracy: true, timeout: 8000 }
    );
}

function getMinCharge(c) {
    const svc = c.serviceCharges || [];
    const vals = svc.map(s => {
        if (s.model === 'range' && s.min) return s.min;
        if (s.model === 'starting_from') return s.startingPrice || s.charge || 0;
        return s.charge || 0;
    }).filter(v => v > 0);
    if (vals.length) return Math.min(...vals);
    return c.charges?.reel || 0;
}

// ===== RELEVANCE SCORING =====
function getRelevanceScore(creator, query) {
    if (!query) return 0;
    const q = query.toLowerCase().trim();
    let score = 0;
    
    if (creator.niche && creator.niche.toLowerCase().includes(q)) {
        score += 3;
    }
    if (creator.niche && creator.niche.toLowerCase() === q) {
        score += 2;
    }
    if (creator.additionalNiches) {
        creator.additionalNiches.forEach(n => {
            if (n.toLowerCase().includes(q)) {
                score += 2;
            }
            if (n.toLowerCase() === q) {
                score += 1;
            }
        });
    }
    if (creator.services) {
        creator.services.forEach(s => {
            if (s.toLowerCase().includes(q)) {
                score += 1;
            }
        });
    }
    if (creator.name && creator.name.toLowerCase().includes(q)) {
        score += 0.5;
    }
    if (creator.city && creator.city.toLowerCase().includes(q)) {
        score += 0.5;
    }
    if (creator.district && creator.district.toLowerCase().includes(q)) {
        score += 0.5;
    }
    
    return score;
}

// ===== SORTING FUNCTION =====
function sortCreators(creators, searchQuery = '') {
    const premium = [];
    const featured = [];
    const regular = [];
    
    creators.forEach(c => {
        if (c.featured && c.verified) {
            premium.push(c);
        } else if (c.featured) {
            featured.push(c);
        } else {
            regular.push(c);
        }
    });
    
    const sortByRelevance = (a, b) => {
        if (searchQuery) {
            const scoreA = getRelevanceScore(a, searchQuery);
            const scoreB = getRelevanceScore(b, searchQuery);
            if (scoreA !== scoreB) return scoreB - scoreA;
        }
        return a.name.localeCompare(b.name);
    };
    
    if (nearMeActive && userLocation) {
        // Cache distances once — avoids recalculating on every sort comparison
        const distCache = new Map();
        const getDist = (c) => {
            if (!distCache.has(c.id)) {
                distCache.set(c.id, calcDist(userLocation.lat, userLocation.lng, c.latitude, c.longitude));
            }
            return distCache.get(c.id);
        };

        const sortByDistRelevance = (a, b) => {
            if (searchQuery) {
                const scoreA = getRelevanceScore(a, searchQuery);
                const scoreB = getRelevanceScore(b, searchQuery);
                if (scoreA !== scoreB) return scoreB - scoreA;
            }
            return getDist(a) - getDist(b);
        };

        premium.sort(sortByDistRelevance);
        featured.sort(sortByDistRelevance);
        regular.sort(sortByDistRelevance);
    } else {
        premium.sort(sortByRelevance);
        featured.sort(sortByRelevance);
        regular.sort(sortByRelevance);
    }
    
    return [...premium, ...featured, ...regular];
}

// ===== RENDER SINGLE CREATOR CARD =====
function renderCreatorCard(creator, dist, q) {
    let avatarContent;
    if (creator.profileImage) {
        avatarContent = `<img src="${getAvatarSrc(creator.profileImage, 200)}" alt="${creator.name}" loading="lazy" onerror="this.style.display='none';this.parentElement.innerHTML='<i class=\\'fas fa-user\\' style=\\'font-size:22px;color:rgba(255,255,255,0.85);\\'></i>';">`;
    } else {
        avatarContent = '<i class="fas fa-user" style="font-size:22px;color:rgba(255,255,255,0.85);"></i>';
    }
    const avatar = `<div class="avatar-inner">${avatarContent}</div>`;
    const nicheEmoji = getEmoji(creator.niche);

    const isPremium = creator.featured && creator.verified;
    const isFeaturedOnly = creator.featured && !creator.verified;

    let relevanceBadge = '';
    if (q) {
        const score = getRelevanceScore(creator, q);
        if (score >= 3) {
            relevanceBadge = '<span class="relevance-badge high"><i class="fas fa-bolt"></i> High match</span>';
        } else if (score >= 2) {
            relevanceBadge = '<span class="relevance-badge medium"><i class="fas fa-wave-square"></i> Good match</span>';
        } else if (score >= 0.5) {
            relevanceBadge = '<span class="relevance-badge low"><i class="fas fa-circle"></i> Related</span>';
        }
    }

    if (viewMode === 'medium' || viewMode === 'small') {
        const card = document.createElement('div');
        card.className = `creator-card ${viewMode}`;
        card.onclick = () => openProfile(creator.id);
        card.innerHTML = `
            <div class="creator-card-top">
                <div class="avatar-col">
                    <div class="creator-avatar">
                        ${avatar}
                    </div>
                    ${dist !== null ? `<div class="distance-badge"><i class="fas fa-location-arrow"></i> ${dist.toFixed(1)} km</div>` : ''}
                </div>
                <div class="creator-info">
                    <div class="creator-name">
                        ${creator.name}
                        ${isPremium ? ' <i class="fas fa-crown" style="color:#FFD700;font-size:14px;"></i>' : ''}
                        ${isFeaturedOnly ? ' <i class="fas fa-star" style="color:#FFD700;font-size:14px;"></i>' : ''}
                        ${relevanceBadge}
                    </div>
                    <div class="creator-niche">${nicheEmoji} ${creator.niche}</div>
                    <div class="creator-location"><i class="fas fa-map-marker-alt"></i> ${creator.district}, ${creator.city}</div>
                </div>
            </div>
            <div class="creator-social">
                ${creator.socialLinks?.instagram ? `
                    <a href="${creator.socialLinks.instagram}" target="_blank" class="social-link instagram" onclick="event.stopPropagation()">
                        <i class="fab fa-instagram"></i> <span class="count">${formatNum(creator.instagramFollowers)}</span>
                    </a>
                ` : `
                    <span class="social-link"><i class="fab fa-instagram"></i> <span class="count">${formatNum(creator.instagramFollowers)}</span></span>
                `}
                ${creator.socialLinks?.youtube ? `
                    <a href="${creator.socialLinks.youtube}" target="_blank" class="social-link youtube" onclick="event.stopPropagation()">
                        <i class="fab fa-youtube"></i> <span class="count">${formatNum(creator.youtubeSubscribers)}</span>
                    </a>
                ` : `
                    <span class="social-link"><i class="fab fa-youtube"></i> <span class="count">${formatNum(creator.youtubeSubscribers)}</span></span>
                `}
                ${creator.socialLinks?.facebook ? `
                    <a href="${creator.socialLinks.facebook}" target="_blank" class="social-link facebook" onclick="event.stopPropagation()">
                        <i class="fab fa-facebook"></i> <span class="count">${formatNum(creator.facebookFollowers)}</span>
                    </a>
                ` : `
                    <span class="social-link"><i class="fab fa-facebook"></i> <span class="count">${formatNum(creator.facebookFollowers)}</span></span>
                `}
                <span class="engagement-badge"><i class="fas fa-bolt"></i> ${creator.engagementRate}%</span>
            </div>
            ${(creator.isUGCCreator || creator.barter) ? `<div style="display:flex;gap:4px;margin:3px 0;">${creator.isUGCCreator ? '<span style="background:rgba(76,175,80,0.12);color:#4CAF50;padding:2px 8px;border-radius:50px;font-size:10px;font-weight:600;"><i class="fas fa-film"></i> UGC</span>' : ''}${creator.barter ? '<span style="background:rgba(255,165,0,0.12);color:#FFA500;padding:2px 8px;border-radius:50px;font-size:10px;font-weight:600;"><i class="fas fa-exchange-alt"></i> Barter</span>' : ''}</div>` : ''}
        `;
        return card;
    }

    let servicesHTML = '';
    if (creator.serviceCharges && creator.serviceCharges.length > 0) {
        servicesHTML = `
            <div class="creator-services">
                <div class="services-title"><i class="fas fa-dollar-sign"></i> Service Charges</div>
                ${creator.serviceCharges.slice(0, 4).map(sc => `
                    <div class="service-item">
                        <span class="service-name">${sc.service}</span>
                        <span class="service-price">${formatPriceDisplay(sc)}</span>
                    </div>
                `).join('')}
                ${creator.serviceCharges.length > 4 ? `
                    <div style="text-align:center;font-size:11px;color:var(--text-muted);padding-top:4px;">
                        +${creator.serviceCharges.length - 4} more services
                    </div>
                ` : ''}
            </div>
        `;
    }

    let pricingHTML = '';
    if (creator.pricingInfo) {
        pricingHTML = `
            <div class="pricing-info">
                <div class="pricing-header">
                    <span class="label">💰 ${getPricingEmoji(creator.pricingInfo.model)}</span>
                    <span class="pricing-badge ${creator.pricingInfo.model}">${getPricingLabel(creator.pricingInfo)}</span>
                </div>
                ${creator.pricingInfo.description ? `<div class="pricing-desc">${creator.pricingInfo.description}</div>` : ''}
            </div>
        `;
    }

    const card = document.createElement('div');
    card.className = 'creator-card';
    card.innerHTML = `
        <div class="creator-card-top">
            <div class="avatar-col">
                <div class="creator-avatar">
                    ${avatar}
                </div>
                ${dist !== null ? `<div class="distance-badge"><i class="fas fa-location-arrow"></i> ${dist.toFixed(1)} km</div>` : ''}
            </div>
            <div class="creator-info">
                <div class="creator-name">
                    ${creator.name}
                    ${isPremium ? ' <i class="fas fa-crown" style="color:#FFD700;font-size:14px;"></i>' : ''}
                    ${isFeaturedOnly ? ' <i class="fas fa-star" style="color:#FFD700;font-size:14px;"></i>' : ''}
                    ${relevanceBadge}
                </div>
                <div class="creator-niche">${nicheEmoji} ${creator.niche}</div>
                <div class="creator-location"><i class="fas fa-map-marker-alt"></i> ${creator.district}, ${creator.city}</div>
            </div>
        </div>
        <div class="creator-social">
            ${creator.socialLinks?.instagram ? `
                <a href="${creator.socialLinks.instagram}" target="_blank" class="social-link instagram">
                    <i class="fab fa-instagram"></i> <span class="count">${formatNum(creator.instagramFollowers)}</span>
                </a>
            ` : `
                <span class="social-link"><i class="fab fa-instagram"></i> <span class="count">${formatNum(creator.instagramFollowers)}</span></span>
            `}
            ${creator.socialLinks?.youtube ? `
                <a href="${creator.socialLinks.youtube}" target="_blank" class="social-link youtube">
                    <i class="fab fa-youtube"></i> <span class="count">${formatNum(creator.youtubeSubscribers)}</span>
                </a>
            ` : `
                <span class="social-link"><i class="fab fa-youtube"></i> <span class="count">${formatNum(creator.youtubeSubscribers)}</span></span>
            `}
            ${creator.socialLinks?.facebook ? `
                <a href="${creator.socialLinks.facebook}" target="_blank" class="social-link facebook">
                    <i class="fab fa-facebook"></i> <span class="count">${formatNum(creator.facebookFollowers)}</span>
                </a>
            ` : `
                <span class="social-link"><i class="fab fa-facebook"></i> <span class="count">${formatNum(creator.facebookFollowers)}</span></span>
            `}
            <span class="engagement-badge"><i class="fas fa-bolt"></i> ${creator.engagementRate}%</span>
        </div>
        <div style="font-size:13px;color:var(--text-secondary);margin:4px 0;">
            <i class="fas fa-eye"></i> Avg Views: ${formatNum(creator.avgReelViews)}
        </div>
        ${pricingHTML}
        ${servicesHTML}
        <div style="font-size:11px;color:var(--text-muted);margin:4px 0;">
            <i class="fas fa-briefcase"></i> ${creator.services.slice(0, 3).join(' • ')}${creator.services.length > 3 ? ` +${creator.services.length - 3} more` : ''}
        </div>
        <div class="creator-card-actions">
            <button class="btn-whatsapp" onclick="contactWhatsApp('${creator.contact?.whatsapp || ''}', '${(creator.name || '').replace(/'/g, "\\'")}')">
                <i class="fab fa-whatsapp"></i> WhatsApp
            </button>
            <button class="btn-profile" onclick="openProfile(${creator.id})">
                <i class="fas fa-eye"></i> Profile
            </button>
        </div>
    `;
    return card;
}

// ===== RENDER =====
function render() {
    if (!creatorsData.length) return;

    const q = searchInput.value.toLowerCase().trim();
    currentSearchQuery = q;
    let result = filtered;

    if (q) {
        result = result.filter(c =>
            c.name.toLowerCase().includes(q) ||
            c.niche.toLowerCase().includes(q) ||
            c.city.toLowerCase().includes(q) ||
            c.district.toLowerCase().includes(q) ||
            (c.services || []).some(s => s.toLowerCase().includes(q)) ||
            (c.additionalNiches || []).some(n => n.toLowerCase().includes(q)) ||
            (c.languages || []).some(l => l.toLowerCase().includes(q)) ||
            (c.pastBrands || []).some(b => b.toLowerCase().includes(q)) ||
            (c.description || '').toLowerCase().includes(q)
        );
    }

    const d = sideDistrict.value;
    const n = sideNiche.value;
    const svc = sideService.value;
    const budget = parseInt(sideBudget.value);

    // Check if any filter is active (other than search)
    const hasActiveFilter = !!(d || n || svc || budget);

    if (d) result = result.filter(c => c.district === d);
    if (n) result = result.filter(c => c.niche === n || (c.additionalNiches || []).includes(n));
    if (svc) result = result.filter(c => (c.services || []).includes(svc));
    if (budget) result = result.filter(c => getMinCharge(c) <= budget);

    result = sortCreators(result, q);

    // Build "other creators" list (not in current filtered result) when filters active
    let otherCreators = [];
    if (hasActiveFilter) {
        const filteredIds = new Set(result.map(c => c.id));
        otherCreators = creatorsData.filter(c => !filteredIds.has(c.id));
        // Sort others: premium (featured+verified) → star (featured only) → distance
        otherCreators = sortCreators(otherCreators, '');
    }

    const total = result.length;
    countEl.textContent = `${total} creators`;

    if (total === 0 && otherCreators.length === 0) {
        grid.innerHTML =
            `<div class="empty-state"><i class="fas fa-user-slash"></i><p>No creators match your filters.</p></div>`;
        return;
    }

    grid.innerHTML = '';
    grid.classList.toggle('medium-mode', viewMode === 'medium');
    grid.classList.toggle('small-mode', viewMode === 'small');

    if (total === 0 && otherCreators.length > 0) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-user-slash"></i><p>No creators match your filters.</p></div>`;
    }

    result.forEach(creator => {
        const dist = (nearMeActive && userLocation) ? calcDist(userLocation.lat, userLocation.lng, creator.latitude, creator.longitude) : null;
        const card = renderCreatorCard(creator, dist, q);
        grid.appendChild(card);
    });

    // ===== OTHER CREATORS SECTION =====
    if (hasActiveFilter && otherCreators.length > 0) {
        // Divider header
        const divider = document.createElement('div');
        divider.className = 'other-creators-divider';
        divider.innerHTML = `
            <div class="divider-line"></div>
            <div class="divider-pill">
                <i class="fas fa-users"></i>
                <span>Other Creators</span>
                <span class="divider-count">${otherCreators.length}</span>
            </div>
            <div class="divider-line"></div>
        `;
        grid.appendChild(divider);

        otherCreators.forEach(creator => {
            const dist = (nearMeActive && userLocation) ? calcDist(userLocation.lat, userLocation.lng, creator.latitude, creator.longitude) : null;
            const card = renderCreatorCard(creator, dist, q);
            card.style.opacity = '0.82';
            grid.appendChild(card);
        });
    }
}

// ===== HELPER FUNCTIONS =====
function formatPriceDisplay(service) {
    let html = '';
    switch (service.model) {
        case 'fixed': {
            html = `₹${service.charge}`;
            html += ` <span class="charge-model fixed">Fixed</span>`;
            break;
        }
        case 'starting_from': {
            const startPrice = service.startingPrice || service.charge;
            html = `<span class="from-label">From</span> ₹${startPrice}`;
            html += ` <span class="charge-model starting">Starting</span>`;
            break;
        }
        case 'negotiable': {
            html = `₹${service.charge}`;
            html += ` <span class="charge-model negotiable">Negotiable</span>`;
            break;
        }
        case 'range': {
            const minPrice = service.min || service.charge;
            const maxPrice = service.max || service.charge;
            html = `₹${minPrice} - ₹${maxPrice}`;
            html += ` <span class="charge-model range">Range</span>`;
            break;
        }
        default: {
            html = `₹${service.charge}`;
        }
    }
    if (service.negotiable) {
        html += ` <span class="negotiable-tag">🤝 Negotiable</span>`;
    }
    return html;
}

function getPricingLabel(pricingInfo) {
    if (!pricingInfo) return '';
    switch (pricingInfo.model) {
        case 'fixed':
            return 'Fixed Price';
        case 'starting_from':
            return `From ₹${pricingInfo.startingPrice || 0}`;
        case 'negotiable':
            return 'Negotiable';
        case 'range':
            return `₹${pricingInfo.minPrice || 0} - ₹${pricingInfo.maxPrice || 0}`;
        default:
            return '';
    }
}

function getPricingEmoji(model) {
    const emojis = {
        'fixed': '✅',
        'starting_from': '🚀',
        'negotiable': '🤝',
        'range': '📊'
    };
    return emojis[model] || '💰';
}

function calcDist(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(
        dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatNum(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n.toString();
}

function getAvatarSrc(url, size = 200) {
    if (!url) return '';
    if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
        return url.replace('/upload/', `/upload/c_fill,g_auto:face,ar_1:1,w_${size},h_${size}/`);
    }
    return url;
}

function getEmoji(niche) {
    const map = {
        'Travel': '✈️',
        'Food': '🍜',
        'Beauty': '💄',
        'Fashion': '👗',
        'Tech': '💻',
        'Fitness': '💪',
        'Health & Wellness': '🌿',
        'Parenting': '👶',
        'Sustainable Living': '🌍',
        'Hotel Promotion': '🏨',
        'Store Promotion': '🛍️',
        'Tourism': '🏞️',
        'Wedding': '💍',
        'Education': '📚',
        'Finance': '💰',
        'Automobile': '🚗',
        'Real Estate': '🏠',
        'Gaming': '🎮',
        'Photography': '📸',
        'Lifestyle': '🌟',
        'Event Coverage': '🎪',
        'Local News': '📰',
        'Entrepreneur': '🚀'
    };
    return map[niche] || '🏷️';
}

// ===== PROFILE MODAL =====
function openProfile(id) {
    const c = creatorsData.find(x => x.id === id);
    if (!c) return;

    const dist = userLocation ? calcDist(userLocation.lat, userLocation.lng, c.latitude, c.longitude) : null;
    const isPremium = c.featured && c.verified;
    const isFeaturedOnly = c.featured && !c.verified;

    let socialLinksHTML = '';
    if (c.socialLinks) {
        const links = [];
        if (c.socialLinks.instagram) {
            links.push(`<a href="${c.socialLinks.instagram}" target="_blank" style="background:rgba(225,48,108,0.15);color:#E1306C;padding:8px 16px;border-radius:50px;text-decoration:none;font-size:14px;font-weight:500;display:inline-flex;align-items:center;gap:8px;"><i class="fab fa-instagram"></i> Instagram</a>`);
        }
        if (c.socialLinks.youtube) {
            links.push(`<a href="${c.socialLinks.youtube}" target="_blank" style="background:rgba(255,0,0,0.15);color:#FF0000;padding:8px 16px;border-radius:50px;text-decoration:none;font-size:14px;font-weight:500;display:inline-flex;align-items:center;gap:8px;"><i class="fab fa-youtube"></i> YouTube</a>`);
        }
        if (c.socialLinks.facebook && c.socialLinks.facebook !== '') {
            links.push(`<a href="${c.socialLinks.facebook}" target="_blank" style="background:rgba(24,119,242,0.15);color:#1877F2;padding:8px 16px;border-radius:50px;text-decoration:none;font-size:14px;font-weight:500;display:inline-flex;align-items:center;gap:8px;"><i class="fab fa-facebook"></i> Facebook</a>`);
        }
        if (c.socialLinks.x && c.socialLinks.x !== '') {
            links.push(`<a href="${c.socialLinks.x}" target="_blank" style="background:rgba(255,255,255,0.08);color:var(--text-primary);padding:8px 16px;border-radius:50px;text-decoration:none;font-size:14px;font-weight:500;display:inline-flex;align-items:center;gap:8px;"><i class="fab fa-x-twitter"></i> X</a>`);
        }
        if (c.socialLinks.thread && c.socialLinks.thread !== '') {
            links.push(`<a href="${c.socialLinks.thread}" target="_blank" style="background:rgba(255,255,255,0.08);color:var(--text-primary);padding:8px 16px;border-radius:50px;text-decoration:none;font-size:14px;font-weight:500;display:inline-flex;align-items:center;gap:8px;"><i class="fab fa-threads"></i> Threads</a>`);
        }
        if (c.socialLinks.snapchat && c.socialLinks.snapchat !== '') {
            links.push(`<a href="${c.socialLinks.snapchat}" target="_blank" style="background:rgba(255,252,0,0.12);color:#FFFC00;padding:8px 16px;border-radius:50px;text-decoration:none;font-size:14px;font-weight:500;display:inline-flex;align-items:center;gap:8px;"><i class="fab fa-snapchat"></i> Snapchat</a>`);
        }
        if (c.socialLinks.twitter && c.socialLinks.twitter !== '') {
            links.push(`<a href="${c.socialLinks.twitter}" target="_blank" style="background:rgba(29,161,242,0.12);color:#1DA1F2;padding:8px 16px;border-radius:50px;text-decoration:none;font-size:14px;font-weight:500;display:inline-flex;align-items:center;gap:8px;"><i class="fab fa-twitter"></i> Twitter</a>`);
        }
        if (links.length > 0) {
            socialLinksHTML = `<div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin:12px 0;">${links.join('')}</div>`;
        }
    }

    let modalServicesHTML = '';
    if (c.serviceCharges && c.serviceCharges.length > 0) {
        modalServicesHTML = `
                    <h4 style="text-align:left;margin:16px 0 8px;">💼 All Service Charges</h4>
                    <div style="display:grid;grid-template-columns:1fr;gap:6px;">
                        ${c.serviceCharges.map(sc => `
                            <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 12px;background:var(--surface-soft);border-radius:6px;font-size:13px;flex-wrap:wrap;border:1px solid var(--border-color);">
                                <span style="color:var(--text-secondary);">${sc.service}</span>
                                <span style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                                    ${formatPriceDisplay(sc)}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                `;
    }

    // Profile image with error handling
    let profileImgHtml;
    if (c.profileImage) {
        profileImgHtml = `<img src="${getAvatarSrc(c.profileImage, 300)}" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" onerror="this.style.display='none';this.parentElement.innerHTML='<i class=\\'fas fa-user\\' style=\\'font-size:28px;color:rgba(255,255,255,0.85);\\'></i>';">`;
    } else {
        profileImgHtml = '<i class="fas fa-user" style="font-size:28px;color:rgba(255,255,255,0.85);"></i>';
    }

    modalBody.innerHTML = `
                <div style="text-align:center;">
                    <div style="width:80px;height:80px;border-radius:24%;background:linear-gradient(135deg,#f9ce34,#ee2a7b,#6228d7);padding:3px;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(238,42,123,0.28);">
                        <div style="width:100%;height:100%;border-radius:19%;overflow:hidden;background:linear-gradient(135deg,var(--primary),var(--secondary));display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:#fff;">
                            ${profileImgHtml}
                        </div>
                    </div>
                    <h3 style="font-size:22px;">${c.name}</h3>
                    ${isPremium ? '<div style="background:linear-gradient(135deg,#FFD700,#FFA500);color:#1A1A2E;padding:4px 16px;border-radius:50px;font-weight:700;display:inline-block;font-size:13px;margin-bottom:4px;"><i class="fas fa-crown"></i> Premium</div>' : ''}
                    ${isFeaturedOnly ? '<div style="background:linear-gradient(135deg,#6C63FF,#5A52D5);color:#fff;padding:4px 16px;border-radius:50px;font-weight:700;display:inline-block;font-size:13px;margin-bottom:4px;"><i class="fas fa-star"></i> Featured</div>' : ''}
                    <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:6px 0;">
                        ${c.isUGCCreator ? '<span style="background:rgba(76,175,80,0.15);color:#4CAF50;padding:3px 12px;border-radius:50px;font-size:12px;font-weight:600;"><i class="fas fa-film"></i> UGC Creator</span>' : ''}
                        ${c.barter ? '<span style="background:rgba(255,165,0,0.15);color:#FFA500;padding:3px 12px;border-radius:50px;font-size:12px;font-weight:600;"><i class="fas fa-exchange-alt"></i> Open to Barter</span>' : ''}
                        ${c.creatorGender ? '<span style="background:rgba(108,99,255,0.1);color:var(--primary);padding:3px 12px;border-radius:50px;font-size:12px;"><i class="fas fa-user"></i> ' + c.creatorGender + '</span>' : ''}
                    </div>
                    <div style="color:var(--primary);font-size:14px;">${getEmoji(c.niche)} ${c.niche}</div>
                    ${(c.additionalNiches && c.additionalNiches.length > 0) ? `
                    <div style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-top:6px;">
                        ${c.additionalNiches.map(n => `<span style="background:rgba(108,99,255,0.1);color:var(--primary);padding:2px 10px;border-radius:50px;font-size:11px;">${getEmoji(n)} ${n}</span>`).join('')}
                    </div>` : ''}
                    <div style="color:var(--text-secondary);font-size:13px;margin-top:6px;">
                        <i class="fas fa-map-marker-alt"></i> ${c.district}, ${c.city} 
                        ${dist !== null ? `• <i class="fas fa-location-arrow"></i> ${dist.toFixed(1)} km` : ''}
                    </div>
                    ${(c.languages && c.languages.length > 0) ? `<div style="font-size:12px;color:var(--text-muted);margin-top:4px;"><i class="fas fa-language"></i> ${c.languages.join(' • ')}</div>` : ''}
                    <p style="color:var(--text-secondary);font-size:14px;margin:12px 0;">${c.description || ''}</p>

                    <!-- Platform Stats -->
                    ${c.platformStats ? `
                    <h4 style="text-align:left;margin:16px 0 8px;">📊 Platform Statistics</h4>
                    <div style="display:grid;grid-template-columns:1fr;gap:8px;margin:0 0 12px;">
                        ${c.platformStats.instagram && (c.instagramFollowers || c.platformStats.instagram.followers) ? `
                        <div style="background:rgba(225,48,108,0.07);border:1px solid rgba(225,48,108,0.18);border-radius:10px;padding:10px 12px;">
                            <div style="font-size:12px;font-weight:700;color:#E1306C;margin-bottom:6px;"><i class="fab fa-instagram"></i> Instagram</div>
                            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;text-align:center;">
                                <div><div style="font-weight:700;font-size:14px;">${formatNum(c.instagramFollowers || c.platformStats.instagram.followers)}</div><div style="font-size:10px;color:var(--text-muted);">Followers</div></div>
                                <div><div style="font-weight:700;font-size:14px;">${formatNum(c.platformStats.instagram.avgViews || c.avgReelViews || 0)}</div><div style="font-size:10px;color:var(--text-muted);">Avg Views</div></div>
                                <div><div style="font-weight:700;font-size:14px;">${formatNum(c.platformStats.instagram.avgLikes || 0)}</div><div style="font-size:10px;color:var(--text-muted);">Avg Likes</div></div>
                                <div><div style="font-weight:700;font-size:14px;">${c.platformStats.instagram.engagementRate || c.engagementRate || 0}%</div><div style="font-size:10px;color:var(--text-muted);">ER</div></div>
                            </div>
                        </div>` : ''}
                        ${c.platformStats.youtube && (c.youtubeSubscribers || c.platformStats.youtube.subscribers) ? `
                        <div style="background:rgba(255,0,0,0.06);border:1px solid rgba(255,0,0,0.15);border-radius:10px;padding:10px 12px;">
                            <div style="font-size:12px;font-weight:700;color:#FF0000;margin-bottom:6px;"><i class="fab fa-youtube"></i> YouTube</div>
                            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;text-align:center;">
                                <div><div style="font-weight:700;font-size:14px;">${formatNum(c.youtubeSubscribers || c.platformStats.youtube.subscribers)}</div><div style="font-size:10px;color:var(--text-muted);">Subs</div></div>
                                <div><div style="font-weight:700;font-size:14px;">${formatNum(c.platformStats.youtube.avgViews || 0)}</div><div style="font-size:10px;color:var(--text-muted);">Avg Views</div></div>
                                <div><div style="font-weight:700;font-size:14px;">${formatNum(c.platformStats.youtube.avgLikes || 0)}</div><div style="font-size:10px;color:var(--text-muted);">Avg Likes</div></div>
                                <div><div style="font-weight:700;font-size:14px;">${c.platformStats.youtube.engagementRate || 0}%</div><div style="font-size:10px;color:var(--text-muted);">ER</div></div>
                            </div>
                        </div>` : ''}
                        ${c.platformStats.facebook && (c.facebookFollowers || c.platformStats.facebook.followers) ? `
                        <div style="background:rgba(24,119,242,0.06);border:1px solid rgba(24,119,242,0.15);border-radius:10px;padding:10px 12px;">
                            <div style="font-size:12px;font-weight:700;color:#1877F2;margin-bottom:6px;"><i class="fab fa-facebook"></i> Facebook</div>
                            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;text-align:center;">
                                <div><div style="font-weight:700;font-size:14px;">${formatNum(c.facebookFollowers || c.platformStats.facebook.followers)}</div><div style="font-size:10px;color:var(--text-muted);">Followers</div></div>
                                <div><div style="font-weight:700;font-size:14px;">${formatNum(c.platformStats.facebook.avgViews || 0)}</div><div style="font-size:10px;color:var(--text-muted);">Avg Views</div></div>
                                <div><div style="font-weight:700;font-size:14px;">${formatNum(c.platformStats.facebook.avgLikes || 0)}</div><div style="font-size:10px;color:var(--text-muted);">Avg Likes</div></div>
                                <div><div style="font-weight:700;font-size:14px;">${c.platformStats.facebook.engagementRate || 0}%</div><div style="font-size:10px;color:var(--text-muted);">ER</div></div>
                            </div>
                        </div>` : ''}
                    </div>` : `
                    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:12px 0;">
                        <div style="background:var(--surface-soft);padding:8px;border-radius:8px;border:1px solid var(--border-color);">
                            <div style="font-weight:700;">${formatNum(c.instagramFollowers)}</div>
                            <div style="font-size:11px;color:var(--text-muted);">Instagram</div>
                        </div>
                        <div style="background:var(--surface-soft);padding:8px;border-radius:8px;border:1px solid var(--border-color);">
                            <div style="font-weight:700;">${formatNum(c.youtubeSubscribers)}</div>
                            <div style="font-size:11px;color:var(--text-muted);">YouTube</div>
                        </div>
                        <div style="background:var(--surface-soft);padding:8px;border-radius:8px;border:1px solid var(--border-color);">
                            <div style="font-weight:700;">${formatNum(c.facebookFollowers)}</div>
                            <div style="font-size:11px;color:var(--text-muted);">Facebook</div>
                        </div>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0;">
                        <div style="background:var(--surface-soft);padding:8px;border-radius:8px;border:1px solid var(--border-color);">
                            <div style="font-weight:700;">${formatNum(c.avgReelViews)}</div>
                            <div style="font-size:11px;color:var(--text-muted);">Avg Reel Views</div>
                        </div>
                        <div style="background:var(--surface-soft);padding:8px;border-radius:8px;border:1px solid var(--border-color);">
                            <div style="font-weight:700;">${c.engagementRate}%</div>
                            <div style="font-size:11px;color:var(--text-muted);">Engagement Rate</div>
                        </div>
                    </div>`}

                    ${c.audienceInsights && (c.audienceInsights.ageGroup || (c.audienceInsights.topLocations && c.audienceInsights.topLocations.length > 0)) ? `
                    <h4 style="text-align:left;margin:16px 0 8px;">👥 Audience Insights</h4>
                    <div style="background:var(--surface-soft);padding:10px 14px;border-radius:8px;border:1px solid var(--border-color);display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;text-align:left;">
                        ${c.audienceInsights.ageGroup ? `<div><div style="font-size:11px;color:var(--text-muted);">Age Group</div><div style="font-weight:600;font-size:13px;">${c.audienceInsights.ageGroup}</div></div>` : ''}
                        ${c.audienceInsights.genderSplit ? `<div><div style="font-size:11px;color:var(--text-muted);">Gender Split</div><div style="font-weight:600;font-size:13px;">♂ ${c.audienceInsights.genderSplit.male}% ♀ ${c.audienceInsights.genderSplit.female}%</div></div>` : ''}
                        ${c.audienceInsights.topLocations && c.audienceInsights.topLocations.length ? `<div style="grid-column:1/-1;"><div style="font-size:11px;color:var(--text-muted);">Top Locations</div><div style="font-weight:600;font-size:13px;">${c.audienceInsights.topLocations.join(' • ')}</div></div>` : ''}
                        ${c.audienceInsights.source ? `<div style="grid-column:1/-1;font-size:10px;color:var(--text-muted);"><i class="fas fa-info-circle"></i> Source: ${c.audienceInsights.source === 'self_reported' ? 'Self-reported' : 'Verified'}</div>` : ''}
                    </div>` : ''}

                    ${c.pastBrands && c.pastBrands.length > 0 ? `
                    <h4 style="text-align:left;margin:16px 0 8px;">🤝 Past Brand Collaborations</h4>
                    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">
                        ${c.pastBrands.map(b => `<span style="background:rgba(255,215,0,0.12);color:var(--accent);padding:4px 14px;border-radius:50px;font-size:12px;border:1px solid rgba(255,215,0,0.2);">🏢 ${b}</span>`).join('')}
                    </div>` : ''}

                    ${c.customLinks && (c.customLinks.facebook || c.customLinks.whatsapp || c.customLinks.instagram || c.customLinks.telegram) ? `
                    <h4 style="text-align:left;margin:16px 0 8px;">🔗 Profile & Contact Links</h4>
                    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
                        ${c.customLinks.facebook ? `<a href="${c.customLinks.facebook}" target="_blank" style="background:rgba(24,119,242,0.12);color:#1877F2;padding:6px 16px;border-radius:50px;font-size:12px;text-decoration:none;border:1px solid rgba(24,119,242,0.2);"><i class="fab fa-facebook"></i> Facebook</a>` : ''}
                        ${c.customLinks.whatsapp ? `<a href="${c.customLinks.whatsapp}" target="_blank" style="background:rgba(37,211,102,0.12);color:#25D366;padding:6px 16px;border-radius:50px;font-size:12px;text-decoration:none;border:1px solid rgba(37,211,102,0.2);"><i class="fab fa-whatsapp"></i> WhatsApp</a>` : ''}
                        ${c.customLinks.instagram ? `<a href="${c.customLinks.instagram}" target="_blank" style="background:rgba(225,48,108,0.12);color:#E1306C;padding:6px 16px;border-radius:50px;font-size:12px;text-decoration:none;border:1px solid rgba(225,48,108,0.2);"><i class="fab fa-instagram"></i> Instagram</a>` : ''}
                        ${c.customLinks.telegram ? `<a href="${c.customLinks.telegram}" target="_blank" style="background:rgba(34,158,217,0.12);color:#229ED9;padding:6px 16px;border-radius:50px;font-size:12px;text-decoration:none;border:1px solid rgba(34,158,217,0.2);"><i class="fab fa-telegram"></i> Telegram</a>` : ''}
                    </div>` : ''}

                    ${c.pricingInfo ? `
                        <div style="background:var(--surface-soft);padding:12px;border-radius:8px;margin:8px 0;border:1px solid var(--border-color);">
                            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center;">
                                <span style="font-size:13px;color:var(--text-secondary);">💰 ${getPricingEmoji(c.pricingInfo.model)}</span>
                                <span class="pricing-badge ${c.pricingInfo.model}">${getPricingLabel(c.pricingInfo)}</span>
                            </div>
                            ${c.pricingInfo.description ? `<div style="font-size:12px;color:var(--text-muted);margin-top:4px;">${c.pricingInfo.description}</div>` : ''}
                        </div>
                    ` : ''}

                    ${modalServicesHTML}

                    <h4 style="text-align:left;margin:16px 0 8px;">🛠️ Services Offered</h4>
                    <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-bottom:12px;">
                        ${c.services.map(s => `<span style="background:rgba(108,99,255,0.1);color:var(--primary);padding:4px 14px;border-radius:50px;font-size:12px;">${s}</span>`).join('')}
                    </div>

                    <div style="background:var(--surface-soft);padding:10px;border-radius:8px;margin:8px 0;border:1px solid var(--border-color);">
                        <p style="font-size:13px;color:var(--text-secondary);">
                            <i class="fas fa-map-marker-alt" style="color:var(--primary);"></i> 
                            Available in: ${c.availableDistricts ? c.availableDistricts.join(', ') : 'N/A'}
                        </p>
                        ${c.responseTime ? `<p style="font-size:12px;color:var(--text-muted);margin-top:4px;"><i class="fas fa-clock"></i> Response: ${c.responseTime}${c.turnaroundDays ? ' • Turnaround: ' + c.turnaroundDays + ' days' : ''}</p>` : ''}
                        ${(c.profileLastUpdated) ? `<p style="font-size:11px;color:var(--text-muted);margin-top:2px;"><i class="fas fa-calendar-check"></i> Updated: ${c.profileLastUpdated}</p>` : ''}
                    </div>

                    ${socialLinksHTML}

                    <div style="display:flex;gap:10px;margin-top:16px;">
                        <button class="btn-whatsapp" style="flex:1;padding:12px;border-radius:8px;font-weight:600;border:none;" onclick="contactWhatsApp('${c.contact?.whatsapp || ''}', '${(c.name || '').replace(/'/g, "\\'")}')">
                            <i class="fab fa-whatsapp"></i> WhatsApp
                        </button>
                        <button class="btn-profile" style="flex:1;padding:12px;border-radius:8px;font-weight:600;background:rgba(108,99,255,0.15);color:var(--primary);border:none;" onclick="contactEmail('${c.contact?.isEmailPublic !== false ? (c.contact?.email || '') : ''}')">
                            <i class="fas fa-envelope"></i> Email
                        </button>
                    </div>
                </div>
            `;
    profileModal.classList.add('open');
}

function contactWhatsApp(num, name) {
    if (!num) { showToast('⚠️ No WhatsApp number', 'warning'); return; }
    const greeting = `Hi ${name}! 👋 I came across your profile on CG Creators and I'm interested in your services.`;
    const url = `https://wa.me/${num}?text=${encodeURIComponent(greeting)}`;
    
    // Try opening in new window
    const win = window.open(url, '_blank');
    if (!win || win.closed || typeof win.closed === 'undefined') {
        // Fallback: copy to clipboard
        const text = `WhatsApp: ${num}\nMessage: ${greeting}`;
        fallbackCopy(text);
        showToast('📋 Copy the number and message!', 'info');
    }
}

function fallbackCopy(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
            .then(() => showToast('📋 Copied! Paste it in WhatsApp', 'success'))
            .catch(() => showToast('ℹ️ Opening WhatsApp...', 'info'));
    } else {
        // Legacy fallback for non-HTTPS
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0;';
        document.body.appendChild(ta);
        ta.focus(); ta.select();
        try { document.execCommand('copy'); showToast('📋 Copied! Paste it in WhatsApp', 'success'); }
        catch { showToast('ℹ️ Opening WhatsApp...', 'info'); }
        document.body.removeChild(ta);
    }
}

function contactEmail(email) {
    if (!email) { showToast('⚠️ No email', 'warning'); return; }
    window.location.href = `mailto:${email}`;
}

// ===== THEME TOGGLE =====
function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    const icon = themeToggle.querySelector('i');
    icon.className = theme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
    localStorage.setItem('cgTheme', theme);
}
function initTheme() {
    const saved = localStorage.getItem('cgTheme');
    applyTheme(saved || 'dark');
}
themeToggle.addEventListener('click', () => {
    const current = document.body.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    applyTheme(current === 'light' ? 'dark' : 'light');
});
initTheme();

// ===== SEARCH TOGGLE =====
searchToggle.addEventListener('click', () => {
    searchArea.classList.toggle('open');
    if (searchArea.classList.contains('open')) searchInput.focus();
});

// ===== SIDE MENU =====
function openMenu() {
    sideMenu.classList.add('open');
    overlay.classList.add('active');
}

function closeMenu() {
    sideMenu.classList.remove('open');
    overlay.classList.remove('active');
}
menuToggle.addEventListener('click', openMenu);
closeMenuBtn.addEventListener('click', closeMenu);
overlay.addEventListener('click', closeMenu);

// ===== NEAR ME =====
function activateNearMe() {
    nearMeActive = true;
    [nearMeBtn, nearMeMenu].forEach(el => {
        if (el) el.classList.add('active');
    });
    render();
    showToast('📍 Showing creators near you', 'success');
}

function deactivateNearMe() {
    nearMeActive = false;
    [nearMeBtn, nearMeMenu].forEach(el => {
        if (el) el.classList.remove('active');
    });
    render();
    showToast('📋 Back to default sort', 'info');
}

function triggerNearMe() {
    if (nearMeActive) {
        deactivateNearMe();
        return;
    }

    if (!gpsReady) {
        showToast('⏳ Getting your location...', 'info');
        getUserLocation(() => {
            activateNearMe();
        });
    } else if (!userLocation) {
        getUserLocation(() => {
            activateNearMe();
        });
    } else {
        activateNearMe();
    }
}
nearMeBtn.addEventListener('click', triggerNearMe);
nearMeMenu.addEventListener('click', () => { triggerNearMe(); closeMenu(); });

// ===== SEARCH WITH DEBOUNCE =====
searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => render(), 250);
});

// ===== SIDE FILTERS =====
applySideFilters.addEventListener('click', () => {
    saveFilters();
    render();
    closeMenu();
    showToast('✅ Filters applied', 'success');
});

// ===== CLEAR FILTERS =====


// ===== VIEW TOGGLE =====
const viewToggleBtns = document.querySelectorAll('.view-toggle-btn');
viewToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        viewMode = btn.dataset.view;
        viewToggleBtns.forEach(b => b.classList.toggle('active', b === btn));
        // Save view preference
        try {
            localStorage.setItem('cgViewMode', viewMode);
        } catch (e) {}
        render();
    });
});



// ===== LIST PROFILE =====
listProfileBtn.addEventListener('click', () => {
    joinModal.classList.add('open');
    closeMenu();
});

listProfileDesktop.addEventListener('click', () => {
    joinModal.classList.add('open');
});

closeJoinModal.addEventListener('click', () => joinModal.classList.remove('open'));
closeProfileModal.addEventListener('click', () => profileModal.classList.remove('open'));
window.addEventListener('click', (e) => {
    if (e.target === profileModal) profileModal.classList.remove('open');
    if (e.target === joinModal) joinModal.classList.remove('open');
});



// ===== JOIN FORM =====
joinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const whatsapp = document.getElementById('whatsapp').value.trim();
    const districtRaw = document.getElementById('district').value;
    const district = districtRaw === 'Other'
        ? (document.getElementById('districtOther').value.trim() || 'Other')
        : districtRaw;
    const city = document.getElementById('city').value.trim();
    const nicheRaw = document.getElementById('niche').value;
    const niche = nicheRaw === 'Other'
        ? (document.getElementById('nicheOther').value.trim() || 'Other')
        : nicheRaw;
    const desc = document.getElementById('description').value.trim();
    const instaLink = document.getElementById('instagramLink').value.trim();
    const ytLink = document.getElementById('youtubeLink').value.trim();
    const fbLink = document.getElementById('facebookLink').value.trim();
    const phone = document.getElementById('phone')?.value.trim() || '';
    const creatorGender = document.getElementById('creatorGender')?.value || '';
    const responseTime = document.getElementById('responseTime')?.value || 'within 24 hours';
    const isUGCCreator = document.getElementById('isUGCCreator')?.value === 'true';
    const barter = document.getElementById('barter')?.value === 'true';
    const turnaroundDays = document.getElementById('turnaroundDays')?.value || '3';
    const languages = [...document.querySelectorAll('.lang-cb:checked')].map(cb => cb.value);
    const instaFol = document.getElementById('instaFollowers').value || '0';
    const ytSubs = document.getElementById('ytSubs').value || '0';
    const fbFol = document.getElementById('fbFollowers').value || '0';
    const avgViews = document.getElementById('avgViews').value || '0';
    const engagementRate = document.getElementById('engagementRate').value || '0';
    const instaAvgLikes = document.getElementById('instaAvgLikes')?.value || '0';
    const instaAvgComments = document.getElementById('instaAvgComments')?.value || '0';
    const ytAvgViews = document.getElementById('ytAvgViews')?.value || '0';
    const ytAvgLikes = document.getElementById('ytAvgLikes')?.value || '0';
    const ytAvgComments = document.getElementById('ytAvgComments')?.value || '0';
    const fbAvgViews = document.getElementById('fbAvgViews')?.value || '0';
    const fbAvgLikes = document.getElementById('fbAvgLikes')?.value || '0';
    const fbAvgComments = document.getElementById('fbAvgComments')?.value || '0';
    const xLink = document.getElementById('xLink')?.value.trim() || '';
    const threadLink = document.getElementById('threadLink')?.value.trim() || '';
    const snapchatLink = document.getElementById('snapchatLink')?.value.trim() || '';
    const twitterLink = document.getElementById('twitterLink')?.value.trim() || '';
    const audienceAgeGroup = document.getElementById('audienceAgeGroup')?.value || '';
    const audienceGenderMale = document.getElementById('audienceGenderMale')?.value || '';
    const audienceLocations = document.getElementById('audienceLocations')?.value.trim() || '';
    const pastBrands = document.getElementById('pastBrands')?.value.trim() || '';
    const customLinkFb = document.getElementById('portfolio1')?.value.trim() || '';
    const customLinkWa = document.getElementById('portfolio2')?.value.trim() || '';
    const customLinkIg = document.getElementById('portfolio3')?.value.trim() || '';
    const customLinkTg = document.getElementById('portfolio4')?.value.trim() || '';

    // Collect available districts
    const availDistChecked = [...document.querySelectorAll('.avail-district-cb:checked')].map(cb => cb.value);
    const availDistText = availDistChecked.length > 0 ? availDistChecked.join(', ') : district;

    // Collect additional niches (including custom ones)
    const extraNiches = getAllSelectedNiches();
    const allCustomNiches = customNiches;
    const finalExtraNiches = [...new Set([...extraNiches, ...allCustomNiches])];
    const finalExtraNichesText = finalExtraNiches.length > 0 ? finalExtraNiches.join(', ') : 'None';

    const serviceCharges = getServiceCharges();
    let serviceChargesText = '';
    if (serviceCharges.length > 0) {
        serviceChargesText = '\n📋 *Service Charges:*';
        serviceCharges.forEach(sc => {
            let priceText = `₹${sc.charge}`;
            if (sc.model === 'range' && sc.min && sc.max) {
                priceText = `₹${sc.min} - ₹${sc.max}`;
            } else if (sc.model === 'starting_from') {
                priceText = `From ₹${sc.charge}`;
            }
            let rangeNote = '';
            if (sc.model !== 'range' && sc.min && sc.max) {
                rangeNote = ` (Range: ₹${sc.min} - ₹${sc.max})`;
            }
            serviceChargesText += `\n• ${sc.service}: ${priceText} (${sc.model})${rangeNote}`;
        });
    }

    const customLinksText = [customLinkFb && `• Facebook: ${customLinkFb}`, customLinkWa && `• WhatsApp: ${customLinkWa}`, customLinkIg && `• Instagram: ${customLinkIg}`, customLinkTg && `• Telegram: ${customLinkTg}`].filter(Boolean);
    const portfolioText = customLinksText.length > 0
        ? '\n🔗 *Profile & Contact Links:*\n' + customLinksText.join('\n')
        : '';
    const optionalSocials = [xLink && `• X: ${xLink}`, threadLink && `• Threads: ${threadLink}`, snapchatLink && `• Snapchat: ${snapchatLink}`, twitterLink && `• Twitter: ${twitterLink}`].filter(Boolean).join('\n');

    const msg =
        `📢 *New Creator Application* 📢\n\n` +
        `👤 *Name:* ${name}\n` +
        `📧 *Email:* ${email}\n` +
        `📱 *WhatsApp:* ${whatsapp}${phone ? '\n📞 *Phone:* ' + phone : ''}\n` +
        `${creatorGender ? '👤 *Gender:* ' + creatorGender + '\n' : ''}` +
        `🗣️ *Languages:* ${languages.length > 0 ? languages.join(', ') : 'Hindi'}\n` +
        `📍 *District:* ${district}\n🏙️ *City:* ${city}\n` +
        `🗺️ *Available In:* ${availDistText}\n` +
        `🏷️ *Primary Niche:* ${niche}\n` +
        `🎯 *Additional Niches:* ${finalExtraNichesText}\n` +
        `🎥 *UGC Creator:* ${isUGCCreator ? 'Yes' : 'No'}\n` +
        `🤝 *Barter:* ${barter ? 'Open to barter' : 'Paid only'}\n` +
        `⏱️ *Response Time:* ${responseTime}\n` +
        `📦 *Turnaround:* ${turnaroundDays} days\n\n` +
        `📝 *Description:* ${desc}\n\n` +
        `🔗 *Social Links:*\n• Instagram: ${instaLink}\n• YouTube: ${ytLink}\n• Facebook: ${fbLink}${optionalSocials ? '\n' + optionalSocials : ''}\n\n` +
        `📊 *Social Stats:*\n` +
        `📷 Instagram: ${instaFol} followers | Avg views: ${avgViews} | Likes: ${instaAvgLikes} | Comments: ${instaAvgComments}\n` +
        `▶️ YouTube: ${ytSubs} subs | Avg views: ${ytAvgViews} | Likes: ${ytAvgLikes} | Comments: ${ytAvgComments}\n` +
        `📘 Facebook: ${fbFol} followers | Avg views: ${fbAvgViews} | Likes: ${fbAvgLikes} | Comments: ${fbAvgComments}\n` +
        `⚡ Engagement Rate: ${engagementRate}%\n\n` +
        `${audienceAgeGroup || audienceGenderMale || audienceLocations ? '👥 *Audience:*\n' + (audienceAgeGroup ? `• Age: ${audienceAgeGroup}\n` : '') + (audienceGenderMale ? `• Gender: ${audienceGenderMale}% Male / ${100 - parseInt(audienceGenderMale)}% Female\n` : '') + (audienceLocations ? `• Locations: ${audienceLocations}\n` : '') + '\n' : ''}` +
        `${pastBrands ? '🏢 *Past Brands:* ' + pastBrands + '\n\n' : ''}` +
        `${portfolioText ? portfolioText + '\n\n' : ''}` +
        `${serviceChargesText ? serviceChargesText + '\n\n' : ''}` +
        `📅 *Application Date:* ${new Date().toLocaleDateString('en-IN')}\n🕐 *Time:* ${new Date().toLocaleTimeString('en-IN')}\n\n*Please review this application and contact the creator.*`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encoded}`, '_blank');
    showToast('✅ Application sent via WhatsApp!', 'success');

    setTimeout(() => {
        joinModal.classList.remove('open');
        joinForm.reset();
        document.querySelectorAll('.avail-district-cb, .extra-niche-cb, .lang-cb').forEach(cb => cb.checked = false);
        const portfolio4El = document.getElementById('portfolio4');
        if (portfolio4El) portfolio4El.value = '';
        // re-check Hindi by default
        const hindiCb = document.querySelector('.lang-cb[value="Hindi"]');
        if (hindiCb) hindiCb.checked = true;
        customNiches = [];
        renderCustomNiches();
        updateCustomNicheCounter();
        const districtOther = document.getElementById('districtOther');
        const nicheOther = document.getElementById('nicheOther');
        if (districtOther) { districtOther.style.display = 'none'; districtOther.required = false; }
        if (nicheOther) { nicheOther.style.display = 'none'; nicheOther.required = false; }
        const container = document.getElementById('serviceChargesContainer');
        container.innerHTML = '';
        const defaults = [
            { name: 'Reel Promotion', chargePh: '5000', minPh: '3000', maxPh: '7000', model: 'fixed' },
            { name: 'Story Promotion', chargePh: '1000', minPh: '600', maxPh: '1500', model: 'fixed' },
            { name: 'Feed Post', chargePh: '3000', minPh: '2000', maxPh: '4000', model: 'fixed' },
            { name: 'Professional Reel Shoot', chargePh: '4000', minPh: '3000', maxPh: '6000', model: 'starting_from' },
            { name: 'Brand Collaboration', chargePh: '7000', minPh: '5000', maxPh: '10000', model: 'negotiable' },
        ];
        defaults.forEach(d => {
            const row = document.createElement('div');
            row.className = 'service-charge-row';
            row.innerHTML = `
                <div class="form-group" style="margin-bottom:0;">
                    <label style="font-size:11px;">Service Name</label>
                    <input type="text" class="service-name-input" value="${d.name}" style="padding:8px 12px;font-size:13px;">
                </div>
                <div class="form-group" style="margin-bottom:0;">
                    <label style="font-size:11px;">Charge (₹)</label>
                    <input type="number" class="service-charge-input" placeholder="${d.chargePh}" style="padding:8px 12px;font-size:13px;">
                </div>
                <div class="form-group" style="margin-bottom:0;">
                    <label style="font-size:11px;">Model</label>
                    <select class="service-model-select" style="padding:8px 12px;font-size:13px;">
                        <option value="fixed" ${d.model === 'fixed' ? 'selected' : ''}>Fixed</option>
                        <option value="starting_from" ${d.model === 'starting_from' ? 'selected' : ''}>Starting From</option>
                        <option value="negotiable" ${d.model === 'negotiable' ? 'selected' : ''}>Negotiable</option>
                        <option value="range">Range</option>
                    </select>
                </div>
                <div class="form-group" style="margin-bottom:0;">
                    <label style="font-size:11px;">Min (₹)</label>
                    <input type="number" class="service-min-input" placeholder="${d.minPh}" style="padding:8px 12px;font-size:13px;">
                </div>
                <div class="form-group" style="margin-bottom:0;">
                    <label style="font-size:11px;">Max (₹)</label>
                    <input type="number" class="service-max-input" placeholder="${d.maxPh}" style="padding:8px 12px;font-size:13px;">
                </div>
                <button type="button" class="remove-service-btn" onclick="removeServiceRow(this)" style="margin-top:18px;">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            container.appendChild(row);
        });
        serviceRowCount = 5;
    }, 2000);
});



// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', function(e) {
    // Escape key to close modals
    if (e.key === 'Escape') {
        if (profileModal.classList.contains('open')) profileModal.classList.remove('open');
        if (joinModal.classList.contains('open')) joinModal.classList.remove('open');
        if (sideMenu.classList.contains('open')) closeMenu();
    }
    // Ctrl+F to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchArea.classList.add('open');
        searchInput.focus();
    }
});
// ===== INIT — single DOMContentLoaded =====
document.addEventListener('DOMContentLoaded', function () {

    // Load data
    loadData();

    // Restore saved view mode
    try {
        const savedView = localStorage.getItem('cgViewMode');
        if (savedView) {
            viewMode = savedView;
            viewToggleBtns.forEach(b => b.classList.toggle('active', b.dataset.view === savedView));
        }
    } catch (e) {}

    // Clear filters button
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', clearFilters);

    // Select / Deselect all districts
    const selectAllBtn = document.getElementById('selectAllDistricts');
    const deselectAllBtn = document.getElementById('deselectAllDistricts');
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', () => {
            document.querySelectorAll('.avail-district-cb').forEach(cb => cb.checked = true);
        });
    }
    if (deselectAllBtn) {
        deselectAllBtn.addEventListener('click', () => {
            document.querySelectorAll('.avail-district-cb').forEach(cb => cb.checked = false);
        });
    }

    // Custom niche input
    const addBtn = document.getElementById('addCustomNicheBtn');
    const nicheInput = document.getElementById('customNicheInput');
    if (addBtn) addBtn.addEventListener('click', addCustomNiche);
    if (nicheInput) {
        nicheInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); addCustomNiche(); }
        });
        nicheInput.addEventListener('focus', function () { this.select(); });
    }
});
