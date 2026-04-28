'use client';

import { useState, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStudentStore, useAuthStore } from '@/store';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { Upload, KeyRound, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { DialogDescription } from '@/components/ui/dialog';
import { cn, getAvatarClass } from '@/lib/utils';

export default function SettingsPage() {
  const { students } = useStudentStore();
  const { role, classes, currentClassId, username, setClasses, setCurrentClassId } = useAuthStore();
  const isTeacher = role === 'teacher';

  const currentClass = classes.find(c => c.id === currentClassId);

  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [editClassOpen, setEditClassOpen] = useState(false);
  const [editClassName, setEditClassName] = useState('');
  const [editTeacherName, setEditTeacherName] = useState('');

  const [createClassOpen, setCreateClassOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newTeacherName, setNewTeacherName] = useState('');

  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [resetStudentId, setResetStudentId] = useState<number | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('123456');

  const [deleteClassOpen, setDeleteClassOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const excelInputRef = useRef<HTMLInputElement>(null);
  const importJsonRef = useRef<HTMLInputElement>(null);

  const selectedStudentForReset = useMemo(() => {
    return students.find(s => s.id === resetStudentId);
  }, [students, resetStudentId]);

  const handleChangePassword = async () => {
    if (!oldPassword.trim()) { toast.error('请输入当前密码'); return; }
    if (newPassword.length < 4) { toast.error('新密码长度至少4个字符'); return; }
    if (newPassword !== confirmPassword) { toast.error('两次密码不一致'); return; }

    setLoading(true);
    const result = await api.changePassword(oldPassword, newPassword);
    setLoading(false);
    if (result.success) {
      toast.success('密码修改成功');
      setChangePasswordOpen(false);
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
    } else {
      toast.error(result.error || '修改失败');
    }
  };

  const handleEditClass = async () => {
    if (!currentClassId) return;
    setLoading(true);
    const result = await api.updateClass(currentClassId, {
      name: editClassName.trim() || undefined,
      teacher_name: editTeacherName.trim() || undefined,
    });
    setLoading(false);
    if (result.success) {
      toast.success('班级信息已更新');
      const classResult = await api.listClasses();
      if (classResult.success && classResult.data) setClasses(classResult.data);
      setEditClassOpen(false);
    } else {
      toast.error(result.error || '更新失败');
    }
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim()) { toast.error('请输入班级名称'); return; }
    setLoading(true);
    const result = await api.createClass(newClassName.trim(), newTeacherName.trim() || '班主任');
    setLoading(false);
    if (result.success && result.data) {
      toast.success('班级创建成功');
      const classResult = await api.listClasses();
      if (classResult.success && classResult.data) {
        setClasses(classResult.data);
        setCurrentClassId(result.data.id);
      }
      setCreateClassOpen(false);
      setNewClassName(''); setNewTeacherName('');
      window.location.reload();
    } else {
      toast.error(result.error || '创建失败');
    }
  };

  const handleResetStudentPassword = async () => {
    if (!resetStudentId) return;
    setLoading(true);
    const result = await api.resetStudentPassword(resetStudentId, resetNewPassword || '123456');
    setLoading(false);
    if (result.success) {
      toast.success('密码重置成功');
      setResetPasswordOpen(false);
    } else {
      toast.error(result.error || '重置失败');
    }
  };

  const handleDeleteClass = async () => {
    if (!currentClassId || !currentClass) return;
    if (deleteConfirmText !== currentClass.name) {
      toast.error('班级名称输入不正确');
      return;
    }

    setLoading(true);
    const result = await api.deleteClass(currentClassId);
    setLoading(false);
    if (result.success) {
      toast.success('班级已删除');
      setDeleteClassOpen(false);
      setDeleteConfirmText('');
      const classResult = await api.listClasses();
      if (classResult.success && classResult.data) {
        setClasses(classResult.data);
        if (classResult.data.length > 0) {
          setCurrentClassId(classResult.data[0].id);
        } else {
          setCurrentClassId(null);
        }
        window.location.reload();
      }
    } else {
      toast.error(result.error || '删除失败');
    }
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentClassId) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Array<Record<string, unknown>>;

        let success = 0;
        const skippedDup: string[] = [];
        const skippedEmpty = { count: 0 };

        for (const row of jsonData) {
          const name = (row['姓名'] || row['名字'] || row['name'] || row['Name']) as string;
          if (!name || typeof name !== 'string' || !name.trim()) {
            skippedEmpty.count++;
            continue;
          }
          const result = await api.createStudent(currentClassId, {
            name: name.trim(),
            avatar: Math.floor(Math.random() * 8) + 1,
            password: '123456',
          });
          if (result.success) {
            success++;
          } else if (result.error?.includes('同名')) {
            skippedDup.push(name.trim());
          }
        }

        const parts: string[] = [];
        if (success > 0) parts.push(`成功导入 ${success} 名学生`);
        if (skippedDup.length > 0) parts.push(`跳过 ${skippedDup.length} 名重名学生（${skippedDup.join('、')}）`);
        if (parts.length > 0) {
          toast[success > 0 ? 'success' : 'warning'](parts.join('；'));
          if (success > 0) useStudentStore.getState().fetchStudents(currentClassId);
        } else {
          toast.error('未找到有效数据，请确保 Excel 中包含「姓名」列');
        }
      } catch { toast.error('导入失败，请检查文件格式'); }
      finally { setLoading(false); }
    };
    reader.readAsArrayBuffer(file);
    if (excelInputRef.current) excelInputRef.current.value = '';
  };

  const handleImportJson = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const result = await api.migrateImport(data);
        if (result.success && result.data) {
          toast.success(`导入成功！${result.data.student_count} 名学生、${result.data.record_count} 条记录`);
          const classResult = await api.listClasses();
          if (classResult.success && classResult.data) {
            setClasses(classResult.data);
            if (result.data.class_id) {
              setCurrentClassId(result.data.class_id);
              window.location.reload();
            }
          }
        } else {
          toast.error(result.error || '导入失败');
        }
      } catch { toast.error('文件格式错误'); }
    };
    reader.readAsText(file);
    if (importJsonRef.current) importJsonRef.current.value = '';
  };

  return (
    <div className="animate-fade-in space-y-6">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <span>⚙️</span>
        {isTeacher ? '系统设置' : '我的设置'}
      </h2>

      <div className="grid gap-6">
        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">账号信息</CardTitle>
            <CardDescription>当前登录: {username} ({isTeacher ? '教师' : '学生'})</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => setChangePasswordOpen(true)}>
              <KeyRound className="h-4 w-4 mr-1" />
              修改密码
            </Button>
          </CardContent>
        </Card>

        {/* Class Info (teacher) */}
        {isTeacher && currentClass && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">班级信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">班级名称</Label>
                  <div className="font-semibold">{currentClass.name}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">班主任</Label>
                  <div className="font-semibold">{currentClass.teacher_name || '-'}</div>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={() => {
                  setEditClassName(currentClass.name);
                  setEditTeacherName(currentClass.teacher_name);
                  setEditClassOpen(true);
                }}>编辑信息</Button>
                <Button variant="outline" onClick={() => setCreateClassOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  创建新班级
                </Button>
                <Button variant="destructive" size="default" onClick={() => {
                  setDeleteConfirmText('');
                  setDeleteClassOpen(true);
                }}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  删除班级
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Student Account Management (teacher) */}
        {isTeacher && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">学生账号管理</CardTitle>
              <CardDescription>学生登录名格式为 c班级编号_姓名（如 c{currentClassId}_张三），默认密码 123456</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-60">
                <div className="space-y-2">
                  {students.map(s => (
                    <div key={s.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium', getAvatarClass(s.avatar))}>
                        {s.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{s.name}</div>
                        <div className="text-xs text-muted-foreground">账号: {s.username || '-'}</div>
                      </div>
                      <Button variant="outline" size="sm" className="shrink-0" onClick={() => {
                        setResetStudentId(s.id);
                        setResetNewPassword('123456');
                        setResetPasswordOpen(true);
                      }}>
                        <RotateCcw className="h-3 w-3 mr-1" />
                        重置密码
                      </Button>
                    </div>
                  ))}
                  {students.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">暂无学生</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Data Management (teacher) */}
        {isTeacher && (
          <Card>
            <CardHeader><CardTitle className="text-base">数据管理</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg space-y-2">
                  <h4 className="font-medium">导入学生</h4>
                  <p className="text-sm text-muted-foreground">从 Excel 文件批量添加学生到当前班级，已存在的同名学生会自动跳过</p>
                  <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                    Excel 需包含<strong>「姓名」</strong>列（也支持「名字」或「name」），其他列会被忽略。默认密码为 123456。
                  </div>
                  <Button variant="outline" size="sm" onClick={() => excelInputRef.current?.click()} disabled={loading}>
                    <Upload className="h-4 w-4 mr-1" />
                    {loading ? '导入中...' : '导入学生 (Excel)'}
                  </Button>
                  <input ref={excelInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportExcel} />
                </div>
                <div className="p-4 border rounded-lg space-y-2">
                  <h4 className="font-medium">迁移数据</h4>
                  <p className="text-sm text-muted-foreground">从旧版 JSON 备份迁移完整班级数据</p>
                  <Button variant="outline" size="sm" onClick={() => importJsonRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-1" />
                    导入备份 (JSON)
                  </Button>
                  <input ref={importJsonRef} type="file" accept=".json" className="hidden" onChange={handleImportJson} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Change Password Modal */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>修改密码</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>当前密码</Label><Input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} /></div>
            <div><Label>新密码</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="至少4个字符" /></div>
            <div><Label>确认新密码</Label><Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePasswordOpen(false)}>取消</Button>
            <Button onClick={handleChangePassword} disabled={loading}>{loading ? '处理中...' : '确认修改'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Class Modal */}
      <Dialog open={editClassOpen} onOpenChange={setEditClassOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>编辑班级信息</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>班级名称</Label><Input value={editClassName} onChange={(e) => setEditClassName(e.target.value)} /></div>
            <div><Label>班主任</Label><Input value={editTeacherName} onChange={(e) => setEditTeacherName(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditClassOpen(false)}>取消</Button>
            <Button onClick={handleEditClass} disabled={loading}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Class Modal */}
      <Dialog open={createClassOpen} onOpenChange={setCreateClassOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>创建新班级</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>班级名称 *</Label><Input value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="例如：三年二班" /></div>
            <div><Label>班主任</Label><Input value={newTeacherName} onChange={(e) => setNewTeacherName(e.target.value)} placeholder="班主任" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateClassOpen(false)}>取消</Button>
            <Button onClick={handleCreateClass} disabled={loading}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Student Password Modal */}
      <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>重置学生密码</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm">将 <strong>{selectedStudentForReset?.name}</strong> 的密码重置为：</p>
            <Input value={resetNewPassword} onChange={(e) => setResetNewPassword(e.target.value)} placeholder="新密码（默认 123456）" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordOpen(false)}>取消</Button>
            <Button onClick={handleResetStudentPassword} disabled={loading}>确认重置</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Class Confirmation Modal */}
      <Dialog open={deleteClassOpen} onOpenChange={setDeleteClassOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">删除班级</DialogTitle>
            <DialogDescription>
              此操作不可撤销！将永久删除班级「{currentClass?.name}」及其所有数据，包括：学生信息、学生账号、积分记录、小组、规则、商品、宠物等。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>请输入班级名称「<strong>{currentClass?.name}</strong>」以确认删除</Label>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={currentClass?.name}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteClassOpen(false)}>取消</Button>
            <Button
              variant="destructive"
              onClick={handleDeleteClass}
              disabled={loading || deleteConfirmText !== currentClass?.name}
            >
              {loading ? '删除中...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
