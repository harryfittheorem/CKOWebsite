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

let currentPage = 0;
const pageSize = 50;
let allLeads = [];
let filteredLeads = [];

document.getElementById('sign-out-btn').addEventListener('click', () => {
  sessionStorage.removeItem('cko_admin_token');
  sessionStorage.removeItem('cko_admin_refresh');
  window.location.href = 'index.html';
});

async function fetchStats() {
  try {
    const totalResponse = await fetch(`${SUPABASE_URL}/rest/v1/leads?select=count`, {
      method: 'HEAD',
      headers: {
        ...headers,
        'Prefer': 'count=exact'
      }
    });

    if (totalResponse.ok) {
      const totalCount = totalResponse.headers.get('content-range');
      if (totalCount) {
        const count = totalCount.split('/')[1];
        document.getElementById('total-leads').textContent = count;
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const todayResponse = await fetch(`${SUPABASE_URL}/rest/v1/leads?select=count&created_at=gte.${todayISO}`, {
      method: 'HEAD',
      headers: {
        ...headers,
        'Prefer': 'count=exact'
      }
    });

    if (todayResponse.ok) {
      const todayCount = todayResponse.headers.get('content-range');
      if (todayCount) {
        const count = todayCount.split('/')[1];
        document.getElementById('leads-today').textContent = count;
      }
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);
    const weekISO = oneWeekAgo.toISOString();

    const weekResponse = await fetch(`${SUPABASE_URL}/rest/v1/leads?select=count&created_at=gte.${weekISO}`, {
      method: 'HEAD',
      headers: {
        ...headers,
        'Prefer': 'count=exact'
      }
    });

    if (weekResponse.ok) {
      const weekCount = weekResponse.headers.get('content-range');
      if (weekCount) {
        const count = weekCount.split('/')[1];
        document.getElementById('leads-this-week').textContent = count;
      }
    }

  } catch (error) {
    console.error('Error fetching stats:', error);
    document.getElementById('total-leads').textContent = 'Error';
    document.getElementById('leads-today').textContent = 'Error';
    document.getElementById('leads-this-week').textContent = 'Error';
  }
}

async function fetchLocations() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/locations?select=slug,name&order=name.asc`, {
      headers
    });

    if (response.ok) {
      const locations = await response.json();
      const locationSelect = document.getElementById('filter-location');

      locations.forEach(location => {
        const option = document.createElement('option');
        option.value = location.slug;
        option.textContent = location.name;
        locationSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error fetching locations:', error);
  }
}

async function fetchLeads() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/leads?select=*&order=created_at.desc`, {
      headers
    });

    if (response.ok) {
      allLeads = await response.json();
      filteredLeads = [...allLeads];
      currentPage = 0;
      populateSourceFilter();
      renderLeadsTable();
      updatePagination();
    } else {
      showError('Failed to load leads');
    }
  } catch (error) {
    console.error('Error fetching leads:', error);
    showError('Error loading leads');
  }
}

function populateSourceFilter() {
  const sourceSelect = document.getElementById('filter-source');
  const uniqueSources = [...new Set(allLeads.map(lead => lead.source).filter(Boolean))].sort();

  sourceSelect.innerHTML = '<option value="">All Sources</option>';

  uniqueSources.forEach(source => {
    const option = document.createElement('option');
    option.value = source;
    option.textContent = source;
    sourceSelect.appendChild(option);
  });
}

function applyFilters() {
  const locationFilter = document.getElementById('filter-location').value;
  const sourceFilter = document.getElementById('filter-source').value;
  const dateFromFilter = document.getElementById('filter-date-from').value;
  const dateToFilter = document.getElementById('filter-date-to').value;

  filteredLeads = allLeads.filter(lead => {
    if (locationFilter && lead.location_slug !== locationFilter) return false;
    if (sourceFilter && lead.source !== sourceFilter) return false;

    if (dateFromFilter) {
      const leadDate = new Date(lead.created_at);
      const fromDate = new Date(dateFromFilter);
      fromDate.setHours(0, 0, 0, 0);
      if (leadDate < fromDate) return false;
    }

    if (dateToFilter) {
      const leadDate = new Date(lead.created_at);
      const toDate = new Date(dateToFilter);
      toDate.setHours(23, 59, 59, 999);
      if (leadDate > toDate) return false;
    }

    return true;
  });

  currentPage = 0;
  renderLeadsTable();
  updatePagination();
}

function resetFilters() {
  document.getElementById('filter-location').value = '';
  document.getElementById('filter-source').value = '';
  document.getElementById('filter-date-from').value = '';
  document.getElementById('filter-date-to').value = '';

  filteredLeads = [...allLeads];
  currentPage = 0;
  renderLeadsTable();
  updatePagination();
}

function formatDateTime(dateString) {
  const date = new Date(dateString);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${dateStr}<br><span class="text-xs text-gray-500">${timeStr}</span>`;
}

function formatSource(source) {
  const sourceMap = {
    'homepage-hero-ip': 'Homepage Hero IP',
    'homepage-hero-zip': 'Homepage Hero ZIP',
    'location-hero-league-city': 'Location Hero League City'
  };
  return sourceMap[source] || source;
}

function getStatusBadge(status) {
  if (status === 'success') {
    return '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/50 text-green-400 border border-green-800">Synced</span>';
  } else if (status === 'failed') {
    return '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/50 text-red-400 border border-red-800">Failed</span>';
  } else {
    return '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-400 border border-gray-700">Pending</span>';
  }
}

function renderLeadsTable() {
  const tbody = document.getElementById('leads-table-body');
  const start = currentPage * pageSize;
  const end = start + pageSize;
  const pageLeads = filteredLeads.slice(start, end);

  if (pageLeads.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="px-6 py-12 text-center text-gray-500">
          No leads found
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = pageLeads.map(lead => `
    <tr class="hover:bg-gray-800/50 transition-colors">
      <td class="px-6 py-4 whitespace-nowrap text-sm text-white">
        ${formatDateTime(lead.created_at)}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
        ${lead.name || '-'}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
        ${lead.phone || '-'}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
        ${lead.email || '-'}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
        ${lead.location_slug || '-'}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
        ${formatSource(lead.source)}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
        ${lead.miles ? lead.miles.toFixed(1) : '-'}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm">
        ${getStatusBadge(lead.ghl_push_status)}
      </td>
    </tr>
  `).join('');
}

function updatePagination() {
  const start = currentPage * pageSize + 1;
  const end = Math.min((currentPage + 1) * pageSize, filteredLeads.length);
  const total = filteredLeads.length;

  document.getElementById('showing-range').textContent = `${start}-${end}`;
  document.getElementById('total-count').textContent = total;

  document.getElementById('prev-page-btn').disabled = currentPage === 0;
  document.getElementById('next-page-btn').disabled = end >= total;
}

function showError(message) {
  const tbody = document.getElementById('leads-table-body');
  tbody.innerHTML = `
    <tr>
      <td colspan="8" class="px-6 py-12 text-center text-red-400">
        ${message}
      </td>
    </tr>
  `;
}

function exportToCSV() {
  const headers = ['Date/Time', 'Name', 'Phone', 'Email', 'Location', 'Source', 'Miles', 'GHL Status'];

  const rows = filteredLeads.map(lead => {
    const date = new Date(lead.created_at);
    const dateStr = date.toLocaleDateString('en-US');
    const timeStr = date.toLocaleTimeString('en-US');
    const dateTime = `${dateStr} ${timeStr}`;

    return [
      dateTime,
      lead.name || '',
      lead.phone || '',
      lead.email || '',
      lead.location_slug || '',
      formatSource(lead.source),
      lead.miles ? lead.miles.toFixed(1) : '',
      lead.ghl_push_status || 'pending'
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      const escaped = String(cell).replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const timestamp = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `cko-leads-${timestamp}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

document.getElementById('apply-filters-btn').addEventListener('click', applyFilters);
document.getElementById('reset-filters-btn').addEventListener('click', resetFilters);
document.getElementById('export-csv-btn').addEventListener('click', exportToCSV);

document.getElementById('prev-page-btn').addEventListener('click', () => {
  if (currentPage > 0) {
    currentPage--;
    renderLeadsTable();
    updatePagination();
  }
});

document.getElementById('next-page-btn').addEventListener('click', () => {
  const maxPage = Math.ceil(filteredLeads.length / pageSize) - 1;
  if (currentPage < maxPage) {
    currentPage++;
    renderLeadsTable();
    updatePagination();
  }
});

fetchStats();
fetchLocations();
fetchLeads();
