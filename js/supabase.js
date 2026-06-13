// =====================================================
// SUPABASE CLIENT & QUERIES
// js/supabase.js
// =====================================================

// Gunakan Environment Variables dari Vercel / Vite (.env)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Load Supabase from CDN (in index.html)
let supabase = null;

function initSupabase() {
  if (typeof window.supabase !== 'undefined') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('[Supabase] Client initialized');
  } else {
    console.error('[Supabase] Library not loaded!');
  }
  return supabase;
}

// =====================================================
// AUTH QUERIES
// =====================================================
const AuthAPI = {
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } }
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) return null;
    return data;
  },

  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// =====================================================
// SITES QUERIES
// =====================================================
const SitesAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    return data;
  },

  async getById(idOrSlug) {
    const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(idOrSlug);
    let query = supabase.from('sites').select('*');
    if (isUUID) {
      query = query.eq('id', idOrSlug);
    } else {
      query = query.or(`code.ilike.${idOrSlug},name.ilike.${idOrSlug}`);
    }
    const { data, error } = await query.single();
    if (error) throw error;
    return data;
  },

  async create(siteData) {
    const { data, error } = await supabase
      .from('sites')
      .insert([siteData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('sites')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('sites')
      .update({ is_active: false })
      .eq('id', id);
    if (error) throw error;
  },

  async getStats(siteId) {
    const { data, error } = await supabase
      .from('devices')
      .select(`
        id, name, model, total_ports,
        device_types(name),
        port_connections(status)
      `)
      .eq('site_id', siteId)
      .eq('is_active', true);
    if (error) throw error;

    let total = 0, filled = 0, empty = 0, unverified = 0;
    (data || []).forEach(device => {
      const typeName = device.device_types?.name || 'OTHER';
      const ports = device.port_connections || [];
      const f = ports.filter(p => p.status === 'filled').length;
      
      let devTotal = device.total_ports || ports.length;
      if (typeName === 'GTGO' || typeName === 'OLT') devTotal = Math.max(devTotal, 128);
      else if (typeName === 'CISCO') devTotal = Math.max(devTotal, 48);
      else if (typeName === 'HUAWEI') devTotal = Math.max(devTotal, 56);
      else if (typeName === 'OTB') {
        const is144 = device.model?.includes('144') || device.name?.includes('144') || ports.length >= 140;
        devTotal = Math.max(devTotal, is144 ? 144 : 96);
      }
      
      total += devTotal;
      filled += f;
      // Estimate other stats based on difference
      const unv = ports.filter(p => p.status === 'unverified').length;
      const res = ports.filter(p => p.status === 'reserved').length;
      unverified += unv;
      empty += Math.max(0, devTotal - f - unv - res);
    });

    return { total, filled, empty, unverified, devices: data?.length || 0 };
  }
};

// =====================================================
// DEVICE TYPES QUERIES
// =====================================================
const DeviceTypesAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('device_types')
      .select('*')
      .order('name');
    if (error) throw error;
    return data;
  },

  async create(typeData) {
    const { data, error } = await supabase
      .from('device_types')
      .insert([typeData])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};


// =====================================================
// DEVICES QUERIES
// =====================================================
const DevicesAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('devices')
      .select('id, name, site_id, device_types(name)')
      .eq('is_active', true)
      .order('sort_order');
    if (error) throw error;
    return data;
  },

  async getBySite(siteId) {
    const { data, error } = await supabase
      .from('devices')
      .select(`
        *,
        device_types(name, icon, color),
        port_connections(status)
      `)
      .eq('site_id', siteId)
      .eq('is_active', true)
      .order('sort_order');
    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('devices')
      .select(`
        *,
        device_types(name, icon, color),
        sites(name, location)
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async getBySiteAndName(siteCodeOrId, deviceNameOrSlug) {
    const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(siteCodeOrId);
    let siteQuery = supabase.from('sites').select('id');
    if (isUUID) siteQuery = siteQuery.eq('id', siteCodeOrId);
    else siteQuery = siteQuery.or(`code.ilike.${siteCodeOrId},name.ilike.${siteCodeOrId}`);
    
    const { data: siteData, error: siteErr } = await siteQuery.single();
    if (siteErr) throw siteErr;

    // Convert slug back to name (hyphens -> spaces), try both forms
    const nameFromSlug = deviceNameOrSlug.replace(/-/g, ' ');

    // Try exact match first, then partial
    for (const searchName of [deviceNameOrSlug, nameFromSlug]) {
      const { data, error } = await supabase
        .from('devices')
        .select(`
          *,
          device_types(name, icon, color),
          sites(name, location)
        `)
        .eq('site_id', siteData.id)
        .ilike('name', searchName)
        .eq('is_active', true)
        .maybeSingle();
      if (!error && data) return data;
    }
    
    // Try wildcard: match first word of device name
    const firstWord = nameFromSlug.split(' ')[0];
    const { data: fuzzy, error: fuzzyErr } = await supabase
      .from('devices')
      .select(`
        *,
        device_types(name, icon, color),
        sites(name, location)
      `)
      .eq('site_id', siteData.id)
      .ilike('name', `${firstWord}%`)
      .eq('is_active', true)
      .limit(1);
    if (!fuzzyErr && fuzzy?.length > 0) return fuzzy[0];

    throw new Error('Perangkat tidak ditemukan');
  },

  async create(deviceData) {
    const { data, error } = await supabase
      .from('devices')
      .insert([deviceData])
      .select(`*, device_types(name, icon, color)`)
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('devices')
      .update(updates)
      .eq('id', id)
      .select(`*, device_types(name, icon, color)`)
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('devices')
      .update({ is_active: false })
      .eq('id', id);
    if (error) throw error;
  }
};

// =====================================================
// OTB TUBES QUERIES
// =====================================================
const TubesAPI = {
  async getByDevice(deviceId) {
    const { data, error } = await supabase
      .from('otb_tubes')
      .select('*')
      .eq('device_id', deviceId)
      .order('tube_number');
    if (error) throw error;
    return data;
  },

  async create(tubeData) {
    const { data, error } = await supabase
      .from('otb_tubes')
      .insert([tubeData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('otb_tubes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

// =====================================================
// PORT CONNECTIONS QUERIES
// =====================================================
const PortsAPI = {
  async getByDevice(deviceId) {
    const { data, error } = await supabase
      .from('port_connections')
      .select(`
        *,
        otb_tubes(tube_number)
      `)
      .eq('device_id', deviceId)
      .order('port_number');
    if (error) throw error;
    return data;
  },

  async getByTube(tubeId) {
    const { data, error } = await supabase
      .from('port_connections')
      .select('*')
      .eq('tube_id', tubeId)
      .order('port_number');
    if (error) throw error;
    return data;
  },

  async update(id, updates, updatedBy = 'anonymous') {
    const { data, error } = await supabase
      .from('port_connections')
      .update({ ...updates, updated_by: updatedBy })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async create(portData) {
    const { data, error } = await supabase
      .from('port_connections')
      .insert([portData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async bulkCreate(portsData) {
    const { data, error } = await supabase
      .from('port_connections')
      .insert(portsData)
      .select();
    if (error) throw error;
    return data;
  },

  async search(query) {
    const { data, error } = await supabase
      .from('port_connections')
      .select(`
        *,
        devices(
          name, site_id,
          device_types(name, icon, color),
          sites(name, code)
        )
      `)
      .ilike('connection_label', `%${query}%`)
      .limit(50);
    if (error) throw error;
    return data;
  },

  async getStats(deviceId) {
    const { data, error } = await supabase
      .from('port_connections')
      .select('status')
      .eq('device_id', deviceId);
    if (error) throw error;

    const stats = { filled: 0, empty: 0, unverified: 0, reserved: 0 };
    (data || []).forEach(p => { stats[p.status] = (stats[p.status] || 0) + 1; });
    stats.total = data?.length || 0;
    return stats;
  }
};

// =====================================================
// AUDIT LOG QUERIES
// =====================================================
const AuditAPI = {
  async getRecent(limit = 50) {
    const { data, error } = await supabase
      .from('port_audit_log')
      .select('*')
      .order('changed_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  },

  async getByDevice(deviceId, limit = 30) {
    const { data, error } = await supabase
      .from('port_audit_log')
      .select('*')
      .eq('device_id', deviceId)
      .order('changed_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  }
};

// =====================================================
// REALTIME SUBSCRIPTION
// =====================================================
const RealtimeAPI = {
  subscribeToDevice(deviceId, callback) {
    return supabase
      .channel(`device-${deviceId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'port_connections',
        filter: `device_id=eq.${deviceId}`
      }, callback)
      .subscribe();
  },

  subscribeToSite(siteId, callback) {
    return supabase
      .channel(`site-${siteId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'devices',
        filter: `site_id=eq.${siteId}`
      }, callback)
      .subscribe();
  },

  unsubscribe(channel) {
    supabase.removeChannel(channel);
  }
};

// =====================================================
// OFFLINE QUEUE (IndexedDB)
// =====================================================
const OfflineQueue = {
  DB_NAME: 'server-data-offline',
  DB_VERSION: 1,
  db: null,

  async init() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('queue')) {
          db.createObjectStore('queue', { keyPath: 'id', autoIncrement: true });
        }
      };
      req.onsuccess = (e) => { this.db = e.target.result; resolve(); };
      req.onerror = reject;
    });
  },

  async add(operation) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['queue'], 'readwrite');
      const store = tx.objectStore('queue');
      const req = store.add({ ...operation, timestamp: Date.now() });
      req.onsuccess = () => resolve(req.result);
      req.onerror = reject;
    });
  },

  async getAll() {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['queue'], 'readonly');
      const store = tx.objectStore('queue');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = reject;
    });
  },

  async remove(id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['queue'], 'readwrite');
      const store = tx.objectStore('queue');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = reject;
    });
  },

  async sync() {
    const queue = await this.getAll();
    for (const op of queue) {
      try {
        if (op.type === 'updatePort') {
          await PortsAPI.update(op.portId, op.updates, op.updatedBy);
        }
        await this.remove(op.id);
      } catch (e) {
        console.error('[OfflineQueue] Failed to sync:', e);
      }
    }
    if (queue.length > 0) {
      console.log(`[OfflineQueue] Synced ${queue.length} operations`);
      return queue.length;
    }
    return 0;
  }
};

// =====================================================
// SITE CORE NOTES QUERIES
// =====================================================
const SiteCoreNotesAPI = {
  async getBySite(siteId) {
    const { data, error } = await supabase
      .from('site_core_notes')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async create(noteData) {
    const { data, error } = await supabase
      .from('site_core_notes')
      .insert([noteData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('site_core_notes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id) {
    const { error } = await supabase
      .from('site_core_notes')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

export {
  initSupabase,
  AuthAPI,
  SitesAPI,
  DeviceTypesAPI,
  DevicesAPI,
  TubesAPI,
  PortsAPI,
  AuditAPI,
  RealtimeAPI,
  OfflineQueue,
  SiteCoreNotesAPI
};
