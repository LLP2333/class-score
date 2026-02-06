'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore, exportAllData, importAllData } from '@/store';
import { toast } from 'sonner';

export function useBackend() {
  const { isAvailable, token, user, hasRemoteData, setAvailable, setAuth, clearAuth, setHasRemoteData, isLoggedIn } = useAuthStore();
  const [isChecking, setIsChecking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check backend availability
  const checkBackend = useCallback(async () => {
    setIsChecking(true);
    try {
      const available = await api.health();
      setAvailable(available);
      return available;
    } finally {
      setIsChecking(false);
    }
  }, [setAvailable]);

  // Initialize backend on mount
  useEffect(() => {
    checkBackend();
  }, [checkBackend]);

  // Register
  const register = useCallback(async (username: string, password: string) => {
    if (!isAvailable) {
      toast.error('后端不可用');
      return false;
    }

    setIsLoading(true);
    try {
      const result = await api.register(username, password);
      if (result.success && result.data) {
        setAuth(result.data.token, { username: result.data.username }, false);
        toast.success('注册成功');
        return true;
      } else {
        toast.error(result.error || '注册失败');
        return false;
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAvailable, setAuth]);

  // Login
  const login = useCallback(async (username: string, password: string) => {
    if (!isAvailable) {
      toast.error('后端不可用');
      return false;
    }

    setIsLoading(true);
    try {
      const result = await api.login(username, password);
      if (result.success && result.data) {
        setAuth(
          result.data.token,
          { username: result.data.username },
          result.data.has_data
        );
        toast.success('登录成功');
        return true;
      } else {
        toast.error(result.error || '登录失败');
        return false;
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAvailable, setAuth]);

  // Logout
  const logout = useCallback(() => {
    clearAuth();
    toast.success('已退出登录');
  }, [clearAuth]);

  // Upload data to backend
  const uploadData = useCallback(async () => {
    if (!isLoggedIn() || !token) {
      toast.error('请先登录');
      return false;
    }

    setIsLoading(true);
    try {
      const data = exportAllData();
      const result = await api.uploadData(token, data);
      
      if (result.success) {
        setHasRemoteData(true);
        toast.success('数据上传成功');
        return true;
      } else {
        if (result.error?.includes('Token')) {
          clearAuth();
        }
        toast.error(result.error || '上传失败');
        return false;
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, token, setHasRemoteData, clearAuth]);

  // Download data from backend
  const downloadData = useCallback(async () => {
    if (!isLoggedIn() || !token) {
      toast.error('请先登录');
      return false;
    }

    setIsLoading(true);
    try {
      const result = await api.downloadData(token);
      
      if (result.success) {
        if (result.data) {
          const success = importAllData(result.data);
          if (success) {
            toast.success('数据下载成功');
            return true;
          } else {
            toast.error('数据导入失败');
            return false;
          }
        } else {
          toast.info('后端暂无数据');
          return true;
        }
      } else {
        if (result.error?.includes('Token')) {
          clearAuth();
        }
        toast.error(result.error || '下载失败');
        return false;
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, token, clearAuth]);

  return {
    // State
    isAvailable,
    isLoggedIn: isLoggedIn(),
    user,
    hasRemoteData,
    isChecking,
    isLoading,
    
    // Actions
    checkBackend,
    register,
    login,
    logout,
    uploadData,
    downloadData,
  };
}
