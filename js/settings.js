// =====================================================
// SETTINGS.JS - Settings & Profile Page
// =====================================================
import { currentUser, currentProfile, canEdit, isAdmin, isGuest, handleSignOut } from './auth.js';
import { storage } from './utils.js';
import { showToast } from './app.js';

export async function renderSettingsPage(container) {
  const profile = currentProfile;
  const user = currentUser;
  const name = profile?.full_name || user?.email || 'Tamu';
  const role = profile?.role || 'viewer';
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const roleColors = { admin: '#f59e0b', editor: '#3b82f6', viewer: '#64748b' };
  const roleLabels = { admin: '👑 Administrator', editor: '✏️ Editor', viewer: '👀 Viewer' };
  const theme = storage.get('theme', 'dark');

  container.innerHTML = `
    <div class="stagger">
      <h2 style="margin-bottom:var(--space-5)">⚙️ Pengaturan</h2>

      <!-- Profile Card -->
      <div class="card" style="margin-bottom:var(--space-4)">
        <div class="card__body" style="display:flex;align-items:center;gap:var(--space-4)">
          <div style="
            width:64px;height:64px;border-radius:50%;flex-shrink:0;
            background:linear-gradient(135deg,var(--color-primary),var(--color-secondary));
            display:grid;place-items:center;font-size:1.5rem;font-weight:800;color:white;
          ">${initials}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:1.1rem;font-weight:700">${name}</div>
            <div style="font-size:0.8rem;color:var(--color-text-muted)">${user?.email || 'Mode Tamu'}</div>
            <span class="badge" style="
              background:${roleColors[role]}22;
              color:${roleColors[role]};
              border:1px solid ${roleColors[role]}44;
              margin-top:6px;display:inline-flex;
            ">${roleLabels[role] || role}</span>
          </div>
          ${!isGuest() ? `
            <button class="btn btn-secondary btn-sm" onclick="showEditProfileModal()">✏️ Edit</button>
          ` : ''}
        </div>
      </div>

      <!-- App Settings -->
      <div class="settings-section">
        <div class="settings-section__title">Tampilan</div>
        <div class="settings-item" onclick="toggleTheme()">
          <div class="settings-item__icon" style="background:rgba(139,92,246,0.12)">🌙</div>
          <div class="settings-item__content">
            <div class="settings-item__label">Tema Gelap</div>
            <div class="settings-item__desc">Mode gelap / terang</div>
          </div>
          <label class="switch" onclick="event.stopPropagation()">
            <input type="checkbox" id="theme-toggle" ${theme === 'dark' ? 'checked' : ''} onchange="handleThemeToggle(this)">
            <div class="switch__track"></div>
            <div class="switch__thumb"></div>
          </label>
        </div>
      </div>

      <!-- Data Settings -->
      <div class="settings-section">
        <div class="settings-section__title">Data & Sinkronisasi</div>
        <div class="settings-item" onclick="App.navigate('audit')">
          <div class="settings-item__icon" style="background:rgba(59,130,246,0.12)">📋</div>
          <div class="settings-item__content">
            <div class="settings-item__label">Riwayat Perubahan</div>
            <div class="settings-item__desc">Log semua perubahan data port</div>
          </div>
          <span class="settings-item__right">›</span>
        </div>
        <div class="settings-item" onclick="showImportModal()">
          <div class="settings-item__icon" style="background:rgba(16,185,129,0.12)">📂</div>
          <div class="settings-item__content">
            <div class="settings-item__label">Import Data Excel</div>
            <div class="settings-item__desc">Import file xlsx dari template</div>
          </div>
          <span class="settings-item__right">›</span>
        </div>
        <div class="settings-item" onclick="syncOfflineData()">
          <div class="settings-item__icon" style="background:rgba(245,158,11,0.12)">🔄</div>
          <div class="settings-item__content">
            <div class="settings-item__label">Sinkronisasi Data Offline</div>
            <div class="settings-item__desc">Kirim perubahan yang tersimpan offline</div>
          </div>
          <span class="settings-item__right">›</span>
        </div>
      </div>

      <!-- Supabase Config -->
      <div class="settings-section">
        <div class="settings-section__title">Konfigurasi Backend</div>
        <div class="settings-item" onclick="showSupabaseConfig()">
          <div class="settings-item__icon" style="background:rgba(16,185,129,0.12)">🗄️</div>
          <div class="settings-item__content">
            <div class="settings-item__label">Supabase Config</div>
            <div class="settings-item__desc">URL & API Key Supabase</div>
          </div>
          <span class="settings-item__right">›</span>
        </div>
      </div>

      <!-- About -->
      <div class="settings-section">
        <div class="settings-section__title">Tentang Aplikasi</div>
        <div class="settings-item">
          <div class="settings-item__icon" style="background:rgba(59,130,246,0.12)">🖥️</div>
          <div class="settings-item__content">
            <div class="settings-item__label">Server Data Manager</div>
            <div class="settings-item__desc">v1.0.0 — Sistem manajemen port jaringan multi-site</div>
          </div>
        </div>
        <div class="settings-item">
          <div class="settings-item__icon" style="background:rgba(100,116,139,0.12)">📱</div>
          <div class="settings-item__content">
            <div class="settings-item__label">Install Aplikasi</div>
            <div class="settings-item__desc">Tambahkan ke layar utama smartphone</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="promptInstall()">Install</button>
        </div>
      </div>

      <!-- Sign Out -->
      <div style="margin-top:var(--space-4)">
        <button class="btn btn-danger btn-full btn-lg" onclick="handleSignOutClick()">
          🚪 ${isGuest() ? 'Keluar dari Mode Tamu' : 'Keluar / Sign Out'}
        </button>
      </div>

      <div style="text-align:center;margin-top:var(--space-6);color:var(--color-text-muted);font-size:0.75rem">
        Server Data Manager © 2025<br>
        Powered by Supabase + PWA
      </div>
    </div>
  `;
}

// =====================================================
// HANDLERS
// =====================================================
window.handleThemeToggle = function(checkbox) {
  const theme = checkbox.checked ? 'dark' : 'light';
  storage.set('theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('theme-btn');
  if (btn) btn.textContent = theme === 'dark' ? '🌙' : '☀️';
};

window.handleSignOutClick = handleSignOut;

window.syncOfflineData = async function() {
  try {
    const { OfflineQueue } = await import('./supabase.js');
    const count = await OfflineQueue.sync();
    if (count > 0) {
      showToast(`✅ ${count} perubahan offline berhasil disinkronkan`, 'success');
    } else {
      showToast('ℹ️ Tidak ada data offline untuk disinkronkan', 'info');
    }
  } catch (err) {
    showToast(`❌ Sinkronisasi gagal: ${err.message}`, 'error');
  }
};

// =====================================================
// SUPABASE CONFIG MODAL
// =====================================================
window.showSupabaseConfig = function() {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.onclick = (e) => { if (e.target === backdrop) backdrop.remove(); };
  backdrop.innerHTML = `
    <div class="modal" onclick="event.stopPropagation()">
      <div class="modal__handle"></div>
      <div class="modal__title">🗄️ Konfigurasi Supabase</div>
      <div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:var(--radius-lg);padding:12px;margin-bottom:16px;font-size:0.82rem;color:var(--color-warning)">
        ⚠️ Ubah nilai ini di file <code style="background:rgba(0,0,0,0.3);padding:2px 6px;border-radius:4px">js/supabase.js</code> baris 8-9
      </div>
      <div class="form-group">
        <label class="form-label">Supabase Project URL</label>
        <div style="
          background:var(--color-bg-input);border:1px solid var(--color-border-strong);
          border-radius:var(--radius-lg);padding:11px var(--space-4);
          font-family:var(--font-mono);font-size:0.8rem;color:var(--color-text-muted);
          word-break:break-all;
        ">https://YOUR_PROJECT_ID.supabase.co</div>
        <div class="form-hint">Format: https://[project-id].supabase.co</div>
      </div>
      <div style="margin-top:12px">
        <a href="https://supabase.com/dashboard" target="_blank" class="btn btn-primary btn-full">
          🔗 Buka Supabase Dashboard
        </a>
      </div>
      <div style="margin-top:8px">
        <button class="btn btn-secondary btn-full" onclick="document.querySelector('.modal-backdrop').remove()">Tutup</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);
};

// =====================================================
// EDIT PROFILE MODAL
// =====================================================
window.showEditProfileModal = function() {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.onclick = (e) => { if (e.target === backdrop) backdrop.remove(); };
  backdrop.innerHTML = `
    <div class="modal" onclick="event.stopPropagation()">
      <div class="modal__handle"></div>
      <div class="modal__title">✏️ Edit Profil</div>
      <div class="form-group">
        <label class="form-label">Nama Lengkap</label>
        <input class="form-input" id="edit-profile-name" type="text"
               value="${currentProfile?.full_name || ''}" placeholder="Nama Anda">
      </div>
      <div class="modal__actions">
        <button class="btn btn-secondary" style="flex:1" onclick="document.querySelector('.modal-backdrop').remove()">Batal</button>
        <button class="btn btn-primary" style="flex:2" onclick="submitEditProfile()">💾 Simpan</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);
};

window.submitEditProfile = async function() {
  const name = document.getElementById('edit-profile-name').value.trim();
  if (!name) { showToast('Nama tidak boleh kosong', 'warning'); return; }
  const btn = document.querySelector('.modal .btn-primary');
  btn.classList.add('loading'); btn.disabled = true;
  try {
    const { AuthAPI } = await import('./supabase.js');
    await AuthAPI.updateProfile(currentUser.id, { full_name: name });
    currentProfile.full_name = name;
    document.querySelector('.modal-backdrop').remove();
    showToast('✅ Profil berhasil diperbarui', 'success');
    window.App.navigate('settings');
  } catch (err) {
    showToast(`❌ ${err.message}`, 'error');
  } finally {
    btn.classList.remove('loading'); btn.disabled = false;
  }
};

// =====================================================
// IMPORT MODAL
// =====================================================
window.showImportModal = function() {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.onclick = (e) => { if (e.target === backdrop) backdrop.remove(); };
  backdrop.innerHTML = `
    <div class="modal" onclick="event.stopPropagation()">
      <div class="modal__handle"></div>
      <div class="modal__title">📂 Import Data Excel</div>
      <p style="color:var(--color-text-muted);font-size:0.875rem;margin-bottom:var(--space-5)">
        Import data dari file Excel (.xlsx) sesuai format template OTB/CISCO/HUAWEI
      </p>
      <div class="dropzone" id="import-dropzone" onclick="document.getElementById('file-import-input').click()">
        <div class="dropzone__icon">📂</div>
        <div class="dropzone__text">Tap untuk pilih file</div>
        <div class="dropzone__hint">Format: .xlsx (Data Otb-Gtgo-Cisco)</div>
      </div>
      <input type="file" id="file-import-input" accept=".xlsx,.xls" style="display:none" onchange="handleImportFile(this)">
      <div id="import-preview" style="margin-top:var(--space-4)"></div>
      <div class="modal__actions" style="margin-top:var(--space-4)">
        <button class="btn btn-secondary btn-full" onclick="document.querySelector('.modal-backdrop').remove()">Tutup</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  // Drag & drop
  const dropzone = document.getElementById('import-dropzone');
  dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('drag-over'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) processImportFile(file);
  });
};

window.handleImportFile = function(input) {
  const file = input.files[0];
  if (file) processImportFile(file);
};

async function processImportFile(file) {
  const preview = document.getElementById('import-preview');
  preview.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;color:var(--color-text-muted);font-size:0.875rem">
      <div class="loading-spinner" style="width:20px;height:20px;border-width:2px"></div>
      Membaca file ${file.name}...
    </div>
  `;
  
  // Import the xlsx library dynamically
  try {
    // Note: requires SheetJS CDN in index.html
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetNames = workbook.SheetNames;
    
    preview.innerHTML = `
      <div style="background:var(--color-filled-bg);border:1px solid rgba(16,185,129,0.3);border-radius:var(--radius-lg);padding:12px;font-size:0.85rem">
        <div style="font-weight:700;color:var(--color-filled);margin-bottom:8px">✅ File dibaca: ${file.name}</div>
        <div style="color:var(--color-text-muted)">Sheet ditemukan:</div>
        <ul style="margin:8px 0 0 16px;color:var(--color-text-secondary)">
          ${sheetNames.map(n => `<li>${n}</li>`).join('')}
        </ul>
        <div style="margin-top:12px;color:var(--color-text-muted);font-size:0.8rem">
          ℹ️ Fitur import otomatis akan segera hadir. Gunakan SQL seed di folder /supabase untuk import saat ini.
        </div>
      </div>
    `;
  } catch (err) {
    preview.innerHTML = `
      <div style="color:var(--color-danger);background:rgba(239,68,68,0.1);border-radius:var(--radius-lg);padding:12px;font-size:0.85rem">
        ❌ Gagal membaca file: ${err.message}
      </div>
    `;
  }
}

// =====================================================
// PWA INSTALL PROMPT
// =====================================================
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

window.promptInstall = async function() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      showToast('✅ Aplikasi berhasil diinstall!', 'success');
    }
    deferredPrompt = null;
  } else {
    showToast('ℹ️ Buka browser menu dan pilih "Add to Home Screen"', 'info', 5000);
  }
};
