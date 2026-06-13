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
      <style>
        @keyframes floatCard {
          0%, 100% { transform: translateY(0); box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
          50% { transform: translateY(-10px); box-shadow: 0 20px 30px rgba(0,0,0,0.1); }
        }
      </style>
      <canvas id="login-canvas" style="position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;"></canvas>
      <div class="login-card fade-in" style="position:relative;z-index:1;animation: floatCard 6s ease-in-out infinite;">
        <div class="login-logo">
          <img src="/logos/logo-apk.jpg" alt="Company Logo" class="login-company-logo" style="width:80px;height:auto;border-radius:20px;"
               onerror="this.style.display='none';document.getElementById('login-logo-fallback').style.display='flex';">
          <div id="login-logo-fallback" style="display:none;width:80px;height:80px;border-radius:20px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);align-items:center;justify-content:center;margin:0 auto var(--space-4);">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><circle cx="7" cy="6" r="1" fill="white" stroke="none"/><circle cx="7" cy="12" r="1" fill="white" stroke="none"/></svg>
          </div>
          <div class="login-logo__title">Server Data Manager</div>
          <div class="login-logo__subtitle">Manajemen Port &amp; Perangkat Jaringan</div>
        </div>

        <div id="auth-form">
          <div class="form-group">
            <label class="form-label" for="auth-username">Username</label>
            <input class="form-input" type="text" id="auth-username" 
                   placeholder="admin" autocomplete="username" required>
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
                  onclick="handleAuthSubmit()" style="margin-top:16px">
            Masuk
          </button>
        </div>

        <div class="divider" style="margin:20px 0"></div>

        <div style="text-align:center">
          <button class="btn btn-ghost" onclick="continueAsGuest()" style="font-size:0.85rem;color:var(--color-text-muted)">
            👀 Lanjutkan sebagai Tamu (hanya baca)
          </button>
        </div>
      </div>
    </div>
  `;
}

// Initialize canvas animation after login page renders
export function initLoginAnimation() {
  const canvas = document.getElementById('login-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Create floating nodes (server icons)
  const nodes = Array.from({ length: 28 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.8,
    vy: (Math.random() - 0.5) * 0.8,
    size: 6 + Math.random() * 12,
    opacity: 0.3 + Math.random() * 0.4,
    type: Math.floor(Math.random() * 3),
    pulse: Math.random() * Math.PI * 2,
  }));

  function drawNode(node) {
    ctx.save();
    ctx.globalAlpha = node.opacity * (0.8 + 0.4 * Math.sin(node.pulse));
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const color = node.type === 0 ? '59, 130, 246' : '139, 92, 246';
    ctx.strokeStyle = `rgba(${color}, 1)`;
    ctx.lineWidth = 1;
    ctx.translate(node.x, node.y);

    if (node.type === 0) {
      ctx.strokeRect(-node.size / 2, -node.size / 2, node.size, node.size);
      ctx.beginPath(); ctx.moveTo(-node.size / 2, 0); ctx.lineTo(node.size / 2, 0); ctx.stroke();
    } else if (node.type === 1) {
      ctx.beginPath(); ctx.arc(0, 0, node.size / 2, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, node.size / 6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color}, 0.5)`; ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -node.size / 2); ctx.lineTo(node.size / 2, 0);
      ctx.lineTo(0, node.size / 2); ctx.lineTo(-node.size / 2, 0);
      ctx.closePath(); ctx.stroke();
    }
    ctx.restore();
  }

  function drawConnections() {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180) {
          ctx.save();
          ctx.globalAlpha = (1 - dist / 180) * 0.35;
          ctx.strokeStyle = 'rgba(59, 130, 246, 1)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  let animId;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawConnections();
    nodes.forEach(n => {
      n.x += n.vx;
      n.y += n.vy;
      n.pulse += 0.02;
      if (n.x < -20) n.x = canvas.width + 20;
      if (n.x > canvas.width + 20) n.x = -20;
      if (n.y < -20) n.y = canvas.height + 20;
      if (n.y > canvas.height + 20) n.y = -20;
      drawNode(n);
    });
    animId = requestAnimationFrame(animate);
  }

  animate();
  return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
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
  const usernameInput = document.getElementById('auth-username').value.trim();
  const password = document.getElementById('auth-password').value;
  const btn = document.getElementById('auth-submit-btn');

  if (!usernameInput || !password) {
    showToast('Username dan password wajib diisi', 'warning');
    return;
  }

  // Format username to email for Supabase Auth
  const email = usernameInput.includes('@') ? usernameInput : `${usernameInput}@server.local`;

  btn.classList.add('loading');
  btn.disabled = true;

  try {
    const data = await AuthAPI.signIn(email, password);
    currentUser = data.user;
    currentProfile = await AuthAPI.getProfile(currentUser.id);
    vibrate([10, 5, 10]);
    showToast(`👋 Selamat datang, ${currentProfile?.full_name || usernameInput}!`, 'success');
    storage.set('lastUser', { email, name: currentProfile?.full_name });
    window.App.navigate('dashboard');
  } catch (err) {
    console.error('[Auth]', err);
    // Ignore internal schema errors if login actually fails due to credentials
    const msg = err.message?.includes('Invalid login') 
      ? 'Username atau password salah' 
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
  return !isGuest();
}

export function isAdmin() {
  return !isGuest();
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
