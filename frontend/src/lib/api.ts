import type { ApiResponse, LoginResponse, RegisterResponse, ExportData } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
const TIMEOUT = 3000;

// Helper function for fetch with timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export const api = {
  // Health check - detect if backend is available
  async health(): Promise<boolean> {
    try {
      const response = await fetchWithTimeout(`${API_BASE}/api/health`);
      if (response.ok) {
        const data = await response.json();
        return data.success === true;
      }
      return false;
    } catch {
      return false;
    }
  },
  
  // User registration
  async register(
    username: string,
    password: string
  ): Promise<ApiResponse<RegisterResponse>> {
    try {
      const response = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          data: {
            token: data.data.token,
            username: data.data.username,
          },
          message: data.message,
        };
      }
      
      return {
        success: false,
        error: data.error || '注册失败',
      };
    } catch {
      return {
        success: false,
        error: '网络错误',
      };
    }
  },
  
  // User login
  async login(
    username: string,
    password: string
  ): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          data: {
            token: data.data.token,
            username: data.data.username,
            has_data: data.data.has_data || false,
          },
          message: data.message,
        };
      }
      
      return {
        success: false,
        error: data.error || '登录失败',
      };
    } catch {
      return {
        success: false,
        error: '网络错误',
      };
    }
  },
  
  // Upload data to backend
  async uploadData(
    token: string,
    data: ExportData
  ): Promise<ApiResponse<{ size: number }>> {
    try {
      const response = await fetch(`${API_BASE}/api/sync/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          data: result.data,
          message: '数据上传成功',
        };
      }
      
      // Handle token expiration
      if (response.status === 401) {
        return {
          success: false,
          error: 'Token已过期，请重新登录',
        };
      }
      
      return {
        success: false,
        error: result.error || '上传失败',
      };
    } catch {
      return {
        success: false,
        error: '网络错误',
      };
    }
  },
  
  // Download data from backend
  async downloadData(token: string): Promise<ApiResponse<ExportData | null>> {
    try {
      const response = await fetch(`${API_BASE}/api/sync/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          data: result.data || null,
          message: result.data ? '数据下载成功' : '后端暂无数据',
        };
      }
      
      // Handle token expiration
      if (response.status === 401) {
        return {
          success: false,
          error: 'Token已过期，请重新登录',
        };
      }
      
      return {
        success: false,
        error: result.error || '下载失败',
      };
    } catch {
      return {
        success: false,
        error: '网络错误',
      };
    }
  },
};
