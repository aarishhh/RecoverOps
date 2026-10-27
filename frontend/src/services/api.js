import { INITIAL_MOCK_INCIDENTS } from './mockData';

const STORAGE_KEY = 'recoverops_incidents_data';
const API_URL_KEY = 'recoverops_custom_api_url';

/**
 * Get active API Base URL. Priority:
 * 1. User manual override stored in localStorage
 * 2. Vite environment variable VITE_API_BASE_URL
 * 3. Empty string (falls back to local client persistence)
 */
export function getApiBaseUrl() {
  const customUrl = localStorage.getItem(API_URL_KEY);
  if (customUrl !== null && customUrl.trim() !== '') {
    return customUrl.trim();
  }
  return (import.meta.env.VITE_API_BASE_URL || '').trim();
}

export function setApiBaseUrl(url) {
  if (!url || url.trim() === '') {
    localStorage.removeItem(API_URL_KEY);
  } else {
    localStorage.setItem(API_URL_KEY, url.trim().replace(/\/+$/, ''));
  }
}

/**
 * Local fallback storage engine to ensure UI is 100% interactive and testable
 * before deploying or when developing offline.
 */
function getLocalIncidents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_INCIDENTS));
      return [...INITIAL_MOCK_INCIDENTS];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading local incident storage', err);
    return [...INITIAL_MOCK_INCIDENTS];
  }
}

function saveLocalIncidents(incidents) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents));
  } catch (err) {
    console.error('Error saving local incident storage', err);
  }
}

/**
 * Test connectivity to configured backend endpoint
 */
export async function testApiConnection(baseUrl = null) {
  const url = baseUrl !== null ? baseUrl : getApiBaseUrl();
  if (!url) {
    return {
      connected: false,
      mode: 'mock',
      message: 'No backend API URL configured. Operating in local simulated storage mode.',
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`${url}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return {
        connected: true,
        mode: 'live',
        message: 'Successfully connected to backend API Gateway!',
        details: data,
      };
    } else {
      return {
        connected: false,
        mode: 'error',
        message: `Backend returned HTTP ${res.status}: ${res.statusText}`,
      };
    }
  } catch (err) {
    return {
      connected: false,
      mode: 'error',
      message: err.name === 'AbortError' ? 'Connection timed out (>6s)' : (err.message || 'Network error reaching backend endpoint'),
    };
  }
}

/**
 * API Service with seamless backend integration
 */
export const incidentApi = {
  /**
   * List incidents with search and filter parameters
   */
  async list({ search, status, severity, service } = {}) {
    const baseUrl = getApiBaseUrl();

    if (baseUrl) {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (status) query.append('status', status);
      if (severity) query.append('severity', severity);
      if (service) query.append('service', service);

      const url = `${baseUrl}/incidents${query.toString() ? `?${query.toString()}` : ''}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.message || `API error (${res.status}): Failed to fetch incidents`);
      }

      const json = await res.json();
      return {
        incidents: json.incidents || json.data || [],
        source: 'live-backend',
        metrics: json.metrics || null,
      };
    }

    // Fallback simulated persistence
    let data = getLocalIncidents();
    if (search && search.trim()) {
      const term = search.toLowerCase().trim();
      data = data.filter(inc => 
        (inc.title && inc.title.toLowerCase().includes(term)) ||
        (inc.description && inc.description.toLowerCase().includes(term)) ||
        (inc.id && inc.id.toLowerCase().includes(term))
      );
    }
    if (status) {
      data = data.filter(inc => inc.status === status);
    }
    if (severity) {
      data = data.filter(inc => inc.severity === severity);
    }
    if (service) {
      data = data.filter(inc => inc.affectedService === service);
    }

    // Sort by creation date descending
    data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      incidents: data,
      source: 'local-storage',
      metrics: null,
    };
  },

  /**
   * Get single incident by ID
   */
  async getById(id) {
    const baseUrl = getApiBaseUrl();
    if (baseUrl) {
      const res = await fetch(`${baseUrl}/incidents/${encodeURIComponent(id)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(`Incident ${id} was not found.`);
        }
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.message || `Failed to fetch incident ${id}`);
      }

      const json = await res.json();
      return json.incident || json.data || json;
    }

    const list = getLocalIncidents();
    const item = list.find(inc => inc.id === id);
    if (!item) {
      throw new Error(`Incident ${id} not found in local storage.`);
    }
    return item;
  },

  /**
   * Create new incident
   */
  async create(incidentData) {
    const baseUrl = getApiBaseUrl();

    if (baseUrl) {
      const res = await fetch(`${baseUrl}/incidents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(incidentData),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.message || errorBody.error || `HTTP ${res.status}: Failed to create incident`);
      }

      const json = await res.json();
      return json.incident || json.data || json;
    }

    // Local creation
    const list = getLocalIncidents();
    const nextNumber = 9500 + list.length + 1;
    const now = new Date().toISOString();
    const newIncident = {
      id: `INC-${nextNumber}`,
      title: incidentData.title.trim(),
      description: incidentData.description?.trim() || '',
      affectedService: incidentData.affectedService,
      severity: incidentData.severity,
      status: incidentData.status || 'INVESTIGATING',
      assignee: incidentData.assignee || 'Unassigned',
      createdAt: now,
      updatedAt: now,
      rootCause: incidentData.rootCause || '',
      resolutionNotes: incidentData.resolutionNotes || '',
      timeline: [
        {
          id: `tl-${Date.now()}`,
          timestamp: now,
          author: incidentData.assignee || 'System Admin',
          type: 'SYSTEM',
          message: `Incident created with severity ${incidentData.severity} for service ${incidentData.affectedService}.`,
        }
      ],
    };

    list.unshift(newIncident);
    saveLocalIncidents(list);
    return newIncident;
  },

  /**
   * Update incident (severity, status, assignee, description, rootCause, resolutionNotes)
   */
  async update(id, updates) {
    const baseUrl = getApiBaseUrl();

    if (baseUrl) {
      const res = await fetch(`${baseUrl}/incidents/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.message || `HTTP ${res.status}: Failed to update incident`);
      }

      const json = await res.json();
      return json.incident || json.data || json;
    }

    const list = getLocalIncidents();
    const index = list.findIndex(inc => inc.id === id);
    if (index === -1) {
      throw new Error(`Incident ${id} not found.`);
    }

    const existing = list[index];
    const now = new Date().toISOString();
    const timelineUpdates = [];

    if (updates.status && updates.status !== existing.status) {
      timelineUpdates.push({
        id: `tl-${Date.now()}-status`,
        timestamp: now,
        author: updates.author || 'Engineer',
        type: updates.status === 'RESOLVED' ? 'RESOLVED' : 'STATUS_CHANGE',
        message: `Status updated from ${existing.status} to ${updates.status}.`,
      });
    }

    if (updates.severity && updates.severity !== existing.severity) {
      timelineUpdates.push({
        id: `tl-${Date.now()}-sev`,
        timestamp: now,
        author: updates.author || 'Engineer',
        type: 'SEVERITY_CHANGE',
        message: `Severity modified from ${existing.severity} to ${updates.severity}.`,
      });
    }

    if (updates.assignee && updates.assignee !== existing.assignee) {
      timelineUpdates.push({
        id: `tl-${Date.now()}-ass`,
        timestamp: now,
        author: updates.author || 'Engineer',
        type: 'UPDATE',
        message: `Incident assigned to ${updates.assignee}.`,
      });
    }

    const updated = {
      ...existing,
      ...updates,
      updatedAt: now,
      timeline: [...(existing.timeline || []), ...timelineUpdates],
    };

    list[index] = updated;
    saveLocalIncidents(list);
    return updated;
  },

  /**
   * Add a timeline activity entry
   */
  async addTimelineEvent(id, { message, author = 'On-call SRE', type = 'UPDATE' }) {
    const baseUrl = getApiBaseUrl();

    if (baseUrl) {
      const res = await fetch(`${baseUrl}/incidents/${encodeURIComponent(id)}/timeline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ message, author, type }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.message || `Failed to add timeline event`);
      }

      const json = await res.json();
      return json.incident || json.data || json;
    }

    const list = getLocalIncidents();
    const index = list.findIndex(inc => inc.id === id);
    if (index === -1) throw new Error(`Incident ${id} not found.`);

    const now = new Date().toISOString();
    const newEvent = {
      id: `tl-${Date.now()}`,
      timestamp: now,
      author: author || 'Engineer',
      type: type || 'UPDATE',
      message: message.trim(),
    };

    list[index].timeline = [...(list[index].timeline || []), newEvent];
    list[index].updatedAt = now;
    saveLocalIncidents(list);
    return list[index];
  },

  /**
   * Delete an incident
   */
  async delete(id) {
    const baseUrl = getApiBaseUrl();
    if (baseUrl) {
      const res = await fetch(`${baseUrl}/incidents/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.message || `Failed to delete incident`);
      }
      return true;
    }

    const list = getLocalIncidents();
    const filtered = list.filter(inc => inc.id !== id);
    saveLocalIncidents(filtered);
    return true;
  },

  /**
   * Reset mock data to factory defaults
   */
  resetLocalData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_INCIDENTS));
    return [...INITIAL_MOCK_INCIDENTS];
  }
};
