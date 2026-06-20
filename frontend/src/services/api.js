import axios from 'axios';

// IMPORTANT: This must be the full URL of your Render backend
const API_BASE_URL = 'https://crimegptheck.netlify.app/api'; // Replace with your actual Render backend URL

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

export default api;

export default api;
// Get auth token from localStorage
export const getToken = () => localStorage.getItem('crimegpt_token');

// Helper: Prepare request headers with auth
const getHeaders = (contentType = 'application/json') => {
  const headers = {};
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Response helper that checks for 401 Unauthorized
const handleResponse = async (res) => {
  if (res.status === 401) {
    localStorage.removeItem('crimegpt_token');
    localStorage.removeItem('crimegpt_user');
    // Force redirect to login page by changing location
    window.location.href = '/';
    throw new Error('Session expired. Please log in again.');
  }

  let data;
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch (err) {
      console.error('Failed to parse JSON response:', err);
    }
  }

  if (!res.ok) {
    throw new Error((data && data.message) || `API request failed (Status: ${res.status})`);
  }

  if (data === undefined) {
    throw new Error('Empty or invalid response from server.');
  }

  return data;
};

// --- AUTH API ---
export const authAPI = {
  login: async (username, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ username, password })
    });
    return handleResponse(res);
  },

  register: async (userData) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    });
    return handleResponse(res);
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: getHeaders()
    });
    return handleResponse(res);
  }
};

// --- CASES API ---
export const casesAPI = {
  getCases: async () => {
    const res = await fetch(`${API_BASE_URL}/cases`, {
      method: 'GET',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getCaseById: async (id) => {
    const res = await fetch(`${API_BASE_URL}/cases/${id}`, {
      method: 'GET',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  createCase: async (caseData) => {
    const res = await fetch(`${API_BASE_URL}/cases`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(caseData)
    });
    return handleResponse(res);
  },

  updateCase: async (id, caseData) => {
    const res = await fetch(`${API_BASE_URL}/cases/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(caseData)
    });
    return handleResponse(res);
  },

  deleteCase: async (id) => {
    const res = await fetch(`${API_BASE_URL}/cases/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  verifyEvidence: async (id) => {
    const res = await fetch(`${API_BASE_URL}/cases/${id}/verify-evidence`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  signDocument: async (id, docType) => {
    const res = await fetch(`${API_BASE_URL}/cases/${id}/sign`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ docType })
    });
    return handleResponse(res);
  },

  getAuditLogs: async () => {
    const res = await fetch(`${API_BASE_URL}/cases/audit/logs`, {
      method: 'GET',
      headers: getHeaders()
    });
    return handleResponse(res);
  }
};

// --- AI & AGENTS API ---
export const aiAPI = {
  // Promise-based narrative analysis
  runRAGAnalysis: async (narrative, caseId) => {
    const res = await fetch(`${API_BASE_URL}/ai/analyze`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ narrative, caseId })
    });
    return handleResponse(res);
  },

  // SSE Narrative Analysis streaming reader
  analyzeNarrativeStream: async (narrative, caseId, onChunk, onContext, onResult, onError) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/analyze`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ narrative, caseId })
      });

      if (response.status === 401) {
        localStorage.removeItem('crimegpt_token');
        localStorage.removeItem('crimegpt_user');
        window.location.href = '/';
        throw new Error('Session expired');
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Narrative analysis request failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const rawEvent of events) {
          if (!rawEvent.trim()) continue;

          const lines = rawEvent.split('\n');
          let eventType = 'message';
          let dataStr = '';

          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventType = line.replace('event:', '').trim();
            } else if (line.startsWith('data:')) {
              dataStr = line.replace('data:', '').trim();
            }
          }

          if (!dataStr) continue;

          try {
            const data = JSON.parse(dataStr);
            if (eventType === 'context') {
              onContext(data);
            } else if (eventType === 'result') {
              onResult(data);
            } else if (eventType === 'error') {
              onError(data);
            } else if (eventType === 'message' && data.chunk) {
              onChunk(data.chunk);
            }
          } catch (e) {
            console.error('Error parsing SSE packet:', e, dataStr);
          }
        }
      }
    } catch (err) {
      console.error('SSE connection error:', err);
      onError(err);
    }
  },

  runComplianceAudit: async (caseId) => {
    const res = await fetch(`${API_BASE_URL}/ai/${caseId}/audit`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  auditCase: async (caseId) => {
    const res = await fetch(`${API_BASE_URL}/ai/${caseId}/audit`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  checkContradictions: async (caseId) => {
    const res = await fetch(`${API_BASE_URL}/ai/${caseId}/contradictions`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  parseOcrText: async (ocrText) => {
    const res = await fetch(`${API_BASE_URL}/ai/ocr-parse`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ ocrText })
    });
    return handleResponse(res);
  }
};
