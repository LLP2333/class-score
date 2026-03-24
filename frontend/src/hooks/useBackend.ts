'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore, useSyncStore, exportAllData, importAllData, setSyncing } from '@/store';
import { toast } from 'sonner';

export type SyncAction = 'none' | 'upload' | 'download' | 'conflict';

export function useBackend() {
  const { isAvailable, token, user, hasRemoteData, setAvailable, setAuth, clearAuth, setHasRemoteData, isLoggedIn } = useAuthStore();
  const { lastSyncVersion, isDirty, markClean } = useSyncStore();
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

  // Change password
  const changePassword = useCallback(async (oldPassword: string, newPassword: string) => {
    if (!isLoggedIn() || !token) {
      toast.error('请先登录');
      return false;
    }

    setIsLoading(true);
    try {
      const result = await api.changePassword(token, oldPassword, newPassword);
      if (result.success) {
        toast.success('密码修改成功');
        return true;
      } else {
        toast.error(result.error || '修改密码失败');
        return false;
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, token]);

  // Logout
  const logout = useCallback(() => {
    clearAuth();
    useSyncStore.getState().reset();
    toast.success('已退出登录');
  }, [clearAuth]);

  // Check sync status: compare local dirty flag + versions to decide action
  const checkSyncStatus = useCallback(async (): Promise<{ action: SyncAction; serverVersion: number; serverModifiedAt: string }> => {
    const fallback = { action: 'none' as SyncAction, serverVersion: 0, serverModifiedAt: '' };

    if (!isLoggedIn() || !token) return fallback;

    try {
      const result = await api.syncMeta(token);
      if (!result.success || !result.data) {
        if (result.error?.includes('Token')) clearAuth();
        return fallback;
      }

      const serverVersion = result.data.version;
      const serverModifiedAt = result.data.last_modified_at;
      const localVersion = useSyncStore.getState().lastSyncVersion;
      const localDirty = useSyncStore.getState().isDirty;

      let action: SyncAction = 'none';

      if (!localDirty && serverVersion === localVersion) {
        action = 'none';
      } else if (!localDirty && serverVersion > localVersion) {
        action = 'download';
      } else if (localDirty && serverVersion === localVersion) {
        action = 'upload';
      } else if (localDirty && serverVersion > localVersion) {
        action = 'conflict';
      } else if (!localDirty && serverVersion < localVersion) {
        // Shouldn't happen normally — local version ahead without dirty flag
        action = 'none';
      }

      return { action, serverVersion, serverModifiedAt };
    } catch {
      return fallback;
    }
  }, [isLoggedIn, token, clearAuth]);

  // Upload data to backend
  const uploadData = useCallback(async () => {
    if (!isLoggedIn() || !token) {
      toast.error('请先登录');
      return false;
    }

    setIsLoading(true);
    try {
      setSyncing(true);
      const data = exportAllData();
      const result = await api.uploadData(token, data);
      setSyncing(false);

      if (result.success && result.data) {
        setHasRemoteData(true);
        markClean(result.data.version);
        toast.success('数据已同步到云端');
        return true;
      } else {
        if (result.error?.includes('Token')) clearAuth();
        toast.error(result.error || '上传失败');
        return false;
      }
    } finally {
      setSyncing(false);
      setIsLoading(false);
    }
  }, [isLoggedIn, token, setHasRemoteData, markClean, clearAuth]);

  // Download data from backend
  const downloadData = useCallback(async () => {
    if (!isLoggedIn() || !token) {
      toast.error('请先登录');
      return false;
    }

    setIsLoading(true);
    try {
      // First get the meta to know the version
      const metaResult = await api.syncMeta(token);
      const serverVersion = metaResult.success && metaResult.data ? metaResult.data.version : 0;

      const result = await api.downloadData(token);

      if (result.success) {
        if (result.data) {
          const success = importAllData(result.data, true);
          if (success) {
            markClean(serverVersion);
            toast.success('已从云端同步数据');
            return true;
          } else {
            toast.error('数据导入失败');
            return false;
          }
        } else {
          toast.info('云端暂无数据');
          return true;
        }
      } else {
        if (result.error?.includes('Token')) clearAuth();
        toast.error(result.error || '下载失败');
        return false;
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, token, markClean, clearAuth]);

  return {
    // State
    isAvailable,
    isLoggedIn: isLoggedIn(),
    user,
    hasRemoteData,
    isDirty,
    lastSyncVersion,
    isChecking,
    isLoading,

    // Actions
    checkBackend,
    register,
    login,
    changePassword,
    logout,
    checkSyncStatus,
    uploadData,
    downloadData,
  };
}
