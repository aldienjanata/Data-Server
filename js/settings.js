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

      <!-- About -->
      <div class="settings-section">
        <div class="settings-section__title">Tentang Aplikasi</div>
        <div class="settings-item">
          <div class="settings-item__icon" style="background:transparent;padding:0">
            <img src="/logos/logo-apk.jpg" style="width:100%;height:100%;object-fit:cover;border-radius:8px">
          </div>
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

      </div>



      <!-- Sign Out -->
      <div style="margin-top:var(--space-4)">
        <button class="btn btn-danger btn-full btn-lg" onclick="handleSignOutClick()">
          🚪 ${isGuest() ? 'Keluar dari Mode Tamu' : 'Keluar / Sign Out'}
        </button>
      </div>

      <div style="text-align:center;margin-top:var(--space-6);color:var(--color-text-muted);font-size:0.75rem">
        Server Data Manager © 2026<br>
        Powered by Aldi
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
      <!-- Sign Out -->
      <div style="margin-top:var(--space-4)">
        <button class="btn btn-danger btn-full btn-lg" onclick="handleSignOutClick()">
          🚪 ${isGuest() ? 'Keluar dari Mode Tamu' : 'Keluar / Sign Out'}
        </button>
      </div>

      <div style="text-align:center;margin-top:var(--space-6);color:var(--color-text-muted);font-size:0.75rem">
        Server Data Manager © 2026<br>
        Powered by Aldi
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

window.runSeedBanyumas = async function() {
  const btn = document.getElementById('btn-seed-banyumas');
  btn.disabled = true;
  btn.innerHTML = '⏳ Memeriksa database...';

  try {
    const { getClient } = await import('./supabase.js');
    const supabase = getClient();
    if (!supabase) throw new Error('Koneksi database belum siap. Coba refresh halaman dulu.');

    // Check if devices already exist from SQL seed
    const { data: sites } = await supabase.from('sites').select('id').eq('name', 'Banyumas');
    if (!sites || sites.length === 0) throw new Error('Site Banyumas tidak ditemukan');
    const siteId = sites[0].id;

    const { data: existingDevs } = await supabase.from('devices').select('name').eq('site_id', siteId);
    const existingNames = new Set((existingDevs || []).map(d => d.name));
    const targetDevices = ['X86 HP Proliant RFTTH-CLP','X86 BMS-02','X86 BMS-03','CCR2116-12S-4S+',
      'CWDM MUX DEMUX 8CH','Ericsson 70060CX-32S','Server Facebook','Server YouTube',
      'Server Tiktok','X86 Server Speedtest','Server Proxmox','CCR1036-8G-2S+',
      'DELL Server Speedtest','JUNIPER MX204','X86 RO Dedicated'];
    const alreadyDone = targetDevices.filter(n => existingNames.has(n));

    if (alreadyDone.length >= 13) {
      // Already seeded via SQL!
      localStorage.setItem('seed_banyumas_done', 'true');
      alert(`✅ Sukses! ${alreadyDone.length} perangkat Banyumas sudah ada di database. Halaman akan direload.`);
      window.location.reload();
      return;
    }

    if (!confirm(`Ditemukan ${alreadyDone.length} dari 15 perangkat. Lanjutkan menambah yang belum ada?`)) {
      btn.disabled = false;
      btn.innerHTML = '🚀 Install 13 Perangkat Banyumas (Hanya 1x Klik)';
      return;
    }

    btn.innerHTML = '⏳ Sedang memproses... jangan tutup halaman';

    // Get CISCO type ID (existing type, no need to create new)
    const { data: types } = await supabase.from('device_types').select('id,name');
    const typeMap = {};
    (types || []).forEach(t => typeMap[t.name] = t.id);
    const defaultTypeId = typeMap['CISCO'] || Object.values(typeMap)[0];

    const newDevices = [
      { name: 'X86 HP Proliant RFTTH-CLP', sort_order: 19, total_ports: 2, desc: JSON.stringify([{ label: "Ports", ports: [1,2] }]), portLabels: {} },
      { name: 'X86 BMS-02', sort_order: 11, total_ports: 8, desc: JSON.stringify([{ label: "SFP+", ports: [1,2,3,4] }, { label: "Ethernet", ports: [5,6,7,8] }]), portLabels: {1:"SFP+ 1",2:"SFP+ 2",3:"SFP+ 3",4:"SFP+ 4",5:"ETH 1",6:"ETH 2",7:"ETH 3",8:"ETH 4"} },
      { name: 'X86 BMS-03', sort_order: 12, total_ports: 12, desc: JSON.stringify([{ label: "SFP+", ports: [1,2,3,4] }, { label: "ETH", ports: [5,6,7,8,9,10,11,12] }]), portLabels: {1:"SFP+ 1",2:"SFP+ 2",3:"SFP+ 3",4:"SFP+ 4",5:"ETH 1",6:"ETH 2",7:"ETH 3",8:"ETH 4",9:"ETH 5",10:"ETH 6",11:"ETH 7",12:"ETH 8"} },
      { name: 'CCR2116-12S-4S+', sort_order: 13, total_ports: 16, desc: JSON.stringify([{ label: "SFP+", ports: [1,2,3,4] }, { label: "GIGABIT ETHERNET", ports: Array.from({length:12},(_,i)=>i+5) }]), portLabels: Object.fromEntries([...Array.from({length:4},(_,i)=>[i+1,`SFP+ ${i+1}`]),...Array.from({length:12},(_,i)=>[i+5,`ETH ${i+1}`])]) },
      { name: 'CWDM MUX DEMUX 8CH', sort_order: 14, total_ports: 10, desc: JSON.stringify([{ label: "TX", ports: [1,2,3,4,5] }, { label: "RX", ports: [6,7,8,9,10] }]), portLabels: {1:"TX 1470",2:"TX 1510",3:"TX 1550",4:"TX 1590",5:"TX RX",6:"RX 1490",7:"RX 1530",8:"RX 1570",9:"RX 1610",10:"RX TX"} },
      { name: 'Ericsson 70060CX-32S', sort_order: 15, total_ports: 32, desc: JSON.stringify([{ label: "Baris A (Atas)", ports: Array.from({length:16},(_,i)=>i*2+1) }, { label: "Baris B (Bawah)", ports: Array.from({length:16},(_,i)=>i*2+2) }]), portLabels: {} },
      { name: 'Server Facebook', sort_order: 16, total_ports: 1, desc: JSON.stringify([{label:"Ports",ports:[1]}]), portLabels: {} },
      { name: 'Server YouTube', sort_order: 17, total_ports: 1, desc: JSON.stringify([{label:"Ports",ports:[1]}]), portLabels: {} },
      { name: 'Server Tiktok', sort_order: 18, total_ports: 1, desc: JSON.stringify([{label:"Ports",ports:[1]}]), portLabels: {} },
      { name: 'X86 Server Speedtest', sort_order: 10, total_ports: 14, desc: JSON.stringify(Array.from({length:7},(_,i)=>({ label: `Slot ${i+1}`, ports: [i*2+1, i*2+2] }))), portLabels: Object.fromEntries(Array.from({length:14},(_,i)=>[i+1,`Port ${(i%2)+1}`])) },
      { name: 'Server Proxmox', sort_order: 20, total_ports: 2, desc: JSON.stringify([{label:"Ports",ports:[1,2]}]), portLabels: {} },
      { name: 'CCR1036-8G-2S+', sort_order: 21, total_ports: 10, desc: JSON.stringify([{ label: "SFP+", ports: [1,2] }, { label: "ETH", ports: Array.from({length:8},(_,i)=>i+3) }]), portLabels: Object.fromEntries([...Array.from({length:2},(_,i)=>[i+1,`SFP+ ${i+1}`]),...Array.from({length:8},(_,i)=>[i+3,`ETH ${i+1}`])]) },
      { name: 'DELL Server Speedtest', sort_order: 22, total_ports: 2, desc: JSON.stringify([{label:"Ports",ports:[1,2]}]), portLabels: {} },
      { name: 'JUNIPER MX204', sort_order: 23, total_ports: 6, desc: JSON.stringify([{ label: "Ports", ports: [1,2,3,4] }, { label: "Special", ports: [5,6] }]), portLabels: {1:"Port 0",2:"Port 1",3:"Port 2",4:"Port 3",5:"MGMT Port",6:"Bits"} },
      { name: 'X86 RO Dedicated', sort_order: 24, total_ports: 7, desc: JSON.stringify([{ label: "SFP+", ports: [1,2] }, { label: "SFP++", ports: [3,4] }, { label: "Ethernet", ports: [5,6,7] }]), portLabels: {1:"SFP+ 1",2:"SFP+ 2",3:"SFP++ 1",4:"SFP++ 2",5:"ETH 1",6:"ETH 2",7:"ETH 3"} }
    ];

    let created = 0;
    for (const dev of newDevices) {
      if (existingNames.has(dev.name)) continue;

      const { data: createdDev, error: devErr } = await supabase.from('devices').insert([{
        site_id: siteId,
        device_type_id: defaultTypeId,
        name: dev.name,
        total_ports: dev.total_ports,
        description: dev.desc,
        sort_order: dev.sort_order,
        is_active: true
      }]).select();

      if (devErr || !createdDev || createdDev.length === 0) {
        console.warn('Skip device (RLS or error):', dev.name, devErr?.message);
        continue;
      }

      const deviceId = createdDev[0].id;
      const labelKeys = Object.keys(dev.portLabels);
      const totalPorts = labelKeys.length > 0 ? Math.max(...labelKeys.map(Number)) : dev.total_ports;
      const ports = Array.from({length: totalPorts}, (_, i) => ({
        device_id: deviceId,
        port_number: i + 1,
        status: 'empty',
        port_label: dev.portLabels[i + 1] || null,
        updated_at: new Date().toISOString()
      }));

      if (ports.length > 0) {
        await supabase.from('port_connections').insert(ports);
      }
      created++;
    }

    localStorage.setItem('seed_banyumas_done', 'true');
    alert(`✅ Selesai! ${created} perangkat berhasil ditambahkan ke Banyumas. Halaman akan direload.`);
    window.location.reload();

  } catch(err) {
    alert('Terjadi kesalahan: ' + err.message);
    btn.disabled = false;
    btn.innerHTML = '🚀 Install 13 Perangkat Banyumas (Hanya 1x Klik)';
  }
};

