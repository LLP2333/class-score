'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useBackend } from '@/hooks/useBackend';
import { useSyncStore } from '@/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Cloud, Monitor, Upload, Download, X, LogIn } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

const AUTO_UPLOAD_DELAY = 5000;

const LOGIN_PROMPT_KEY = 'classScore_loginPromptDismissed';

export function SyncManager() {
  const { isAvailable, isLoggedIn, hasRemoteData, isLoading, isChecking, checkSyncStatus, uploadData, downloadData, login, register } = useBackend();
  const isDirty = useSyncStore((s) => s.isDirty);
  const lastSyncAt = useSyncStore((s) => s.lastSyncAt);
  const lastSyncVersion = useSyncStore((s) => s.lastSyncVersion);

  const [conflictOpen, setConflictOpen] = useState(false);
  const [firstSyncOpen, setFirstSyncOpen] = useState(false);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [serverModifiedAt, setServerModifiedAt] = useState('');
  const hasChecked = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const canAutoSync = isAvailable && isLoggedIn && lastSyncVersion > 0;

  // --- Established users: check server version and decide ---
  const runSyncCheck = useCallback(async () => {
    if (!isAvailable || !isLoggedIn || lastSyncVersion === 0) return;

    const { action, serverModifiedAt: sma } = await checkSyncStatus();

    switch (action) {
      case 'upload':
        await uploadData();
        break;
      case 'download':
        await downloadData();
        break;
      case 'conflict':
        setServerModifiedAt(sma);
        setConflictOpen(true);
        break;
    }
  }, [isAvailable, isLoggedIn, lastSyncVersion, checkSyncStatus, uploadData, downloadData]);

  // --- On mount: login prompt for unauthenticated users, sync check for authenticated ---
  useEffect(() => {
    if (hasChecked.current) return;
    if (isChecking) return; // wait for health check to finish
    if (!isAvailable) return;

    hasChecked.current = true;

    const timer = setTimeout(() => {
      if (isLoggedIn) {
        if (lastSyncVersion > 0) {
          runSyncCheck();
        } else if (hasRemoteData) {
          setFirstSyncOpen(true);
        }
      } else {
        const dismissed = sessionStorage.getItem(LOGIN_PROMPT_KEY);
        if (!dismissed) {
          setLoginPromptOpen(true);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [isAvailable, isLoggedIn, isChecking, lastSyncVersion, hasRemoteData, runSyncCheck]);

  // Poll server every 5s for changes from other devices (pauses when tab is hidden)
  useEffect(() => {
    if (!canAutoSync) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (!intervalId) {
        intervalId = setInterval(runSyncCheck, 5000);
      }
    };

    const stop = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        runSyncCheck();
        start();
      } else {
        stop();
      }
    };

    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [canAutoSync, runSyncCheck]);

  // Debounced auto-upload on data change
  useEffect(() => {
    if (!isDirty || !canAutoSync) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      runSyncCheck();
    }, AUTO_UPLOAD_DELAY);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [isDirty, canAutoSync, runSyncCheck]);

  // --- First sync handlers ---
  const handleFirstSyncDownload = async () => {
    setFirstSyncOpen(false);
    await downloadData();
  };

  const handleFirstSyncUpload = async () => {
    setFirstSyncOpen(false);
    await uploadData();
  };

  const handleFirstSyncSkip = () => {
    setFirstSyncOpen(false);
  };

  // --- Conflict handlers ---
  const handleUseLocal = async () => {
    setConflictOpen(false);
    await uploadData();
  };

  const handleUseRemote = async () => {
    setConflictOpen(false);
    await downloadData();
  };

  // --- Login prompt handlers ---
  const handleLoginPromptAuth = async () => {
    if (!username.trim() || !password.trim()) {
      toast.error('请输入用户名和密码');
      return;
    }
    const success = isRegistering
      ? await register(username.trim(), password.trim())
      : await login(username.trim(), password.trim());
    if (success) {
      setLoginPromptOpen(false);
      setUsername('');
      setPassword('');
    }
  };

  const handleLoginPromptSkip = () => {
    sessionStorage.setItem(LOGIN_PROMPT_KEY, '1');
    setLoginPromptOpen(false);
  };

  return (
    <>
      {/* Login prompt — shown once per session when not logged in */}
      <Dialog open={loginPromptOpen} onOpenChange={setLoginPromptOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{isRegistering ? '注册账号' : '登录账号'}</DialogTitle>
            <DialogDescription>
              登录后数据将自动同步到云端，支持多设备使用
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>用户名</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
              />
            </div>
            <div>
              <Label>密码</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                onKeyDown={(e) => e.key === 'Enter' && handleLoginPromptAuth()}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {isRegistering ? (
                <>已有账号？<button className="text-primary hover:underline" onClick={() => setIsRegistering(false)}>去登录</button></>
              ) : (
                <>没有账号？<button className="text-primary hover:underline" onClick={() => setIsRegistering(true)}>去注册</button></>
              )}
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button onClick={handleLoginPromptAuth} disabled={isLoading} className="w-full">
              <LogIn className="h-4 w-4 mr-1" />
              {isLoading ? '处理中...' : isRegistering ? '注册' : '登录'}
            </Button>
            <Button variant="ghost" onClick={handleLoginPromptSkip} className="w-full">
              暂不登录
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* First sync dialog — shown once after login when server has data */}
      <Dialog open={firstSyncOpen} onOpenChange={setFirstSyncOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>云端数据同步</DialogTitle>
            <DialogDescription>
              检测到云端已有数据，请选择如何处理：
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button onClick={handleFirstSyncDownload} disabled={isLoading} className="w-full">
              <Download className="h-4 w-4 mr-1" />
              下载云端数据到本地
            </Button>
            <Button variant="outline" onClick={handleFirstSyncUpload} disabled={isLoading} className="w-full">
              <Upload className="h-4 w-4 mr-1" />
              上传本地数据到云端
            </Button>
            <Button variant="ghost" onClick={handleFirstSyncSkip} className="w-full">
              <X className="h-4 w-4 mr-1" />
              暂不同步
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conflict dialog — shown when both local and server changed */}
      <Dialog open={conflictOpen} onOpenChange={setConflictOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>数据同步冲突</DialogTitle>
            <DialogDescription>
              检测到本地数据和云端数据都有更新，请选择要保留的版本：
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="grid gap-2">
              <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                <Monitor className="h-4 w-4 shrink-0" />
                <span>本地最后同步：{lastSyncAt ? formatDate(lastSyncAt) : '未知'}</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                <Cloud className="h-4 w-4 shrink-0" />
                <span>云端最后更新：{serverModifiedAt ? formatDate(serverModifiedAt) : '未知'}</span>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button onClick={handleUseLocal} disabled={isLoading} className="w-full">
              <Monitor className="h-4 w-4 mr-1" />
              使用本地数据（覆盖云端）
            </Button>
            <Button variant="outline" onClick={handleUseRemote} disabled={isLoading} className="w-full">
              <Cloud className="h-4 w-4 mr-1" />
              使用云端数据（覆盖本地）
            </Button>
            <Button variant="ghost" onClick={() => setConflictOpen(false)} className="w-full">
              <X className="h-4 w-4 mr-1" />
              暂不同步
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
