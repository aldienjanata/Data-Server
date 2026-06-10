// =====================================================
// DASHBOARD.JS
// =====================================================
import { SitesAPI } from './supabase.js';
import { getSiteColor, getSiteEmoji, calcPercent, formatDate } from './utils.js';
import { currentProfile, canEdit } from './auth.js';

export async function renderDashboard(container) {
  try {
    const sites = await SitesAPI.getAll();

    // Get stats for all sites concurrently
    const statsAll = await Promise.all(sites.map(s => SitesAPI.getStats(s.id)));
    const siteStats = sites.map((s, i) => ({ ...s, stats: statsAll[i] }));

    const totalDevices = siteStats.reduce((a, s) => a + (s.stats?.devices || 0), 0);
    const totalPorts   = siteStats.reduce((a, s) => a + (s.stats?.total || 0), 0);
    const totalFilled  = siteStats.reduce((a, s) => a + (s.stats?.filled || 0), 0);
    const totalEmpty   = siteStats.reduce((a, s) => a + (s.stats?.empty || 0), 0);
    const overallPct   = calcPercent(totalFilled, totalPorts);

    const userName = currentProfile?.full_name?.split(' ')[0] || 'Teknisi';
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Selamat Pagi' : hour < 17 ? 'Selamat Siang' : 'Selamat Malam';

    container.innerHTML = `
      <div class="stagger">
        <!-- Dashboard Header -->
        <div class="dashboard-header">
          <div class="dashboard-greeting">${greeting}, ${userName}! 👋</div>
          <div class="dashboard-subtitle">Sistem Manajemen Data Perangkat Server</div>
          <div style="margin-top:16px;display:flex;align-items:center;gap:12px;">
            <div style="flex:1">
              <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                <span style="font-size:0.8rem;color:var(--color-text-muted)">Penggunaan Port Keseluruhan</span>
                <span style="font-size:0.8rem;font-weight:700;color:var(--color-filled)">${overallPct}%</span>
              </div>
              <div style="height:8px;background:var(--color-bg-overlay);border-radius:var(--radius-full);overflow:hidden;">
                <div style="height:100%;width:${overallPct}%;background:linear-gradient(90deg,var(--color-primary),var(--color-filled));border-radius:var(--radius-full);transition:width 0.8s ease;"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card" style="--stat-accent:var(--color-primary);--stat-accent-bg:rgba(59,130,246,0.12)">
            <div class="stat-card__icon">🌐</div>
            <div class="stat-card__value">${sites.length}</div>
            <div class="stat-card__label">Total Site</div>
          </div>
          <div class="stat-card" style="--stat-accent:var(--color-secondary);--stat-accent-bg:rgba(139,92,246,0.12)">
            <div class="stat-card__icon">🖥️</div>
            <div class="stat-card__value">${totalDevices}</div>
            <div class="stat-card__label">Total Perangkat</div>
          </div>
          <div class="stat-card" style="--stat-accent:var(--color-filled);--stat-accent-bg:rgba(16,185,129,0.12)">
            <div class="stat-card__icon">🟢</div>
            <div class="stat-card__value">${totalFilled}</div>
            <div class="stat-card__label">Port Terisi</div>
            <div class="stat-card__sub">dari ${totalPorts} total port</div>
          </div>
          <div class="stat-card" style="--stat-accent:var(--color-warning);--stat-accent-bg:rgba(245,158,11,0.12)">
            <div class="stat-card__icon">⚪</div>
            <div class="stat-card__value">${totalEmpty}</div>
            <div class="stat-card__label">Port Kosong</div>
          </div>
        </div>

        <!-- Sites Section -->
        <div class="section-header">
          <div class="section-title">
            <span class="section-title__icon">📍</span>
            Semua Site
          </div>
          ${canEdit() ? `
            <button class="btn btn-primary btn-sm" onclick="showAddSiteModal()">
              + Site Baru
            </button>
          ` : ''}
        </div>

        <div class="sites-grid">
          ${siteStats.map(site => renderSiteCard(site)).join('')}
          ${canEdit() ? `
            <div class="card card--clickable" onclick="showAddSiteModal()"
                 style="min-height:160px;display:grid;place-items:center;border-style:dashed;opacity:0.6;">
              <div style="text-align:center;">
                <div style="font-size:36px;margin-bottom:8px;">➕</div>
                <div style="font-size:0.875rem;font-weight:600;color:var(--color-text-muted)">Tambah Site Baru</div>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;

  } catch (err) {
    console.error('[Dashboard] Error:', err);
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">⚠️</div>
        <div class="empty-state__title">Gagal memuat dashboard</div>
        <div class="empty-state__desc">${err.message}</div>
        <button class="btn btn-primary" onclick="window.App.navigate('dashboard')">Coba Lagi</button>
      </div>
    `;
  }
}

function renderSiteCard(site) {
  const { stats } = site;
  const pct = calcPercent(stats?.filled || 0, stats?.total || 0);
  const color = getSiteColor(site.name);
  const emoji = getSiteEmoji(site.name);

  return `
    <div class="site-card" onclick="App.navigate('site', {siteId:'${site.id}'})"
         style="--site-color:${color}">
      <div class="site-card__header">
        <div>
          <div class="site-card__avatar" style="background:${color}22;">
            ${emoji}
          </div>
          <div class="site-card__name">${site.name}</div>
          <div class="site-card__location">📍 ${site.location || 'Jawa Tengah'}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:1.5rem;font-weight:800;color:${color}">${pct}%</div>
          <div style="font-size:0.7rem;color:var(--color-text-muted)">terisi</div>
          <!-- Mini circular progress -->
          <svg width="40" height="40" viewBox="0 0 40 40" style="margin-top:8px">
            <circle cx="20" cy="20" r="16" fill="none" stroke="var(--color-bg-overlay)" stroke-width="4"/>
            <circle cx="20" cy="20" r="16" fill="none" stroke="${color}" stroke-width="4"
                    stroke-dasharray="${2 * Math.PI * 16}" 
                    stroke-dashoffset="${2 * Math.PI * 16 * (1 - pct / 100)}"
                    stroke-linecap="round"
                    transform="rotate(-90 20 20)"
                    style="transition:stroke-dashoffset 1s ease"/>
          </svg>
        </div>
      </div>
      <div class="site-card__stats">
        <div class="site-card__stat">
          <div class="site-card__stat-value">${stats?.devices || 0}</div>
          <div class="site-card__stat-label">Perangkat</div>
        </div>
        <div class="site-card__stat">
          <div class="site-card__stat-value" style="color:var(--color-filled)">${stats?.filled || 0}</div>
          <div class="site-card__stat-label">Terisi</div>
        </div>
        <div class="site-card__stat">
          <div class="site-card__stat-value">${stats?.total || 0}</div>
          <div class="site-card__stat-label">Total Port</div>
        </div>
      </div>
    </div>
  `;
}

// =====================================================
// ADD SITE MODAL
// =====================================================
window.showAddSiteModal = function() {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.onclick = (e) => { if (e.target === backdrop) backdrop.remove(); };
  backdrop.innerHTML = `
    <div class="modal" onclick="event.stopPropagation()">
      <div class="modal__handle"></div>
      <div class="modal__title">🌐 Tambah Site Baru</div>
      <div class="form-group">
        <label class="form-label">Nama Site *</label>
        <input class="form-input" id="new-site-name" type="text" placeholder="cth: Purwokerto" required>
      </div>
      <div class="form-group">
        <label class="form-label">Lokasi</label>
        <input class="form-input" id="new-site-location" type="text" placeholder="cth: Purwokerto, Jawa Tengah">
      </div>
      <div class="form-group">
        <label class="form-label">Deskripsi</label>
        <textarea class="form-textarea" id="new-site-desc" placeholder="Deskripsi site..."></textarea>
      </div>
      <div class="modal__actions">
        <button class="btn btn-secondary" style="flex:1" onclick="document.querySelector('.modal-backdrop').remove()">Batal</button>
        <button class="btn btn-primary" style="flex:2" onclick="submitAddSite()">➕ Tambah Site</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);
  setTimeout(() => document.getElementById('new-site-name')?.focus(), 300);
};

window.submitAddSite = async function() {
  const name     = document.getElementById('new-site-name').value.trim();
  const location = document.getElementById('new-site-location').value.trim();
  const desc     = document.getElementById('new-site-desc').value.trim();
  if (!name) { const { showToast } = await import('./app.js'); showToast('Nama site wajib diisi', 'warning'); return; }
  const btn = document.querySelector('.modal .btn-primary');
  btn.classList.add('loading'); btn.disabled = true;
  try {
    await SitesAPI.create({ name, location: location || null, description: desc || null });
    document.querySelector('.modal-backdrop').remove();
    const { showToast } = await import('./app.js');
    showToast(`✅ Site ${name} berhasil ditambahkan!`, 'success');
    window.App.navigate('dashboard');
  } catch (err) {
    const { showToast } = await import('./app.js');
    showToast(`❌ ${err.message}`, 'error');
  } finally {
    btn.classList.remove('loading'); btn.disabled = false;
  }
};
