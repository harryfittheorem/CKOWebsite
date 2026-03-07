const SUPABASE_URL = 'https://agbmljovmexflolbgljn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnYm1sam92bWV4ZmxvbGJnbGpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3OTg3ODAsImV4cCI6MjA4MzM3NDc4MH0.dBQxzYtka4nD0eJQFH0Izj-jbQBX4kEoMS0vZrSOtRA';

const token = sessionStorage.getItem('cko_admin_token');
if (!token) {
  window.location.href = 'index.html';
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
const detailsTab = document.getElementById('details-tab');
const scheduleTab = document.getElementById('schedule-tab');
const mediaTab = document.getElementById('media-tab');

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

detailsTabBtn.addEventListener('click', () => {
  detailsTabBtn.classList.add('bg-gray-800', 'border-b-2', 'border-accent', 'text-white');
  detailsTabBtn.classList.remove('text-gray-400');
  scheduleTabBtn.classList.remove('bg-gray-800', 'border-b-2', 'border-accent', 'text-white');
  scheduleTabBtn.classList.add('text-gray-400');
  mediaTabBtn.classList.remove('bg-gray-800', 'border-b-2', 'border-accent', 'text-white');
  mediaTabBtn.classList.add('text-gray-400');
  detailsTab.classList.remove('hidden');
  scheduleTab.classList.add('hidden');
  mediaTab.classList.add('hidden');
});

scheduleTabBtn.addEventListener('click', () => {
  scheduleTabBtn.classList.add('bg-gray-800', 'border-b-2', 'border-accent', 'text-white');
  scheduleTabBtn.classList.remove('text-gray-400');
  detailsTabBtn.classList.remove('bg-gray-800', 'border-b-2', 'border-accent', 'text-white');
  detailsTabBtn.classList.add('text-gray-400');
  mediaTabBtn.classList.remove('bg-gray-800', 'border-b-2', 'border-accent', 'text-white');
  mediaTabBtn.classList.add('text-gray-400');
  scheduleTab.classList.remove('hidden');
  detailsTab.classList.add('hidden');
  mediaTab.classList.add('hidden');

  if (currentLocation) {
    loadSchedule(currentLocation.slug);
  }
});

mediaTabBtn.addEventListener('click', () => {
  mediaTabBtn.classList.add('bg-gray-800', 'border-b-2', 'border-accent', 'text-white');
  mediaTabBtn.classList.remove('text-gray-400');
  detailsTabBtn.classList.remove('bg-gray-800', 'border-b-2', 'border-accent', 'text-white');
  detailsTabBtn.classList.add('text-gray-400');
  scheduleTabBtn.classList.remove('bg-gray-800', 'border-b-2', 'border-accent', 'text-white');
  scheduleTabBtn.classList.add('text-gray-400');
  mediaTab.classList.remove('hidden');
  detailsTab.classList.add('hidden');
  scheduleTab.classList.add('hidden');

  if (currentLocation) {
    loadMedia(currentLocation.slug);
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
      const addressParts = loc.address.split(',');
      const cityState = addressParts.length >= 3 ? `${addressParts[addressParts.length - 2].trim()}, ${addressParts[addressParts.length - 1].trim()}` : loc.address;

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

    const addressParts = currentLocation.address.split(',');
    if (addressParts.length >= 3) {
      document.getElementById('input-address').value = addressParts[0].trim();
      document.getElementById('input-city').value = addressParts[1].trim();
      const lastPart = addressParts[2].trim().split(' ');
      document.getElementById('input-state').value = lastPart[0] || '';
      document.getElementById('input-zip').value = lastPart[1] || '';
    } else {
      document.getElementById('input-address').value = currentLocation.address || '';
      document.getElementById('input-city').value = '';
      document.getElementById('input-state').value = '';
      document.getElementById('input-zip').value = '';
    }

    document.getElementById('input-phone').value = currentLocation.phone || '';
    document.getElementById('input-email').value = currentLocation.email || '';
    document.getElementById('input-hours').value = currentLocation.hours || '';
    document.getElementById('input-hero-headline').value = currentLocation.hero_headline || '';
    document.getElementById('input-about-text').value = currentLocation.about_text || '';
    document.getElementById('input-google-maps-url').value = currentLocation.google_maps_embed_url || '';
    document.getElementById('input-ghl-calendar-url').value = currentLocation.ghl_calendar_url || '';
    document.getElementById('input-ghl-location-id').value = currentLocation.ghl_location_id || '';
    document.getElementById('input-clubready-site-id').value = currentLocation.clubready_site_id || '';
    document.getElementById('input-lat').value = currentLocation.lat || '';
    document.getElementById('input-lng').value = currentLocation.lng || '';

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
  document.getElementById('input-clubready-site-id').value = '';
  document.getElementById('input-lat').value = '';
  document.getElementById('input-lng').value = '';

  updateToggleUI();
  openPanel();

  detailsTabBtn.click();
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

  const fullAddress = `${streetAddress}, ${city}, ${state} ${zip}`;

  const locationData = {
    name,
    slug,
    address: fullAddress,
    phone,
    email,
    hours: document.getElementById('input-hours').value.trim(),
    hero_headline: document.getElementById('input-hero-headline').value.trim(),
    about_text: document.getElementById('input-about-text').value.trim(),
    google_maps_embed_url: document.getElementById('input-google-maps-url').value.trim(),
    ghl_calendar_url: document.getElementById('input-ghl-calendar-url').value.trim(),
    ghl_location_id: document.getElementById('input-ghl-location-id').value.trim(),
    clubready_site_id: document.getElementById('input-clubready-site-id').value.trim(),
    lat,
    lng,
    is_active: isActive
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

loadLocations();
