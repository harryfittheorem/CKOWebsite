const SUPABASE_URL = 'https://nfxpqhsnakrrjnfqlkgy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5meHBxaHNuYWtycmpuZnFsa2d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NTQ1MDAsImV4cCI6MjA4ODQzMDUwMH0.j1ZuiqGObosV37GH5W9rzWowrBgea5FLwL84EPLpaZc';

const token = sessionStorage.getItem('cko_admin_token');
const userRole = sessionStorage.getItem('cko_user_role');

if (!token) {
  window.location.href = 'index.html';
}

if (userRole !== 'admin') {
  window.location.href = '../franchisee/dashboard.html';
}

const headers = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};

let currentLocation = null;
let isAddMode = false;
let isActive = false;

document.getElementById('sign-out-btn').addEventListener('click', () => {
  sessionStorage.removeItem('cko_admin_token');
  sessionStorage.removeItem('cko_admin_refresh');
  window.location.href = 'index.html';
});

const overlay = document.getElementById('overlay');
const editPanel = document.getElementById('edit-panel');
const closeBtn = document.getElementById('close-panel-btn');
const detailsTabBtn = document.getElementById('details-tab-btn');
const scheduleTabBtn = document.getElementById('schedule-tab-btn');
const mediaTabBtn = document.getElementById('media-tab-btn');
const packagesTabBtn = document.getElementById('packages-tab-btn');
const eventsTabBtn = document.getElementById('events-tab-btn');
const instructorsTabBtn = document.getElementById('instructors-tab-btn');
const usersTabBtn = document.getElementById('users-tab-btn');
const detailsTab = document.getElementById('details-tab');
const scheduleTab = document.getElementById('schedule-tab');
const mediaTab = document.getElementById('media-tab');
const packagesTab = document.getElementById('packages-tab');
const eventsTab = document.getElementById('events-tab');
const instructorsTab = document.getElementById('instructors-tab');
const usersTab = document.getElementById('users-tab');

function openPanel() {
  overlay.classList.add('open');
  editPanel.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closePanel() {
  overlay.classList.remove('open');
  editPanel.classList.remove('open');
  document.body.style.overflow = '';
  currentLocation = null;
  isAddMode = false;
}

overlay.addEventListener('click', closePanel);
closeBtn.addEventListener('click', closePanel);

function switchTab(activeBtn, activeTab) {
  [detailsTabBtn, scheduleTabBtn, mediaTabBtn, packagesTabBtn, eventsTabBtn, instructorsTabBtn, usersTabBtn].forEach(btn => {
    btn.classList.remove('text-white', 'border-accent');
    btn.classList.add('text-gray-400', 'border-transparent');
  });
  [detailsTab, scheduleTab, mediaTab, packagesTab, eventsTab, instructorsTab, usersTab].forEach(tab => {
    tab.classList.add('hidden');
  });

  const detailsFooter = document.getElementById('details-footer');
  if (detailsFooter) {
    detailsFooter.classList.add('hidden');
  }

  activeBtn.classList.remove('text-gray-400', 'border-transparent');
  activeBtn.classList.add('text-white', 'border-accent');
  activeTab.classList.remove('hidden');

  if (activeTab === detailsTab && detailsFooter) {
    detailsFooter.classList.remove('hidden');
  }
}

detailsTabBtn.addEventListener('click', () => {
  switchTab(detailsTabBtn, detailsTab);
});

scheduleTabBtn.addEventListener('click', () => {
  switchTab(scheduleTabBtn, scheduleTab);
  if (currentLocation) {
    loadSchedule(currentLocation.slug);
  }
});

mediaTabBtn.addEventListener('click', () => {
  switchTab(mediaTabBtn, mediaTab);
  if (currentLocation) {
    loadMedia(currentLocation.slug);
  }
});

packagesTabBtn.addEventListener('click', () => {
  switchTab(packagesTabBtn, packagesTab);
  if (currentLocation) {
    loadPackages(currentLocation.slug);
  }
});

eventsTabBtn.addEventListener('click', () => {
  switchTab(eventsTabBtn, eventsTab);
  if (currentLocation) {
    loadEvents(currentLocation.slug);
  }
});

instructorsTabBtn.addEventListener('click', () => {
  switchTab(instructorsTabBtn, instructorsTab);
  if (currentLocation) {
    loadInstructors(currentLocation.slug);
  }
});

usersTabBtn.addEventListener('click', () => {
  switchTab(usersTabBtn, usersTab);
  if (currentLocation) {
    loadUsers(currentLocation.slug);
  }
});

const toggleActiveBtn = document.getElementById('toggle-active');
toggleActiveBtn.addEventListener('click', () => {
  isActive = !isActive;
  updateToggleUI();
});

function updateToggleUI() {
  if (isActive) {
    toggleActiveBtn.classList.remove('bg-gray-700');
    toggleActiveBtn.classList.add('bg-accent');
    toggleActiveBtn.querySelector('span').classList.remove('translate-x-1');
    toggleActiveBtn.querySelector('span').classList.add('translate-x-6');
  } else {
    toggleActiveBtn.classList.remove('bg-accent');
    toggleActiveBtn.classList.add('bg-gray-700');
    toggleActiveBtn.querySelector('span').classList.remove('translate-x-6');
    toggleActiveBtn.querySelector('span').classList.add('translate-x-1');
  }
}

function showToast(message) {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  toastMessage.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

async function loadLocations() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/locations?select=*&order=name.asc`, {
      headers
    });

    if (!response.ok) throw new Error('Failed to fetch locations');

    const locations = await response.json();
    const tbody = document.getElementById('locations-table-body');

    if (locations.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="px-6 py-8 text-center text-gray-500">
            No locations found. Add your first location to get started.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = locations.map(loc => {
      const cityState = loc.city && loc.state
        ? `${loc.city}, ${loc.state}`
        : loc.address;

      return `
        <tr class="hover:bg-gray-800/50 transition-colors">
          <td class="px-6 py-4 text-white font-medium">${loc.name}</td>
          <td class="px-6 py-4 text-gray-300">${cityState}</td>
          <td class="px-6 py-4 text-gray-300">${loc.phone}</td>
          <td class="px-6 py-4">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${loc.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}">
              ${loc.is_active ? 'Active' : 'Inactive'}
            </span>
          </td>
          <td class="px-6 py-4 text-right">
            <button onclick="editLocation('${loc.id}')" class="text-accent hover:text-[#e5b000] font-medium transition-colors">
              Edit
            </button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading locations:', error);
    const tbody = document.getElementById('locations-table-body');
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="px-6 py-8 text-center text-red-400">
          Error loading locations. Please try again.
        </td>
      </tr>
    `;
  }
}

window.editLocation = async function(locationId) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/locations?id=eq.${locationId}&select=*`, {
      headers
    });

    if (!response.ok) throw new Error('Failed to fetch location');

    const locations = await response.json();
    if (locations.length === 0) throw new Error('Location not found');

    currentLocation = locations[0];
    isAddMode = false;
    isActive = currentLocation.is_active;

    document.getElementById('panel-title').textContent = 'Edit Location';
    document.getElementById('input-name').value = currentLocation.name || '';
    document.getElementById('input-slug').value = currentLocation.slug || '';
    document.getElementById('input-slug').readOnly = true;
    document.getElementById('input-slug').classList.add('bg-gray-700', 'cursor-not-allowed');

    document.getElementById('input-address').value = currentLocation.address || '';
    document.getElementById('input-city').value = currentLocation.city || '';
    document.getElementById('input-state').value = currentLocation.state || '';
    document.getElementById('input-zip').value = currentLocation.zip || '';

    document.getElementById('input-phone').value = currentLocation.phone || '';
    document.getElementById('input-email').value = currentLocation.email || '';
    document.getElementById('input-hours').value = currentLocation.hours || '';
    document.getElementById('input-hero-headline').value = currentLocation.hero_headline || '';
    document.getElementById('input-about-text').value = currentLocation.about_text || '';
    document.getElementById('input-google-maps-url').value = currentLocation.google_maps_embed_url || '';
    document.getElementById('input-ghl-calendar-url').value = currentLocation.ghl_calendar_url || '';
    document.getElementById('input-ghl-location-id').value = currentLocation.ghl_location_id || '';
    document.getElementById('input-ghl-webhook-url').value = currentLocation.ghl_webhook_url || '';
    document.getElementById('input-ghl-api-key').value = currentLocation.ghl_api_key || '';
    document.getElementById('input-clubready-site-id').value = currentLocation.clubready_site_id || '';
    document.getElementById('input-clubready-api-key').value = currentLocation.clubready_api_key || '';
    document.getElementById('input-clubready-chain-id').value = currentLocation.clubready_chain_id || '';
    document.getElementById('input-instagram-url').value = currentLocation.instagram_url || '';
    document.getElementById('input-facebook-url').value = currentLocation.facebook_url || '';
    document.getElementById('input-lat').value = currentLocation.lat || '';
    document.getElementById('input-lng').value = currentLocation.lng || '';

    document.getElementById('toggle-show-schedule').checked = currentLocation.show_schedule !== false;
    document.getElementById('toggle-show-memberships').checked = currentLocation.show_memberships !== false;
    document.getElementById('toggle-show-programs').checked = currentLocation.show_programs !== false;
    document.getElementById('toggle-show-testimonials').checked = currentLocation.show_testimonials !== false;
    document.getElementById('toggle-show-map').checked = currentLocation.show_map !== false;
    document.getElementById('toggle-show-contact-form').checked = currentLocation.show_contact_form !== false;
    document.getElementById('toggle-show-gallery').checked = currentLocation.show_gallery !== false;
    document.getElementById('toggle-show-events').checked = currentLocation.show_events !== false;
    document.getElementById('toggle-show-instructors').checked = currentLocation.show_instructors !== false;

    updateToggleUI();
    openPanel();

    detailsTabBtn.click();
  } catch (error) {
    console.error('Error loading location:', error);
    alert('Failed to load location details');
  }
};

document.getElementById('add-location-btn').addEventListener('click', () => {
  currentLocation = null;
  isAddMode = true;
  isActive = true;

  document.getElementById('panel-title').textContent = 'Add New Location';
  document.getElementById('input-name').value = '';
  document.getElementById('input-slug').value = '';
  document.getElementById('input-slug').readOnly = false;
  document.getElementById('input-slug').classList.remove('bg-gray-700', 'cursor-not-allowed');
  document.getElementById('input-address').value = '';
  document.getElementById('input-city').value = '';
  document.getElementById('input-state').value = '';
  document.getElementById('input-zip').value = '';
  document.getElementById('input-phone').value = '';
  document.getElementById('input-email').value = '';
  document.getElementById('input-hours').value = '';
  document.getElementById('input-hero-headline').value = '';
  document.getElementById('input-about-text').value = '';
  document.getElementById('input-google-maps-url').value = '';
  document.getElementById('input-ghl-calendar-url').value = '';
  document.getElementById('input-ghl-location-id').value = '';
  document.getElementById('input-ghl-webhook-url').value = '';
  document.getElementById('input-ghl-api-key').value = '';
  document.getElementById('input-clubready-site-id').value = '';
  document.getElementById('input-clubready-api-key').value = '';
  document.getElementById('input-clubready-chain-id').value = '';
  document.getElementById('input-instagram-url').value = '';
  document.getElementById('input-facebook-url').value = '';
  document.getElementById('input-lat').value = '';
  document.getElementById('input-lng').value = '';

  document.getElementById('toggle-show-schedule').checked = true;
  document.getElementById('toggle-show-memberships').checked = true;
  document.getElementById('toggle-show-programs').checked = true;
  document.getElementById('toggle-show-testimonials').checked = true;
  document.getElementById('toggle-show-map').checked = true;
  document.getElementById('toggle-show-contact-form').checked = true;
  document.getElementById('toggle-show-gallery').checked = true;
  document.getElementById('toggle-show-events').checked = false;
  document.getElementById('toggle-show-instructors').checked = true;

  updateToggleUI();
  openPanel();

  detailsTabBtn.click();
});

document.getElementById('import-location-reviews-btn').addEventListener('click', async () => {
  if (!currentLocation) {
    alert('Please save the location first');
    return;
  }

  const btn = document.getElementById('import-location-reviews-btn');
  const originalHTML = btn.innerHTML;

  try {
    btn.disabled = true;
    btn.innerHTML = `
      <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Importing...
    `;

    const result = await fetch(
      `${SUPABASE_URL}/functions/v1/google-import-reviews`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          location_slug: currentLocation.slug,
          overwrite: false
        })
      }
    );

    const data = await result.json();

    if (data.success) {
      if (data.imported > 0) {
        showToast(`Successfully imported ${data.imported} Google reviews!`);
      } else {
        showToast(data.message || 'No reviews found. Will use corporate defaults.', 'warning');
      }
    } else {
      throw new Error(data.error || 'Import failed');
    }
  } catch (error) {
    console.error('Error importing reviews:', error);
    alert(`Failed to import reviews: ${error.message}`);
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHTML;
  }
});

document.getElementById('save-location-btn').addEventListener('click', async () => {
  const name = document.getElementById('input-name').value.trim();
  const slug = document.getElementById('input-slug').value.trim();
  const streetAddress = document.getElementById('input-address').value.trim();
  const city = document.getElementById('input-city').value.trim();
  const state = document.getElementById('input-state').value.trim();
  const zip = document.getElementById('input-zip').value.trim();
  const phone = document.getElementById('input-phone').value.trim();
  const email = document.getElementById('input-email').value.trim();
  const lat = parseFloat(document.getElementById('input-lat').value);
  const lng = parseFloat(document.getElementById('input-lng').value);

  if (!name || !slug || !streetAddress || !city || !state || !zip || !phone || !lat || !lng) {
    alert('Please fill in all required fields (Name, Slug, Address, City, State, ZIP, Phone, Lat, Lng)');
    return;
  }

  const locationData = {
    name,
    slug,
    address: streetAddress,
    city,
    state,
    zip,
    phone,
    email,
    hours: document.getElementById('input-hours').value.trim(),
    hero_headline: document.getElementById('input-hero-headline').value.trim(),
    about_text: document.getElementById('input-about-text').value.trim(),
    google_maps_embed_url: document.getElementById('input-google-maps-url').value.trim(),
    ghl_calendar_url: document.getElementById('input-ghl-calendar-url').value.trim(),
    ghl_location_id: document.getElementById('input-ghl-location-id').value.trim(),
    ghl_webhook_url: document.getElementById('input-ghl-webhook-url').value.trim() || null,
    ghl_api_key: document.getElementById('input-ghl-api-key').value.trim() || null,
    clubready_site_id: document.getElementById('input-clubready-site-id').value.trim(),
    clubready_api_key: document.getElementById('input-clubready-api-key').value.trim() || null,
    clubready_chain_id: document.getElementById('input-clubready-chain-id').value.trim() || null,
    instagram_url: document.getElementById('input-instagram-url').value.trim() || null,
    facebook_url: document.getElementById('input-facebook-url').value.trim() || null,
    lat,
    lng,
    is_active: isActive,
    show_schedule: document.getElementById('toggle-show-schedule').checked,
    show_memberships: document.getElementById('toggle-show-memberships').checked,
    show_programs: document.getElementById('toggle-show-programs').checked,
    show_testimonials: document.getElementById('toggle-show-testimonials').checked,
    show_map: document.getElementById('toggle-show-map').checked,
    show_contact_form: document.getElementById('toggle-show-contact-form').checked,
    show_gallery: document.getElementById('toggle-show-gallery').checked,
    show_events: document.getElementById('toggle-show-events').checked,
    show_instructors: document.getElementById('toggle-show-instructors').checked
  };

  try {
    let response;

    if (isAddMode) {
      response = await fetch(`${SUPABASE_URL}/rest/v1/locations`, {
        method: 'POST',
        headers,
        body: JSON.stringify(locationData)
      });
    } else {
      response = await fetch(`${SUPABASE_URL}/rest/v1/locations?id=eq.${currentLocation.id}`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(locationData)
      });
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save location');
    }

    showToast(isAddMode ? 'Location created successfully!' : 'Location updated successfully!');
    closePanel();
    loadLocations();
  } catch (error) {
    console.error('Error saving location:', error);
    alert(`Failed to save location: ${error.message}`);
  }
});

async function loadSchedule(locationSlug) {
  const scheduleList = document.getElementById('schedule-list');
  scheduleList.innerHTML = `
    <div class="text-center text-gray-500 py-8">
      <svg class="animate-spin h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Loading schedule...
    </div>
  `;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/class_schedule?location_slug=eq.${locationSlug}&is_active=eq.true&order=day_of_week.asc,start_time.asc&select=*`, {
      headers
    });

    if (!response.ok) throw new Error('Failed to fetch schedule');

    const classes = await response.json();

    if (classes.length === 0) {
      scheduleList.innerHTML = `
        <div class="text-center text-gray-500 py-8">
          No classes scheduled yet. Add your first class below.
        </div>
      `;
      return;
    }

    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const groupedByDay = classes.reduce((acc, cls) => {
      if (!acc[cls.day_of_week]) acc[cls.day_of_week] = [];
      acc[cls.day_of_week].push(cls);
      return acc;
    }, {});

    scheduleList.innerHTML = dayOrder
      .filter(day => groupedByDay[day])
      .map(day => {
        const dayClasses = groupedByDay[day];
        return `
          <div class="mb-4">
            <h5 class="text-accent font-semibold uppercase text-sm mb-2">${day}</h5>
            <div class="space-y-2">
              ${dayClasses.map(cls => `
                <div class="bg-gray-800 rounded-lg p-4 flex justify-between items-start">
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-1">
                      <span class="text-white font-medium">${cls.start_time} - ${cls.end_time}</span>
                      <span class="text-accent text-sm">${cls.class_type}</span>
                    </div>
                    ${cls.instructor ? `<p class="text-gray-400 text-sm">Instructor: ${cls.instructor}</p>` : ''}
                  </div>
                  <button onclick="deleteClass('${cls.id}')" class="text-red-400 hover:text-red-300 transition-colors ml-4">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }).join('');
  } catch (error) {
    console.error('Error loading schedule:', error);
    scheduleList.innerHTML = `
      <div class="text-center text-red-400 py-8">
        Error loading schedule. Please try again.
      </div>
    `;
  }
}

window.deleteClass = async function(classId) {
  if (!confirm('Are you sure you want to delete this class?')) return;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/class_schedule?id=eq.${classId}`, {
      method: 'PATCH',
      headers: {
        ...headers,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ is_active: false })
    });

    if (!response.ok) throw new Error('Failed to delete class');

    showToast('Class deleted successfully!');
    loadSchedule(currentLocation.slug);
  } catch (error) {
    console.error('Error deleting class:', error);
    alert('Failed to delete class');
  }
};

document.getElementById('add-class-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!currentLocation) {
    alert('Please save the location first before adding classes');
    return;
  }

  const classData = {
    location_slug: currentLocation.slug,
    day_of_week: document.getElementById('class-day').value,
    start_time: document.getElementById('class-start-time').value,
    end_time: document.getElementById('class-end-time').value,
    class_type: document.getElementById('class-type').value.trim(),
    instructor: document.getElementById('class-instructor').value.trim() || null,
    ghl_booking_url: document.getElementById('class-booking-url').value.trim() || null,
    is_active: true
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/class_schedule`, {
      method: 'POST',
      headers,
      body: JSON.stringify(classData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add class');
    }

    showToast('Class added successfully!');
    document.getElementById('add-class-form').reset();
    loadSchedule(currentLocation.slug);
  } catch (error) {
    console.error('Error adding class:', error);
    alert(`Failed to add class: ${error.message}`);
  }
});

async function loadMedia(locationSlug) {
  const mediaList = document.getElementById('media-list');
  mediaList.innerHTML = `
    <div class="text-center text-gray-500 py-8">
      <svg class="animate-spin h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Loading media...
    </div>
  `;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/location_media?location_slug=eq.${locationSlug}&is_active=eq.true&order=display_order.asc,created_at.asc&select=*`, {
      headers
    });

    if (!response.ok) throw new Error('Failed to fetch media');

    const mediaItems = await response.json();

    if (mediaItems.length === 0) {
      mediaList.innerHTML = `
        <div class="text-center text-gray-500 py-8">
          No media added yet. Add your first media item below.
        </div>
      `;
      return;
    }

    const getMediaTypeBadge = (type) => {
      const badges = {
        hero_image: 'bg-blue-500/10 text-blue-400',
        hero_video_id: 'bg-purple-500/10 text-purple-400',
        gallery: 'bg-green-500/10 text-green-400'
      };
      return badges[type] || 'bg-gray-500/10 text-gray-400';
    };

    const truncateUrl = (url, maxLength = 40) => {
      return url.length > maxLength ? url.substring(0, maxLength) + '...' : url;
    };

    mediaList.innerHTML = mediaItems.map(media => `
      <div class="bg-gray-800 rounded-lg p-4 flex justify-between items-start">
        <div class="flex-1 space-y-2">
          <div class="flex items-center gap-3">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getMediaTypeBadge(media.media_type)}">
              ${media.media_type}
            </span>
            <span class="text-gray-500 text-xs">Order: ${media.display_order}</span>
          </div>
          <div>
            <p class="text-white font-mono text-sm">${truncateUrl(media.url)}</p>
            ${media.alt_text ? `<p class="text-gray-400 text-sm mt-1">${media.alt_text}</p>` : ''}
          </div>
        </div>
        <button onclick="deleteMedia('${media.id}')" class="text-red-400 hover:text-red-300 transition-colors ml-4">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </button>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading media:', error);
    mediaList.innerHTML = `
      <div class="text-center text-red-400 py-8">
        Error loading media. Please try again.
      </div>
    `;
  }
}

window.deleteMedia = async function(mediaId) {
  if (!confirm('Are you sure you want to delete this media item?')) return;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/location_media?id=eq.${mediaId}`, {
      method: 'PATCH',
      headers: {
        ...headers,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ is_active: false })
    });

    if (!response.ok) throw new Error('Failed to delete media');

    showToast('Media deleted successfully!');
    loadMedia(currentLocation.slug);
  } catch (error) {
    console.error('Error deleting media:', error);
    alert('Failed to delete media');
  }
};

document.getElementById('add-media-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!currentLocation) {
    alert('Please save the location first before adding media');
    return;
  }

  const mediaData = {
    location_slug: currentLocation.slug,
    media_type: document.getElementById('media-type').value,
    url: document.getElementById('media-url').value.trim(),
    alt_text: document.getElementById('media-alt-text').value.trim() || null,
    display_order: parseInt(document.getElementById('media-display-order').value) || 0,
    is_active: true
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/location_media`, {
      method: 'POST',
      headers,
      body: JSON.stringify(mediaData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add media');
    }

    showToast('Media added successfully!');
    document.getElementById('add-media-form').reset();
    document.getElementById('media-display-order').value = '0';
    loadMedia(currentLocation.slug);
  } catch (error) {
    console.error('Error adding media:', error);
    alert(`Failed to add media: ${error.message}`);
  }
});

async function loadPackages(locationSlug) {
  const packagesList = document.getElementById('packages-list');
  packagesList.innerHTML = `
    <div class="text-center text-gray-500 py-8">
      <svg class="animate-spin h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Loading packages...
    </div>
  `;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/packages?location_slug=eq.${locationSlug}&select=*&order=display_order.asc`, {
      headers
    });

    if (!response.ok) throw new Error('Failed to fetch packages');

    const packages = await response.json();

    if (packages.length === 0) {
      packagesList.innerHTML = `
        <div class="text-center text-gray-500 py-8">
          No packages found for this location. Add one below.
        </div>
      `;
      return;
    }

    packagesList.innerHTML = packages.map(pkg => `
      <div class="bg-gray-800 rounded-lg p-4">
        <div class="flex justify-between items-start">
          <div class="flex-1 space-y-2">
            <div class="flex items-center gap-3">
              <h4 class="text-white font-semibold">${pkg.name}</h4>
              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${pkg.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}">
                ${pkg.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            ${pkg.description ? `<p class="text-gray-400 text-sm">${pkg.description}</p>` : ''}
            <div class="flex items-center gap-4 text-sm text-gray-300">
              <span class="font-semibold text-accent">$${parseFloat(pkg.price).toFixed(2)}</span>
              <span>${pkg.duration_months} month${pkg.duration_months !== 1 ? 's' : ''}</span>
              <span class="text-gray-500">CR ID: ${pkg.clubready_package_id}</span>
              <span class="text-gray-500">Order: ${pkg.display_order}</span>
            </div>
          </div>
          <button onclick="togglePackageStatus('${pkg.id}', ${!pkg.is_active})" class="text-gray-400 hover:text-accent transition-colors ml-4">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${pkg.is_active ? 'M6 18L18 6M6 6l12 12' : 'M5 13l4 4L19 7'}"></path>
            </svg>
          </button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading packages:', error);
    packagesList.innerHTML = `
      <div class="text-center text-red-400 py-8">
        Error loading packages. Please try again.
      </div>
    `;
  }
}

window.togglePackageStatus = async function(packageId, newStatus) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/packages?id=eq.${packageId}`, {
      method: 'PATCH',
      headers: {
        ...headers,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ is_active: newStatus })
    });

    if (!response.ok) throw new Error('Failed to update package status');

    showToast(`Package ${newStatus ? 'activated' : 'deactivated'} successfully!`);
    loadPackages(currentLocation.slug);
  } catch (error) {
    console.error('Error updating package:', error);
    alert('Failed to update package status');
  }
};

document.getElementById('add-package-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!currentLocation) {
    alert('Please save the location first before adding packages');
    return;
  }

  const packageData = {
    location_slug: currentLocation.slug,
    name: document.getElementById('package-name').value.trim(),
    description: document.getElementById('package-description').value.trim() || null,
    price: parseFloat(document.getElementById('package-price').value),
    duration_months: parseInt(document.getElementById('package-duration').value),
    clubready_package_id: document.getElementById('package-clubready-id').value.trim(),
    display_order: parseInt(document.getElementById('package-display-order').value) || 0,
    is_active: true
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/packages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(packageData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add package');
    }

    showToast('Package added successfully!');
    document.getElementById('add-package-form').reset();
    document.getElementById('package-display-order').value = '0';
    loadPackages(currentLocation.slug);
  } catch (error) {
    console.error('Error adding package:', error);
    alert(`Failed to add package: ${error.message}`);
  }
});

async function loadUsers(locationSlug) {
  const usersList = document.getElementById('users-list');
  usersList.innerHTML = `
    <div class="text-center text-gray-500 py-8">
      <svg class="animate-spin h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Loading users...
    </div>
  `;

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/user_locations?location_slug=eq.${locationSlug}&select=user_id,created_at,user_profiles!inner(role)`,
      { headers }
    );

    if (!response.ok) throw new Error('Failed to fetch users');

    const userLocations = await response.json();

    if (userLocations.length === 0) {
      usersList.innerHTML = `
        <div class="text-center text-gray-500 py-8">
          No users have access to this location yet.
        </div>
      `;
      return;
    }

    const userIds = userLocations.map(ul => ul.user_id);
    const usersResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      headers: {
        ...headers,
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`
      }
    });

    let authUsers = [];
    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      authUsers = usersData.users || [];
    }

    const totalLocationsMap = {};
    const totalLocationsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/user_locations?select=user_id`,
      { headers }
    );

    if (totalLocationsResponse.ok) {
      const allUserLocations = await totalLocationsResponse.json();
      allUserLocations.forEach(ul => {
        totalLocationsMap[ul.user_id] = (totalLocationsMap[ul.user_id] || 0) + 1;
      });
    }

    usersList.innerHTML = userLocations.map(userLoc => {
      const authUser = authUsers.find(u => u.id === userLoc.user_id);
      const email = authUser ? authUser.email : 'Unknown';
      const role = userLoc.user_profiles?.role || 'franchisee';
      const createdAt = new Date(userLoc.created_at).toLocaleDateString();
      const totalLocations = totalLocationsMap[userLoc.user_id] || 1;

      return `
        <div class="bg-gray-800 rounded-lg p-4 flex justify-between items-start">
          <div class="flex-1 space-y-2">
            <div class="flex items-center gap-3">
              <span class="text-white font-medium">${email}</span>
              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${role === 'admin' ? 'bg-accent/10 text-accent' : 'bg-blue-500/10 text-blue-400'}">
                ${role}
              </span>
            </div>
            <div class="flex items-center gap-4 text-sm text-gray-400">
              <span>Added: ${createdAt}</span>
              <span>${totalLocations} location${totalLocations !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <button onclick="revokeUserAccess('${userLoc.user_id}', '${locationSlug}', ${totalLocations})" class="text-red-400 hover:text-red-300 transition-colors ml-4">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading users:', error);
    usersList.innerHTML = `
      <div class="text-center text-red-400 py-8">
        Error loading users. Please try again.
      </div>
    `;
  }
}

window.revokeUserAccess = async function(userId, locationSlug, totalLocations) {
  const message = totalLocations === 1
    ? 'This is the user\'s only location. Revoking access will delete their account. Continue?'
    : 'Are you sure you want to revoke this user\'s access to this location?';

  if (!confirm(message)) return;

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/manage-franchisee-user`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        action: 'revoke',
        user_id: userId,
        location_slug: locationSlug
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to revoke access');
    }

    showToast(totalLocations === 1 ? 'User account deleted successfully!' : 'Access revoked successfully!');
    loadUsers(locationSlug);
  } catch (error) {
    console.error('Error revoking access:', error);
    alert(`Failed to revoke access: ${error.message}`);
  }
};

document.getElementById('invite-user-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!currentLocation) {
    alert('Please save the location first before inviting users');
    return;
  }

  const email = document.getElementById('user-email').value.trim();

  if (!email) {
    alert('Please enter an email address');
    return;
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/manage-franchisee-user`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        action: 'invite',
        email: email,
        location_slug: currentLocation.slug
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to invite user');
    }

    showToast('User invited successfully!');
    document.getElementById('invite-user-form').reset();
    loadUsers(currentLocation.slug);
  } catch (error) {
    console.error('Error inviting user:', error);
    alert(`Failed to invite user: ${error.message}`);
  }
});

document.getElementById('bulk-import-reviews-btn').addEventListener('click', async () => {
  const overwriteCheckbox = document.getElementById('overwrite-reviews-checkbox');
  const overwrite = overwriteCheckbox.checked;
  const importLogContainer = document.getElementById('import-log-container');
  const importLog = document.getElementById('import-log');
  const bulkImportBtn = document.getElementById('bulk-import-reviews-btn');

  try {
    bulkImportBtn.disabled = true;
    bulkImportBtn.innerHTML = `
      <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Importing...
    `;

    importLogContainer.classList.remove('hidden');
    importLog.innerHTML = '<div class="text-gray-400">Starting import...</div>';

    const response = await fetch(`${SUPABASE_URL}/rest/v1/locations?is_active=eq.true&select=slug,name,city,state`, {
      headers
    });

    const locations = await response.json();
    let totalImported = 0;
    let successCount = 0;
    let noneFoundCount = 0;
    let errorCount = 0;

    for (const location of locations) {
      await new Promise(r => setTimeout(r, 500));

      const logEntry = document.createElement('div');
      logEntry.className = 'text-gray-300';

      try {
        const result = await fetch(
          `${SUPABASE_URL}/functions/v1/google-import-reviews`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              location_slug: location.slug,
              overwrite: overwriteCheckbox.checked
            })
          }
        );

        const data = await result.json();

        if (data.success) {
          if (data.imported > 0) {
            logEntry.innerHTML = `<span class="text-green-400">✓</span> ${location.name} — ${data.imported} reviews imported`;
            totalImported += data.imported;
            successCount++;
          } else {
            logEntry.innerHTML = `<span class="text-yellow-400">⚠</span> ${location.name} — ${data.message || 'No reviews found (will use corporate defaults)'}`;
            noneFoundCount++;
          }
        } else {
          logEntry.innerHTML = `<span class="text-red-400">✗</span> ${location.name} — ${data.error || 'Failed'}`;
          errorCount++;
        }
      } catch (error) {
        logEntry.innerHTML = `<span class="text-red-400">✗</span> ${location.name} — ${error.message}`;
        errorCount++;
      }

      importLog.appendChild(logEntry);
      importLog.parentElement.scrollTop = importLog.parentElement.scrollHeight;
    }

    const summaryEntry = document.createElement('div');
    summaryEntry.className = 'text-white font-semibold mt-4 pt-4 border-t border-gray-700';
    summaryEntry.innerHTML = `Import complete — ${totalImported} reviews imported across ${successCount} locations (${noneFoundCount} with no reviews, ${errorCount} errors)`;
    importLog.appendChild(summaryEntry);

    bulkImportBtn.disabled = false;
    bulkImportBtn.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
      </svg>
      Import Google Reviews for All Locations
    `;

    showToast('Import completed successfully!');
  } catch (error) {
    console.error('Error during bulk import:', error);
    importLog.innerHTML += `<div class="text-red-400 mt-2">✗ Import failed: ${error.message}</div>`;

    bulkImportBtn.disabled = false;
    bulkImportBtn.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
      </svg>
      Import Google Reviews for All Locations
    `;
  }
});

document.getElementById('manage-corporate-events-btn').addEventListener('click', () => {
  const panel = document.getElementById('corporate-events-panel');
  panel.classList.toggle('hidden');
  if (!panel.classList.contains('hidden')) {
    loadCorporateEvents();
  }
});

document.getElementById('close-corporate-events-panel').addEventListener('click', () => {
  document.getElementById('corporate-events-panel').classList.add('hidden');
});

async function loadCorporateEvents() {
  const list = document.getElementById('corporate-events-list');
  list.innerHTML = '<div class="text-center text-gray-500 py-4">Loading templates...</div>';

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/events?is_corporate_template=eq.true&location_slug=is.null&order=event_date.asc`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Failed to fetch corporate events');

    const events = await response.json();

    if (events.length === 0) {
      list.innerHTML = '<div class="text-center text-gray-500 py-4">No corporate templates yet. Click "+ Add Corporate Template" to create one.</div>';
      return;
    }

    list.innerHTML = events.map(event => {
      const eventDate = new Date(event.event_date);
      const formattedDate = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      return `
        <div class="bg-gray-900 rounded-lg p-3 flex justify-between items-center">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-1">
              <span class="text-white font-medium text-sm">${event.title}</span>
              <span class="text-xs px-2 py-1 rounded ${event.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">
                ${event.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p class="text-gray-400 text-xs">${formattedDate}</p>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="toggleCorporateEventActive('${event.id}', ${!event.is_active})" class="text-gray-400 hover:text-accent transition-colors p-1" title="${event.is_active ? 'Deactivate' : 'Activate'}">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${event.is_active ? 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' : 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'}"></path>
              </svg>
            </button>
            <button onclick="editCorporateEvent('${event.id}')" class="text-accent hover:text-accent/80 transition-colors p-1" title="Edit">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </button>
            <button onclick="deleteCorporateEvent('${event.id}')" class="text-red-400 hover:text-red-300 transition-colors p-1" title="Delete">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Error loading corporate events:', error);
    list.innerHTML = '<div class="text-center text-red-400 py-4">Error loading templates. Please try again.</div>';
  }
}

window.toggleCorporateEventActive = async function(eventId, newStatus) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.${eventId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ is_active: newStatus })
    });

    if (!response.ok) throw new Error('Failed to toggle event status');

    loadCorporateEvents();
  } catch (error) {
    console.error('Error toggling corporate event:', error);
    alert('Failed to update event status');
  }
};

window.editCorporateEvent = async function(eventId) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.${eventId}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Failed to fetch event');

    const events = await response.json();
    if (events.length === 0) throw new Error('Event not found');

    const event = events[0];

    document.getElementById('corporate-event-form-title').textContent = 'Edit Corporate Event Template';
    document.getElementById('corporate-event-id').value = event.id;
    document.getElementById('corporate-event-title').value = event.title || '';
    document.getElementById('corporate-event-description').value = event.description || '';
    document.getElementById('corporate-event-date').value = event.event_date || '';
    document.getElementById('corporate-event-end-date').value = event.end_date || '';
    document.getElementById('corporate-event-cta-label').value = event.cta_label || '';
    document.getElementById('corporate-event-cta-url').value = event.cta_url || '';
    document.getElementById('corporate-event-image-url').value = event.image_url || '';
    document.getElementById('corporate-event-active').checked = event.is_active !== false;

    if (event.image_url) {
      const previewContainer = document.getElementById('corporate-event-image-preview-container');
      const preview = document.getElementById('corporate-event-image-preview');
      preview.src = event.image_url;
      previewContainer.classList.remove('hidden');
      const statusEl = document.getElementById('corporate-event-upload-status');
      statusEl.textContent = 'Current image (upload new to replace)';
      statusEl.className = 'text-xs mt-1 text-gray-400';
      statusEl.classList.remove('hidden');
    }

    document.getElementById('corporate-event-modal').classList.remove('hidden');
  } catch (error) {
    console.error('Error loading corporate event:', error);
    alert('Failed to load event details');
  }
};

window.deleteCorporateEvent = async function(eventId) {
  if (!confirm('Are you sure you want to delete this corporate event template?')) return;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.${eventId}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Prefer': 'return=minimal'
      }
    });

    if (!response.ok) throw new Error('Failed to delete event');

    loadCorporateEvents();
  } catch (error) {
    console.error('Error deleting corporate event:', error);
    alert('Failed to delete event');
  }
};

document.getElementById('add-corporate-event-btn').addEventListener('click', () => {
  document.getElementById('corporate-event-form-title').textContent = 'Add Corporate Event Template';
  document.getElementById('corporate-event-form').reset();
  document.getElementById('corporate-event-id').value = '';
  document.getElementById('corporate-event-active').checked = true;
  document.getElementById('corporate-event-modal').classList.remove('hidden');
});

document.getElementById('close-corporate-event-form').addEventListener('click', () => {
  document.getElementById('corporate-event-modal').classList.add('hidden');
});

document.getElementById('cancel-corporate-event-form').addEventListener('click', () => {
  document.getElementById('corporate-event-modal').classList.add('hidden');
});

document.getElementById('corporate-event-image-upload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    alert('File size must be less than 5MB');
    e.target.value = '';
    return;
  }

  const previewContainer = document.getElementById('corporate-event-image-preview-container');
  const preview = document.getElementById('corporate-event-image-preview');
  const statusEl = document.getElementById('corporate-event-upload-status');
  const hiddenInput = document.getElementById('corporate-event-image-url');

  preview.src = URL.createObjectURL(file);
  previewContainer.classList.remove('hidden');
  statusEl.textContent = 'Uploading...';
  statusEl.className = 'text-xs mt-1 text-yellow-400';
  statusEl.classList.remove('hidden');

  try {
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const path = `events/${filename}`;

    const uploadResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/location-media/${path}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': file.type
      },
      body: file
    });

    if (!uploadResponse.ok) {
      throw new Error('Upload failed');
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/location-media/${path}`;
    hiddenInput.value = publicUrl;
    statusEl.textContent = 'Uploaded ✓';
    statusEl.className = 'text-xs mt-1 text-green-400';
  } catch (error) {
    console.error('Upload error:', error);
    statusEl.textContent = 'Upload failed. Try again.';
    statusEl.className = 'text-xs mt-1 text-red-400';
    hiddenInput.value = '';
  }
});

document.getElementById('corporate-event-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const eventId = document.getElementById('corporate-event-id').value;
  const isEdit = !!eventId;

  const eventData = {
    title: document.getElementById('corporate-event-title').value.trim(),
    description: document.getElementById('corporate-event-description').value.trim() || null,
    event_date: document.getElementById('corporate-event-date').value,
    end_date: document.getElementById('corporate-event-end-date').value || null,
    cta_label: document.getElementById('corporate-event-cta-label').value.trim() || null,
    cta_url: document.getElementById('corporate-event-cta-url').value.trim() || null,
    image_url: document.getElementById('corporate-event-image-url').value.trim() || null,
    is_active: document.getElementById('corporate-event-active').checked,
    is_corporate_template: true,
    location_slug: null
  };

  try {
    let response;

    if (isEdit) {
      response = await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.${eventId}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(eventData)
      });
    } else {
      response = await fetch(`${SUPABASE_URL}/rest/v1/events`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(eventData)
      });
    }

    if (!response.ok) throw new Error('Failed to save corporate event');

    document.getElementById('corporate-event-modal').classList.add('hidden');
    loadCorporateEvents();

  } catch (error) {
    console.error('Error saving corporate event:', error);
    alert('Failed to save event. Please try again.');
  }
});

async function loadEvents(locationSlug) {
  const eventsList = document.getElementById('events-list');
  eventsList.innerHTML = `
    <div class="text-center text-gray-500 py-8">
      <svg class="animate-spin h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Loading events...
    </div>
  `;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/events?location_slug=eq.${locationSlug}&order=event_date.asc`, {
      headers
    });

    if (!response.ok) throw new Error('Failed to fetch events');

    const events = await response.json();

    if (events.length === 0) {
      eventsList.innerHTML = `
        <div class="text-center text-gray-500 py-8">
          No events found for this location. Add one below.
        </div>
      `;
      return;
    }

    eventsList.innerHTML = events.map(event => {
      const eventDate = new Date(event.event_date);
      const formattedDate = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      return `
        <div class="bg-gray-800 rounded-lg p-4 flex justify-between items-start">
          <div class="flex-1 space-y-2">
            <div class="flex items-center gap-3">
              <h4 class="text-white font-medium">${event.title}</h4>
              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${event.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}">
                ${event.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p class="text-gray-400 text-sm">${formattedDate}</p>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="editEvent('${event.id}')" class="text-accent hover:text-accent/80 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </button>
            <button onclick="deleteEvent('${event.id}')" class="text-red-400 hover:text-red-300 transition-colors ml-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading events:', error);
    eventsList.innerHTML = `
      <div class="text-center text-red-400 py-8">
        Error loading events. Please try again.
      </div>
    `;
  }
}

window.editEvent = async function(eventId) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.${eventId}`, {
      headers
    });

    if (!response.ok) throw new Error('Failed to fetch event');

    const events = await response.json();
    if (events.length === 0) throw new Error('Event not found');

    const event = events[0];

    document.getElementById('event-id').value = event.id;
    document.getElementById('event-title').value = event.title || '';
    document.getElementById('event-description').value = event.description || '';
    document.getElementById('event-date').value = event.event_date || '';
    document.getElementById('event-end-date').value = event.end_date || '';
    document.getElementById('event-cta-label').value = event.cta_label || '';
    document.getElementById('event-cta-url').value = event.cta_url || '';
    document.getElementById('event-image-url').value = event.image_url || '';
    document.getElementById('event-active').checked = event.is_active !== false;

    if (event.image_url) {
      const previewContainer = document.getElementById('event-image-preview-container');
      const preview = document.getElementById('event-image-preview');
      preview.src = event.image_url;
      previewContainer.classList.remove('hidden');
      const statusEl = document.getElementById('event-upload-status');
      statusEl.textContent = 'Current image (upload new to replace)';
      statusEl.className = 'text-xs mt-1 text-gray-400';
      statusEl.classList.remove('hidden');
    }

    document.getElementById('event-submit-btn').textContent = 'Update Event';
  } catch (error) {
    console.error('Error loading event:', error);
    alert('Failed to load event details');
  }
};

window.deleteEvent = async function(eventId) {
  if (!confirm('Are you sure you want to delete this event?')) return;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.${eventId}`, {
      method: 'DELETE',
      headers: {
        ...headers,
        'Prefer': 'return=minimal'
      }
    });

    if (!response.ok) throw new Error('Failed to delete event');

    showToast('Event deleted successfully!');
    loadEvents(currentLocation.slug);
  } catch (error) {
    console.error('Error deleting event:', error);
    alert('Failed to delete event');
  }
};

document.getElementById('event-image-upload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    alert('File size must be less than 5MB');
    e.target.value = '';
    return;
  }

  const previewContainer = document.getElementById('event-image-preview-container');
  const preview = document.getElementById('event-image-preview');
  const statusEl = document.getElementById('event-upload-status');
  const hiddenInput = document.getElementById('event-image-url');

  preview.src = URL.createObjectURL(file);
  previewContainer.classList.remove('hidden');
  statusEl.textContent = 'Uploading...';
  statusEl.className = 'text-xs mt-1 text-yellow-400';
  statusEl.classList.remove('hidden');

  try {
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const path = `events/${filename}`;

    const uploadResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/location-media/${path}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': file.type
      },
      body: file
    });

    if (!uploadResponse.ok) {
      throw new Error('Upload failed');
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/location-media/${path}`;
    hiddenInput.value = publicUrl;
    statusEl.textContent = 'Uploaded ✓';
    statusEl.className = 'text-xs mt-1 text-green-400';
  } catch (error) {
    console.error('Upload error:', error);
    statusEl.textContent = 'Upload failed. Try again.';
    statusEl.className = 'text-xs mt-1 text-red-400';
    hiddenInput.value = '';
  }
});

document.getElementById('add-event-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!currentLocation) {
    alert('Please save the location first before adding events');
    return;
  }

  const eventId = document.getElementById('event-id').value;
  const isEdit = !!eventId;

  const eventData = {
    location_slug: currentLocation.slug,
    title: document.getElementById('event-title').value.trim(),
    description: document.getElementById('event-description').value.trim() || null,
    event_date: document.getElementById('event-date').value,
    end_date: document.getElementById('event-end-date').value || null,
    cta_label: document.getElementById('event-cta-label').value.trim() || null,
    cta_url: document.getElementById('event-cta-url').value.trim() || null,
    image_url: document.getElementById('event-image-url').value.trim() || null,
    is_active: document.getElementById('event-active').checked,
    is_corporate_template: false
  };

  try {
    let response;

    if (isEdit) {
      response = await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.${eventId}`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(eventData)
      });
    } else {
      response = await fetch(`${SUPABASE_URL}/rest/v1/events`, {
        method: 'POST',
        headers,
        body: JSON.stringify(eventData)
      });
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save event');
    }

    showToast(isEdit ? 'Event updated successfully!' : 'Event added successfully!');
    document.getElementById('add-event-form').reset();
    document.getElementById('event-id').value = '';
    document.getElementById('event-submit-btn').textContent = 'Add Event';
    loadEvents(currentLocation.slug);
  } catch (error) {
    console.error('Error saving event:', error);
    alert(`Failed to save event: ${error.message}`);
  }
});

// Instructors Management
async function loadInstructors(locationSlug) {
  const instructorsList = document.getElementById('instructors-list');
  instructorsList.innerHTML = `
    <div class="text-center text-gray-500 py-8">
      <svg class="animate-spin h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Loading instructors...
    </div>
  `;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/instructors?location_slug=eq.${locationSlug}&order=display_order.asc`, {
      headers
    });

    if (!response.ok) throw new Error('Failed to fetch instructors');

    const instructors = await response.json();

    if (instructors.length === 0) {
      instructorsList.innerHTML = `
        <div class="text-center text-gray-500 py-8">
          No instructors found for this location.
        </div>
      `;
      return;
    }

    instructorsList.innerHTML = instructors.map(instructor => {
      const initials = instructor.name.split(' ').map(n => n[0]).join('').toUpperCase();
      return `
        <div class="flex items-center justify-between bg-gray-800 rounded-lg p-4">
          <div class="flex items-center gap-4">
            ${instructor.photo_url
              ? `<img src="${instructor.photo_url}" alt="${instructor.name}" class="w-12 h-12 rounded-full object-cover">`
              : `<div class="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold">${initials}</div>`
            }
            <div>
              <h4 class="text-white font-medium">${instructor.name}</h4>
              ${instructor.title ? `<p class="text-gray-400 text-sm">${instructor.title}</p>` : ''}
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="px-3 py-1 rounded-full text-xs font-medium ${instructor.is_active ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}">
              ${instructor.is_active ? 'Active' : 'Inactive'}
            </span>
            <button onclick="editInstructor(${instructor.id})" class="text-accent hover:text-[#e5b000] transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </button>
            <button onclick="deleteInstructor(${instructor.id})" class="text-red-400 hover:text-red-300 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading instructors:', error);
    instructorsList.innerHTML = `
      <div class="text-center text-red-400 py-8">
        Failed to load instructors. Please try again.
      </div>
    `;
  }
}

document.getElementById('add-instructor-btn').addEventListener('click', () => {
  document.getElementById('instructor-form-title').textContent = 'Add Instructor';
  document.getElementById('instructor-submit-btn').textContent = 'Add Instructor';
  document.getElementById('instructor-form').reset();
  document.getElementById('instructor-id').value = '';
  document.getElementById('instructor-photo-url').value = '';
  document.getElementById('instructor-photo-preview-container').classList.add('hidden');
  document.getElementById('instructor-modal').classList.remove('hidden');
});

document.getElementById('close-instructor-form').addEventListener('click', () => {
  document.getElementById('instructor-modal').classList.add('hidden');
});

document.getElementById('cancel-instructor-form').addEventListener('click', () => {
  document.getElementById('instructor-modal').classList.add('hidden');
});

window.editInstructor = async function(instructorId) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/instructors?id=eq.${instructorId}`, {
      headers
    });

    if (!response.ok) throw new Error('Failed to fetch instructor');

    const instructors = await response.json();
    if (instructors.length === 0) throw new Error('Instructor not found');

    const instructor = instructors[0];

    document.getElementById('instructor-id').value = instructor.id;
    document.getElementById('instructor-name').value = instructor.name || '';
    document.getElementById('instructor-title').value = instructor.title || '';
    document.getElementById('instructor-bio').value = instructor.bio || '';
    document.getElementById('instructor-certifications').value = instructor.certifications || '';
    document.getElementById('instructor-specialties').value = instructor.specialties || '';
    document.getElementById('instructor-display-order').value = instructor.display_order || 0;
    document.getElementById('instructor-active').checked = instructor.is_active;
    document.getElementById('instructor-photo-url').value = instructor.photo_url || '';

    if (instructor.photo_url) {
      document.getElementById('instructor-photo-preview').src = instructor.photo_url;
      document.getElementById('instructor-photo-preview-container').classList.remove('hidden');
    } else {
      document.getElementById('instructor-photo-preview-container').classList.add('hidden');
    }

    document.getElementById('instructor-form-title').textContent = 'Edit Instructor';
    document.getElementById('instructor-submit-btn').textContent = 'Update Instructor';
    document.getElementById('instructor-modal').classList.remove('hidden');
  } catch (error) {
    console.error('Error loading instructor:', error);
    alert('Failed to load instructor details.');
  }
};

window.deleteInstructor = async function(instructorId) {
  if (!confirm('Are you sure you want to delete this instructor?')) return;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/instructors?id=eq.${instructorId}`, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) throw new Error('Failed to delete instructor');

    showToast('Instructor deleted successfully!');
    loadInstructors(currentLocation.slug);
  } catch (error) {
    console.error('Error deleting instructor:', error);
    alert('Failed to delete instructor. Please try again.');
  }
};

document.getElementById('instructor-photo-upload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const statusEl = document.getElementById('instructor-upload-status');

  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    statusEl.textContent = 'File too large. Max size: 5MB';
    statusEl.className = 'text-red-400 text-xs mt-1';
    statusEl.classList.remove('hidden');
    return;
  }

  statusEl.textContent = 'Uploading...';
  statusEl.className = 'text-accent text-xs mt-1';
  statusEl.classList.remove('hidden');

  try {
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    const filePath = `instructors/${fileName}`;

    const uploadResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/location-media/${filePath}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': file.type
      },
      body: file
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      throw new Error(error.message || 'Upload failed');
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/location-media/${filePath}`;

    document.getElementById('instructor-photo-url').value = publicUrl;
    document.getElementById('instructor-photo-preview').src = publicUrl;
    document.getElementById('instructor-photo-preview-container').classList.remove('hidden');

    statusEl.textContent = 'Upload complete!';
    statusEl.className = 'text-green-400 text-xs mt-1';

    setTimeout(() => {
      statusEl.classList.add('hidden');
    }, 3000);
  } catch (error) {
    console.error('Upload error:', error);
    statusEl.textContent = `Upload failed: ${error.message}`;
    statusEl.className = 'text-red-400 text-xs mt-1';
  }
});

document.getElementById('instructor-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!currentLocation) {
    alert('No location selected');
    return;
  }

  const instructorId = document.getElementById('instructor-id').value;
  const isEdit = !!instructorId;

  const instructorData = {
    location_slug: currentLocation.slug,
    name: document.getElementById('instructor-name').value.trim(),
    title: document.getElementById('instructor-title').value.trim() || null,
    bio: document.getElementById('instructor-bio').value.trim() || null,
    certifications: document.getElementById('instructor-certifications').value.trim() || null,
    specialties: document.getElementById('instructor-specialties').value.trim() || null,
    photo_url: document.getElementById('instructor-photo-url').value.trim() || null,
    display_order: parseInt(document.getElementById('instructor-display-order').value) || 0,
    is_active: document.getElementById('instructor-active').checked
  };

  try {
    let response;

    if (isEdit) {
      response = await fetch(`${SUPABASE_URL}/rest/v1/instructors?id=eq.${instructorId}`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(instructorData)
      });
    } else {
      response = await fetch(`${SUPABASE_URL}/rest/v1/instructors`, {
        method: 'POST',
        headers,
        body: JSON.stringify(instructorData)
      });
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save instructor');
    }

    showToast(isEdit ? 'Instructor updated successfully!' : 'Instructor added successfully!');
    document.getElementById('instructor-modal').classList.add('hidden');
    loadInstructors(currentLocation.slug);
  } catch (error) {
    console.error('Error saving instructor:', error);
    alert(`Failed to save instructor: ${error.message}`);
  }
});

loadLocations();
