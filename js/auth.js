// =====================================================
// AUTH.JS - Authentication Module
// =====================================================
import { AuthAPI } from './supabase.js';
import { storage, vibrate } from './utils.js';
import { showToast } from './app.js';

export let currentUser = null;
export let currentProfile = null;

// =====================================================
// RENDER LOGIN PAGE
// =====================================================
export function renderLoginPage() {
  return `
    <div class="login-page">
      <div class="login-card fade-in">
        <div class="login-logo">
          <div class="login-logo__icon">🖥️</div>
          <div class="login-logo__title">Server Data Manager</div>
          <div class="login-logo__subtitle">Manajemen Port & Perangkat Jaringan</div>
        </div>

        <div id="auth-form">
          <div class="form-group">
            <label class="form-label" for="auth-email">Email</label>
            <input class="form-input" type="email" id="auth-email" 
                   placeholder="nama@email.com" autocomplete="email" required>
          </div>

          <div class="form-group">
            <label class="form-label" for="auth-password">Password</label>
            <div style="position:relative">
              <input class="form-input" type="password" id="auth-password" 
                     placeholder="••••••••" autocomplete="current-password" required>
              <button class="btn btn-ghost btn-icon-sm" 
                      style="position:absolute;right:8px;top:50%;transform:translateY(-50%)"
                      onclick="togglePasswordVisibility()" id="toggle-pw-btn"
                      type="button">👁️</button>
            </div>
          </div>

          <div id="auth-name-group" class="form-group hidden">
            <label class="form-label" for="auth-name">Nama Lengkap</label>
            <input class="form-input" type="text" id="auth-name" 
                   placeholder="Nama Anda" autocomplete="name">
          </div>

          <button class="btn btn-primary btn-full btn-lg" id="auth-submit-btn"
                  onclick="handleAuthSubmit()" style="margin-top:8px">
            Masuk
          </button>

          <div class="divider--text" style="margin:20px 0">atau</div>

          <button class="btn btn-secondary btn-full" onclick="toggleAuthMode()" id="auth-toggle-btn">
            Daftar Akun Baru
          </button>
        </div>

        <div class="divider" style="margin:24px 0"></div>

        <div style="text-align:center">
          <button class="btn btn-ghost" onclick="continueAsGuest()" style="font-size:0.85rem;color:var(--color-text-muted)">
            👀 Lanjutkan sebagai Tamu (hanya baca)
          </button>
        </div>
      </div>
    </div>
  `;
}

// =====================================================
// AUTH MODE TOGGLE
// =====================================================
let isRegisterMode = false;

window.toggleAuthMode = function() {
  isRegisterMode = !isRegisterMode;
  const nameGroup = document.getElementById('auth-name-group');
  const submitBtn = document.getElementById('auth-submit-btn');
  const toggleBtn = document.getElementById('auth-toggle-btn');

  if (isRegisterMode) {
    nameGroup.classList.remove('hidden');
    submitBtn.textContent = 'Daftar';
    toggleBtn.textContent = 'Sudah punya akun? Masuk';
  } else {
    nameGroup.classList.add('hidden');
    submitBtn.textContent = 'Masuk';
    toggleBtn.textContent = 'Daftar Akun Baru';
  }
};

window.togglePasswordVisibility = function() {
  const input = document.getElementById('auth-password');
  const btn = document.getElementById('toggle-pw-btn');
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
  }
};

// =====================================================
// HANDLE AUTH SUBMIT
// =====================================================
window.handleAuthSubmit = async function() {
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const name = document.getElementById('auth-name')?.value.trim();
  const btn = document.getElementById('auth-submit-btn');

  if (!email || !password) {
    showToast('Email dan password wajib diisi', 'warning');
    return;
  }

  btn.classList.add('loading');
  btn.disabled = true;

  try {
    if (isRegisterMode) {
      await AuthAPI.signUp(email, password, name || email);
      showToast('✅ Akun berhasil dibuat! Silakan cek email untuk verifikasi', 'success');
      isRegisterMode = false;
      window.toggleAuthMode();
    } else {
      const data = await AuthAPI.signIn(email, password);
      currentUser = data.user;
      currentProfile = await AuthAPI.getProfile(currentUser.id);
      vibrate([10, 5, 10]);
      showToast(`👋 Selamat datang, ${currentProfile?.full_name || email}!`, 'success');
      storage.set('lastUser', { email, name: currentProfile?.full_name });
      window.App.navigate('dashboard');
    }
  } catch (err) {
    console.error('[Auth]', err);
    const msg = err.message?.includes('Invalid login') 
      ? 'Email atau password salah' 
      : (err.message || 'Terjadi kesalahan');
    showToast(`❌ ${msg}`, 'error');
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
};

// =====================================================
// CONTINUE AS GUEST
// =====================================================
window.continueAsGuest = function() {
  currentUser = null;
  currentProfile = { role: 'viewer', full_name: 'Tamu' };
  storage.set('guestMode', true);
  showToast('👀 Mode tamu - hanya bisa melihat data', 'info');
  window.App.navigate('dashboard');
};

// =====================================================
// HANDLE SIGN OUT
// =====================================================
export async function handleSignOut() {
  try {
    if (currentUser) await AuthAPI.signOut();
    currentUser = null;
    currentProfile = null;
    storage.remove('guestMode');
    window.App.navigate('login');
    showToast('Berhasil keluar', 'info');
  } catch (err) {
    console.error('[Auth] Sign out error:', err);
  }
}

// =====================================================
// INIT AUTH - check session on load
// =====================================================
export async function initAuth() {
  // Check if guest mode
  if (storage.get('guestMode')) {
    currentProfile = { role: 'viewer', full_name: 'Tamu' };
    return false;
  }

  try {
    const user = await AuthAPI.getUser();
    if (user) {
      currentUser = user;
      currentProfile = await AuthAPI.getProfile(user.id);
      return true;
    }
  } catch {}
  return false;
}

// =====================================================
// PERMISSION CHECK
// =====================================================
export function canEdit() {
  if (!currentProfile) return false;
  return ['admin', 'editor'].includes(currentProfile.role);
}

export function isAdmin() {
  return currentProfile?.role === 'admin';
}

export function isGuest() {
  return !currentUser && currentProfile?.role === 'viewer';
}

// =====================================================
// USER PROFILE COMPONENT
// =====================================================
export function renderUserBadge() {
  const name = currentProfile?.full_name || currentUser?.email || 'Tamu';
  const role = currentProfile?.role || 'viewer';
  const roleLabel = { admin: '👑 Admin', editor: '✏️ Editor', viewer: '👀 Viewer' }[role] || role;
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return `
    <div class="user-badge" onclick="window.App.navigate('settings')" style="
      display:flex;align-items:center;gap:8px;cursor:pointer;
      background:var(--color-bg-elevated);border:1px solid var(--color-border);
      border-radius:var(--radius-full);padding:4px 10px 4px 4px;
    ">
      <div style="
        width:28px;height:28px;border-radius:50%;
        background:linear-gradient(135deg,var(--color-primary),var(--color-secondary));
        display:grid;place-items:center;font-size:0.75rem;font-weight:700;color:white;
        flex-shrink:0;
      ">${initials}</div>
      <div style="display:flex;flex-direction:column;">
        <span style="font-size:0.75rem;font-weight:600;line-height:1;">${name.split(' ')[0]}</span>
        <span style="font-size:0.6rem;color:var(--color-text-muted);">${roleLabel}</span>
      </div>
    </div>
  `;
}
