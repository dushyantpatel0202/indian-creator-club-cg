// ===== MAIN APPLICATION =====
let creatorsData = [];
let filtered = [];
let userLocation = null;
let gpsReady = false;
let serviceRowCount = 5;
let viewMode = 'small';

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
    el.innerHTML =
        `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i> ${msg}`;
    container.appendChild(el);
    setTimeout(() => { el.remove(); }, 4000);
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

// ===== LOAD DATA =====
async function loadData() {
    try {
        const res = await fetch('creators.json');
        if (!res.ok) throw new Error('Network error - Could not load creators.json');
        const data = await res.json();
        creatorsData = data.creators || [];
        creatorsData.forEach(c => { c.services = getServices(c); });
        filtered = [...creatorsData];
        populateSideFilters();
        render();
        getUserLocation();
        showToast('✅ ' + creatorsData.length + ' creators loaded successfully!', 'success');
    } catch (e) {
        console.error('Error loading creators:', e);
        grid.innerHTML =
            `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Unable to Load Creators</h3><p>Make sure <strong>creators.json</strong> is in the same folder as index.html</p><p style="font-size:13px;color:var(--text-muted);margin-top:8px;">Error: ${e.message}</p><button class="btn-primary" onclick="loadData()" style="margin-top:16px;padding:10px 24px;border-radius:60px;"><i class="fas fa-rotate"></i> Retry</button></div>`;
        showToast('⚠️ Could not load creators.json. Check console for details.', 'warning');
    }
}

function populateSideFilters() {
    const districts = [...new Set(creatorsData.map(c => c.district))].sort();
    const niches = [...new Set(creatorsData.map(c => c.niche))].sort();
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

function getUserLocation(callback) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            pos => {
                userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                gpsReady = true;
                showToast('📍 Location detected', 'success');
                render();
                if (callback) callback();
            },
            () => {
                userLocation = { lat: 21.2514, lng: 81.6296 };
                gpsReady = true;
                showToast('📍 Using default location (Raipur)', 'warning');
                render();
                if (callback) callback();
            }, { enableHighAccuracy: true, timeout: 8000 }
        );
    } else {
        userLocation = { lat: 21.2514, lng: 81.6296 };
        gpsReady = true;
        render();
        if (callback) callback();
    }
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

// ===== SORTING FUNCTION FOR "NEAR ME" =====
function sortCreatorsByDistance(creators) {
    if (!userLocation) return creators;

    return creators.sort((a, b) => {
        const distA = calcDist(userLocation.lat, userLocation.lng, a.latitude, a.longitude);
        const distB = calcDist(userLocation.lat, userLocation.lng, b.latitude, b.longitude);

        // TIER 1: Premium (featured: true, verified: true) - ALWAYS on top with crown
        const isPremiumA = a.featured && a.verified;
        const isPremiumB = b.featured && b.verified;
        if (isPremiumA && !isPremiumB) return -1;
        if (!isPremiumA && isPremiumB) return 1;

        // TIER 2: Regular featured (featured: true, verified: false) - only get priority if within 40km
        const isFeaturedA = a.featured && !a.verified;
        const isFeaturedB = b.featured && !b.verified;
        const aWithin40 = distA <= 40;
        const bWithin40 = distB <= 40;

        if (isFeaturedA && aWithin40 && !(isFeaturedB && bWithin40)) return -1;
        if (isFeaturedB && bWithin40 && !(isFeaturedA && aWithin40)) return 1;

        return distA - distB;
    });
}

// ===== RENDER =====
function render() {
    if (!creatorsData.length) return;

    const q = searchInput.value.toLowerCase().trim();
    let result = filtered;

    if (q) {
        result = result.filter(c =>
            c.name.toLowerCase().includes(q) ||
            c.niche.toLowerCase().includes(q) ||
            c.city.toLowerCase().includes(q) ||
            c.district.toLowerCase().includes(q) ||
            (c.services || []).some(s => s.toLowerCase().includes(q))
        );
    }

    const d = sideDistrict.value;
    const n = sideNiche.value;
    const svc = sideService.value;
    const budget = parseInt(sideBudget.value);

    if (d) result = result.filter(c => c.district === d);
    if (n) result = result.filter(c => c.niche === n);
    if (svc) result = result.filter(c => (c.services || []).includes(svc));
    if (budget) result = result.filter(c => getMinCharge(c) <= budget);

    if (userLocation) {
        result = sortCreatorsByDistance(result);
    } else {
        result.sort((a, b) => {
            const isPremiumA = a.featured && a.verified;
            const isPremiumB = b.featured && b.verified;
            if (isPremiumA && !isPremiumB) return -1;
            if (!isPremiumA && isPremiumB) return 1;
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            return a.name.localeCompare(b.name);
        });
    }

    const total = result.length;
    countEl.textContent = `${total} creators`;

    if (total === 0) {
        grid.innerHTML =
            `<div class="empty-state"><i class="fas fa-user-slash"></i><p>No creators match your filters.</p></div>`;
        return;
    }

    grid.innerHTML = '';
    grid.classList.toggle('medium-mode', viewMode === 'medium');
    grid.classList.toggle('small-mode', viewMode === 'small');
    result.forEach(creator => {
        const dist = userLocation ? calcDist(userLocation.lat, userLocation.lng, creator.latitude, creator
            .longitude) : null;
        const avatarContent = creator.profileImage ? `<img src="${getAvatarSrc(creator.profileImage, 200)}" alt="${creator.name}">` :
            '<i class="fas fa-user" style="font-size:22px;color:rgba(255,255,255,0.85);"></i>';
        const avatar = `<div class="avatar-inner">${avatarContent}</div>`;
        const nicheEmoji = getEmoji(creator.niche);

        const isPremium = creator.featured && creator.verified;
        const isFeaturedOnly = creator.featured && !creator.verified;

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
                    `;
            grid.appendChild(card);
            return;
        }

        let servicesHTML = '';
        if (creator.serviceCharges && creator.serviceCharges.length > 0) {
            servicesHTML = `
                        <div class="creator-services">
                            <div class="services-title"><i class="fas fa-dollar-sign"></i> Service Charges</div>
                            ${creator.serviceCharges.slice(0, 4).map(sc => `
                                <div class="service-item">
                                    <span class="service-name">${sc.service}</span>
                                    <span class="service-price">
                                        ${formatPriceDisplay(sc)}
                                    </span>
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
        grid.appendChild(card);
    });
}

// ===== HELPER FUNCTIONS =====
function formatPriceDisplay(service) {
    let html = '';
    switch (service.model) {
        case 'fixed':
            html = `₹${service.charge}`;
            html += ` <span class="charge-model fixed">Fixed</span>`;
            break;
        case 'starting_from':
            const startPrice = service.startingPrice || service.charge;
            html = `<span class="from-label">From</span> ₹${startPrice}`;
            html += ` <span class="charge-model starting">Starting</span>`;
            break;
        case 'negotiable':
            html = `₹${service.charge}`;
            html += ` <span class="charge-model negotiable">Negotiable</span>`;
            break;
        case 'range':
            const minPrice = service.min || service.charge;
            const maxPrice = service.max || service.charge;
            html = `₹${minPrice} - ₹${maxPrice}`;
            html += ` <span class="charge-model range">Range</span>`;
            break;
        default:
            html = `₹${service.charge}`;
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
        'Local News': '📰'
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
        socialLinksHTML = `
                    <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin:12px 0;">
                        ${c.socialLinks.instagram ? `<a href="${c.socialLinks.instagram}" target="_blank" style="background:rgba(225,48,108,0.15);color:#E1306C;padding:8px 16px;border-radius:50px;text-decoration:none;font-size:14px;font-weight:500;display:inline-flex;align-items:center;gap:8px;"><i class="fab fa-instagram"></i> Instagram</a>` : ''}
                        ${c.socialLinks.youtube ? `<a href="${c.socialLinks.youtube}" target="_blank" style="background:rgba(255,0,0,0.15);color:#FF0000;padding:8px 16px;border-radius:50px;text-decoration:none;font-size:14px;font-weight:500;display:inline-flex;align-items:center;gap:8px;"><i class="fab fa-youtube"></i> YouTube</a>` : ''}
                        ${c.socialLinks.facebook ? `<a href="${c.socialLinks.facebook}" target="_blank" style="background:rgba(24,119,242,0.15);color:#1877F2;padding:8px 16px;border-radius:50px;text-decoration:none;font-size:14px;font-weight:500;display:inline-flex;align-items:center;gap:8px;"><i class="fab fa-facebook"></i> Facebook</a>` : ''}
                    </div>
                `;
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

    modalBody.innerHTML = `
                <div style="text-align:center;">
                    <div style="width:80px;height:80px;border-radius:24%;background:linear-gradient(135deg,#f9ce34,#ee2a7b,#6228d7);padding:3px;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(238,42,123,0.28);">
                        <div style="width:100%;height:100%;border-radius:19%;overflow:hidden;background:linear-gradient(135deg,var(--primary),var(--secondary));display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:#fff;">
                            ${c.profileImage ? `<img src="${getAvatarSrc(c.profileImage, 300)}" style="width:100%;height:100%;object-fit:cover;display:block;">` : '<i class="fas fa-user" style="font-size:28px;color:rgba(255,255,255,0.85);"></i>'}
                        </div>
                    </div>
                    <h3 style="font-size:22px;">${c.name}</h3>
                    ${isPremium ? '<div style="background:linear-gradient(135deg,#FFD700,#FFA500);color:#1A1A2E;padding:4px 16px;border-radius:50px;font-weight:700;display:inline-block;font-size:13px;margin-bottom:4px;"><i class="fas fa-crown"></i> Premium</div>' : ''}
                    ${isFeaturedOnly ? '<div style="background:linear-gradient(135deg,#6C63FF,#5A52D5);color:#fff;padding:4px 16px;border-radius:50px;font-weight:700;display:inline-block;font-size:13px;margin-bottom:4px;"><i class="fas fa-star"></i> Featured</div>' : ''}
                    <div style="color:var(--primary);font-size:14px;">${getEmoji(c.niche)} ${c.niche}</div>
                    <div style="color:var(--text-secondary);font-size:13px;">
                        <i class="fas fa-map-marker-alt"></i> ${c.district}, ${c.city} 
                        ${dist !== null ? `• <i class="fas fa-location-arrow"></i> ${dist.toFixed(1)} km` : ''}
                    </div>
                    <p style="color:var(--text-secondary);font-size:14px;margin:12px 0;">${c.description || ''}</p>

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
                    </div>

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
                    </div>

                    ${socialLinksHTML}

                    <div style="display:flex;gap:10px;margin-top:16px;">
                        <button class="btn-whatsapp" style="flex:1;padding:12px;border-radius:8px;font-weight:600;border:none;" onclick="contactWhatsApp('${c.contact?.whatsapp || ''}', '${(c.name || '').replace(/'/g, "\\'")}')">
                            <i class="fab fa-whatsapp"></i> WhatsApp
                        </button>
                        <button class="btn-profile" style="flex:1;padding:12px;border-radius:8px;font-weight:600;background:rgba(108,99,255,0.15);color:var(--primary);border:none;" onclick="contactEmail('${c.contact?.email || ''}')">
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
    window.open(url, '_blank');
}

function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0;';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    try { document.execCommand('copy'); showToast('📋 Greeting copied! Paste it in WhatsApp', 'success'); }
    catch { showToast('ℹ️ Opening WhatsApp...', 'info'); }
    document.body.removeChild(ta);
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
function sortByDistance() {
    if (!userLocation) {
        showToast('⏳ Getting your location...', 'info');
        getUserLocation(() => {
            filtered = [...creatorsData];
            render();
            showToast('📍 Showing creators near you', 'success');
        });
        return;
    }
    filtered = [...creatorsData];
    render();
    showToast('📍 Showing creators near you', 'success');
}

function triggerNearMe() {
    if (!gpsReady) {
        showToast('⏳ Getting your location...', 'info');
        getUserLocation(() => {
            filtered = [...creatorsData];
            render();
            showToast('📍 Showing creators near you', 'success');
        });
    } else {
        sortByDistance();
    }
}
nearMeBtn.addEventListener('click', triggerNearMe);
nearMeMenu.addEventListener('click', triggerNearMe);

// ===== SEARCH =====
searchInput.addEventListener('input', () => { render(); });

// ===== SIDE FILTERS =====
applySideFilters.addEventListener('click', () => {
    render();
    closeMenu();
    showToast('✅ Filters applied', 'success');
});

// ===== VIEW TOGGLE =====
const viewToggleBtns = document.querySelectorAll('.view-toggle-btn');
viewToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        viewMode = btn.dataset.view;
        viewToggleBtns.forEach(b => b.classList.toggle('active', b === btn));
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
    const district = document.getElementById('district').value;
    const city = document.getElementById('city').value.trim();
    const niche = document.getElementById('niche').value;
    const desc = document.getElementById('description').value.trim();
    const instaLink = document.getElementById('instagramLink').value.trim();
    const ytLink = document.getElementById('youtubeLink').value.trim();
    const fbLink = document.getElementById('facebookLink').value.trim();
    const instaFol = document.getElementById('instaFollowers').value || '0';
    const ytSubs = document.getElementById('ytSubs').value || '0';
    const fbFol = document.getElementById('fbFollowers').value || '0';
    const avgViews = document.getElementById('avgViews').value || '0';
    const engagementRate = document.getElementById('engagementRate').value || '0';

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

    const msg =
        `📢 *New Creator Application* 📢\n\n👤 *Name:* ${name}\n📧 *Email:* ${email}\n📱 *WhatsApp:* ${whatsapp}\n📍 *District:* ${district}\n🏙️ *City:* ${city}\n🏷️ *Niche:* ${niche}\n\n📝 *Description:* ${desc}\n\n🔗 *Social Links:*\n• Instagram: ${instaLink}\n• YouTube: ${ytLink}\n• Facebook: ${fbLink}\n\n📊 *Social Stats:*\n• Instagram Followers: ${instaFol}\n• YouTube Subscribers: ${ytSubs}\n• Facebook Followers: ${fbFol}\n• Avg Reel Views: ${avgViews}\n• Engagement Rate: ${engagementRate}%${serviceChargesText}\n\n📅 *Application Date:* ${new Date().toLocaleDateString('en-IN')}\n🕐 *Time:* ${new Date().toLocaleTimeString('en-IN')}\n\n*Please review this application and contact the creator.*`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/7734906606?text=${encoded}`, '_blank');
    showToast('✅ Application sent via WhatsApp!', 'success');

    setTimeout(() => {
        joinModal.classList.remove('open');
        joinForm.reset();
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

// ===== INIT =====
document.addEventListener('DOMContentLoaded', loadData);