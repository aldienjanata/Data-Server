// =====================================================
// UTILS.JS - Helper Functions
// =====================================================

// Format date to Indonesian locale
export function formatDate(dateStr, options = {}) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const defaultOpts = {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    ...options
  };
  return date.toLocaleDateString('id-ID', defaultOpts);
}

export function timeAgo(dateStr) {
  if (!dateStr) return '-';
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`;
  return formatDate(dateStr, { day: 'numeric', month: 'short', year: 'numeric' });
}

// Status helpers
export function getStatusLabel(status) {
  const map = {
    filled:     'Terisi',
    empty:      'Kosong',
    unverified: 'Belum Verifikasi',
    reserved:   'Reservasi'
  };
  return map[status] || status;
}

export function getStatusIcon(status) {
  const map = {
    filled:     '🟢',
    empty:      '⚪',
    unverified: '🟡',
    reserved:   '🟣'
  };
  return map[status] || '❓';
}

// Device type helpers
export function getDeviceIcon(typeName) {
  const svgs = {
    'OTB': '<img src="/logos/OTB.webp" style="width:100%;height:100%;object-fit:contain;">',
    'CISCO': '<img src="/logos/CISCO.webp" style="width:100%;height:100%;object-fit:contain;">',
    'HUAWEI': '<img src="/logos/Huawei.webp" style="width:100%;height:100%;object-fit:contain;">',
    'GTGO': '<img src="/logos/GTGO OLT.jpeg" style="width:100%;height:100%;object-fit:contain;border-radius:6px;">',
    'OTHER': '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>'
  };
  return svgs[typeName] || svgs['OTHER'];
}

export function getDeviceColor(typeName) {
  const map = {
    'OTB':    'var(--color-otb)',
    'CISCO':  'var(--color-cisco)',
    'HUAWEI': 'var(--color-huawei)',
    'GTGO':   'var(--color-gtgo)',
    'OTHER':  'var(--color-other)'
  };
  return map[typeName] || 'var(--color-other)';
}

export function getDeviceBgColor(typeName) {
  const map = {
    'OTB':    'rgba(59,130,246,0.1)',
    'CISCO':  'rgba(245,158,11,0.1)',
    'HUAWEI': 'rgba(16,185,129,0.1)',
    'GTGO':   'rgba(139,92,246,0.1)',
    'OTHER':  'rgba(100,116,139,0.1)'
  };
  return map[typeName] || 'rgba(100,116,139,0.1)';
}

// Site color helper
export function getSiteColor(siteName) {
  const colors = {
    'Banyumas': '#3b82f6',
    'Cilacap':  '#10b981',
    'Rowokele': '#8b5cf6',
    'Kebumen':  '#f59e0b'
  };
  return colors[siteName] || '#64748b';
}

export function getSiteEmoji(siteName) {
  const emojis = {
    'Banyumas': '🏔️',
    'Cilacap':  '🌊',
    'Rowokele': '⚡',
    'Kebumen':  '🌿'
  };
  return emojis[siteName] || '📍';
}

// Percentage calculation
export function calcPercent(filled, total) {
  if (!total) return 0;
  return Math.round((filled / total) * 100);
}

// Highlight search term in text
export function highlightText(text, query) {
  if (!query || !text) return escapeHtml(text || '');
  const escaped = escapeHtml(text);
  const escapedQuery = escapeHtml(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return escaped.replace(new RegExp(escapedQuery, 'gi'), (m) => `<mark>${m}</mark>`);
}

// Escape HTML
export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Debounce
export function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Deep clone
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Generate unique ID
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// Group array by key
export function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = typeof key === 'function' ? key(item) : item[key];
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

// Parse location code e.g. "1/3/2" -> { otb: 1, pos1: 3, pos2: 2 }
export function parseLocationCode(code) {
  if (!code) return null;
  const match = code.match(/(\d+)\/(\d+)\/(\d+)/);
  if (!match) return null;
  return { otb: parseInt(match[1]), pos1: parseInt(match[2]), pos2: parseInt(match[3]) };
}

// Format port number with leading zero
export function formatPort(num) {
  return String(num).padStart(2, '0');
}

// Copy to clipboard
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return true;
  }
}

// Vibrate (haptic feedback)
export function vibrate(pattern = [10]) {
  if ('vibrate' in navigator) navigator.vibrate(pattern);
}

// Check online status
export function isOnline() {
  return navigator.onLine;
}

// Local storage helpers
export const storage = {
  get(key, fallback = null) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch {}
  },
  remove(key) { localStorage.removeItem(key); },
  clear() { localStorage.clear(); }
};

// Export data as CSV
export function exportCSV(data, filename = 'export.csv') {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => `"${(row[h] ?? '').toString().replace(/"/g, '""')}"`).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Export data as JSON
export function exportJSON(data, filename = 'export.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
