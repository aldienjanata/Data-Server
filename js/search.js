// =====================================================
// SEARCH.JS - Global Search Module
// =====================================================
import { PortsAPI, SitesAPI } from './supabase.js';
import { debounce, highlightText, getDeviceIcon, getDeviceColor, getDeviceBgColor } from './utils.js';

export async function renderSearchPage(container) {
  container.innerHTML = `
    <div class="search-page-header">
      <h2 style="margin-bottom:var(--space-4)">🔍 Cari Port & Perangkat</h2>
      <div class="search-wrapper">
        <span class="search-icon">🔍</span>
        <input class="search-input" type="text" id="global-search-input"
               placeholder="Cari nama lokasi, core, koneksi..." autocomplete="off"
               autofocus>
        <button class="search-clear hidden" id="search-clear-btn" onclick="clearSearch()">✕</button>
      </div>
    </div>

    <div id="search-results">
      ${renderSearchSuggestions()}
    </div>
  `;

  const input = document.getElementById('global-search-input');
  input.addEventListener('input', debounce(handleSearch, 400));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') clearSearch();
  });
}

// =====================================================
// SEARCH SUGGESTIONS (initial state)
// =====================================================
function renderSearchSuggestions() {
  const recents = getRecentSearches();
  return `
    <div class="fade-in">
      ${recents.length > 0 ? `
        <div class="section-header" style="margin-bottom:12px">
          <div class="section-title" style="font-size:0.85rem">🕒 Pencarian Terkini</div>
          <button class="btn btn-ghost btn-sm" onclick="clearRecentSearches()">Hapus</button>
        </div>
        ${recents.map(q => `
          <div class="search-result-item" onclick="setSearchQuery('${q}')">
            <div class="search-result-icon" style="background:var(--color-bg-overlay)">🕒</div>
            <div class="search-result-info">
              <div class="search-result-title">${q}</div>
            </div>
          </div>
        `).join('')}
        <div class="divider"></div>
      ` : ''}
      <div class="empty-state" style="padding:40px 24px">
        <div class="empty-state__icon" style="font-size:48px;opacity:0.4">🔍</div>
        <div class="empty-state__title">Cari koneksi port</div>
        <div class="empty-state__desc">
          Ketik nama lokasi, kode core (cth: 1/3/2), nama customer, atau nama perangkat
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:16px">
          ${['Karangtengah', 'CWDM', 'Backbone', 'Up Link', 'CUST-'].map(q => `
            <button class="chip" onclick="setSearchQuery('${q}')">${q}</button>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// =====================================================
// HANDLE SEARCH
// =====================================================
async function handleSearch() {
  const query = document.getElementById('global-search-input').value.trim();
  const clearBtn = document.getElementById('search-clear-btn');
  const resultsEl = document.getElementById('search-results');

  if (clearBtn) clearBtn.classList.toggle('hidden', !query);

  if (!query || query.length < 2) {
    resultsEl.innerHTML = renderSearchSuggestions();
    return;
  }

  // Loading state
  resultsEl.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;padding:16px;color:var(--color-text-muted)">
      <div class="loading-spinner" style="width:24px;height:24px;border-width:2px"></div>
      Mencari "${query}"...
    </div>
  `;

  try {
    const results = await PortsAPI.search(query);

    if (!results.length) {
      resultsEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">🔍</div>
          <div class="empty-state__title">Tidak ditemukan</div>
          <div class="empty-state__desc">Tidak ada hasil untuk "<strong>${query}</strong>"</div>
        </div>
      `;
      return;
    }

    // Save to recent
    saveRecentSearch(query);

    // Group by device
    const byDevice = {};
    results.forEach(r => {
      const devId = r.device_id;
      if (!byDevice[devId]) byDevice[devId] = { device: r.devices, ports: [] };
      byDevice[devId].ports.push(r);
    });

    const html = Object.values(byDevice).map(group => {
      const { device, ports } = group;
      const typeName = device?.device_types?.name || 'OTHER';
      const icon     = getDeviceIcon(typeName);
      const color    = getDeviceColor(typeName);
      const bgColor  = getDeviceBgColor(typeName);
      const siteName = device?.sites?.name || '';

      return `
        <div style="margin-bottom:var(--space-4)">
          <div style="
            display:flex;align-items:center;gap:8px;
            font-size:0.75rem;font-weight:700;text-transform:uppercase;
            letter-spacing:0.05em;color:var(--color-text-muted);
            margin-bottom:8px;padding:0 4px;
          ">
            <span style="font-size:16px">${icon}</span>
            ${siteName ? `${siteName} › ` : ''}${device?.name || 'Perangkat'}
            <span class="badge badge-${typeName.toLowerCase()}">${typeName}</span>
          </div>
          ${ports.map(port => renderSearchResult(port, query, device)).join('')}
        </div>
      `;
    }).join('');

    resultsEl.innerHTML = `
      <div style="
        font-size:0.8rem;color:var(--color-text-muted);
        margin-bottom:var(--space-4);
        display:flex;justify-content:space-between;align-items:center;
      ">
        <span>${results.length} hasil untuk "<strong style="color:var(--color-primary-light)">${query}</strong>"</span>
      </div>
      <div class="stagger">${html}</div>
    `;

  } catch (err) {
    console.error('[Search] Error:', err);
    resultsEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">⚠️</div>
        <div class="empty-state__title">Pencarian gagal</div>
        <div class="empty-state__desc">${err.message}</div>
      </div>
    `;
  }
}

// =====================================================
// RENDER SEARCH RESULT ITEM
// =====================================================
function renderSearchResult(port, query, device) {
  const typeName = device?.device_types?.name || 'OTHER';
  const icon     = getDeviceIcon(typeName);
  const bgColor  = getDeviceBgColor(typeName);
  const statusIcons = { filled: '🟢', empty: '⚪', unverified: '🟡', reserved: '🟣' };

  return `
    <div class="search-result-item"
         onclick="App.navigate('device', {siteId:'${device?.site_id || ''}', deviceId:'${port.device_id}'})">
      <div class="search-result-icon" style="background:${bgColor}">${statusIcons[port.status] || '⚪'}</div>
      <div class="search-result-info">
        <div class="search-result-title">
          ${highlightText(port.connection_label || '(Kosong)', query)}
        </div>
        <div class="search-result-meta">
          Port ${String(port.port_number).padStart(2,'0')}
          ${port.connection_detail ? ` • ${port.connection_detail}` : ''}
          ${port.otb_tubes?.tube_number ? ` • Tube ${port.otb_tubes.tube_number}` : ''}
        </div>
      </div>
      <span style="font-size:18px;color:var(--color-text-muted)">›</span>
    </div>
  `;
}

// =====================================================
// RECENT SEARCHES (localStorage)
// =====================================================
function getRecentSearches() {
  try { return JSON.parse(localStorage.getItem('recentSearches') || '[]'); }
  catch { return []; }
}

function saveRecentSearch(query) {
  try {
    let recents = getRecentSearches().filter(q => q !== query);
    recents.unshift(query);
    recents = recents.slice(0, 5);
    localStorage.setItem('recentSearches', JSON.stringify(recents));
  } catch {}
}

window.clearRecentSearches = function() {
  localStorage.removeItem('recentSearches');
  document.getElementById('search-results').innerHTML = renderSearchSuggestions();
};

window.clearSearch = function() {
  const input = document.getElementById('global-search-input');
  if (input) { input.value = ''; input.focus(); }
  const clearBtn = document.getElementById('search-clear-btn');
  if (clearBtn) clearBtn.classList.add('hidden');
  document.getElementById('search-results').innerHTML = renderSearchSuggestions();
};

window.setSearchQuery = function(query) {
  const input = document.getElementById('global-search-input');
  if (input) {
    input.value = query;
    input.dispatchEvent(new Event('input'));
  }
};
