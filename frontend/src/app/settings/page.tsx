'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSettingsStore, useStudentStore, useSyncStore, exportAllData, importAllData, clearAllData } from '@/store';
import { useBackend } from '@/hooks/useBackend';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { Download, Upload, Trash2, Cloud, CloudOff, LogIn, LogOut, RefreshCw, KeyRound } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

export default function SettingsPage() {
  const { classInfo, setClassInfo } = useSettingsStore();
  const { addStudent } = useStudentStore();
  
  const { isAvailable, isLoggedIn, user, isDirty, isLoading, login, logout, register, changePassword, uploadData, downloadData, checkSyncStatus } = useBackend();
  const lastSyncAt = useSyncStore((s) => s.lastSyncAt);

  // Modal states
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [editClassInfoOpen, setEditClassInfoOpen] = useState(false);
  const [editClassName, setEditClassName] = useState(classInfo.name);
  const [editTeacherName, setEditTeacherName] = useState(classInfo.teacher);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  // Class info
  const handleSaveClassInfo = () => {
    setClassInfo({
      name: editClassName.trim() || '我的班级',
      teacher: editTeacherName.trim() || '班主任',
    });
    toast.success('班级信息已更新');
    setEditClassInfoOpen(false);
  };

  // Auth
  const handleAuth = async () => {
    if (!username.trim() || !password.trim()) {
      toast.error('请输入用户名和密码');
      return;
    }
    
    const success = isRegistering 
      ? await register(username.trim(), password.trim())
      : await login(username.trim(), password.trim());
    
    if (success) {
      setLoginModalOpen(false);
      setUsername('');
      setPassword('');
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (!oldPassword.trim()) {
      toast.error('请输入当前密码');
      return;
    }
    if (newPassword.length < 4) {
      toast.error('新密码长度至少4个字符');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('两次输入的新密码不一致');
      return;
    }

    const success = await changePassword(oldPassword, newPassword);
    if (success) {
      setChangePasswordOpen(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  // Export data
  const handleExportBackup = () => {
    const data = exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `班级积分备份_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('备份文件已下载');
  };

  // Import data
  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const success = importAllData(data);
        if (success) {
          toast.success('数据导入成功');
          window.location.reload();
        } else {
          toast.error('导入失败：无效的备份文件');
        }
      } catch {
        toast.error('导入失败：文件格式错误');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Import students from Excel
  const handleImportExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Array<{ 姓名?: string; 名字?: string; name?: string }>;

        let count = 0;
        jsonData.forEach((row) => {
          const name = row['姓名'] || row['名字'] || row['name'];
          if (name && typeof name === 'string' && name.trim()) {
            addStudent({
              name: name.trim(),
              avatar: Math.floor(Math.random() * 8) + 1,
              groupId: null,
              totalScore: 0,
            });
            count++;
          }
        });

        if (count > 0) {
          toast.success(`成功导入 ${count} 名学生`);
        } else {
          toast.error('未找到有效的学生数据（请确保有"姓名"列）');
        }
      } catch {
        toast.error('导入失败：无法解析Excel文件');
      }
    };
    reader.readAsArrayBuffer(file);
    
    if (excelInputRef.current) {
      excelInputRef.current.value = '';
    }
  };

  // Clear data
  const handleClearData = () => {
    if (confirm('确定要清空所有数据吗？此操作不可撤销！\n\n建议先备份数据。')) {
      clearAllData();
      toast.success('数据已清空');
      window.location.reload();
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <span>⚙️</span>
        系统设置
      </h2>

      <div className="grid gap-6">
        {/* Class Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">班级信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">班级名称</Label>
                <div className="font-semibold">{classInfo.name}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">班主任</Label>
                <div className="font-semibold">{classInfo.teacher}</div>
              </div>
            </div>
            <Button variant="outline" onClick={() => {
              setEditClassName(classInfo.name);
              setEditTeacherName(classInfo.teacher);
              setEditClassInfoOpen(true);
            }}>
              编辑信息
            </Button>
          </CardContent>
        </Card>

        {/* Cloud Sync */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {isAvailable ? <Cloud className="h-5 w-5 text-green-500" /> : <CloudOff className="h-5 w-5 text-muted-foreground" />}
              云端同步
            </CardTitle>
            <CardDescription>
              {isAvailable 
                ? isLoggedIn 
                  ? `已登录: ${user?.username}` 
                  : '后端服务已连接，请登录'
                : '后端服务不可用（数据仅保存在本地）'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAvailable ? (
              <>
                {isLoggedIn ? (
                  <>
                    {/* Sync status */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        {isDirty ? (
                          <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                        ) : (
                          <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                        )}
                        {isDirty ? '本地有未同步的修改' : '数据已同步'}
                      </span>
                      {lastSyncAt && (
                        <span>上次同步：{formatRelativeTime(lastSyncAt)}</span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button onClick={async () => {
                        if (lastSyncAt) {
                          const { action } = await checkSyncStatus();
                          if (action === 'conflict') {
                            if (!confirm('云端数据已被其他设备更新，确定要用本地数据覆盖云端吗？')) return;
                          }
                          if (action === 'download') {
                            toast.info('云端数据比本地更新，建议先下载');
                            return;
                          }
                        }
                        await uploadData();
                      }} disabled={isLoading}>
                        <Upload className="h-4 w-4 mr-1" />
                        上传到云端
                      </Button>
                      <Button variant="outline" onClick={async () => {
                        if (isDirty) {
                          if (!confirm('本地有未同步的修改，下载云端数据会覆盖这些修改。\n\n确定要继续吗？')) return;
                        }
                        await downloadData();
                      }} disabled={isLoading}>
                        <Download className="h-4 w-4 mr-1" />
                        从云端下载
                      </Button>
                      <Button variant="outline" onClick={() => checkSyncStatus().then(({ action }) => {
                        if (action === 'none') toast.info('数据已是最新');
                      })} disabled={isLoading}>
                        <RefreshCw className="h-4 w-4 mr-1" />
                        检查同步
                      </Button>
                      <Button variant="ghost" onClick={() => setChangePasswordOpen(true)}>
                        <KeyRound className="h-4 w-4 mr-1" />
                        修改密码
                      </Button>
                      <Button variant="ghost" onClick={() => {
                        if (isDirty) {
                          if (!confirm('本地有未同步的修改，退出后这些修改不会自动上传。\n\n确定要退出登录吗？')) return;
                        }
                        logout();
                      }}>
                        <LogOut className="h-4 w-4 mr-1" />
                        退出登录
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button onClick={() => setLoginModalOpen(true)}>
                    <LogIn className="h-4 w-4 mr-1" />
                    登录/注册
                  </Button>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                启动后端服务后即可使用云端同步功能
              </p>
            )}
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">数据管理</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Backup */}
              <div className="p-4 border rounded-lg space-y-2">
                <h4 className="font-medium">备份与恢复</h4>
                <p className="text-sm text-muted-foreground">导出或导入完整数据备份</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportBackup}>
                    <Download className="h-4 w-4 mr-1" />
                    导出备份
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-1" />
                    导入备份
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportBackup}
                  />
                </div>
              </div>

              {/* Excel Import */}
              <div className="p-4 border rounded-lg space-y-2">
                <h4 className="font-medium">Excel 导入</h4>
                <p className="text-sm text-muted-foreground">从 Excel 批量导入学生名单</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => excelInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-1" />
                    导入学生
                  </Button>
                  <input
                    ref={excelInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleImportExcel}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Excel 文件需包含「姓名」列
                </p>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="p-4 border border-red-200 bg-red-50 rounded-lg space-y-2">
              <h4 className="font-medium text-red-600">危险操作</h4>
              <p className="text-sm text-red-600/80">清空所有数据，此操作不可撤销</p>
              <Button variant="destructive" size="sm" onClick={handleClearData}>
                <Trash2 className="h-4 w-4 mr-1" />
                清空数据
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Class Info Modal */}
      <Dialog open={editClassInfoOpen} onOpenChange={setEditClassInfoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑班级信息</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>班级名称</Label>
              <Input
                value={editClassName}
                onChange={(e) => setEditClassName(e.target.value)}
                placeholder="我的班级"
              />
            </div>
            <div>
              <Label>班主任</Label>
              <Input
                value={editTeacherName}
                onChange={(e) => setEditTeacherName(e.target.value)}
                placeholder="班主任"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditClassInfoOpen(false)}>取消</Button>
            <Button onClick={handleSaveClassInfo}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Modal */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改密码</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>当前密码</Label>
              <Input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="请输入当前密码"
              />
            </div>
            <div>
              <Label>新密码</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入新密码（至少4个字符）"
              />
            </div>
            <div>
              <Label>确认新密码</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入新密码"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePasswordOpen(false)}>取消</Button>
            <Button onClick={handleChangePassword} disabled={isLoading}>
              {isLoading ? '处理中...' : '确认修改'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Login Modal */}
      <Dialog open={loginModalOpen} onOpenChange={setLoginModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRegistering ? '注册账号' : '登录'}</DialogTitle>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoginModalOpen(false)}>取消</Button>
            <Button onClick={handleAuth} disabled={isLoading}>
              {isLoading ? '处理中...' : isRegistering ? '注册' : '登录'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
