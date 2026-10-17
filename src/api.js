/**
 * Reloop Authoritative HTTP API Client
 * Configured for local FastAPI backend at http://127.0.0.1:8000/api
 * Uses HttpOnly session cookies and CSRF headers.
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Attach CSRF token on state-changing requests if cookie present
  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const csrfToken = getCookie('reloop_csrf');
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // sends and receives HttpOnly cookies
  });

  const contentType = response.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    if (data && typeof data === 'object') {
      if (typeof data.detail === 'string') {
        errorMsg = data.detail;
      } else if (Array.isArray(data.detail)) {
        errorMsg = data.detail.map(d => `${d.loc ? d.loc.join('.') + ': ' : ''}${d.msg}`).join('; ');
      }
    }
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // Health
  checkHealth: () => request('/health'),

  // Auth
  auth: {
    register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
    login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    getMe: () => request('/auth/me'),
    updateProfile: (payload) => request('/auth/me', { method: 'PUT', body: JSON.stringify(payload) }),
    getCsrf: () => request('/auth/csrf'),
  },

  // Listings
  listings: {
    getAll: (params = {}) => {
      const q = new URLSearchParams();
      if (params.q) q.append('q', params.q);
      if (params.category) q.append('category', params.category);
      if (params.condition) q.append('condition', params.condition);
      if (params.status_filter) q.append('status_filter', params.status_filter);
      if (params.sort_by) q.append('sort_by', params.sort_by);
      const queryStr = q.toString() ? `?${q.toString()}` : '';
      return request(`/listings${queryStr}`);
    },
    getById: (id) => request(`/listings/${id}`),
    create: (payload) => request('/listings', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload) => request(`/listings/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    deactivate: (id) => request(`/listings/${id}/deactivate`, { method: 'POST' }),
  },

  // Bids & Winner Selection
  bids: {
    submitBid: (listingId, amountRupees) =>
      request(`/listings/${listingId}/bids`, {
        method: 'POST',
        body: JSON.stringify({ amount_rupees: amountRupees }),
      }),
    getBids: (listingId) => request(`/listings/${listingId}/bids`),
    selectBidder: (listingId, bidId) =>
      request(`/listings/${listingId}/select-bidder`, {
        method: 'POST',
        body: JSON.stringify({ bid_id: bidId }),
      }),
    respondToSelection: (selectionId, action) =>
      request(`/selections/${selectionId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      }),
  },

  // Handover, Payments & Fulfilment Transactions
  transactions: {
    getById: (id) => request(`/transactions/${id}`),
    simulatePayment: (id, payload) =>
      request(`/transactions/${id}/simulate-payment`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    advanceDelivery: (id, payload = {}) =>
      request(`/transactions/${id}/advance-delivery`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    advancePickup: (id, payload = {}) =>
      request(`/transactions/${id}/advance-pickup`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    confirmReceipt: (id, payload = {}) =>
      request(`/transactions/${id}/confirm-receipt`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    arrangeHandover: (id, payload) =>
      request(`/transactions/${id}/arrange-handover`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    confirmHandover: (id) =>
      request(`/transactions/${id}/confirm-handover`, {
        method: 'POST',
      }),
  },

  // User Dashboards
  dashboard: {
    getMyListings: () => request('/dashboard/my-listings'),
    getMyBids: () => request('/dashboard/my-bids'),
    getCustomerOverview: () => request('/dashboard/customer-overview'),
    getSellerOverview: () => request('/dashboard/seller-overview'),
    getMyTransactions: () => request('/dashboard/my-transactions'),
  },
};
