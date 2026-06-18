// Global variables
let creators = [];
let filteredCreators = [];
let userLocation = null;
let currentPage = 1;
let itemsPerPage = window.innerWidth < 768 ? 4 : 6;
let isGPSInitialized = false;
let nearbyPage = 1;
let nearbyItemsPerPage = window.innerWidth < 768 ? 6 : 8;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadCreatorsData();
    
    const mobileMenuBtn = document.querySelector('.mobile-menu');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }
    
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
    });

    // Mobile: Close menu when clicking outside or on a link
    document.addEventListener('click', (e) => {
        const navLinks = document.getElementById('navLinks');
        const mobileMenuBtn = document.querySelector('.mobile-menu');
        if (navLinks?.classList.contains('mobile-open')) {
            const isClickInside = navLinks.contains(e.target) || mobileMenuBtn?.contains(e.target);
            const isNavLink = e.target.tagName === 'A' || e.target.closest('a');
            
            if (!isClickInside || isNavLink) {
                navLinks.classList.remove('mobile-open');
            }
        }
    });

    // Auto-reset mobile menu on desktop resize/orientation change
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) {
            document.getElementById('navLinks')?.classList.remove('mobile-open');
        }
    });
});

// ===== HELPER FUNCTIONS =====

function getNicheEmoji(niche) {
    const emojis = {
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
        'Restaurant Promotion': '🍽️',
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
        'Health and Wellness': '🌿'
    };
    return emojis[niche] || '🏷️';
}

function formatPriceDisplay(service) {
    let html = '';
    
    switch(service.model) {
        case 'fixed':
            html = `<span class="service-price">₹${service.charge}</span>`;
            html += ` <span class="charge-model fixed">Fixed</span>`;
            break;
        case 'starting_from':
            const startPrice = service.startingPrice || service.charge;
            html = `<span class="starting-price"><span class="from-label">From</span> ₹${startPrice}</span>`;
            html += ` <span class="charge-model starting">Starting</span>`;
            break;
        case 'negotiable':
            html = `<span class="service-price">₹${service.charge}</span>`;
            html += ` <span class="charge-model negotiable">Negotiable</span>`;
            break;
        case 'range':
            const minPrice = service.min || service.charge;
            const maxPrice = service.max || service.charge;
            html = `<span class="price-range">₹${minPrice} <span class="separator">-</span> ₹${maxPrice}</span>`;
            html += ` <span class="charge-model range">Range</span>`;
            break;
        default:
            html = `<span class="service-price">₹${service.charge}</span>`;
    }
    
    if (service.negotiable) {
        html += ` <span class="negotiable-tag">🤝 Negotiable</span>`;
    }
    
    return html;
}

function getPricingBadge(pricingInfo) {
    if (!pricingInfo) return '';
    
    const badges = {
        'fixed': '<span class="pricing-badge fixed"><i class="fas fa-check-circle"></i> Fixed Price</span>',
        'starting_from': `<span class="pricing-badge starting"><i class="fas fa-arrow-up"></i> From ₹${pricingInfo.startingPrice || 0}</span>`,
        'negotiable': '<span class="pricing-badge negotiable"><i class="fas fa-handshake"></i> Negotiable</span>',
        'range': `<span class="pricing-badge range"><i class="fas fa-arrows-h"></i> ₹${pricingInfo.minPrice || 0} - ₹${pricingInfo.maxPrice || 0}</span>`
    };
    
    return badges[pricingInfo.model] || '';
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

// Always green - positive reinforcement!
function getEngagementColor(rate) {
    return '#4CAF50';
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer') || (() => {
        const div = document.createElement('div');
        div.id = 'toastContainer';
        div.className = 'toast-container';
        document.body.appendChild(div);
        return div;
    })();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = {
        success: 'fa-check-circle',
        warning: 'fa-exclamation-triangle',
        error: 'fa-times-circle',
        info: 'fa-info-circle'
    };
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${message}`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.5s ease';
        setTimeout(() => toast.remove(), 500);
    }, 5000);
}

// ===== CORE FUNCTIONS =====

function loadCreatorsData() {
    fetch('creators.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load creators data');
            }
            return response.json();
        })
        .then(data => {
            creators = data.creators;
            filteredCreators = [...creators];
            
            populateFilters();
            displayCreators(filteredCreators.slice(0, itemsPerPage));
            updateStats();
            getUserLocation();
            
            document.getElementById('creatorCount').textContent = 
                `${filteredCreators.length} creators found`;
        })
        .catch(error => {
            console.error('Error loading creators:', error);
            document.getElementById('creatorsGrid').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Unable to Load Creators</h3>
                    <p>Please refresh the page or try again later.</p>
                    <button class="btn-primary" onclick="loadCreatorsData()" style="margin-top:16px;">
                        <i class="fas fa-rotate"></i> Retry
                    </button>
                </div>
            `;
        });
}

function populateFilters() {
    const nicheFilter = document.getElementById('nicheFilter');
    const niches = [...new Set(creators.map(c => c.niche))].sort();
    niches.forEach(niche => {
        const option = document.createElement('option');
        option.value = niche;
        option.textContent = niche;
        nicheFilter.appendChild(option);
    });
    
    const districtFilter = document.getElementById('districtFilter');
    const districts = [...new Set(creators.map(c => c.district))].sort();
    districts.forEach(district => {
        const option = document.createElement('option');
        option.value = district;
        option.textContent = district;
        districtFilter.appendChild(option);
    });
    
    const serviceFilter = document.getElementById('serviceFilter');
    const allServices = [...new Set(creators.flatMap(c => c.services))].sort();
    allServices.forEach(service => {
        const option = document.createElement('option');
        option.value = service;
        option.textContent = service;
        serviceFilter.appendChild(option);
    });
}

function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                isGPSInitialized = true;
                displayNearbyCreators();
                displayCreators(filteredCreators.slice(0, currentPage * itemsPerPage));
                showToast('📍 Location detected successfully!', 'success');
            },
            (error) => {
                console.log('GPS Error:', error.message);
                let errorMessage = 'Unable to get your location. Using default location.';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = '📍 Please allow location access to find creators near you.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = '📍 Location information is unavailable. Using default location.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = '📍 Location request timed out. Using default location.';
                        break;
                }
                showToast(errorMessage, 'warning');
                userLocation = { lat: 21.2514, lng: 81.6296 };
                isGPSInitialized = true;
                displayNearbyCreators();
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    } else {
        showToast('Geolocation is not supported by your browser', 'error');
        userLocation = { lat: 21.2514, lng: 81.6296 };
        isGPSInitialized = true;
        displayNearbyCreators();
    }
}

function displayCreators(creatorsList) {
    const grid = document.getElementById('creatorsGrid');
    if (!grid) return;
    
    if (creatorsList.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-slash"></i>
                <h3>No Creators Found</h3>
                <p>Try adjusting your filters or search terms</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = '';
    
    creatorsList.forEach(creator => {
        const distance = userLocation ? 
            calculateDistance(userLocation.lat, userLocation.lng, creator.latitude, creator.longitude) : null;
        const nicheEmoji = getNicheEmoji(creator.niche);
        
        // Always green - positive!
        const engagementColor = '#4CAF50';
        const engagementBg = 'rgba(76,175,80,0.15)';
        
        let pricingHTML = '';
        if (creator.pricingInfo) {
            const pricingBadge = getPricingBadge(creator.pricingInfo);
            pricingHTML = `
                <div class="pricing-info-card">
                    <div class="pricing-header">
                        <span class="label">💳 ${getPricingEmoji(creator.pricingInfo.model)} Pricing Model</span>
                        ${pricingBadge}
                    </div>
                    ${creator.pricingInfo.description ? 
                        `<div class="pricing-description-text">${creator.pricingInfo.description}</div>` : ''
                    }
                </div>
            `;
        }
        
        let serviceChargesHTML = '';
        if (creator.serviceCharges && creator.serviceCharges.length > 0) {
            serviceChargesHTML = `
                <div class="creator-services-wrapper">
                    <div class="services-header">
                        <span class="services-title"><i class="fas fa-dollar-sign"></i> Service Charges</span>
                        <span style="font-size:11px;color:var(--text-muted);">${creator.serviceCharges.length} services</span>
                    </div>
                    <div class="creator-services-grid">
                        ${creator.serviceCharges.slice(0, 6).map(sc => `
                            <div class="service-charge-item">
                                <span class="service-name">${sc.service}</span>
                                <div class="charge-detail">
                                    ${formatPriceDisplay(sc)}
                                </div>
                            </div>
                        `).join('')}
                        ${creator.serviceCharges.length > 6 ? `
                            <div class="service-charge-item" style="grid-column:1/-1;text-align:center;color:var(--text-muted);font-size:12px;background:transparent;">
                                +${creator.serviceCharges.length - 6} more services
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }
        
        const card = document.createElement('div');
        card.className = 'creator-card';
        card.innerHTML = `
            <div class="creator-card-top">
                <div class="creator-avatar">
                    ${creator.profileImage ? 
                        `<img src="${creator.profileImage}" alt="${creator.name}" loading="lazy">` :
                        creator.name.split(' ').map(n => n[0]).join('')
                    }
                    ${creator.verified ? '<span class="verified-badge">✅</span>' : ''}
                </div>
                <div class="creator-info">
                    <div class="creator-name">
                        <span>${creator.name}</span>
                        ${creator.featured ? '<span class="featured-badge"><i class="fas fa-star"></i> Featured</span>' : ''}
                    </div>
                    <div class="creator-niche" data-niche="${creator.niche}">${nicheEmoji} ${creator.niche}</div>
                    <div class="creator-location">
                        <i class="fas fa-map-marker-alt"></i> ${creator.district}, ${creator.city}
                    </div>
                    ${distance !== null && distance < 50 ? 
                        `<div class="distance-badge"><i class="fas fa-location-arrow"></i> ${distance.toFixed(1)} km away</div>` : ''
                    }
                </div>
            </div>
            
            <div class="creator-social-handles">
                ${creator.socialLinks?.instagram ? `<span class="handle">@${creator.socialLinks.instagram.split('/').pop()}</span>` : ''}
                ${creator.socialLinks?.youtube ? `<span class="handle">@${creator.socialLinks.youtube.split('/').pop()}</span>` : ''}
            </div>
            
            <div class="creator-social">
                <a href="${creator.socialLinks?.instagram || '#'}" target="_blank" class="social-item" title="Instagram">
                    <i class="fab fa-instagram insta"></i> <span class="count">${formatNumber(creator.instagramFollowers)}</span>
                </a>
                <a href="${creator.socialLinks?.youtube || '#'}" target="_blank" class="social-item" title="YouTube">
                    <i class="fab fa-youtube yt"></i> <span class="count">${formatNumber(creator.youtubeSubscribers)}</span>
                </a>
                <a href="${creator.socialLinks?.facebook || '#'}" target="_blank" class="social-item" title="Facebook">
                    <i class="fab fa-facebook fb"></i> <span class="count">${formatNumber(creator.facebookFollowers)}</span>
                </a>
                <span class="engagement-badge" style="background:${engagementBg};color:${engagementColor};">
                    <i class="fas fa-bolt"></i> ${creator.engagementRate}% engagement
                </span>
            </div>
            
            <div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px;">
                <i class="fas fa-eye"></i> Avg Reel Views: ${formatNumber(creator.avgReelViews)}
            </div>
            
            ${pricingHTML}
            ${serviceChargesHTML}
            
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">
                <i class="fas fa-briefcase"></i> ${creator.services.slice(0, 3).join(' • ')}
                ${creator.services.length > 3 ? ` +${creator.services.length - 3} more` : ''}
            </div>
            
            <div class="creator-card-actions">
                <button class="btn-whatsapp" onclick="contactWhatsApp('${creator.contact.whatsapp}')">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </button>
                <button class="btn-profile" onclick="openProfileModal(${creator.id})">
                    <i class="fas fa-eye"></i> Profile
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
    
    const countEl = document.getElementById('creatorCount');
    if (countEl) {
        countEl.textContent = `${filteredCreators.length} creators found`;
    }
    
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    if (loadMoreContainer) {
        if (filteredCreators.length <= currentPage * itemsPerPage) {
            loadMoreContainer.style.display = 'none';
        } else {
            loadMoreContainer.style.display = 'block';
        }
    }
}

function updateStats() {
    const uniqueDistricts = new Set(creators.map(c => c.district));
    const uniqueNiches = new Set(creators.map(c => c.niche));
    
    document.getElementById('totalCreators').textContent = creators.length;
    document.getElementById('totalDistricts').textContent = uniqueDistricts.size;
    document.getElementById('totalNiches').textContent = uniqueNiches.size;
    document.getElementById('totalCollaborations').textContent = Math.floor(creators.length * 3.2);
}

function searchCreators() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    
    if (!query) {
        filteredCreators = [...creators];
    } else {
        filteredCreators = creators.filter(c => 
            c.name.toLowerCase().includes(query) ||
            c.niche.toLowerCase().includes(query) ||
            c.city.toLowerCase().includes(query) ||
            c.district.toLowerCase().includes(query) ||
            c.services.some(s => s.toLowerCase().includes(query))
        );
    }
    
    currentPage = 1;
    displayCreators(filteredCreators.slice(0, itemsPerPage));
}

function applyFilters() {
    const districtFilter = document.getElementById('districtFilter').value;
    const nicheFilter = document.getElementById('nicheFilter').value;
    const serviceFilter = document.getElementById('serviceFilter').value;
    const budgetFilter = parseInt(document.getElementById('budgetFilter').value);
    const sortFilter = document.getElementById('sortFilter').value;
    
    let result = [...creators];
    
    if (districtFilter) {
        result = result.filter(c => c.district === districtFilter);
    }
    if (nicheFilter) {
        result = result.filter(c => c.niche === nicheFilter);
    }
    if (serviceFilter) {
        result = result.filter(c => c.services.includes(serviceFilter));
    }
    if (budgetFilter) {
        result = result.filter(c => c.charges.reel <= budgetFilter);
    }
    
    switch(sortFilter) {
        case 'engagement':
            result.sort((a, b) => b.engagementRate - a.engagementRate);
            break;
        case 'followers':
            result.sort((a, b) => b.instagramFollowers - a.instagramFollowers);
            break;
        case 'views':
            result.sort((a, b) => b.avgReelViews - a.avgReelViews);
            break;
        case 'price-low':
            result.sort((a, b) => a.charges.reel - b.charges.reel);
            break;
        case 'price-high':
            result.sort((a, b) => b.charges.reel - a.charges.reel);
            break;
        case 'distance':
            if (userLocation) {
                result.sort((a, b) => {
                    const distA = calculateDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude);
                    const distB = calculateDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude);
                    return distA - distB;
                });
            }
            break;
        default:
            break;
    }
    
    // Prioritize featured creators while maintaining the chosen sort order within groups
    result.sort((a, b) => (b.featured === a.featured) ? 0 : b.featured ? 1 : -1);

    filteredCreators = result;
    currentPage = 1;
    displayCreators(filteredCreators.slice(0, itemsPerPage));

    // Scroll to results on mobile so the user sees the changes immediately
    if (window.innerWidth < 768) {
        document.getElementById('creators')?.scrollIntoView({ behavior: 'smooth' });
    }
}

function filterByNiche(niche) {
    document.getElementById('nicheFilter').value = niche;
    applyFilters();
    document.getElementById('creators').scrollIntoView({ behavior: 'smooth' });
}

function loadMoreCreators() {
    currentPage++;
    const end = currentPage * itemsPerPage;
    const visible = filteredCreators.slice(0, end);
    displayCreators(visible);
}

function findNearbyCreators() {
    if (!isGPSInitialized) {
        showToast('⏳ Getting your location...', 'info');
        getUserLocation();
        return;
    }
    
    const grid = document.getElementById('nearbyGrid');
    if (grid) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-spinner fa-spin"></i>
                <h3>Finding creators near you...</h3>
                <p>Please wait while we calculate distances</p>
            </div>
        `;
    }
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                isGPSInitialized = true;
                showToast('📍 Location refreshed successfully!', 'success');
                nearbyPage = 1;
                displayNearbyCreators();
                applyFilters();
            },
            (error) => {
                showToast('⚠️ Could not refresh location. Using previous location.', 'warning');
                nearbyPage = 1;
                displayNearbyCreators();
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    } else {
        nearbyPage = 1;
        displayNearbyCreators();
    }
}

function displayNearbyCreators(nearbyList) {
    const grid = document.getElementById('nearbyGrid');
    if (!grid) return;
    
    if (!userLocation) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-map-pin"></i>
                <h3>Location Not Available</h3>
                <p>Please enable GPS or allow location access</p>
                <button class="btn-primary" onclick="findNearbyCreators()" style="margin-top:16px;">
                    <i class="fas fa-location-dot"></i> Enable GPS
                </button>
            </div>
        `;
        return;
    }
    
    const creatorsWithDistance = creators.map(c => ({
        ...c,
        distance: calculateDistance(userLocation.lat, userLocation.lng, c.latitude, c.longitude)
    }));
    
    const allNearby = creatorsWithDistance.sort((a, b) => a.distance - b.distance);
    const nearby = nearbyList || allNearby.slice(0, nearbyPage * nearbyItemsPerPage);
    
    const nearbyCount = document.getElementById('nearbyCount');
    if (nearbyCount) {
        nearbyCount.textContent = `${allNearby.length} nearby creators`;
    }
    
    if (nearby.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users-slash"></i>
                <h3>No Creators Nearby</h3>
                <p>We couldn't find any creators near your location. Try expanding your search.</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = '';
    
    nearby.forEach(creator => {
        const nicheEmoji = getNicheEmoji(creator.niche);
        const engagementColor = '#4CAF50';
        const engagementBg = 'rgba(76,175,80,0.15)';
        
        let pricingHTML = '';
        if (creator.pricingInfo) {
            const pricingBadge = getPricingBadge(creator.pricingInfo);
            pricingHTML = `
                <div class="pricing-info-card" style="margin:8px 0;padding:10px;">
                    <div class="pricing-header" style="margin-bottom:4px;">
                        <span class="label" style="font-size:11px;">💳 ${getPricingEmoji(creator.pricingInfo.model)}</span>
                        ${pricingBadge}
                    </div>
                </div>
            `;
        }
        
        let serviceChargesHTML = '';
        if (creator.serviceCharges && creator.serviceCharges.length > 0) {
            serviceChargesHTML = `
                <div class="creator-services-wrapper" style="margin: 8px 0;">
                    <div class="creator-services-grid" style="grid-template-columns:1fr;">
                        ${creator.serviceCharges.slice(0, 4).map(sc => `
                            <div class="service-charge-item">
                                <span class="service-name">${sc.service}</span>
                                <div class="charge-detail">
                                    ${formatPriceDisplay(sc)}
                                </div>
                            </div>
                        `).join('')}
                        ${creator.serviceCharges.length > 4 ? `
                            <div class="service-charge-item" style="grid-column:1/-1;text-align:center;color:var(--text-muted);font-size:12px;background:transparent;">
                                +${creator.serviceCharges.length - 4} more services
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }
        
        const card = document.createElement('div');
        card.className = 'creator-card';
        card.innerHTML = `
            <div class="creator-card-top">
                <div class="creator-avatar">
                    ${creator.profileImage ? 
                        `<img src="${creator.profileImage}" alt="${creator.name}" loading="lazy">` :
                        creator.name.split(' ').map(n => n[0]).join('')
                    }
                    ${creator.verified ? '<span class="verified-badge">✅</span>' : ''}
                </div>
                <div class="creator-info">
                    <div class="creator-name">
                        <span>${creator.name}</span>
                        ${creator.featured ? '<span class="featured-badge"><i class="fas fa-star"></i> Featured</span>' : ''}
                    </div>
                    <div class="creator-niche" data-niche="${creator.niche}">${nicheEmoji} ${creator.niche}</div>
                    <div class="creator-location">
                        <i class="fas fa-map-marker-alt"></i> ${creator.city}
                    </div>
                    <div class="distance-badge" style="margin-top:4px;font-size:13px;padding:3px 14px;">
                        <i class="fas fa-location-arrow"></i> ${creator.distance.toFixed(1)} km away
                    </div>
                </div>
            </div>
            
            <div class="creator-social">
                <a href="${creator.socialLinks?.instagram || '#'}" target="_blank" class="social-item" title="Instagram">
                    <i class="fab fa-instagram insta"></i> <span class="count">${formatNumber(creator.instagramFollowers)}</span>
                </a>
                <a href="${creator.socialLinks?.youtube || '#'}" target="_blank" class="social-item" title="YouTube">
                    <i class="fab fa-youtube yt"></i> <span class="count">${formatNumber(creator.youtubeSubscribers)}</span>
                </a>
                <a href="${creator.socialLinks?.facebook || '#'}" target="_blank" class="social-item" title="Facebook">
                    <i class="fab fa-facebook fb"></i> <span class="count">${formatNumber(creator.facebookFollowers)}</span>
                </a>
                <span class="engagement-badge" style="background:${engagementBg};color:${engagementColor};">
                    <i class="fas fa-bolt"></i> ${creator.engagementRate}%
                </span>
            </div>
            
            <div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px;">
                <i class="fas fa-eye"></i> Avg Views: ${formatNumber(creator.avgReelViews)}
            </div>
            
            ${pricingHTML}
            ${serviceChargesHTML}
            
            <div class="creator-card-actions">
                <button class="btn-whatsapp" onclick="contactWhatsApp('${creator.contact.whatsapp}')">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </button>
                <button class="btn-profile" onclick="openProfileModal(${creator.id})">
                    <i class="fas fa-eye"></i> Profile
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
    
    if (allNearby.length > nearbyPage * nearbyItemsPerPage) {
        const loadMoreDiv = document.createElement('div');
        loadMoreDiv.className = 'load-more';
        loadMoreDiv.style.gridColumn = '1 / -1';
        loadMoreDiv.innerHTML = `
            <button class="btn-secondary" onclick="loadMoreNearby()">
                <i class="fas fa-arrow-down"></i> Load More Nearby Creators
            </button>
        `;
        grid.appendChild(loadMoreDiv);
    }
}

function loadMoreNearby() {
    nearbyPage++;
    displayNearbyCreators();
}

function openProfileModal(id) {
    const creator = creators.find(c => c.id === id);
    if (!creator) return;
    
    const modal = document.getElementById('profileModal');
    const body = document.getElementById('modalBody');
    
    const distance = userLocation ? 
        calculateDistance(userLocation.lat, userLocation.lng, creator.latitude, creator.longitude) : null;
    const nicheEmoji = getNicheEmoji(creator.niche);
    
    let pricingInfoHTML = '';
    if (creator.pricingInfo) {
        const pricingBadge = getPricingBadge(creator.pricingInfo);
        pricingInfoHTML = `
            <div class="pricing-info-card" style="margin:16px 0;">
                <div class="pricing-header">
                    <span class="label">💳 ${getPricingEmoji(creator.pricingInfo.model)} Pricing Model</span>
                    ${pricingBadge}
                </div>
                ${creator.pricingInfo.description ? 
                    `<div class="pricing-description-text">${creator.pricingInfo.description}</div>` : ''
                }
            </div>
        `;
    }
    
    let modalServicesHTML = '';
    if (creator.serviceCharges && creator.serviceCharges.length > 0) {
        modalServicesHTML = `
            <h4 style="text-align: left; margin: 20px 0 12px;">💼 All Service Charges</h4>
            <div class="modal-services-grid">
                ${creator.serviceCharges.map(sc => `
                    <div class="modal-service-item">
                        <span class="service-name">${sc.service}</span>
                        <div class="charge-detail">
                            ${formatPriceDisplay(sc)}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    body.innerHTML = `
        <div class="modal-profile">
            <div class="modal-avatar" style="overflow:hidden;">
                ${creator.profileImage ? 
                    `<img src="${creator.profileImage}" alt="${creator.name}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` :
                    creator.name.split(' ').map(n => n[0]).join('')
                }
                ${creator.verified ? '<span style="position:absolute;bottom:2px;right:2px;font-size:20px;">✅</span>' : ''}
            </div>
            <h2>${creator.name}</h2>
            <div class="modal-niche">${nicheEmoji} ${creator.niche}</div>
            <div class="modal-location">
                <i class="fas fa-map-marker-alt"></i> ${creator.district}, ${creator.city}
                ${distance !== null ? ` • <i class="fas fa-location-arrow"></i> ${distance.toFixed(1)} km away` : ''}
            </div>
            <p style="color: var(--text-secondary); margin: 16px 0; line-height: 1.6;">${creator.description}</p>
            
            <div class="modal-stats">
                <div class="modal-stat">
                    <div class="number">${formatNumber(creator.instagramFollowers)}</div>
                    <div class="label"><i class="fab fa-instagram insta"></i> Instagram</div>
                </div>
                <div class="modal-stat">
                    <div class="number">${formatNumber(creator.youtubeSubscribers)}</div>
                    <div class="label"><i class="fab fa-youtube yt"></i> YouTube</div>
                </div>
                <div class="modal-stat">
                    <div class="number">${formatNumber(creator.facebookFollowers)}</div>
                    <div class="label"><i class="fab fa-facebook fb"></i> Facebook</div>
                </div>
            </div>
            
            <div class="modal-stats" style="grid-template-columns: 1fr 1fr;">
                <div class="modal-stat">
                    <div class="number">${formatNumber(creator.avgReelViews)}</div>
                    <div class="label"><i class="fas fa-eye"></i> Avg Reel Views</div>
                </div>
                <div class="modal-stat">
                    <div class="number">${creator.engagementRate}%</div>
                    <div class="label"><i class="fas fa-bolt"></i> Engagement Rate</div>
                </div>
            </div>
            
            ${pricingInfoHTML}
            
            <h4 style="text-align: left; margin: 20px 0 12px;">💰 Quick Charges</h4>
            <div class="modal-charges">
                <div class="modal-charge">
                    <div class="amount">₹${creator.charges.reel}</div>
                    <div class="label">Reel Post</div>
                </div>
                <div class="modal-charge">
                    <div class="amount">₹${creator.charges.story}</div>
                    <div class="label">Story Post</div>
                </div>
                <div class="modal-charge">
                    <div class="amount">₹${creator.charges.post}</div>
                    <div class="label">Feed Post</div>
                </div>
                <div class="modal-charge">
                    <div class="amount">₹${creator.charges.reelMaking}</div>
                    <div class="label">Reel Making</div>
                </div>
                <div class="modal-charge collab-charge">
                    <div class="amount">₹${creator.charges.collaboration}</div>
                    <div class="label">🤝 Brand Collaboration</div>
                </div>
            </div>
            
            ${modalServicesHTML}
            
            <h4 style="text-align: left; margin: 20px 0 12px;">🛠️ Services Offered</h4>
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;">
                ${creator.services.map(service => 
                    `<span style="background:rgba(108,99,255,0.1);color:var(--primary);padding:4px 14px;border-radius:50px;font-size:13px;">${service}</span>`
                ).join('')}
            </div>
            
            <div style="background:rgba(108,99,255,0.05);padding:12px;border-radius:10px;margin-bottom:20px;">
                <p style="font-size:13px;color:var(--text-secondary);">
                    <i class="fas fa-map-marker-alt" style="color:var(--primary);"></i> 
                    Available in: ${creator.availableDistricts.join(', ')}
                </p>
            </div>
            
            <div class="modal-actions">
                <button class="btn-whatsapp" onclick="contactWhatsApp('${creator.contact.whatsapp}')" style="padding: 14px; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 16px; background: #25D366; color: white; flex:1;">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </button>
                <button class="btn-primary" onclick="contactEmail('${creator.contact.email}')" style="padding: 14px; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 16px; flex:1;">
                    <i class="fas fa-envelope"></i> Email
                </button>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeProfileModal() {
    document.getElementById('profileModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function openJoinModal() {
    document.getElementById('joinModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeJoinModal() {
    document.getElementById('joinModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function contactWhatsApp(number) {
    showToast(`📱 Opening WhatsApp for ${number}`, 'success');
    setTimeout(() => {
        window.open(`https://wa.me/${number}`, '_blank');
    }, 500);
}

function contactEmail(email) {
    showToast(`📧 Opening email for ${email}`, 'success');
    setTimeout(() => {
        window.location.href = `mailto:${email}`;
    }, 500);
}

function submitJoinForm(event) {
    event.preventDefault();
    
    const fullName = document.getElementById('fullName')?.value || 'Not provided';
    const email = document.getElementById('email')?.value || 'Not provided';
    const whatsapp = document.getElementById('whatsapp')?.value || 'Not provided';
    const district = document.getElementById('district')?.value || 'Not provided';
    const niche = document.getElementById('niche')?.value || 'Not provided';
    const instagramFollowers = document.getElementById('instagramFollowers')?.value || 'Not provided';
    const youtubeSubscribers = document.getElementById('youtubeSubscribers')?.value || 'Not provided';
    const avgViews = document.getElementById('avgViews')?.value || 'Not provided';
    const engagementRate = document.getElementById('engagementRate')?.value || 'Not provided';
    const reelCharge = document.getElementById('reelCharge')?.value || 'Not provided';
    const storyCharge = document.getElementById('storyCharge')?.value || 'Not provided';
    const postCharge = document.getElementById('postCharge')?.value || 'Not provided';
    const collabCharge = document.getElementById('collabCharge')?.value || 'Not provided';
    
    const message = `📢 *New Creator Application* 📢
    
👤 *Name:* ${fullName}
📧 *Email:* ${email}
📱 *WhatsApp:* ${whatsapp}
📍 *District:* ${district}
🏷️ *Niche:* ${niche}

📊 *Social Stats:*
• Instagram Followers: ${instagramFollowers}
• YouTube Subscribers: ${youtubeSubscribers}
• Avg Reel Views: ${avgViews}
• Engagement Rate: ${engagementRate}%

💰 *Charges:*
• Reel: ₹${reelCharge}
• Story: ₹${storyCharge}
• Feed Post: ₹${postCharge}
• Collaboration: ₹${collabCharge}

📅 *Application Date:* ${new Date().toLocaleDateString('en-IN')}
🕐 *Time:* ${new Date().toLocaleTimeString('en-IN')}

*Please review this application and contact the creator.*`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappNumber = '919999999999';
    
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
    showToast('✅ Application sent via WhatsApp!', 'success');
    
    setTimeout(() => {
        closeJoinModal();
        document.getElementById('joinForm').reset();
    }, 2000);
}

function toggleMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    navLinks.classList.toggle('mobile-open');
}

window.onclick = function(event) {
    const profileModal = document.getElementById('profileModal');
    const joinModal = document.getElementById('joinModal');
    if (event.target === profileModal) {
        closeProfileModal();
    }
    if (event.target === joinModal) {
        closeJoinModal();
    }
};

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeProfileModal();
        closeJoinModal();
    }
});

console.log('✅ Chhattisgarh Creator Network loaded with', creators.length, 'creators!');