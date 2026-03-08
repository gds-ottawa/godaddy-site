// GDS Ottawa PWA - Main JavaScript
// Version 1.0.0

// Page Navigation
function showPage(pageId) {
  // Hide all pages
  const pages = document.querySelectorAll('.page');
  pages.forEach(page => page.classList.remove('active'));
  
  // Show selected page
  const selectedPage = document.getElementById(pageId);
  if (selectedPage) {
    selectedPage.classList.add('active');
  }
  
  // Update navigation active state
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => item.classList.remove('active'));
  
  // Set active nav based on page
  const pageToNav = {
    'homePage': 0,
    'requestPage': 1,
    'calculatorPage': 2,
    'servicesPage': 3,
    'contactPage': 4,
    'galleryPage': 2 // Gallery shows under pricing nav
  };
  
  const navIndex = pageToNav[pageId];
  if (navIndex !== undefined && navItems[navIndex]) {
    navItems[navIndex].classList.add('active');
  }
  
  // Scroll to top
  window.scrollTo(0, 0);
}

// Service Request Form Handler
document.addEventListener('DOMContentLoaded', function() {
  const requestForm = document.getElementById('requestForm');
  
  if (requestForm) {
    requestForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Get form data
      const formData = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        address: document.getElementById('address').value,
        service: document.getElementById('service').value,
        description: document.getElementById('description').value,
        contactTime: document.getElementById('contactTime').value,
        timestamp: new Date().toISOString()
      };
      
      // Log to console (in production, send to backend)
      console.log('Service Request Submitted:', formData);
      
      // Send email notification (using mailto as fallback)
      const emailSubject = `New Service Request - ${formData.service}`;
      const emailBody = `
Name: ${formData.name}
Phone: ${formData.phone}
Email: ${formData.email}
Address: ${formData.address}
Service: ${formData.service}
Description: ${formData.description}
Contact Time: ${formData.contactTime}
      `;
      
      // Show success message
      const successMessage = document.getElementById('successMessage');
      if (successMessage) {
        successMessage.classList.add('show');
        
        // Hide after 5 seconds
        setTimeout(() => {
          successMessage.classList.remove('show');
        }, 5000);
      }
      
      // Reset form
      requestForm.reset();
      
      // Optional: Open phone dialer or WhatsApp
      // window.location.href = 'tel:3437778893';
      
      // Store in localStorage for later retrieval
      try {
        const requests = JSON.parse(localStorage.getItem('serviceRequests') || '[]');
        requests.push(formData);
        localStorage.setItem('serviceRequests', JSON.stringify(requests));
      } catch (e) {
        console.error('Error storing request:', e);
      }
    });
  }
});

// Price Calculator
function calculatePrice() {
  const service = document.getElementById('calcService').value;
  const priceResult = document.getElementById('priceResult');
  const priceAmount = document.getElementById('priceAmount');
  const priceRange = document.getElementById('priceRange');
  
  const prices = {
    'spring-both': { amount: '$490', range: 'Both springs replacement' },
    'cable': { amount: '$235', range: 'Typical range: $175-$295' },
    'opener-install': { amount: '$225', range: 'Installation only (no opener)' },
    'opener-chain': { amount: '$650', range: 'Chain drive opener with installation' },
    'opener-belt': { amount: '$750', range: 'Belt drive opener with installation' },
    'opener-premium': { amount: '$850', range: 'Belt drive + battery backup + camera' },
    'safety-sensor': { amount: '$195', range: 'Safety sensor replacement' },
    'track': { amount: '$260', range: 'Typical range: $175-$350' },
    'panel': { amount: '$260', range: 'Typical range: $175-$350' },
    'keypad': { amount: '$150', range: 'Wireless keypad installation' },
    'remote': { amount: '$120', range: 'Remote control programming' },
    'maintenance': { amount: '$147', range: 'Typical range: $120-$175' },
    'chain-gear': { amount: '$275', range: 'Chain gear replacement' },
    'door-single': { amount: '$2,150', range: 'Typical range: $1,800-$2,500' },
    'door-double': { amount: '$2,850', range: 'Typical range: $2,200-$3,500' }
  };
  
  if (service && prices[service]) {
    priceAmount.textContent = prices[service].amount;
    priceRange.textContent = prices[service].range;
    priceResult.style.display = 'block';
    
    // Smooth scroll to result
    priceResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } else {
    priceResult.style.display = 'none';
  }
}

// Get User Location
function getLocation() {
  const addressInput = document.getElementById('address');
  
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser');
    return;
  }
  
  // Show loading state
  addressInput.value = 'Getting your location...';
  addressInput.disabled = true;
  
  navigator.geolocation.getCurrentPosition(
    async function(position) {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      
      try {
        // Use reverse geocoding (you'd need an API key for production)
        // For now, just show coordinates
        addressInput.value = `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        
        // In production, use Google Maps Geocoding API:
        // const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=YOUR_API_KEY`);
        // const data = await response.json();
        // addressInput.value = data.results[0].formatted_address;
        
      } catch (error) {
        console.error('Geocoding error:', error);
        addressInput.value = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
      } finally {
        addressInput.disabled = false;
      }
    },
    function(error) {
      console.error('Geolocation error:', error);
      addressInput.value = '';
      addressInput.disabled = false;
      alert('Unable to get your location. Please enter address manually.');
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

// PWA Install Prompt
let deferredPrompt;
const installBanner = document.getElementById('installBanner');
const installBtn = document.getElementById('installBtn');
const closeBanner = document.getElementById('closeBanner');

// Check if already installed
if (window.matchMedia('(display-mode: standalone)').matches) {
  // Already installed, don't show banner
  console.log('App is installed');
} else {
  // Show banner after 3 seconds if not installed
  setTimeout(() => {
    if (installBanner && !localStorage.getItem('installBannerClosed')) {
      installBanner.classList.add('show');
    }
  }, 3000);
}

// Listen for install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('Install prompt triggered');
  e.preventDefault();
  deferredPrompt = e;
  
  // Show install banner if not closed
  if (installBanner && !localStorage.getItem('installBannerClosed')) {
    installBanner.classList.add('show');
  }
});

// Install button click
if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) {
      alert('App installation is not available on this device/browser');
      return;
    }
    
    // Show install prompt
    deferredPrompt.prompt();
    
    // Wait for user choice
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User ${outcome} the install prompt`);
    
    // Clear prompt
    deferredPrompt = null;
    
    // Hide banner
    if (installBanner) {
      installBanner.classList.remove('show');
    }
  });
}

// Close banner button
if (closeBanner) {
  closeBanner.addEventListener('click', () => {
    if (installBanner) {
      installBanner.classList.remove('show');
      localStorage.setItem('installBannerClosed', 'true');
    }
  });
}

// Track app install
window.addEventListener('appinstalled', (e) => {
  console.log('PWA installed successfully');
  
  // Hide banner
  if (installBanner) {
    installBanner.classList.remove('show');
  }
  
  // Track analytics (if you have analytics)
  // gtag('event', 'app_installed');
});

// Handle offline/online status
window.addEventListener('online', () => {
  console.log('App is online');
  // Update UI if needed
});

window.addEventListener('offline', () => {
  console.log('App is offline');
  // Show offline indicator if needed
});

// Photo upload preview (optional enhancement)
const photoInput = document.getElementById('photos');
if (photoInput) {
  photoInput.addEventListener('change', function(e) {
    const files = e.target.files;
    console.log(`${files.length} photo(s) selected`);
    
    // In production, you could show thumbnails here
    // or upload to cloud storage
  });
}

// Emergency call tracking
document.querySelectorAll('a[href^="tel:"]').forEach(link => {
  link.addEventListener('click', () => {
    console.log('Emergency call initiated');
    // Track analytics if needed
  });
});

// WhatsApp tracking
document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
  link.addEventListener('click', () => {
    console.log('WhatsApp chat initiated');
    // Track analytics if needed
  });
});

// Service Worker Update Handler
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(registration => {
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New version available
          if (confirm('New version available! Reload to update?')) {
            window.location.reload();
          }
        }
      });
    });
  });
}

// Utility: Format phone number
function formatPhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
}

// Utility: Validate email
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Analytics tracking (placeholder)
function trackEvent(category, action, label) {
  console.log('Event:', category, action, label);
  
  // In production, integrate with Google Analytics or similar:
  // gtag('event', action, {
  //   'event_category': category,
  //   'event_label': label
  // });
}

// Initialize app
console.log('GDS Ottawa PWA loaded');
console.log('Version: 1.0.0');
