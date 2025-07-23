// API configuration and helper functions

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

interface RequestOptions extends RequestInit {
  token?: string;
}

class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new ApiError(response.status, error.message || 'Request failed', error);
  }
  
  return response.json();
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
    credentials: 'include',
  });
  
  return handleResponse<T>(response);
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<{ token: string; refreshToken: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
    
  register: (data: { email: string; password: string; name: string }) =>
    apiRequest<{ token: string; refreshToken: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  refresh: (refreshToken: string) =>
    apiRequest<{ token: string; refreshToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),
    
  logout: (refreshToken: string) =>
    apiRequest('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),
};

// Proposals API
export const proposalsApi = {
  list: (token: string) =>
    apiRequest<any[]>('/proposals', { token }),
    
  get: (id: string, token: string) =>
    apiRequest<any>(`/proposals/${id}`, { token }),
    
  create: (data: any, token: string) =>
    apiRequest<any>('/proposals', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),
    
  update: (id: string, data: any, token: string) =>
    apiRequest<any>(`/proposals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),
    
  delete: (id: string, token: string) =>
    apiRequest(`/proposals/${id}`, {
      method: 'DELETE',
      token,
    }),
};

// Stakeholders API
export const stakeholdersApi = {
  add: (proposalId: string, data: { userId: string }, token: string) =>
    apiRequest<any>(`/proposals/${proposalId}/stakeholders`, {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),
    
  remove: (proposalId: string, stakeholderId: string, token: string) =>
    apiRequest(`/proposals/${proposalId}/stakeholders/${stakeholderId}`, {
      method: 'DELETE',
      token,
    }),
    
  updateStatus: (proposalId: string, stakeholderId: string, status: string, comments: string, token: string) =>
    apiRequest<any>(`/proposals/${proposalId}/stakeholders/${stakeholderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, comments }),
      token,
    }),
};

// Approvals API
export const approvalsApi = {
  submit: (proposalId: string, data: { status: string; comments?: string }, token: string) =>
    apiRequest<any>(`/proposals/${proposalId}/approvals`, {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),
    
  update: (proposalId: string, approvalId: string, data: { status: string; comments?: string }, token: string) =>
    apiRequest<any>(`/proposals/${proposalId}/approvals/${approvalId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),
};

export { ApiError };